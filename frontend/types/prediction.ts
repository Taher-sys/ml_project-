export type MachineType = "L" | "M" | "H";

export interface SensorInputData {
  air_temperature: number;
  process_temperature: number;
  rotational_speed: number;
  torque: number;
  tool_wear: number;
  type: MachineType;
}

export interface ShapContributionData {
  feature: string;
  value: number;
}

export interface PredictionResult {
  failure_probability: number;
  confidence_score: number;
  uncertainty_std: number;
  prediction: "failure" | "normal";
  shap_contributions: ShapContributionData[];
  recommendation: string;
  safety_measures: string[];
}

export interface ModelInfoMetrics {
  bayesian_bnn?: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    calibration_ece: number;
  };
  baseline_nn?: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    calibration_ece: number;
  };
  test_sample_count?: number;
  test_positive_count?: number;
}

export interface ModelInfo {
  model_type: string;
  mc_samples: number;
  input_features: string[];
  metrics: ModelInfoMetrics;
  training_dataset: string;
}
