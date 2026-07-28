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
      <div className="glass-panel rounded-2xl p-6 shadow-xl animate-pulse flex flex-col justify-center items-center h-48 border border-slate-800">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm text-slate-400 font-mono-numeric">Evaluating Monte Carlo stochastic passes...</p>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="glass-panel rounded-2xl p-6 shadow-xl flex flex-col justify-center items-center h-48 text-center border border-slate-800">
        <ShieldAlert className="w-8 h-8 text-slate-600 mb-2" />
        <h3 className="text-sm font-semibold text-slate-400">Awaiting Sensor Telemetry</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Submit inputs or select a preset scenario to evaluate failure likelihood and model uncertainty.
        </p>
      </div>
    );
  }

  const isFailure = prediction.prediction === "failure";
  const probPercent = (prediction.failure_probability * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`glass-panel rounded-2xl p-6 shadow-2xl relative overflow-hidden border ${
        isFailure
          ? "border-rose-500/40 bg-gradient-to-br from-rose-950/20 via-slate-900/80 to-slate-900"
          : "border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-slate-900/80 to-slate-900"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Prediction Assessment
        </span>
        <span
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isFailure
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          }`}
        >
          {isFailure ? (
            <>
              <AlertOctagon className="w-3.5 h-3.5" /> Failure Hazard
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> Normal Operation
            </>
          )}
        </span>
      </div>

      <div className="flex items-baseline gap-3 my-2">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-5xl font-extrabold font-mono-numeric tracking-tight ${
            isFailure ? "text-rose-400 text-glow-red" : "text-emerald-400 text-glow-cyan"
          }`}
        >
          {probPercent}%
        </motion.span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Predicted Failure Probability
        </span>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>
          Epistemic Std Deviation (σ):{" "}
          <strong className="text-slate-200 font-mono-numeric">{prediction.uncertainty_std.toFixed(4)}</strong>
        </span>
        <span>
          Confidence Score:{" "}
          <strong className="text-cyan-400 font-mono-numeric">{(prediction.confidence_score * 100).toFixed(1)}%</strong>
        </span>
      </div>
    </motion.div>
  );
};
