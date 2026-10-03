import { SensorInputData, PredictionResult, ModelInfo } from "@/types/prediction";
import { PredictionResponseSchema } from "@/lib/schemas";
import { DispatchWebhookPayload, DispatchWebhookResponse } from "@/types/ticket";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

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

export async function fetchBatchPrediction(inputs: SensorInputData[]): Promise<PredictionResult[]> {
  const response = await fetch(`${API_BASE_URL}/predict/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Batch prediction error (${response.status}): ${errorText}`);
  }

  const jsonArray = await response.json();
  return jsonArray.map((item: unknown) => PredictionResponseSchema.parse(item) as PredictionResult);
}

export async function dispatchMaintenanceTicket(payload: DispatchWebhookPayload): Promise<DispatchWebhookResponse> {
  const response = await fetch(`${API_BASE_URL}/tickets/dispatch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Dispatch service error (${response.status}): ${errorText}`);
  }

  return (await response.json()) as DispatchWebhookResponse;
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
