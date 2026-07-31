"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, CheckSquare } from "lucide-react";

interface SafetyMeasuresPanelProps {
  safety_measures?: string[];
}

const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

export const SafetyMeasuresPanel: React.FC<SafetyMeasuresPanelProps> = ({
  safety_measures,
}) => {
  if (!safety_measures || safety_measures.length === 0) {
    return null;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="glass-panel rounded-2xl p-6 shadow-2xl relative overflow-hidden border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-900"
    >
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-amber-500/20">
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-md">
          <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
            Recommended Safety Measures
          </h3>
          <p className="text-xs text-slate-400">
            Sensor-derived mitigation protocols to reduce risk before continued machine operation
          </p>
        </div>
      </div>

      <motion.ul className="space-y-3">
        {safety_measures.map((measure, idx) => (
          <motion.li
            key={idx}
            variants={itemVariants}
            className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 transition-all text-xs text-slate-200"
          >
            <CheckSquare className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{measure}</span>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
};
