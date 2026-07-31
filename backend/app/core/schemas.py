from typing import List, Literal, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class SensorInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    air_temperature: float = Field(
        ...,
        ge=200.0,
        le=400.0,
        description="Air temperature in Kelvin [K]",
        json_schema_extra={"example": 300.5},
    )
    process_temperature: float = Field(
        ...,
        ge=200.0,
        le=400.0,
        description="Process temperature in Kelvin [K]",
        json_schema_extra={"example": 310.2},
    )
    rotational_speed: float = Field(
        ...,
        ge=0.0,
        le=5000.0,
        description="Rotational speed in RPM",
        json_schema_extra={"example": 1500.0},
    )
    torque: float = Field(
        ...,
        ge=0.0,
        le=300.0,
        description="Torque in Nm",
        json_schema_extra={"example": 40.5},
    )
    tool_wear: float = Field(
        ...,
        ge=0.0,
        le=500.0,
        description="Tool wear in minutes",
        json_schema_extra={"example": 120.0},
    )
    type: Literal["L", "M", "H"] = Field(
        ...,
        description="Product quality variant (L=Low 50%, M=Medium 30%, H=High 20%)",
        json_schema_extra={"example": "M"},
    )


class BatchSensorInput(BaseModel):
    inputs: List[SensorInput]


class ShapContribution(BaseModel):
    feature: str
    value: float


class PredictionResponse(BaseModel):
    failure_probability: float = Field(..., description="Mean predicted probability of machine failure [0, 1]")
    confidence_score: float = Field(..., description="Epistemic confidence score derived from MC Dropout variance [0, 1]")
    uncertainty_std: float = Field(..., description="Standard deviation across MC Dropout passes")
    prediction: Literal["failure", "normal"] = Field(..., description="Binary prediction label")
    shap_contributions: List[ShapContribution] = Field(..., description="Feature attribution scores via SHAP")
    recommendation: str = Field(..., description="Confidence-aware maintenance action recommendation")
    safety_measures: List[str] = Field(default_factory=list, description="Specific safety measures to prevent/mitigate failure")


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"


class ModelInfoResponse(BaseModel):
    model_type: str = "Bayesian Neural Network (Monte Carlo Dropout)"
    mc_samples: int = 50
    input_features: List[str]
    metrics: Dict[str, Any]
    training_dataset: str = "AI4I 2020 Predictive Maintenance Dataset (UCI Machine Learning Repository)"
