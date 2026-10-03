"use client";

import React from "react";
import { motion } from "framer-motion";
import { PredictionResult } from "@/types/prediction";
import { AlertOctagon, CheckCircle2, Activity, ShieldAlert } from "lucide-react";

interface PredictionCardProps {
  prediction: PredictionResult | null;
  isLoading: boolean;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({ prediction, isLoading }) => {
  if (isLoading) {
    return (
      <div className="rounded-xl p-6 border border-[#2A3241] bg-[#181D24] shadow-sm flex flex-col justify-center items-center h-48">
        <Activity className="w-8 h-8 text-[#10B981] animate-spin mb-3" />
        <p className="text-xs text-[#7E8B9B] font-mono">Running 50 Monte Carlo Dropout Forward Passes...</p>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="rounded-xl p-6 border border-[#2A3241] bg-[#181D24] shadow-sm flex flex-col justify-center items-center h-48 text-center">
        <ShieldAlert className="w-8 h-8 text-[#7E8B9B] mb-2" />
        <h3 className="text-sm font-semibold text-[#EDEDED] font-mono">Awaiting Sensor Telemetry</h3>
        <p className="text-xs text-[#7E8B9B] max-w-xs mt-1">
          Adjust parameters or select a preset scenario to evaluate failure likelihood.
        </p>
      </div>
    );
  }

  const isFailure = prediction.prediction === "failure";
  const probPercent = (prediction.failure_probability * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl p-6 border shadow-sm transition-colors ${
        isFailure
          ? "border-[#FF3B30] bg-[#181D24]"
          : "border-[#2A3241] bg-[#181D24]"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold text-[#7E8B9B] uppercase tracking-widest font-mono">
          Prediction Assessment
        </span>
        <span
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold font-mono uppercase tracking-wider border ${
            isFailure
              ? "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/50"
              : "bg-[#13171D] text-[#10B981] border-[#10B981]/40"
          }`}
        >
          {isFailure ? (
            <>
              <AlertOctagon className="w-3.5 h-3.5" /> Failure Hazard
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Nominal Operation
            </>
          )}
        </span>
      </div>

      <div className="flex items-baseline gap-3 my-2">
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-5xl font-black font-mono-numeric tracking-tight ${
            isFailure ? "text-[#FF3B30]" : "text-[#EDEDED]"
          }`}
        >
          {probPercent}%
        </motion.span>
        <span className="text-xs font-semibold text-[#7E8B9B] uppercase tracking-wider font-mono">
          Failure Likelihood
        </span>
      </div>

      <div className="mt-4 pt-3 border-t border-[#2A3241] flex items-center justify-between text-xs text-[#7E8B9B] font-mono">
        <span>
          Epistemic Std (σ):{" "}
          <strong className="text-[#EDEDED]">{prediction.uncertainty_std.toFixed(4)}</strong>
        </span>
        <span>
          Confidence:{" "}
          <strong className="text-[#10B981]">{(prediction.confidence_score * 100).toFixed(1)}%</strong>
        </span>
      </div>
    </motion.div>
  );
};
