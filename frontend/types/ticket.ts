import { SensorInputData, PredictionResult } from "./prediction";

export type FailureModeCode = "TWF" | "HDF" | "PWF" | "OSF" | "RNF" | "NONE";

export interface FailureModeInfo {
  code: FailureModeCode;
  name: string;
  shortName: string;
  description: string;
  indicators: string[];
  severity: "high" | "medium" | "low" | "none";
}

export type UrgencyLevel = "CRITICAL" | "ELEVATED" | "REVIEW";

export type PriorityLevel = "CRITICAL" | "ELEVATED" | "STANDARD" | "LOW";

export interface BatchTelemetryRow {
  id: string;
  rowIndex: number;
  machineId: string;
  air_temperature: number;
  process_temperature: number;
  rotational_speed: number;
  torque: number;
  tool_wear: number;
  type: "L" | "M" | "H";
  predictionResult?: PredictionResult;
  failureMode?: FailureModeInfo;
  isAnomalous?: boolean;
  anomalyReason?: string;
  status: "pending" | "evaluating" | "evaluated" | "error";
  errorMessage?: string;
}

export interface SOPChecklistItem {
  id: string;
  step: string;
  category: "Mechanical" | "Thermal" | "Electrical" | "Operational" | "Verification";
  completed: boolean;
  critical: boolean;
}

export interface MaintenanceTicket {
  ticketId: string;
  machineId: string;
  timestamp: string;
  urgency: UrgencyLevel;
  priorityOverride: PriorityLevel;
  assignedTechnician: string;
  status: "OPEN" | "DISPATCHED" | "RESOLVED";
  sensorData: SensorInputData;
  prediction: PredictionResult;
  failureMode: FailureModeInfo;
  sopChecklist: SOPChecklistItem[];
  notes: string;
  dispatchedAt?: string;
  dispatchId?: string;
}

export interface DispatchWebhookPayload {
  ticketId: string;
  machineId: string;
  timestamp: string;
  urgency: UrgencyLevel;
  priorityOverride: PriorityLevel;
  assignedTechnician: string;
  failureMode: FailureModeInfo;
  failureProbability: number;
  uncertaintyStd: number;
  confidenceScore: number;
  topContributingFeature: string;
  sensorData: SensorInputData;
  sopChecklist: SOPChecklistItem[];
  notes?: string;
}

export interface DispatchWebhookResponse {
  status: "dispatched" | "failed";
  dispatchId: string;
  ticketId: string;
  timestamp: string;
  assignedTechnician: string;
  message: string;
}

export interface CSVParsingError {
  row: number;
  column?: string;
  message: string;
  value?: string;
}

export interface FeatureBaselineComparison {
  featureKey: string;
  displayName: string;
  actualValue: number;
  baselineMean: number;
  delta: number;
  unit: string;
  shapScore?: number;
  impactsRisk: boolean;
}
