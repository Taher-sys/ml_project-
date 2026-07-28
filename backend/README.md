# TrustAI-PM Backend

FastAPI Python microservice for Bayesian Deep Learning predictive maintenance inference, MC Dropout epistemic uncertainty quantification, SHAP explainability, and rule-based maintenance action recommendation.

## Architecture

- **`app/main.py`**: FastAPI application entry point with startup lifespan handlers.
- **`app/api/routes.py`**: REST endpoints (`/api/predict`, `/api/predict/batch`, `/api/health`, `/api/model-info`).
- **`app/core/`**: Pydantic schemas and application settings (`config.py`, `schemas.py`).
- **`app/ml/preprocess.py`**: Dataset loader, One-Hot Encoding, StandardScaler fitting & input transformation.
- **`app/ml/model.py`**: PyTorch BNN with `MCDropout` layers and baseline NN.
- **`app/ml/train.py`**: Training loop with BCE loss, class imbalance weighting, early stopping, and ECE calibration metrics.
- **`app/ml/uncertainty.py`**: Monte Carlo Dropout inference engine ($N=50$ forward passes).
- **`app/ml/explain.py`**: SHAP `KernelExplainer` wrapper for local feature attributions.
- **`app/ml/recommend.py`**: Confidence-aware action recommendation decision matrix.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run model training pipeline
python -m app.ml.train

# Start FastAPI dev server
uvicorn app.main:app --reload --port 8000
```
