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
      <div className="glass-panel rounded-2xl p-6 shadow-xl flex items-center justify-center text-slate-500 text-xs h-64 border border-slate-800">
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
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-panel rounded-2xl p-6 shadow-2xl relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" /> SHAP Feature Attribution
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Local explanation showing features driving failure vs normal prediction
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Increases Failure Risk
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Promotes Safe Operation
          </span>
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
          >
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={11}
              tickFormatter={(val) => val.toFixed(2)}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#cbd5e1"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                      <p className="font-bold text-slate-200">{data.name}</p>
                      <p className={`font-mono-numeric ${data.isPositive ? "text-rose-400" : "text-emerald-400"}`}>
                        SHAP Impact Value: {data.value >= 0 ? `+${data.value}` : data.value}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={0} stroke="#475569" strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isPositive ? "#f43f5e" : "#10b981"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
