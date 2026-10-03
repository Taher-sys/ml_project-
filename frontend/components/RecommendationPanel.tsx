"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, ShieldAlert, ArrowRight, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecommendationPanelProps {
  recommendation: string | null;
  onDispatchTicket?: () => void;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  recommendation,
  onDispatchTicket,
}) => {
  if (!recommendation) {
    return (
      <div className="rounded-2xl p-6 border border-zinc-800 bg-zinc-950/60 text-zinc-500 text-xs flex items-center justify-center font-mono">
        Action recommendation will appear after processing sensor reading.
      </div>
    );
  }

  const isImmediate = recommendation.includes("Immediate");
  const isUncertain = recommendation.includes("uncertain") || recommendation.includes("Monitor");
  const isSafe = recommendation.includes("Safe");

  let theme = {
    bg: "border-emerald-500/30 bg-emerald-950/15 text-emerald-400",
    badge: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  };

  if (isImmediate) {
    theme = {
      bg: "border-red-500/40 bg-red-950/20 text-red-400",
      badge: "border-red-500/50 bg-red-500/20 text-red-300",
      icon: <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />,
    };
  } else if (isUncertain) {
    theme = {
      bg: "border-amber-500/40 bg-amber-950/20 text-amber-400",
      badge: "border-amber-500/50 bg-amber-500/20 text-amber-300",
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    };
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl p-5 border backdrop-blur-xl transition-all shadow-xl ${theme.bg}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-md shrink-0 mt-0.5">
            {theme.icon}
          </div>
          <div className="space-y-1">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider border ${theme.badge}`}
            >
              Action Protocol
            </span>
            <h3 className="text-base md:text-lg font-bold tracking-tight text-zinc-100 font-mono">
              {recommendation}
            </h3>
            <p className="text-xs text-zinc-400 max-w-xl">
              {isImmediate &&
                "Elevated failure probability backed by low epistemic uncertainty. Isolate machine and issue urgent maintenance work order."}
              {isUncertain &&
                "Model indicates elevated variance or borderline parameters. Schedule physical inspection before component degradation."}
              {isSafe &&
                "Telemetry parameters remain inside optimal operating envelope. Machine is cleared for normal production."}
            </p>
          </div>
        </div>

        {onDispatchTicket && (
          <Button
            variant={isImmediate ? "destructive" : "outline"}
            size="sm"
            onClick={onDispatchTicket}
            className="text-xs font-mono h-9 gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5" />
            Dispatch Ticket
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};
