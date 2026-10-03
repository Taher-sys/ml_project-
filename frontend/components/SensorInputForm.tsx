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
    label: "Normal Operation",
    icon: <Gauge className="w-4 h-4 text-emerald-400" />,
    color: "border-emerald-500/30 hover:border-emerald-400/80 hover:bg-emerald-500/10 text-emerald-300",
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
    icon: <Wrench className="w-4 h-4 text-red-400" />,
    color: "border-red-500/30 hover:border-red-400/80 hover:bg-red-500/10 text-red-300",
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
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    color: "border-amber-500/30 hover:border-amber-400/80 hover:bg-amber-500/10 text-amber-300",
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
    icon: <AlertTriangle className="w-4 h-4 text-cyan-400" />,
    color: "border-cyan-500/30 hover:border-cyan-400/80 hover:bg-cyan-500/10 text-cyan-300",
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl p-6 border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl shadow-xl space-y-6"
    >
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-zinc-100 flex items-center gap-2.5 font-mono">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            Telemetry Simulation
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time parameter manipulation for single unit stochastic analysis
          </p>
        </div>

        {onSwitchToBatch && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSwitchToBatch}
            className="text-xs font-mono h-8 gap-1.5 border-zinc-700 bg-zinc-900/60 text-cyan-400 hover:bg-zinc-800"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Fleet Batch
          </Button>
        )}
      </div>

      {/* Preset Scenarios */}
      <div>
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-2.5 font-mono">
          Baseline Operating Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p.data)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer ${p.color}`}
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
            <span className="text-zinc-300 font-medium">Air Temperature [K]</span>
            <span className="text-cyan-400 font-bold">{formData.air_temperature.toFixed(1)} K</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="295"
              max="306"
              step="0.1"
              value={formData.air_temperature}
              onChange={(e) => handleChange("air_temperature", parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <input
              type="number"
              step="0.1"
              value={formData.air_temperature}
              onChange={(e) => handleChange("air_temperature", parseFloat(e.target.value))}
              className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-100 font-mono text-right focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Process Temperature */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-zinc-300 font-medium">Process Temperature [K]</span>
            <span className="text-cyan-400 font-bold">{formData.process_temperature.toFixed(1)} K</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="305"
              max="315"
              step="0.1"
              value={formData.process_temperature}
              onChange={(e) => handleChange("process_temperature", parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <input
              type="number"
              step="0.1"
              value={formData.process_temperature}
              onChange={(e) => handleChange("process_temperature", parseFloat(e.target.value))}
              className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-100 font-mono text-right focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Rotational Speed */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-zinc-300 font-medium">Rotational Speed [rpm]</span>
            <span className="text-cyan-400 font-bold">{formData.rotational_speed} rpm</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1100"
              max="3000"
              step="10"
              value={formData.rotational_speed}
              onChange={(e) => handleChange("rotational_speed", parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <input
              type="number"
              step="1"
              value={formData.rotational_speed}
              onChange={(e) => handleChange("rotational_speed", parseFloat(e.target.value))}
              className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-100 font-mono text-right focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Torque */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-zinc-300 font-medium">Torque [Nm]</span>
            <span className="text-cyan-400 font-bold">{formData.torque.toFixed(1)} Nm</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10"
              max="85"
              step="0.5"
              value={formData.torque}
              onChange={(e) => handleChange("torque", parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <input
              type="number"
              step="0.1"
              value={formData.torque}
              onChange={(e) => handleChange("torque", parseFloat(e.target.value))}
              className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-100 font-mono text-right focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Tool Wear */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-zinc-300 font-medium">Tool Wear [min]</span>
            <span className="text-cyan-400 font-bold">{formData.tool_wear} min</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="260"
              step="1"
              value={formData.tool_wear}
              onChange={(e) => handleChange("tool_wear", parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <input
              type="number"
              step="1"
              value={formData.tool_wear}
              onChange={(e) => handleChange("tool_wear", parseFloat(e.target.value))}
              className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-100 font-mono text-right focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Machine Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300 block font-mono">Product Variant Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(["L", "M", "H"] as MachineType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleChange("type", t)}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                  formData.type === t
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
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
          className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-bold py-3 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 font-mono text-xs uppercase tracking-wider"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" /> Running Monte Carlo Simulation...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-zinc-950" /> Run Bayesian Uncertainty Inference
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};
