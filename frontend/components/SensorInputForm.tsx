"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { SensorInputData, MachineType } from "@/types/prediction";
import { Gauge, Zap, Wrench, AlertTriangle, Upload, RefreshCw } from "lucide-react";

interface SensorInputFormProps {
  onSubmit: (data: SensorInputData) => void;
  isLoading: boolean;
}

const PRESETS: { label: string; icon: React.ReactNode; color: string; data: SensorInputData }[] = [
  {
    label: "Normal Operation",
    icon: <Gauge className="w-4 h-4 text-emerald-400" />,
    color: "border-emerald-500/30 hover:border-emerald-400/80 hover:bg-emerald-500/10",
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
    icon: <Wrench className="w-4 h-4 text-rose-400" />,
    color: "border-rose-500/30 hover:border-rose-400/80 hover:bg-rose-500/10",
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
    color: "border-amber-500/30 hover:border-amber-400/80 hover:bg-amber-500/10",
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
    color: "border-cyan-500/30 hover:border-cyan-400/80 hover:bg-cyan-500/10",
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

export const SensorInputForm: React.FC<SensorInputFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<SensorInputData>({
    air_temperature: 300.5,
    process_temperature: 310.2,
    rotational_speed: 1500,
    torque: 40.5,
    tool_wear: 120,
    type: "M",
  });

  const handleChange = (field: keyof SensorInputData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof value === "number" ? value : value,
    }));
  };

  const handleApplyPreset = (presetData: SensorInputData) => {
    setFormData(presetData);
    onSubmit(presetData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n");
      if (lines.length > 1) {
        const row = lines[1].split(",");
        if (row.length >= 6) {
          const parsedData: SensorInputData = {
            air_temperature: parseFloat(row[0]) || 300.0,
            process_temperature: parseFloat(row[1]) || 310.0,
            rotational_speed: parseFloat(row[2]) || 1500,
            torque: parseFloat(row[3]) || 40.0,
            tool_wear: parseFloat(row[4]) || 100,
            type: (row[5]?.trim().toUpperCase() as MachineType) || "M",
          };
          setFormData(parsedData);
          onSubmit(parsedData);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel rounded-2xl p-6 shadow-2xl relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-cyan-400" /> Sensor Parameters
          </h2>
          <p className="text-xs text-slate-400 mt-1">Configure telemetry inputs for Bayesian failure evaluation</p>
        </div>

        <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700/80 text-cyan-400 border border-cyan-500/20 transition-all">
          <Upload className="w-3.5 h-3.5" /> Batch CSV
          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Preset Scenarios */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Preset Scenarios
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p.data)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs text-slate-200 transition-all ${p.color}`}
            >
              {p.icon}
              <span className="font-medium truncate">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Air Temperature <span className="text-slate-500">[K]</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.air_temperature}
              onChange={(e) => handleChange("air_temperature", parseFloat(e.target.value))}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono-numeric focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Process Temperature <span className="text-slate-500">[K]</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.process_temperature}
              onChange={(e) => handleChange("process_temperature", parseFloat(e.target.value))}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono-numeric focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Rotational Speed <span className="text-slate-500">[rpm]</span>
            </label>
            <input
              type="number"
              step="1"
              value={formData.rotational_speed}
              onChange={(e) => handleChange("rotational_speed", parseFloat(e.target.value))}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono-numeric focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Torque <span className="text-slate-500">[Nm]</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.torque}
              onChange={(e) => handleChange("torque", parseFloat(e.target.value))}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono-numeric focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Tool Wear <span className="text-slate-500">[min]</span>
            </label>
            <input
              type="number"
              step="1"
              value={formData.tool_wear}
              onChange={(e) => handleChange("tool_wear", parseFloat(e.target.value))}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono-numeric focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Product Type Variant</label>
            <select
              value={formData.type}
              onChange={(e) => handleChange("type", e.target.value as MachineType)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono-numeric focus:outline-none focus:border-cyan-500 transition-all"
            >
              <option value="L">L (Low Quality Variant)</option>
              <option value="M">M (Medium Quality Variant)</option>
              <option value="H">H (High Quality Variant)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> Running 50 Monte Carlo Forward Passes...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-slate-950" /> Predict Failure & Epistemic Uncertainty
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};
