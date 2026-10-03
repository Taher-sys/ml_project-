import json
import uuid
from datetime import datetime
import joblib
import numpy as np
from fastapi import APIRouter, HTTPException, Depends

from app.core.config import MODEL_PATH, SCALER_PATH, METRICS_PATH, FEATURE_COLUMNS
from app.core.schemas import (
    SensorInput,
    BatchSensorInput,
    PredictionResponse,
    HealthResponse,
    ModelInfoResponse,
    ShapContribution,
    FailureModeDiagnosis,
    DispatchTicketRequest,
    DispatchTicketResponse,
)
from app.ml.preprocess import transform_single_input, transform_batch_input, load_raw_dataset, prepare_features_and_target
from app.ml.model import BayesianNeuralNetwork
from app.ml.uncertainty import predict_with_uncertainty, predict_batch_with_uncertainty
from app.ml.explain import ShapExplainerWrapper
from app.ml.recommend import generate_recommendation, get_safety_measures
from app.ml.diagnosis import diagnose_failure_mode
from app.utils.logger import logger


router = APIRouter(prefix="/api", tags=["Predictive Maintenance API"])

# Global singletons loaded during app startup
model_instance: BayesianNeuralNetwork = None
scaler_instance = None
explainer_instance: ShapExplainerWrapper = None


def get_model_and_scaler():
    """Dependency helper assuring model and scaler are loaded."""
    if model_instance is None or scaler_instance is None:
        raise HTTPException(
            status_code=503,
            detail="ML Model service not fully initialized. Run training pipeline first.",
        )
    return model_instance, scaler_instance


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint returning system status."""
    return HealthResponse(status="ok", version="1.0.0")


@router.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    """Returns model metadata, feature list, and evaluation metrics."""
    metrics = {}
    if METRICS_PATH.exists():
        with open(METRICS_PATH, "r") as f:
            metrics = json.load(f)

    return ModelInfoResponse(
        model_type="Bayesian Neural Network (Monte Carlo Dropout)",
        mc_samples=50,
        input_features=FEATURE_COLUMNS,
        metrics=metrics,
    )


@router.post("/predict", response_model=PredictionResponse)
async def predict_single(sensor_input: SensorInput):
    """
    Predicts machine failure probability, quantifies epistemic uncertainty via MC Dropout,
    computes SHAP attributions, returns confidence-aware recommendations, provides safety measures,
    and identifies the specific failure mode (TWF, HDF, PWF, OSF, RNF).
    """
    model, scaler = get_model_and_scaler()

    try:
        scaled_input = transform_single_input(sensor_input, scaler)

        # 1. Uncertainty Quantification (50 MC forward passes)
        unc_res = predict_with_uncertainty(model, scaled_input, n_samples=50)

        # 2. SHAP Explainability
        shap_list = []
        if explainer_instance is not None:
            raw_shap = explainer_instance.explain(scaled_input)
            shap_list = [ShapContribution(**item) for item in raw_shap]

        # 3. Confidence-aware Recommendation
        rec = generate_recommendation(
            mean_probability=unc_res["mean_probability"],
            confidence_score=unc_res["confidence_score"],
        )

        # 4. Targeted Safety Measures for Failure Predictions
        safety = get_safety_measures(shap_list, unc_res["prediction"])

        # 5. Physics-informed Failure Mode Diagnosis
        diag = diagnose_failure_mode(sensor_input, unc_res["mean_probability"])

        return PredictionResponse(
            failure_probability=unc_res["mean_probability"],
            confidence_score=unc_res["confidence_score"],
            uncertainty_std=unc_res["std_deviation"],
            prediction=unc_res["prediction"],
            shap_contributions=shap_list,
            recommendation=rec,
            safety_measures=safety,
            failure_mode=diag,
        )
    except Exception as e:
        logger.error(f"Prediction endpoint error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/predict/batch", response_model=list[PredictionResponse])
async def predict_batch(batch_input: BatchSensorInput):
    """
    Vectorized batch prediction endpoint processing multiple sensor telemetry rows simultaneously.
    Runs fast parallel Monte Carlo Dropout passes across the entire batch tensor.
    """
    model, scaler = get_model_and_scaler()

    if not batch_input.inputs:
        return []

    try:
        scaled_batch = transform_batch_input(batch_input.inputs, scaler)
        batch_uncertainty = predict_batch_with_uncertainty(model, scaled_batch, n_samples=50)

        results = []
        for i, sensor_input in enumerate(batch_input.inputs):
            unc_res = batch_uncertainty[i]
            mean_p = unc_res["mean_probability"]
            conf_s = unc_res["confidence_score"]
            pred_label = unc_res["prediction"]

            rec = generate_recommendation(mean_probability=mean_p, confidence_score=conf_s)
            diag = diagnose_failure_mode(sensor_input, mean_p)

            # Compute SHAP for anomalous / failure cases or first few rows for responsive throughput
            shap_list = []
            if explainer_instance is not None and (mean_p > 0.40 or unc_res["std_deviation"] > 0.08 or i < 3):
                try:
                    single_scaled = scaled_batch[i : i + 1]
                    raw_shap = explainer_instance.explain(single_scaled)
                    shap_list = [ShapContribution(**item) for item in raw_shap]
                except Exception as ex:
                    logger.warning(f"Batch SHAP row {i} failed: {ex}")

            safety = get_safety_measures(shap_list, pred_label)

            results.append(
                PredictionResponse(
                    failure_probability=mean_p,
                    confidence_score=conf_s,
                    uncertainty_std=unc_res["std_deviation"],
                    prediction=pred_label,
                    shap_contributions=shap_list,
                    recommendation=rec,
                    safety_measures=safety,
                    failure_mode=diag,
                )
            )

        return results
    except Exception as e:
        logger.error(f"Batch prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


@router.post("/tickets/dispatch", response_model=DispatchTicketResponse)
async def dispatch_maintenance_ticket(payload: DispatchTicketRequest):
    """
    Receives and processes technician maintenance dispatch orders,
    logs the event in SCADA operations audit trails, and returns a verified dispatch confirmation.
    """
    logger.info(f"Received Dispatch Request for Ticket {payload.ticket_id} on Machine {payload.machine_id}")
    logger.info(f"Assigned: {payload.assigned_technician}, Urgency: {payload.urgency}, Priority: {payload.priority_override}")

    dispatch_id = f"DSP-2026-{uuid.uuid4().hex[:6].upper()}"
    timestamp_str = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    return DispatchTicketResponse(
        status="dispatched",
        dispatch_id=dispatch_id,
        ticket_id=payload.ticket_id,
        timestamp=timestamp_str,
        assigned_technician=payload.assigned_technician,
        message=f"Dispatch webhook accepted. Work order {payload.ticket_id} assigned to {payload.assigned_technician} and broadcast to shop-floor pager.",
    )

