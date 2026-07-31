"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import { SensorInputData, MachineType } from "@/types/prediction";
import {
  Gauge,
  Zap,
  Wrench,
  AlertTriangle,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Table,
  X,
} from "lucide-react";

interface SensorInputFormProps {
  onSubmit: (data: SensorInputData) => void;
  isLoading: boolean;
}

const REQUIRED_HEADERS = [
  "air_temperature",
  "process_temperature",
  "rotational_speed",
  "torque",
  "tool_wear",
  "type",
] as const;

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

  const [csvError, setCsvError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [parsedRows, setParsedRows] = useState<SensorInputData[]>([]);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be uploaded again if needed
    e.target.value = "";
    setCsvError(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawHeaders = results.meta.fields || [];
        setDetectedHeaders(rawHeaders);

        // Normalize header keys for comparison
        const normalizedHeaderMap = new Map<string, string>();
        rawHeaders.forEach((h) => {
          normalizedHeaderMap.set(h.trim().toLowerCase(), h);
        });

        // Check for missing required headers
        const missing = REQUIRED_HEADERS.filter((req) => !normalizedHeaderMap.has(req));

        if (missing.length > 0) {
          setCsvError(`CSV missing required column(s): ${missing.join(", ")}`);
          return;
        }

        // Map PapaParse row objects explicitly by key name (NOT array position)
        const mappedData: SensorInputData[] = [];
        for (const row of results.data) {
          const getVal = (reqKey: typeof REQUIRED_HEADERS[number]): string => {
            const actualKey = normalizedHeaderMap.get(reqKey);
            return actualKey ? (row[actualKey] ?? "").toString().trim() : "";
          };

          const rawType = getVal("type").toUpperCase();
          const validTypes: MachineType[] = ["L", "M", "H"];
          const parsedType: MachineType = validTypes.includes(rawType as MachineType)
            ? (rawType as MachineType)
            : "M";

          mappedData.push({
            air_temperature: parseFloat(getVal("air_temperature")) || 300.0,
            process_temperature: parseFloat(getVal("process_temperature")) || 310.0,
            rotational_speed: parseFloat(getVal("rotational_speed")) || 1500,
            torque: parseFloat(getVal("torque")) || 40.0,
            tool_wear: parseFloat(getVal("tool_wear")) || 100,
            type: parsedType,
          });
        }

        if (mappedData.length === 0) {
          setCsvError("Uploaded CSV contains no valid data rows.");
          return;
        }

        setParsedRows(mappedData);
        setShowPreviewModal(true);
      },
      error: (err) => {
        setCsvError(`Failed to parse CSV file: ${err.message}`);
      },
    });
  };

  const handleConfirmImport = () => {
    if (parsedRows.length > 0) {
      const selectedInput = parsedRows[0];
      setFormData(selectedInput);
      onSubmit(selectedInput);
    }
    setShowPreviewModal(false);
  };

  return (
    <>
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
            <p className="text-xs text-slate-400 mt-1">
              Configure telemetry inputs for Bayesian failure evaluation
            </p>
          </div>

          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700/80 text-cyan-400 border border-cyan-500/20 transition-all">
            <Upload className="w-3.5 h-3.5" /> Batch CSV
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* CSV Error Alert */}
        {csvError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start justify-between gap-2 shadow-lg"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-rose-200">CSV Import Error</strong>
                <span>{csvError}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCsvError(null)}
              className="text-rose-400 hover:text-rose-200 p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

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

      {/* CSV Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel max-w-3xl w-full rounded-2xl p-6 shadow-2xl border border-slate-700 relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                    <Table className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      CSV Import Validation Preview
                    </h3>
                    <p className="text-xs text-slate-400">
                      Verify column header alignment and parsed values before running evaluation
                    </p>
                  </div>
                </div>

                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono-numeric">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 6/6 Columns Mapped By Name
                </span>
              </div>

              {/* Parsed Preview Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 mb-6">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700 font-mono-numeric">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">air_temperature [K]</th>
                      <th className="py-2.5 px-3">process_temperature [K]</th>
                      <th className="py-2.5 px-3">rotational_speed [rpm]</th>
                      <th className="py-2.5 px-3">torque [Nm]</th>
                      <th className="py-2.5 px-3">tool_wear [min]</th>
                      <th className="py-2.5 px-3">type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono-numeric text-slate-200">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className={idx === 0 ? "bg-cyan-500/10 font-semibold" : "hover:bg-slate-800/50"}>
                        <td className="py-2 px-3 text-slate-500">Row {idx + 1} {idx === 0 ? "(Active)" : ""}</td>
                        <td className="py-2 px-3 text-cyan-300">{row.air_temperature}</td>
                        <td className="py-2 px-3">{row.process_temperature}</td>
                        <td className="py-2 px-3">{row.rotational_speed}</td>
                        <td className="py-2 px-3">{row.torque}</td>
                        <td className="py-2 px-3">{row.tool_wear}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-100 font-bold">
                            {row.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <p className="text-xs text-slate-400">
                  Total rows parsed: <strong className="text-slate-200 font-mono-numeric">{parsedRows.length}</strong>. First row will be loaded into form parameters.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirm & Apply Parameters
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
