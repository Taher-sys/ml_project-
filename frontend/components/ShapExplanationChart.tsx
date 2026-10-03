"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShapContributionData } from "@/types/prediction";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Sparkles } from "lucide-react";

interface ShapExplanationChartProps {
  contributions: ShapContributionData[];
}

const FEATURE_LABELS: Record<string, string> = {
  air_temperature: "Air Temp",
  process_temperature: "Process Temp",
  rotational_speed: "Rotational Speed",
  torque: "Torque",
  tool_wear: "Tool Wear",
  machine_type: "Machine Type",
};

export const ShapExplanationChart: React.FC<ShapExplanationChartProps> = ({ contributions }) => {
  if (!contributions || contributions.length === 0) {
    return (
      <div className="rounded-lg p-6 border border-[#2A3241] bg-[#181D24] flex items-center justify-center text-[#7E8B9B] text-xs h-64 font-mono">
        No SHAP attribution data available for current prediction.
      </div>
    );
  }

  const chartData = contributions.map((item) => ({
    name: FEATURE_LABELS[item.feature] || item.feature,
    value: item.value,
    isPositive: item.value >= 0,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg p-6 border border-[#2A3241] bg-[#181D24] shadow-md space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#2A3241]">
        <div>
          <h3 className="text-sm font-bold text-[#EDEDED] flex items-center gap-2 font-mono">
            <Sparkles className="w-4 h-4 text-[#10B981]" /> SHAP Feature Attribution
          </h3>
          <p className="text-xs text-[#7E8B9B] mt-0.5">
            Local additive feature explanations for failure versus nominal classification
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-[#FF3B30]">
            <span className="w-2 h-2 rounded-full bg-[#FF3B30] inline-block"></span> Drives Failure Risk
          </span>
          <span className="flex items-center gap-1.5 text-[#10B981]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block"></span> Promotes Nominal
          </span>
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 30, left: 85, bottom: 5 }}
          >
            <XAxis
              type="number"
              stroke="#7E8B9B"
              fontSize={11}
              fontFamily="monospace"
              tickFormatter={(val) => val.toFixed(2)}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#EDEDED"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#13171D] border border-[#2A3241] p-2.5 rounded shadow-xl text-xs font-mono">
                      <p className="font-bold text-[#EDEDED]">{data.name}</p>
                      <p className={`font-mono-numeric mt-0.5 ${data.isPositive ? "text-[#FF3B30]" : "text-[#10B981]"}`}>
                        SHAP Impact Value: {data.value >= 0 ? `+${data.value.toFixed(4)}` : data.value.toFixed(4)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={0} stroke="#2A3241" strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[2, 2, 2, 2]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isPositive ? "#FF3B30" : "#10B981"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
