import pytest
import numpy as np
import torch
from fastapi.testclient import TestClient

from app.core.schemas import SensorInput, PredictionResponse
from app.ml.preprocess import transform_single_input, load_raw_dataset, prepare_features_and_target
from app.ml.model import BayesianNeuralNetwork
from app.ml.uncertainty import predict_with_uncertainty
from app.ml.recommend import generate_recommendation
from app.main import app


def test_sensor_input_schema():
    valid_input = SensorInput(
        air_temperature=300.5,
        process_temperature=310.2,
        rotational_speed=1500.0,
        torque=40.5,
        tool_wear=120.0,
        type="M",
    )
    assert valid_input.air_temperature == 300.5
    assert valid_input.type == "M"


def test_model_mc_dropout_variability():
    model = BayesianNeuralNetwork(input_dim=8)
    model.eval()
    model.enable_mc_dropout(True)

    dummy_x = np.random.randn(1, 8).astype(np.float32)

    # Predict with uncertainty (50 passes)
    res = predict_with_uncertainty(model, dummy_x, n_samples=50)

    assert "mean_probability" in res
    assert "std_deviation" in res
    assert "confidence_score" in res
    assert 0.0 <= res["mean_probability"] <= 1.0
    assert 0.0 <= res["confidence_score"] <= 1.0
    assert len(res["raw_samples"]) == 50


def test_recommendation_matrix():
    # High failure prob + High confidence
    assert generate_recommendation(0.85, 0.90) == "Immediate maintenance required"
    # High failure prob + Low confidence
    assert generate_recommendation(0.85, 0.50) == "Schedule inspection, prediction uncertain"
    # Low failure prob + High confidence
    assert generate_recommendation(0.15, 0.90) == "Safe to operate"
    # Low failure prob + Low confidence
    assert generate_recommendation(0.15, 0.50) == "Monitor closely, re-check soon"


def test_api_health_endpoint():
    client = TestClient(app)
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
