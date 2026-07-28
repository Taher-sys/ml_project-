import os
import zipfile
import urllib.request
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib

from app.core.config import (
    DATA_DIR,
    MODELS_DIR,
    DATASET_PATH,
    SCALER_PATH,
    DATASET_URL,
    FEATURE_COLUMNS,
)
from app.core.schemas import SensorInput
from app.utils.logger import logger


def ensure_dataset_exists() -> str:
    """Download AI4I 2020 dataset from UCI repository if not present."""
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(MODELS_DIR, exist_ok=True)

    if DATASET_PATH.exists():
        logger.info(f"Dataset found at {DATASET_PATH}")
        return str(DATASET_PATH)

    logger.info(f"Downloading dataset from UCI archive: {DATASET_URL}")
    zip_path = DATA_DIR / "ai4i2020.zip"
    req = urllib.request.Request(DATASET_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as response, open(zip_path, "wb") as out_file:
        out_file.write(response.read())

    logger.info("Extracting zip dataset...")
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(DATA_DIR)

    if zip_path.exists():
        os.remove(zip_path)

    # Check for ai4i2020.csv
    if not DATASET_PATH.exists():
        # Look for any .csv file extracted
        csv_files = list(DATA_DIR.glob("*.csv"))
        if csv_files:
            csv_files[0].rename(DATASET_PATH)

    logger.info(f"Dataset successfully prepared at {DATASET_PATH}")
    return str(DATASET_PATH)


def load_raw_dataset() -> pd.DataFrame:
    ensure_dataset_exists()
    df = pd.read_csv(DATASET_PATH)
    return df


def prepare_features_and_target(df: pd.DataFrame):
    """
    Cleans raw dataset, performs one-hot encoding on 'Type',
    and separates features X and target y.
    """
    df_clean = df.copy()

    # Drop identifiers if present
    drop_cols = [c for c in ["UDI", "Product ID"] if c in df_clean.columns]
    df_clean = df_clean.drop(columns=drop_cols)

    # Separate failure modes if present, keep target 'Machine failure'
    target_col = "Machine failure"
    if target_col not in df_clean.columns:
        raise ValueError(f"Target column '{target_col}' missing from dataset.")

    # One-hot encode 'Type' (L, M, H)
    df_encoded = pd.get_dummies(df_clean, columns=["Type"], prefix="Type", dtype=float)

    # Ensure all target feature columns exist in exact order
    for col in FEATURE_COLUMNS:
        if col not in df_encoded.columns:
            df_encoded[col] = 0.0

    X = df_encoded[FEATURE_COLUMNS].values
    y = df_encoded[target_col].values

    return X, y, df_encoded


def load_and_preprocess_data(save_scaler: bool = True):
    """
    Loads data, fits StandardScaler on numerical features,
    and returns stratified train/val/test splits (70/15/15).
    """
    df = load_raw_dataset()
    X, y, df_encoded = prepare_features_and_target(df)

    # Train / Temp split (70% train, 30% temp)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )

    # Split temp into Val and Test (15% val, 15% test)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
    )

    # Scale first 5 numeric columns
    scaler = StandardScaler()
    X_train[:, :5] = scaler.fit_transform(X_train[:, :5])
    X_val[:, :5] = scaler.transform(X_val[:, :5])
    X_test[:, :5] = scaler.transform(X_test[:, :5])

    if save_scaler:
        os.makedirs(MODELS_DIR, exist_ok=True)
        joblib.dump(scaler, SCALER_PATH)
        logger.info(f"Fitted StandardScaler saved to {SCALER_PATH}")

    return {
        "X_train": X_train.astype(np.float32),
        "y_train": y_train.astype(np.float32),
        "X_val": X_val.astype(np.float32),
        "y_val": y_val.astype(np.float32),
        "X_test": X_test.astype(np.float32),
        "y_test": y_test.astype(np.float32),
        "scaler": scaler,
        "feature_names": FEATURE_COLUMNS,
    }


def transform_single_input(sensor_input: SensorInput, scaler: StandardScaler) -> np.ndarray:
    """Transforms a single SensorInput object into a 2D numpy array [1, 8] ready for inference."""
    type_h = 1.0 if sensor_input.type == "H" else 0.0
    type_l = 1.0 if sensor_input.type == "L" else 0.0
    type_m = 1.0 if sensor_input.type == "M" else 0.0

    numeric_vals = np.array(
        [
            [
                sensor_input.air_temperature,
                sensor_input.process_temperature,
                sensor_input.rotational_speed,
                sensor_input.torque,
                sensor_input.tool_wear,
            ]
        ],
        dtype=np.float32,
    )

    numeric_scaled = scaler.transform(numeric_vals)

    categorical_vals = np.array([[type_h, type_l, type_m]], dtype=np.float32)

    full_features = np.hstack([numeric_scaled, categorical_vals])
    return full_features
