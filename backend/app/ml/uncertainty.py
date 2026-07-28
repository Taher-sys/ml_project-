import torch
import numpy as np
from app.ml.model import BayesianNeuralNetwork


def predict_with_uncertainty(
    model: BayesianNeuralNetwork,
    X: np.ndarray,
    n_samples: int = 50,
) -> dict:
    """
    Executes N stochastic forward passes using Monte Carlo Dropout to estimate
    predictive mean, epistemic uncertainty (std dev), and confidence score.

    Args:
        model: Trained BayesianNeuralNetwork instance.
        X: Input feature array of shape [1, 8] or [N_batch, 8].
        n_samples: Number of MC Dropout stochastic forward passes.

    Returns:
        Dict containing mean_probability, std_deviation, confidence_score, and prediction label.
    """
    model.eval()
    model.enable_mc_dropout(True)

    X_tensor = torch.tensor(X, dtype=torch.float32)

    pass_outputs = []
    with torch.no_grad():
        for _ in range(n_samples):
            probs = model(X_tensor).numpy()
            pass_outputs.append(probs)

    # pass_outputs shape: [n_samples, batch_size, 1]
    stacked = np.array(pass_outputs)  # [n_samples, batch_size, 1]

    # Calculate statistics along sample axis (axis 0)
    mean_prob = float(np.mean(stacked[:, 0, 0]))
    std_dev = float(np.std(stacked[:, 0, 0]))

    # Derived confidence score: max std for [0, 1] bounded outputs is 0.5.
    # We map std_dev in [0.0, 0.35] to confidence score in [1.0, 0.0].
    confidence_score = float(max(0.0, min(1.0, 1.0 - (std_dev / 0.35))))

    prediction_label = "failure" if mean_prob >= 0.5 else "normal"

    return {
        "mean_probability": round(mean_prob, 4),
        "std_deviation": round(std_dev, 4),
        "confidence_score": round(confidence_score, 4),
        "prediction": prediction_label,
        "raw_samples": [float(val) for val in stacked[:, 0, 0]],
    }
