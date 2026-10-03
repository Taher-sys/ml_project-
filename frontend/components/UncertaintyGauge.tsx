"use client";

import React from "react";
import { motion } from "framer-motion";
import { HelpCircle, Cpu, ShieldCheck, AlertCircle } from "lucide-react";

interface UncertaintyGaugeProps {
  confidenceScore: number;
  uncertaintyStd: number;
}

export const UncertaintyGauge: React.FC<UncertaintyGaugeProps> = ({
  confidenceScore,
  uncertaintyStd,
}) => {
  const scorePercent = Math.min(100, Math.max(0, confidenceScore * 100));

  const radius = 70;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;
  const needleAngle = -90 + (scorePercent / 100) * 180;

  return (
    <div className="rounded-2xl p-6 border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl shadow-xl relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest font-mono">
            Bayesian Confidence Gauge
          </h3>
        </div>
        <div className="group relative cursor-pointer">
          <HelpCircle className="w-4 h-4 text-zinc-500 hover:text-cyan-400 transition-colors" />
          <div className="absolute right-0 top-6 w-64 p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-300 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 font-mono">
            <strong>Monte Carlo Dropout:</strong> 50 stochastic forward passes with dropout active at inference time. Higher confidence = lower epistemic uncertainty (σ).
          </div>
        </div>
      </div>

      {/* SVG Radial Arc Gauge */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg className="w-48 h-28 overflow-visible" viewBox="0 0 160 90">
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke="#1e293b"
            strokeWidth="14"
            strokeLinecap="round"
          />

          <motion.path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke="url(#vngGaugeGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          <defs>
            <linearGradient id="vngGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Animated Needle */}
          <motion.g
            initial={{ rotate: -90 }}
            animate={{ rotate: needleAngle }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ transformOrigin: "80px 80px" }}
          >
            <line x1="80" y1="80" x2="80" y2="22" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
            <circle cx="80" cy="80" r="6" fill="#06b6d4" stroke="#f8fafc" strokeWidth="2" />
          </motion.g>
        </svg>

        <div className="text-center -mt-2">
          <span className="text-3xl font-black text-zinc-100 font-mono-numeric tracking-tight">
            {scorePercent.toFixed(1)}%
          </span>
          <p className="text-[11px] text-zinc-400 font-mono">Epistemic Certainty</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center pt-3 border-t border-zinc-800 text-xs font-mono">
        <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
          <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Std Dev (σ)</span>
          <span className="text-cyan-400 font-mono-numeric font-bold">{uncertaintyStd.toFixed(4)}</span>
        </div>
        <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
          <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Reliability</span>
          <span className={`font-bold ${scorePercent >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
            {scorePercent >= 70 ? "High Trust" : "Elevated Variance"}
          </span>
        </div>
      </div>
    </div>
  );
};
