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

  const radius = 70;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;
  const needleAngle = -90 + (scorePercent / 100) * 180;

  return (
    <div className="rounded-xl p-6 border border-[#2A3241] bg-[#181D24] shadow-sm relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#13171D] border border-[#2A3241] text-[#D4F63C]">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-[#EDEDED] uppercase tracking-widest font-mono">
            Bayesian Confidence Gauge
          </h3>
        </div>
        <div className="group relative cursor-pointer">
          <HelpCircle className="w-4 h-4 text-[#7E8B9B] hover:text-[#D4F63C] transition-colors" />
          <div className="absolute right-0 top-6 w-64 p-3 bg-[#13171D] border border-[#2A3241] rounded-lg text-xs text-[#EDEDED] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 font-mono">
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
            stroke="#212631"
            strokeWidth="14"
            strokeLinecap="round"
          />

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
              <stop offset="100%" stopColor="#D4F63C" />
            </linearGradient>
          </defs>

          {/* Animated Needle */}
          <motion.g
            initial={{ rotate: -90 }}
            animate={{ rotate: needleAngle }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ transformOrigin: "80px 80px" }}
          >
            <line x1="80" y1="80" x2="80" y2="22" stroke="#EDEDED" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="80" cy="80" r="5" fill="#D4F63C" stroke="#0D0F12" strokeWidth="2" />
          </motion.g>
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
          <span className="text-[#D4F63C] font-mono-numeric font-bold">{uncertaintyStd.toFixed(4)}</span>
        </div>
        <div className="bg-[#13171D] p-2 rounded-lg border border-[#212631]">
          <span className="text-[#7E8B9B] block text-[10px] uppercase font-semibold">Reliability</span>
          <span className={`font-bold ${scorePercent >= 70 ? "text-[#D4F63C]" : "text-[#F5A623]"}`}>
            {scorePercent >= 70 ? "High Trust" : "Elevated Variance"}
          </span>
        </div>
      </div>
    </div>
  );
};
