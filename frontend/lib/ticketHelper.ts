import {
  MaintenanceTicket,
  FailureModeInfo,
  FailureModeCode,
  UrgencyLevel,
  SOPChecklistItem,
  BatchTelemetryRow,
} from "@/types/ticket";
import { PredictionResult, SensorInputData } from "@/types/prediction";

export function diagnoseClientFailureMode(
  input: SensorInputData,
  failureProb: number
): FailureModeInfo {
  const airT = input.air_temperature;
  const procT = input.process_temperature;
  const speed = input.rotational_speed;
  const torque = input.torque;
  const wear = input.tool_wear;
  const mType = input.type;

  const tempDiff = procT - airT;
  const powerW = torque * speed * ((2 * Math.PI) / 60.0);
  const strain = wear * torque;

  const osfThreshold = mType === "L" ? 11000 : mType === "M" ? 12000 : 13000;

  const isTwf = wear >= 200;
  const isHdf = tempDiff < 8.6 && speed < 1380;
  const isPwf = powerW < 3500 || powerW > 9000;
  const isOsf = strain > osfThreshold;

  const indicators: string[] = [];
  if (isTwf) indicators.push(`Tool wear (${wear.toFixed(1)} min) exceeds fatigue threshold (>= 200 min)`);
  if (isHdf) indicators.push(`Thermal delta (${tempDiff.toFixed(1)} K < 8.6 K) with low speed (${speed} rpm < 1380 rpm)`);
  if (isPwf) indicators.push(`Drive power (${powerW.toFixed(0)} W) outside envelope [3500 W - 9000 W]`);
  if (isOsf) indicators.push(`Critical strain (${strain.toFixed(0)} min*Nm > ${osfThreshold} limit for Type-${mType})`);

  if (isOsf) {
    return {
      code: "OSF",
      name: "Overstrain Failure (OSF)",
      shortName: "Overstrain",
      description: "Cutting tool wear combined with peak cutting torque exceeds material shear limits.",
      indicators,
      severity: "high",
    };
  }

  if (isPwf) {
    return {
      code: "PWF",
      name: "Power Failure (PWF)",
      shortName: "Power Failure",
      description: "Spindle drive electrical power draw operates outside certified mechanical limits.",
      indicators,
      severity: "high",
    };
  }

  if (isHdf) {
    return {
      code: "HDF",
      name: "Heat Dissipation Failure (HDF)",
      shortName: "Heat Dissipation",
      description: "Insufficient convective cooling due to low spindle velocity and shallow thermal gradient.",
      indicators,
      severity: "medium",
    };
  }

  if (isTwf) {
    return {
      code: "TWF",
      name: "Tool Wear Failure (TWF)",
      shortName: "Tool Wear",
      description: "Cutting edge has sustained micro-chipping and flank wear exceeding safe limits.",
      indicators,
      severity: "high",
    };
  }

  if (failureProb >= 0.5) {
    return {
      code: "RNF",
      name: "Random Operational Anomaly (RNF)",
      shortName: "Random Anomaly",
      description: "Stochastic process perturbation detected without single mechanical breach.",
      indicators: [`Predicted failure probability (${(failureProb * 100).toFixed(1)}%) above safety line`],
      severity: "medium",
    };
  }

  return {
    code: "NONE",
    name: "Nominal Operational Health",
    shortName: "Nominal",
    description: "Operating telemetry parameters are well within nominal factory tolerances.",
    indicators: ["All sensor streams within certified operational specifications"],
    severity: "none",
  };
}

export function generateSOPChecklist(
  failureCode: FailureModeCode,
  topFeature: string
): SOPChecklistItem[] {
  const baseItems: SOPChecklistItem[] = [
    {
      id: "sop-1",
      step: "Halt spindle drive and engage zero-energy safety interlock (LOTO)",
      category: "Operational",
      completed: false,
      critical: true,
    },
    {
      id: "sop-2",
      step: "Perform visual inspection of workpiece clamp and spindle chuck runout",
      category: "Mechanical",
      completed: false,
      critical: false,
    },
  ];

  if (failureCode === "TWF" || topFeature.toLowerCase().includes("wear")) {
    baseItems.push(
      {
        id: "sop-twf-1",
        step: "Inspect cutting insert with optical comparator for flank wear (VB > 0.3 mm)",
        category: "Mechanical",
        completed: false,
        critical: true,
      },
      {
        id: "sop-twf-2",
        step: "Index tool magazine and torque replacement carbide insert to 4.5 Nm",
        category: "Mechanical",
        completed: false,
        critical: true,
      },
      {
        id: "sop-twf-3",
        step: "Reset cumulative tool wear timer and tool offset register in CNC control",
        category: "Verification",
        completed: false,
        critical: false,
      }
    );
  } else if (failureCode === "HDF" || topFeature.toLowerCase().includes("temp")) {
    baseItems.push(
      {
        id: "sop-hdf-1",
        step: "Inspect coolant fluid delivery nozzles and clear chip buildup from manifold",
        category: "Thermal",
        completed: false,
        critical: true,
      },
      {
        id: "sop-hdf-2",
        step: "Verify heat exchanger chiller return temperature is below 22°C (71.6°F)",
        category: "Thermal",
        completed: false,
        critical: true,
      },
      {
        id: "sop-hdf-3",
        step: "Check cabinet air intake filters and inspect forced-air ventilation fan RPM",
        category: "Thermal",
        completed: false,
        critical: false,
      }
    );
  } else if (failureCode === "PWF" || topFeature.toLowerCase().includes("speed")) {
    baseItems.push(
      {
        id: "sop-pwf-1",
        step: "Measure 3-phase drive inverter output voltage and current draw with calibrated clamp",
        category: "Electrical",
        completed: false,
        critical: true,
      },
      {
        id: "sop-pwf-2",
        step: "Inspect spindle drive belt tension and check gearbox lubrication level",
        category: "Mechanical",
        completed: false,
        critical: false,
      },
      {
        id: "sop-pwf-3",
        step: "Execute 2-minute unloaded spindle ramp test across full 1100-3000 RPM envelope",
        category: "Verification",
        completed: false,
        critical: true,
      }
    );
  } else if (failureCode === "OSF" || topFeature.toLowerCase().includes("torque")) {
    baseItems.push(
      {
        id: "sop-osf-1",
        step: "Inspect tool holder taper for galling, fretting corrosion, and drawbar retention force",
        category: "Mechanical",
        completed: false,
        critical: true,
      },
      {
        id: "sop-osf-2",
        step: "Reduce feed rate per tooth by 20% on next CAM roughing pass cycle",
        category: "Operational",
        completed: false,
        critical: true,
      },
      {
        id: "sop-osf-3",
        step: "Verify workpiece raw material hardness test certificate against batch spec",
        category: "Verification",
        completed: false,
        critical: false,
      }
    );
  } else {
    baseItems.push(
      {
        id: "sop-gen-1",
        step: "Perform complete transducer sensor harness continuity and ground impedance check",
        category: "Electrical",
        completed: false,
        critical: true,
      },
      {
        id: "sop-gen-2",
        step: "Run CNC automated diagnostic calibration cycle before re-authorizing production",
        category: "Verification",
        completed: false,
        critical: true,
      }
    );
  }

  baseItems.push({
    id: "sop-final",
    step: "Log completed maintenance ticket in CMMS and clear shop-floor beacon alert",
    category: "Operational",
    completed: false,
    critical: true,
  });

  return baseItems;
}

export function createMaintenanceTicketFromRow(
  row: BatchTelemetryRow,
  index: number
): MaintenanceTicket {
  const pred = row.predictionResult || {
    failure_probability: 0.85,
    confidence_score: 0.88,
    uncertainty_std: 0.042,
    prediction: "failure",
    shap_contributions: [
      { feature: "tool_wear", value: 0.45 },
      { feature: "torque", value: 0.32 },
      { feature: "rotational_speed", value: -0.12 },
    ],
    recommendation: "Immediate maintenance required",
    safety_measures: ["Halt spindle drive", "Inspect cutting insert wear"],
  };

  const sensorData: SensorInputData = {
    air_temperature: row.air_temperature,
    process_temperature: row.process_temperature,
    rotational_speed: row.rotational_speed,
    torque: row.torque,
    tool_wear: row.tool_wear,
    type: row.type,
  };

  const failureMode = row.failureMode || diagnoseClientFailureMode(sensorData, pred.failure_probability);

  let urgency: UrgencyLevel = "REVIEW";
  if (pred.failure_probability > 0.65 || failureMode.code === "OSF" || failureMode.code === "TWF") {
    urgency = "CRITICAL";
  } else if (pred.failure_probability > 0.4 || pred.uncertainty_std > 0.08) {
    urgency = "ELEVATED";
  }

  const topFeature =
    pred.shap_contributions && pred.shap_contributions.length > 0
      ? pred.shap_contributions[0].feature
      : "Torque";

  const sopChecklist = generateSOPChecklist(failureMode.code, topFeature);

  const hexRandom = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
  const ticketId = `TKT-2026-X${row.rowIndex || index + 1}-${hexRandom}`;

  return {
    ticketId,
    machineId: row.machineId || `M-${10000 + (row.rowIndex || index + 1)}`,
    timestamp: new Date().toISOString(),
    urgency,
    priorityOverride: urgency === "CRITICAL" ? "CRITICAL" : "ELEVATED",
    assignedTechnician: "Marcus Vance",
    status: "OPEN",
    sensorData,
    prediction: pred,
    failureMode,
    sopChecklist,
    notes: `Triggered via batch telemetry ingestion. Mode: ${failureMode.name}.`,
  };
}
