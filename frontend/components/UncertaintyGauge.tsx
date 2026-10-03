"use client";

import React from "react";
import { motion } from "framer-motion";
import { HelpCircle, Cpu } from "lucide-react";

interface UncertaintyGaugeProps {
  confidenceScore: number;
  uncertaintyStd: number;
}

export const UncertaintyGauge: React.FC<UncertaintyGaugeProps> = ({
  confidenceScore,
  uncertaintyStd,
}) => {
  const scorePercent = Math.min(100, Math.max(0, confidenceScore * 100));

  const centerX = 80;
  const centerY = 80;
  const arcRadius = 70;
  const circumference = Math.PI * arcRadius;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  // Polar coordinate needle mechanics:
  // theta = 180 deg (0% / left baseline) to 0 deg (100% / right baseline)
  // Clamp theta strictly between 0 and 180 deg to prevent horizon penetration
  const thetaDeg = Math.min(180, Math.max(0, 180 - (scorePercent / 100) * 180));
  const thetaRad = (thetaDeg * Math.PI) / 180;

  // Needle length r strictly inside arc inner bounds (arc radius 70 - half stroke 7 = 63)
  const needleLength = 48;
  const tipX = centerX + needleLength * Math.cos(thetaRad);
  const tipY = centerY - needleLength * Math.sin(thetaRad);

  return (
    <div className="rounded-xl p-6 border border-[#2A3241] bg-[#181D24] shadow-sm relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#13171D] border border-[#2A3241] text-[#10B981]">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-[#EDEDED] uppercase tracking-widest font-mono">
            Bayesian Confidence Gauge
          </h3>
        </div>
        <div className="group relative cursor-pointer">
          <HelpCircle className="w-4 h-4 text-[#7E8B9B] hover:text-[#10B981] transition-colors" />
          <div className="absolute right-0 top-6 w-64 p-3 bg-[#13171D] border border-[#2A3241] rounded-lg text-xs text-[#EDEDED] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 font-mono">
            <strong>Monte Carlo Dropout:</strong> 50 stochastic forward passes with dropout active at inference time. Higher confidence = lower epistemic uncertainty (σ).
          </div>
        </div>
      </div>

      {/* SVG Radial Arc Gauge */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg className="w-48 h-28 overflow-visible" viewBox="0 0 160 90">
          {/* Background Arc Track */}
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke="#212631"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Active Gradient Arc */}
          <motion.path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke="url(#stealthGaugeGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />

          <defs>
            <linearGradient id="stealthGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF3B30" />
              <stop offset="50%" stopColor="#F5A623" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* Baseline Horizon Guide (Faint CAD reference) */}
          <line x1="20" y1="80" x2="140" y2="80" stroke="#2A3241" strokeWidth="1" strokeDasharray="2 3" />

          {/* Math-Accurate Polar Needle */}
          <motion.line
            x1={centerX}
            y1={centerY}
            animate={{ x2: tipX, y2: tipY }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            stroke="#EDEDED"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Needle Tip Indicator Pip */}
          <motion.circle
            animate={{ cx: tipX, cy: tipY }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            r="3.5"
            fill="#10B981"
            stroke="#0D1117"
            strokeWidth="1.5"
          />
          {/* Center Pivot Anchor */}
          <circle cx={centerX} cy={centerY} r="5" fill="#10B981" stroke="#0D1117" strokeWidth="2" />
        </svg>

        <div className="text-center -mt-2">
          <span className="text-3xl font-black text-[#EDEDED] font-mono-numeric tracking-tight">
            {scorePercent.toFixed(1)}%
          </span>
          <p className="text-[11px] text-[#7E8B9B] font-mono">Epistemic Certainty</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center pt-3 border-t border-[#2A3241] text-xs font-mono">
        <div className="bg-[#13171D] p-2 rounded-lg border border-[#212631]">
          <span className="text-[#7E8B9B] block text-[10px] uppercase font-semibold">Std Dev (σ)</span>
          <span className="text-[#10B981] font-mono-numeric font-bold">{uncertaintyStd.toFixed(4)}</span>
        </div>
        <div className="bg-[#13171D] p-2 rounded-lg border border-[#212631]">
          <span className="text-[#7E8B9B] block text-[10px] uppercase font-semibold">Reliability</span>
          <span className={`font-bold ${scorePercent >= 70 ? "text-[#10B981]" : "text-[#F5A623]"}`}>
            {scorePercent >= 70 ? "High Trust" : "Elevated Variance"}
          </span>
        </div>
      </div>
    </div>
  );
};
