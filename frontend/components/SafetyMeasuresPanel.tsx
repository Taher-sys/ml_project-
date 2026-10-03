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
      className="rounded-lg p-5 border border-[#2A3241] bg-[#181D24] shadow-md space-y-4"
    >
      <div className="flex items-center gap-3 pb-3 border-b border-[#2A3241]">
        <div className="p-2 rounded bg-[#13171D] border border-[#FF3B30]/40 text-[#FF3B30] shadow-sm">
          <ShieldAlert className="w-5 h-5 text-[#FF3B30]" />
        </div>
        <div>
          <h3 className="text-sm md:text-base font-bold text-[#EDEDED] tracking-tight font-mono">
            Safety Measures & Isolation Checklist
          </h3>
          <p className="text-xs text-[#7E8B9B]">
            Mandatory safety protocols before maintenance servicing or machine restart
          </p>
        </div>
      </div>

      <motion.ul className="space-y-2">
        {safety_measures.map((measure, idx) => (
          <motion.li
            key={idx}
            variants={itemVariants}
            className="flex items-start gap-2.5 p-3 rounded bg-[#13171D] border border-[#212631] hover:border-[#10B981]/50 transition-colors text-xs text-[#EDEDED] font-mono"
          >
            <CheckSquare className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
            <span className="leading-relaxed">{measure}</span>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
};
