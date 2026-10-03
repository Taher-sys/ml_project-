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
      <div className="rounded-xl p-6 border border-[#2A3241] bg-[#181D24] text-[#7E8B9B] text-xs flex items-center justify-center font-mono">
        Action recommendation will appear after processing sensor reading.
      </div>
    );
  }

  const isImmediate = recommendation.includes("Immediate");
  const isUncertain = recommendation.includes("uncertain") || recommendation.includes("Monitor");
  const isSafe = recommendation.includes("Safe");

  let theme = {
    bg: "border-[#2A3241] bg-[#181D24] text-[#EDEDED]",
    badge: "border-[#D4F63C]/40 bg-[#13171D] text-[#D4F63C]",
    icon: <CheckCircle className="w-5 h-5 text-[#D4F63C]" />,
  };

  if (isImmediate) {
    theme = {
      bg: "border-[#FF3B30] bg-[#181D24] text-[#FF3B30]",
      badge: "border-[#FF3B30]/50 bg-[#13171D] text-[#FF3B30]",
      icon: <ShieldAlert className="w-5 h-5 text-[#FF3B30]" />,
    };
  } else if (isUncertain) {
    theme = {
      bg: "border-[#F5A623] bg-[#181D24] text-[#F5A623]",
      badge: "border-[#F5A623]/50 bg-[#13171D] text-[#F5A623]",
      icon: <AlertTriangle className="w-5 h-5 text-[#F5A623]" />,
    };
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl p-5 border transition-colors shadow-sm ${theme.bg}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-[#13171D] border border-[#2A3241] shadow-sm shrink-0 mt-0.5">
            {theme.icon}
          </div>
          <div className="space-y-1">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider border ${theme.badge}`}
            >
              Action Protocol
            </span>
            <h3 className="text-base md:text-lg font-bold tracking-tight text-[#EDEDED] font-mono">
              {recommendation}
            </h3>
            <p className="text-xs text-[#7E8B9B] max-w-xl">
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
            variant={isImmediate ? "destructive" : "volt"}
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
