import numpy as np
import torch
import shap
from typing import List, Dict
from app.core.config import FEATURE_COLUMNS
from app.ml.model import BayesianNeuralNetwork
from app.utils.logger import logger


class ShapExplainerWrapper:
    """Wrapper around SHAP KernelExplainer/DeepExplainer for PyTorch BNN model."""

    def __init__(self, model: BayesianNeuralNetwork, background_samples: np.ndarray):
        self.model = model
        self.model.eval()
        self.model.enable_mc_dropout(False)  # Deterministic mode for SHAP attribution speed

        # Subsample background data deterministically using fixed seed
        np.random.seed(42)
        if len(background_samples) > 50:
            rng = np.random.default_rng(42)
            indices = rng.choice(len(background_samples), size=50, replace=False)
            self.background = background_samples[indices]
        else:
            self.background = background_samples

        def predict_fn(x: np.ndarray) -> np.ndarray:
            x_tensor = torch.tensor(x, dtype=torch.float32)
            with torch.no_grad():
                probs = self.model(x_tensor).numpy()
            return probs

        self.explainer = shap.KernelExplainer(predict_fn, self.background)
        logger.info("SHAP KernelExplainer initialized successfully.")

    def explain(self, x: np.ndarray) -> List[Dict[str, float]]:
        """
        Computes signed SHAP values for a single input sample [1, 8].

        Returns:
            List of dicts: [{'feature': 'tool_wear', 'value': 0.31}, ...] sorted by absolute magnitude.
        """
        # Set seed prior to shap_values computation for 100% deterministic sampling
        np.random.seed(42)
        shap_values = self.explainer.shap_values(x, nsamples=100)

        # Ensure sv is a 1D numpy array of shape (n_features,)
        sv = np.array(shap_values)
        sv = np.squeeze(sv)
        if sv.ndim == 0:
            sv = np.array([float(sv)])

        # Readable feature names mapping
        name_map = {
            "Air temperature [K]": "air_temperature",
            "Process temperature [K]": "process_temperature",
            "Rotational speed [rpm]": "rotational_speed",
            "Torque [Nm]": "torque",
            "Tool wear [min]": "tool_wear",
            "Type_H": "type_H",
            "Type_L": "type_L",
            "Type_M": "type_M",
        }

        raw_contributions = []
        for i, col in enumerate(FEATURE_COLUMNS):
            raw_contributions.append(
                {
                    "feature": name_map.get(col, col),
                    "value": round(float(sv[i]), 4),
                }
            )

        # Aggregate categorical 'type' components for cleaner presentation
        type_val = sum(c["value"] for c in raw_contributions if c["feature"].startswith("type_"))
        main_contributions = [c for c in raw_contributions if not c["feature"].startswith("type_")]
        main_contributions.append({"feature": "machine_type", "value": round(type_val, 4)})

        # Sort by absolute impact descending
        main_contributions.sort(key=lambda item: abs(item["value"]), reverse=True)

        return main_contributions
