import json
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
)
from app.ml.preprocess import transform_single_input, load_raw_dataset, prepare_features_and_target
from app.ml.model import BayesianNeuralNetwork
from app.ml.uncertainty import predict_with_uncertainty
from app.ml.explain import ShapExplainerWrapper
from app.ml.recommend import generate_recommendation
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
    computes SHAP attributions, and returns a confidence-aware recommendation.
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

        return PredictionResponse(
            failure_probability=unc_res["mean_probability"],
            confidence_score=unc_res["confidence_score"],
            uncertainty_std=unc_res["std_deviation"],
            prediction=unc_res["prediction"],
            shap_contributions=shap_list,
            recommendation=rec,
        )
    except Exception as e:
        logger.error(f"Prediction endpoint error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/predict/batch")
async def predict_batch(batch_input: BatchSensorInput):
    """Batch prediction endpoint processing multiple sensor readings."""
    results = []
    for item in batch_input.inputs:
        res = await predict_single(item)
        results.append(res)
    return results
