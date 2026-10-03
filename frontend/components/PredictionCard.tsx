"use client";

import React from "react";
import { motion } from "framer-motion";
import { PredictionResult } from "@/types/prediction";
import { AlertOctagon, CheckCircle2, Activity, ShieldAlert } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";

interface PredictionCardProps {
  prediction: PredictionResult | null;
  isLoading: boolean;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({ prediction, isLoading }) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl p-6 border border-zinc-800 bg-zinc-950/70 backdrop-blur-md shadow-xl flex flex-col justify-center items-center h-48">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-xs text-zinc-400 font-mono">Running 50 Monte Carlo Dropout Forward Passes...</p>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="rounded-2xl p-6 border border-zinc-800 bg-zinc-950/70 backdrop-blur-md shadow-xl flex flex-col justify-center items-center h-48 text-center">
        <ShieldAlert className="w-8 h-8 text-zinc-600 mb-2" />
        <h3 className="text-sm font-semibold text-zinc-300 font-mono">Awaiting Sensor Telemetry</h3>
        <p className="text-xs text-zinc-500 max-w-xs mt-1">
          Adjust parameters or select a preset scenario to evaluate failure likelihood.
        </p>
      </div>
    );
  }

  const isFailure = prediction.prediction === "failure";
  const probPercent = (prediction.failure_probability * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl p-6 relative overflow-hidden border backdrop-blur-xl transition-all shadow-2xl ${
        isFailure
          ? "border-red-500/40 bg-gradient-to-br from-red-950/30 via-zinc-950 to-zinc-950"
          : "border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-zinc-950 to-zinc-950"
      }`}
    >
      {isFailure && (
        <BorderBeam
          size={180}
          duration={8}
          colorFrom="#f43f5e"
          colorTo="#ea580c"
          borderWidth={1.5}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
          Prediction Assessment
        </span>
        <span
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider border ${
            isFailure
              ? "bg-red-500/15 text-red-400 border-red-500/40 shadow-sm shadow-red-500/10"
              : "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/10"
          }`}
        >
          {isFailure ? (
            <>
              <AlertOctagon className="w-3.5 h-3.5" /> Failure Hazard
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> Nominal Operation
            </>
          )}
        </span>
      </div>

      <div className="flex items-baseline gap-3 my-2">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-5xl font-black font-mono-numeric tracking-tight ${
            isFailure ? "text-red-400 text-glow-red" : "text-emerald-400 text-glow-cyan"
          }`}
        >
          {probPercent}%
        </motion.span>
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
          Failure Likelihood
        </span>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-mono">
        <span>
          Epistemic Std (σ):{" "}
          <strong className="text-zinc-200">{prediction.uncertainty_std.toFixed(4)}</strong>
        </span>
        <span>
          Confidence:{" "}
          <strong className="text-cyan-400">{(prediction.confidence_score * 100).toFixed(1)}%</strong>
        </span>
      </div>
    </motion.div>
  );
};
