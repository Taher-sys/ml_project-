import { SensorInputData, PredictionResult, ModelInfo } from "@/types/prediction";
import { PredictionResponseSchema } from "@/lib/schemas";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchPrediction(data: SensorInputData): Promise<PredictionResult> {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Prediction service error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const parsed = PredictionResponseSchema.parse(json);
  return parsed as PredictionResult;
}

export async function fetchModelInfo(): Promise<ModelInfo> {
  const response = await fetch(`${API_BASE_URL}/model-info`);
  if (!response.ok) {
    throw new Error(`Failed to fetch model info: ${response.statusText}`);
  }
  return await response.json();
}

export async function fetchHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  return await response.json();
}
