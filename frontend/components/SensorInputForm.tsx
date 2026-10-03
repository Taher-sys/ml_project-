"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { SensorInputData, MachineType } from "@/types/prediction";
import {
  Gauge,
  Zap,
  Wrench,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SensorInputFormProps {
  onSubmit: (data: SensorInputData) => void;
  isLoading: boolean;
  onSwitchToBatch?: () => void;
}

const PRESETS: { label: string; icon: React.ReactNode; color: string; data: SensorInputData }[] = [
  {
    label: "Nominal Baseline",
    icon: <Gauge className="w-4 h-4 text-[#10B981]" />,
    color: "border-[#2A3241] bg-[#13171D] hover:border-[#10B981] text-[#EDEDED]",
    data: {
      air_temperature: 298.1,
      process_temperature: 308.6,
      rotational_speed: 1551,
      torque: 42.8,
      tool_wear: 24,
      type: "M",
    },
  },
  {
    label: "Tool Wear Hazard",
    icon: <Wrench className="w-4 h-4 text-[#FF3B30]" />,
    color: "border-[#FF3B30]/40 bg-[#13171D] hover:border-[#FF3B30] text-[#FF3B30]",
    data: {
      air_temperature: 300.2,
      process_temperature: 310.1,
      rotational_speed: 1380,
      torque: 54.2,
      tool_wear: 216,
      type: "L",
    },
  },
  {
    label: "High Torque / Power",
    icon: <Zap className="w-4 h-4 text-[#F5A623]" />,
    color: "border-[#F5A623]/40 bg-[#13171D] hover:border-[#F5A623] text-[#F5A623]",
    data: {
      air_temperature: 302.5,
      process_temperature: 311.8,
      rotational_speed: 2820,
      torque: 68.5,
      tool_wear: 145,
      type: "H",
    },
  },
  {
    label: "Borderline Edge-Case",
    icon: <AlertTriangle className="w-4 h-4 text-[#7E8B9B]" />,
    color: "border-[#2A3241] bg-[#13171D] hover:border-[#EDEDED] text-[#EDEDED]",
    data: {
      air_temperature: 301.2,
      process_temperature: 310.5,
      rotational_speed: 1410,
      torque: 49.0,
      tool_wear: 188,
      type: "M",
    },
  },
];

export const SensorInputForm: React.FC<SensorInputFormProps> = ({
  onSubmit,
  isLoading,
  onSwitchToBatch,
}) => {
  const [formData, setFormData] = useState<SensorInputData>({
    air_temperature: 300.5,
    process_temperature: 310.2,
    rotational_speed: 1500,
    torque: 40.5,
    tool_wear: 120,
    type: "M",
  });

  const handleChange = (field: keyof SensorInputData, value: string | number) => {
    let finalVal = value;
    if (field !== "type") {
      const parsed = typeof value === "number" ? value : parseFloat(value);
      finalVal = isNaN(parsed) ? 0 : parsed;
    }
    setFormData((prev) => ({
      ...prev,
      [field]: finalVal,
    }));
  };

  const handleApplyPreset = (presetData: SensorInputData) => {
    setFormData(presetData);
    onSubmit(presetData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanData: SensorInputData = {
      air_temperature: isNaN(formData.air_temperature) ? 300.0 : formData.air_temperature,
      process_temperature: isNaN(formData.process_temperature) ? 310.0 : formData.process_temperature,
      rotational_speed: isNaN(formData.rotational_speed) ? 1500 : formData.rotational_speed,
      torque: isNaN(formData.torque) ? 40.0 : formData.torque,
      tool_wear: isNaN(formData.tool_wear) ? 100 : formData.tool_wear,
      type: formData.type || "M",
    };
    onSubmit(cleanData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl p-6 border border-[#2A3241] bg-[#181D24] shadow-sm space-y-6"
    >
      <div className="flex items-center justify-between pb-4 border-b border-[#2A3241]">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-[#EDEDED] flex items-center gap-2.5 font-mono">
            <div className="p-2 rounded-lg bg-[#13171D] border border-[#2A3241] text-[#10B981]">
              <Sliders className="w-5 h-5" />
            </div>
            Telemetry Simulation
          </h2>
          <p className="text-xs text-[#7E8B9B] mt-1">
            Real-time parameter manipulation for single unit stochastic analysis
          </p>
        </div>

        {onSwitchToBatch && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSwitchToBatch}
            className="text-xs font-mono h-8 gap-1.5 border-[#2A3241] bg-[#13171D] text-[#10B981] hover:bg-[#181D24]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Fleet Batch
          </Button>
        )}
      </div>

      {/* Preset Scenarios */}
      <div>
        <label className="text-xs font-bold text-[#7E8B9B] uppercase tracking-widest block mb-2.5 font-mono">
          Baseline Operating Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p.data)}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-mono font-medium transition-colors cursor-pointer ${p.color}`}
            >
              {p.icon}
              <span className="truncate">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Air Temperature */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-[#EDEDED] font-medium">Air Temperature [K]</span>
            <span className="text-[#10B981] font-bold">{formData.air_temperature.toFixed(1)} K</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="295"
              max="306"
              step="0.1"
              value={formData.air_temperature}
              onChange={(e) => handleChange("air_temperature", parseFloat(e.target.value))}
              className="w-full accent-[#10B981] h-1.5 bg-[#13171D] rounded cursor-pointer"
            />
            <input
              type="number"
              step="0.1"
              value={formData.air_temperature}
              onChange={(e) => handleChange("air_temperature", parseFloat(e.target.value))}
              className="w-20 bg-[#13171D] border border-[#2A3241] rounded-lg px-2.5 py-1 text-xs text-[#EDEDED] font-mono text-right focus:outline-none focus:border-[#10B981]"
            />
          </div>
        </div>

        {/* Process Temperature */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-[#EDEDED] font-medium">Process Temperature [K]</span>
            <span className="text-[#10B981] font-bold">{formData.process_temperature.toFixed(1)} K</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="305"
              max="315"
              step="0.1"
              value={formData.process_temperature}
              onChange={(e) => handleChange("process_temperature", parseFloat(e.target.value))}
              className="w-full accent-[#10B981] h-1.5 bg-[#13171D] rounded cursor-pointer"
            />
            <input
              type="number"
              step="0.1"
              value={formData.process_temperature}
              onChange={(e) => handleChange("process_temperature", parseFloat(e.target.value))}
              className="w-20 bg-[#13171D] border border-[#2A3241] rounded-lg px-2.5 py-1 text-xs text-[#EDEDED] font-mono text-right focus:outline-none focus:border-[#10B981]"
            />
          </div>
        </div>

        {/* Rotational Speed */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-[#EDEDED] font-medium">Rotational Speed [rpm]</span>
            <span className="text-[#10B981] font-bold">{formData.rotational_speed} rpm</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1100"
              max="3000"
              step="10"
              value={formData.rotational_speed}
              onChange={(e) => handleChange("rotational_speed", parseFloat(e.target.value))}
              className="w-full accent-[#10B981] h-1.5 bg-[#13171D] rounded cursor-pointer"
            />
            <input
              type="number"
              step="1"
              value={formData.rotational_speed}
              onChange={(e) => handleChange("rotational_speed", parseFloat(e.target.value))}
              className="w-20 bg-[#13171D] border border-[#2A3241] rounded-lg px-2.5 py-1 text-xs text-[#EDEDED] font-mono text-right focus:outline-none focus:border-[#10B981]"
            />
          </div>
        </div>

        {/* Torque */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-[#EDEDED] font-medium">Torque [Nm]</span>
            <span className="text-[#10B981] font-bold">{formData.torque.toFixed(1)} Nm</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10"
              max="85"
              step="0.5"
              value={formData.torque}
              onChange={(e) => handleChange("torque", parseFloat(e.target.value))}
              className="w-full accent-[#10B981] h-1.5 bg-[#13171D] rounded cursor-pointer"
            />
            <input
              type="number"
              step="0.1"
              value={formData.torque}
              onChange={(e) => handleChange("torque", parseFloat(e.target.value))}
              className="w-20 bg-[#13171D] border border-[#2A3241] rounded-lg px-2.5 py-1 text-xs text-[#EDEDED] font-mono text-right focus:outline-none focus:border-[#10B981]"
            />
          </div>
        </div>

        {/* Tool Wear */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-[#EDEDED] font-medium">Tool Wear [min]</span>
            <span className="text-[#10B981] font-bold">{formData.tool_wear} min</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="260"
              step="1"
              value={formData.tool_wear}
              onChange={(e) => handleChange("tool_wear", parseFloat(e.target.value))}
              className="w-full accent-[#10B981] h-1.5 bg-[#13171D] rounded cursor-pointer"
            />
            <input
              type="number"
              step="1"
              value={formData.tool_wear}
              onChange={(e) => handleChange("tool_wear", parseFloat(e.target.value))}
              className="w-20 bg-[#13171D] border border-[#2A3241] rounded-lg px-2.5 py-1 text-xs text-[#EDEDED] font-mono text-right focus:outline-none focus:border-[#10B981]"
            />
          </div>
        </div>

        {/* Machine Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#7E8B9B] block font-mono">Product Variant Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(["L", "M", "H"] as MachineType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleChange("type", t)}
                className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer ${
                  formData.type === t
                    ? "bg-[#13171D] border-[#10B981] text-[#10B981]"
                    : "bg-[#13171D] border-[#2A3241] text-[#7E8B9B] hover:border-[#EDEDED] hover:text-[#EDEDED]"
                }`}
              >
                Type {t} {t === "L" ? "(50%)" : t === "M" ? "(30%)" : "(20%)"}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-3 bg-[#10B981] hover:bg-[#059669] text-[#0D1117] font-black py-3 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 font-mono text-xs uppercase tracking-wider"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-[#0D1117]" /> Running Monte Carlo Simulation...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-[#0D1117]" /> Run Bayesian Uncertainty Inference
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};
