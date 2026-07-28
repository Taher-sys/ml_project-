"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Clock, ShieldAlert, ArrowRight } from "lucide-react";

interface RecommendationPanelProps {
  recommendation: string | null;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ recommendation }) => {
  if (!recommendation) {
    return (
      <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-800 text-slate-500 text-xs flex items-center justify-center">
        Action recommendation will appear after processing sensor reading.
      </div>
    );
  }

  const isImmediate = recommendation.includes("Immediate");
  const isUncertain = recommendation.includes("uncertain") || recommendation.includes("Monitor");
  const isSafe = recommendation.includes("Safe");

  let theme = {
    bg: "from-emerald-950/30 via-slate-900/90 to-slate-900",
    border: "border-emerald-500/40",
    text: "text-emerald-400",
    glow: "text-glow-cyan",
    icon: <CheckCircle className="w-6 h-6 text-emerald-400" />,
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };

  if (isImmediate) {
    theme = {
      bg: "from-rose-950/40 via-slate-900/90 to-slate-900",
      border: "border-rose-500/50",
      text: "text-rose-400",
      glow: "text-glow-red",
      icon: <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />,
      badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    };
  } else if (isUncertain) {
    theme = {
      bg: "from-amber-950/30 via-slate-900/90 to-slate-900",
      border: "border-amber-500/40",
      text: "text-amber-400",
      glow: "text-glow-amber",
      icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    };
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`glass-panel rounded-2xl p-6 shadow-2xl relative overflow-hidden border bg-gradient-to-r ${theme.bg} ${theme.border}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
            {theme.icon}
          </div>
          <div>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-1.5 ${theme.badge}`}>
              Maintenance Protocol Action
            </span>
            <h3 className={`text-xl font-bold tracking-tight ${theme.text} ${theme.glow}`}>
              {recommendation}
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {isImmediate &&
                "High probability of machine component failure backed by high model epistemic confidence. Immediately isolate machine and initiate tool/spindle replacement."}
              {isUncertain &&
                "Model detects potential hazard or elevated standard deviation. Schedule physical inspection and re-run sensor diagnostics to reduce uncertainty."}
              {isSafe &&
                "Telemetry parameters remain within optimal operating envelopes with low model variance. Machine is clear for continued production."}
            </p>
          </div>
        </div>

        <button className="hidden md:flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all cursor-pointer">
          Dispatch Ticket <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </div>
    </motion.div>
  );
};
