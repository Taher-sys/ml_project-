import os
from contextlib import asynccontextmanager
import torch
import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import MODEL_PATH, SCALER_PATH
from app.ml.model import BayesianNeuralNetwork
from app.ml.preprocess import load_raw_dataset, prepare_features_and_target, load_and_preprocess_data
from app.ml.train import run_training_pipeline
from app.ml.explain import ShapExplainerWrapper
from app.api import routes
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler initializing models, scalers, and SHAP explainer on startup."""
    logger.info("Initializing TrustAI-PM Backend Service...")

    # Train automatically if model or scaler missing
    if not MODEL_PATH.exists() or not SCALER_PATH.exists():
        logger.info("Model checkpoint or scaler not found. Running training pipeline...")
        run_training_pipeline()

    # Load Model
    logger.info(f"Loading BNN weights from {MODEL_PATH}")
    model = BayesianNeuralNetwork(input_dim=8)
    model.load_state_dict(torch.load(MODEL_PATH, weights_only=True))
    model.eval()
    routes.model_instance = model

    # Load Scaler
    logger.info(f"Loading scaler from {SCALER_PATH}")
    scaler = joblib.load(SCALER_PATH)
    routes.scaler_instance = scaler

    # Load background data for SHAP KernelExplainer
    logger.info("Initializing SHAP explainer background dataset...")
    try:
        data = load_and_preprocess_data(save_scaler=False)
        X_bg = data["X_train"]
        routes.explainer_instance = ShapExplainerWrapper(model, X_bg)
    except Exception as e:
        logger.warning(f"Could not initialize SHAP explainer background: {e}")

    logger.info("TrustAI-PM Backend Service successfully started!")
    yield
    logger.info("Shutting down TrustAI-PM Backend Service...")


app = FastAPI(
    title="TrustAI-PM Predictive Maintenance API",
    description="Explainable and Uncertainty-Aware Predictive Maintenance using Bayesian Deep Learning (Monte Carlo Dropout) and SHAP.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Next.js frontend on localhost:3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)


@app.get("/")
async def root():
    return {
        "service": "TrustAI-PM Predictive Maintenance API",
        "docs": "/docs",
        "status": "running",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
