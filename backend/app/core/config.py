import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"

# File paths
DATASET_PATH = DATA_DIR / "ai4i2020.csv"
MODEL_PATH = MODELS_DIR / "bnn_model.pt"
BASELINE_MODEL_PATH = MODELS_DIR / "baseline_model.pt"
SCALER_PATH = MODELS_DIR / "scaler.pkl"
METRICS_PATH = MODELS_DIR / "metrics.json"

# UCI Dataset download URL
DATASET_URL = "https://archive.ics.uci.edu/static/public/601/ai4i+2020+predictive+maintenance+dataset.zip"

# Feature configuration
NUMERIC_FEATURES = [
    "air_temperature",
    "process_temperature",
    "rotational_speed",
    "torque",
    "tool_wear",
]

CATEGORICAL_FEATURES = ["type"]  # L, M, H

FEATURE_COLUMNS = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]",
    "Type_H",
    "Type_L",
    "Type_M",
]

# Uncertainty parameters
DEFAULT_MC_SAMPLES = 50
