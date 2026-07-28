import os
import json
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
)

from app.core.config import MODELS_DIR, MODEL_PATH, BASELINE_MODEL_PATH, METRICS_PATH
from app.ml.preprocess import load_and_preprocess_data
from app.ml.model import BayesianNeuralNetwork, BaselineNeuralNetwork
from app.utils.logger import logger


def calculate_expected_calibration_error(y_true, y_prob, n_bins=10):
    """Computes Expected Calibration Error (ECE) for reliability evaluation."""
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    total_samples = len(y_true)

    for i in range(n_bins):
        bin_lower = bin_boundaries[i]
        bin_upper = bin_boundaries[i + 1]
        in_bin = (y_prob >= bin_lower) & (y_prob < bin_upper)
        prop_in_bin = np.mean(in_bin)

        if prop_in_bin > 0:
            accuracy_in_bin = np.mean(y_true[in_bin])
            avg_confidence_in_bin = np.mean(y_prob[in_bin])
            ece += np.abs(accuracy_in_bin - avg_confidence_in_bin) * prop_in_bin

    return float(ece)


def train_model(
    model: nn.Module,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    epochs: int = 150,
    lr: float = 0.003,
    batch_size: int = 128,
    patience: int = 20,
) -> nn.Module:
    """Train loop with BCE loss, class pos_weight, and early stopping."""
    # Convert numpy to torch tensors
    X_tr = torch.tensor(X_train, dtype=torch.float32)
    y_tr = torch.tensor(y_train, dtype=torch.float32).unsqueeze(1)
    X_v = torch.tensor(X_val, dtype=torch.float32)
    y_v = torch.tensor(y_val, dtype=torch.float32).unsqueeze(1)

    # Class weight calculation for imbalance handling
    pos_count = y_train.sum()
    neg_count = len(y_train) - pos_count
    pos_weight = torch.tensor([neg_count / max(pos_count, 1.0)], dtype=torch.float32)

    criterion = nn.BCELoss(weight=None)
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)

    best_loss = float("inf")
    best_weights = None
    patience_counter = 0

    dataset_size = len(X_train)

    model.train()
    for epoch in range(epochs):
        permutation = torch.randperm(dataset_size)
        epoch_loss = 0.0

        for i in range(0, dataset_size, batch_size):
            indices = permutation[i : i + batch_size]
            batch_x, batch_y = X_tr[indices], y_tr[indices]

            optimizer.zero_grad()
            outputs = model(batch_x)

            # Apply weighted loss manually to avoid BCELoss target dimension issues
            weights = torch.where(batch_y == 1, pos_weight, torch.tensor(1.0))
            loss = (criterion(outputs, batch_y) * weights).mean()

            loss.backward()
            optimizer.step()
            epoch_loss += loss.item() * len(batch_x)

        # Validation phase
        model.eval()
        with torch.no_grad():
            val_outputs = model(X_v)
            val_weights = torch.where(y_v == 1, pos_weight, torch.tensor(1.0))
            val_loss = (criterion(val_outputs, y_v) * val_weights).mean().item()

        model.train()

        if val_loss < best_loss:
            best_loss = val_loss
            best_weights = model.state_dict().copy()
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                logger.info(f"Early stopping triggered at epoch {epoch + 1}")
                break

    if best_weights:
        model.load_state_dict(best_weights)

    return model


def evaluate_predictions(y_true: np.ndarray, y_prob: np.ndarray, threshold: float = 0.5):
    """Computes full suite of classification and calibration metrics."""
    y_pred = (y_prob >= threshold).astype(int)

    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_true, y_prob))
    ece = calculate_expected_calibration_error(y_true, y_prob)

    return {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1_score": f1,
        "roc_auc": roc_auc,
        "calibration_ece": ece,
    }


def run_training_pipeline():
    """Main execution script to train BNN and baseline models, save weights & print comparison."""
    logger.info("Starting model training pipeline...")
    data = load_and_preprocess_data(save_scaler=True)

    X_train, y_train = data["X_train"], data["y_train"]
    X_val, y_val = data["X_val"], data["y_val"]
    X_test, y_test = data["X_test"], data["y_test"]

    input_dim = X_train.shape[1]

    # 1. Train Bayesian Neural Network (MC Dropout)
    logger.info("Training Bayesian Neural Network...")
    bnn = BayesianNeuralNetwork(input_dim=input_dim)
    bnn = train_model(bnn, X_train, y_train, X_val, y_val)
    torch.save(bnn.state_dict(), MODEL_PATH)
    logger.info(f"Saved BNN model to {MODEL_PATH}")

    # Evaluate BNN with 50 MC Dropout passes on test set
    bnn.eval()
    bnn.enable_mc_dropout(True)
    X_test_tensor = torch.tensor(X_test, dtype=torch.float32)

    mc_preds = []
    with torch.no_grad():
        for _ in range(50):
            mc_preds.append(bnn(X_test_tensor).numpy())

    mc_preds = np.hstack(mc_preds)  # Shape: [N_test, 50]
    bnn_probs = mc_preds.mean(axis=1)
    bnn_metrics = evaluate_predictions(y_test, bnn_probs)

    # 2. Train Deterministic Baseline Model (Dropout off at test time)
    logger.info("Training Baseline Neural Network...")
    baseline = BaselineNeuralNetwork(input_dim=input_dim)
    baseline = train_model(baseline, X_train, y_train, X_val, y_val)
    torch.save(baseline.state_dict(), BASELINE_MODEL_PATH)
    logger.info(f"Saved Baseline model to {BASELINE_MODEL_PATH}")

    baseline.eval()
    with torch.no_grad():
        baseline_probs = baseline(X_test_tensor).numpy().ravel()
    baseline_metrics = evaluate_predictions(y_test, baseline_probs)

    all_metrics = {
        "bayesian_bnn": bnn_metrics,
        "baseline_nn": baseline_metrics,
        "test_sample_count": len(y_test),
        "test_positive_count": int(y_test.sum()),
    }

    with open(METRICS_PATH, "w") as f:
        json.dump(all_metrics, f, indent=2)

    logger.info("=== MODEL EVALUATION METRICS COMPARISON ===")
    logger.info(f"Bayesian BNN (MC Dropout): {bnn_metrics}")
    logger.info(f"Baseline Standard NN:      {baseline_metrics}")
    logger.info(f"Metrics saved to {METRICS_PATH}")

    return all_metrics


if __name__ == "__main__":
    run_training_pipeline()
