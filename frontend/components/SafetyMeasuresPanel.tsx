"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, CheckSquare } from "lucide-react";

interface SafetyMeasuresPanelProps {
  safety_measures?: string[];
}

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25 },
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
      className="rounded-2xl p-5 border border-amber-500/40 bg-amber-950/20 backdrop-blur-xl shadow-xl space-y-4"
    >
      <div className="flex items-center gap-3 pb-3 border-b border-amber-500/20">
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-md">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm md:text-base font-bold text-zinc-100 tracking-tight font-mono">
            Safety Measures & Isolation Checklist
          </h3>
          <p className="text-xs text-zinc-400">
            Mandatory safety steps before maintenance servicing or restart
          </p>
        </div>
      </div>

      <motion.ul className="space-y-2">
        {safety_measures.map((measure, idx) => (
          <motion.li
            key={idx}
            variants={itemVariants}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 transition-colors text-xs text-zinc-200 font-mono"
          >
            <CheckSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{measure}</span>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
};
