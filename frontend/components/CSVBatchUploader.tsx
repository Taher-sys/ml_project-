"use client";

import React, { useState, useRef, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Activity,
  Search,
  RefreshCw,
  Ticket,
  Database,
  Download,
  Play,
  ArrowRight,
  ExternalLink,
  Layers,
} from "lucide-react";
import { BatchTelemetryRow, MaintenanceTicket, CSVParsingError, FailureModeInfo } from "@/types/ticket";
import { SensorInputData, MachineType } from "@/types/prediction";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlowBorderCard } from "@/components/ui/glow-border-card";
import { fetchBatchPrediction } from "@/lib/api";
import { createMaintenanceTicketFromRow, diagnoseClientFailureMode } from "@/lib/ticketHelper";

interface CSVBatchUploaderProps {
  onSelectTicket: (ticket: MaintenanceTicket) => void;
  onApplySingleRow?: (sensorData: SensorInputData) => void;
}

// 24-Machine Comprehensive Fleet Dataset
const SAMPLE_FLEET_DATASET_CSV = `air_temperature,process_temperature,rotational_speed,torque,tool_wear,type,machine_id
298.1,308.6,1551,42.8,24,M,CNC-MILL-01
298.2,308.7,1408,46.3,31,L,CNC-MILL-02
298.4,308.8,1498,49.4,45,M,LATHE-PRIME-03
300.2,310.1,1380,54.2,216,L,LATHE-TWF-04
302.5,311.8,2820,68.5,145,H,MILL-PWF-05
301.2,310.5,1410,49.0,188,M,DRILL-EDGE-06
298.9,309.2,1640,35.5,50,L,PRESS-NORM-07
303.4,312.0,1350,60.2,205,L,PRESS-OSF-08
304.5,313.2,1250,55.0,85,L,CNC-HDF-09
298.5,309.1,1100,75.5,110,M,LATHE-PWF-10
301.2,310.8,1300,72.0,220,H,DRILL-OSF-11
299.8,309.5,1520,38.2,12,H,MILL-NORM-12
300.5,310.2,1450,45.2,245,L,LATHE-TWF-13
302.1,311.5,1380,65.2,210,L,MILL-OSF-14
304.8,312.8,1280,62.0,95,M,PRESS-HDF-15
297.9,308.2,1580,41.0,65,L,PUMP-NORM-16
298.3,308.5,1420,44.5,190,M,CNC-EDGE-17
303.8,313.1,2890,71.2,130,H,TURBINE-PWF-18
299.1,309.4,1510,40.1,38,M,ROBOT-NORM-19
301.9,311.2,1320,68.4,228,L,PRESS-OSF-20
304.2,312.6,1220,58.8,102,L,LATHE-HDF-21
298.7,309.0,1540,42.0,78,H,CNC-NORM-22
300.9,310.4,1440,51.5,235,M,MILL-TWF-23
299.5,309.8,1505,39.8,15,L,ROBOT-NORM-24`;

const SAMPLE_HIGH_FAILURE_CSV = `air_temperature,process_temperature,rotational_speed,torque,tool_wear,type,machine_id
300.5,310.2,1450,45.2,245,L,LATHE-CRIT-01
302.1,311.5,1380,65.2,210,L,MILL-CRIT-02
304.5,313.2,1250,55.0,85,L,CNC-CRIT-03
298.5,309.1,1100,75.5,110,M,DRILL-CRIT-04
301.2,310.8,1300,72.0,220,H,PRESS-CRIT-05`;

export const CSVBatchUploader: React.FC<CSVBatchUploaderProps> = ({
  onSelectTicket,
  onApplySingleRow,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<BatchTelemetryRow[]>([]);
  const [filterTab, setFilterTab] = useState<"all" | "anomalous" | "uncertain" | "nominal">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [parsingErrors, setParsingErrors] = useState<CSVParsingError[]>([]);
  const [, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize column names to AI4I 2020 fields
  const normalizeKey = (key: string): string => {
    const k = key.trim().toLowerCase();
    if (k.includes("air") && (k.includes("temp") || k.includes("[k]"))) return "air_temperature";
    if (k.includes("process") && (k.includes("temp") || k.includes("[k]"))) return "process_temperature";
    if (k.includes("speed") || k.includes("rpm") || k.includes("rotational")) return "rotational_speed";
    if (k.includes("torque") || k.includes("[nm]")) return "torque";
    if (k.includes("wear") || k.includes("[min]")) return "tool_wear";
    if (k === "type" || k.includes("product") || k.includes("variant")) return "type";
    if (k.includes("machine") || k.includes("udi") || k.includes("id")) return "machine_id";
    return k;
  };

  const parseAndEvaluateCSV = (csvContent: string, sourceName: string) => {
    setFileName(sourceName);
    setParsingErrors([]);

    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data as Record<string, string>[];
        const errors: CSVParsingError[] = [];
        const parsedRows: BatchTelemetryRow[] = [];

        rawData.forEach((item, idx) => {
          const normalized: Record<string, string> = {};
          Object.keys(item).forEach((k) => {
            normalized[normalizeKey(k)] = item[k];
          });

          const airT = parseFloat(normalized["air_temperature"] || "300.0");
          const procT = parseFloat(normalized["process_temperature"] || "310.0");
          const speed = parseFloat(normalized["rotational_speed"] || "1500.0");
          const torque = parseFloat(normalized["torque"] || "40.0");
          const wear = parseFloat(normalized["tool_wear"] || "50.0");

          const rawType = (normalized["type"] || "M").trim().toUpperCase();
          let mType: MachineType = "M";
          if (rawType.startsWith("L")) mType = "L";
          else if (rawType.startsWith("H")) mType = "H";
          else mType = "M";

          if (isNaN(airT) || isNaN(procT) || isNaN(speed) || isNaN(torque) || isNaN(wear)) {
            errors.push({
              row: idx + 1,
              message: "Corrupted numerical telemetry detected; replaced with default standard scale.",
            });
          }

          const machineId =
            normalized["machine_id"] ||
            `${mType}-${Math.floor(10000 + idx * 37 + (speed % 100))}`;

          parsedRows.push({
            id: `row-${idx + 1}`,
            rowIndex: idx + 1,
            machineId,
            air_temperature: isNaN(airT) ? 300.0 : airT,
            process_temperature: isNaN(procT) ? 310.0 : procT,
            rotational_speed: isNaN(speed) ? 1500.0 : speed,
            torque: isNaN(torque) ? 40.0 : torque,
            tool_wear: isNaN(wear) ? 50.0 : wear,
            type: mType,
            status: "pending",
          });
        });

        setParsingErrors(errors);

        startTransition(() => {
          setRows(parsedRows);
        });

        if (parsedRows.length > 0) {
          runBatchEvaluation(parsedRows);
        }
      },
      error: (err: Error) => {
        setParsingErrors([{ row: 0, message: `CSV parse failure: ${err.message}` }]);
      },
    });
  };

  const runBatchEvaluation = async (currentRows: BatchTelemetryRow[]) => {
    setIsEvaluating(true);

    try {
      const inputs: SensorInputData[] = currentRows.map((r) => ({
        air_temperature: r.air_temperature,
        process_temperature: r.process_temperature,
        rotational_speed: r.rotational_speed,
        torque: r.torque,
        tool_wear: r.tool_wear,
        type: r.type,
      }));

      const predictions = await fetchBatchPrediction(inputs);

      const evaluatedRows: BatchTelemetryRow[] = currentRows.map((row, i) => {
        const pred = predictions[i];
        if (!pred) return row;

        const failureProb = pred.failure_probability;
        const uncStd = pred.uncertainty_std;

        const isCriticalProb = failureProb > 0.65;
        const isModelDivergence = uncStd > 0.08;
        const isAnomalous = isCriticalProb || isModelDivergence;

        let anomalyReason = "";
        if (isCriticalProb && isModelDivergence) {
          anomalyReason = `Critical Hazard (μ=${(failureProb * 100).toFixed(1)}%) & High Variance (σ=${uncStd.toFixed(3)})`;
        } else if (isCriticalProb) {
          anomalyReason = `Critical Failure Risk (μ=${(failureProb * 100).toFixed(1)}% > 65%)`;
        } else if (isModelDivergence) {
          anomalyReason = `Epistemic Uncertainty Divergence (σ=${uncStd.toFixed(3)} > 0.08)`;
        }

        const failureMode: FailureModeInfo | undefined = pred.failure_mode
          ? {
              code: pred.failure_mode.code,
              name: pred.failure_mode.name,
              shortName: pred.failure_mode.shortName,
              description: pred.failure_mode.description,
              indicators: pred.failure_mode.indicators,
              severity: failureProb > 0.65 ? "high" : "medium",
            }
          : diagnoseClientFailureMode(
              {
                air_temperature: row.air_temperature,
                process_temperature: row.process_temperature,
                rotational_speed: row.rotational_speed,
                torque: row.torque,
                tool_wear: row.tool_wear,
                type: row.type,
              },
              failureProb
            );

        return {
          ...row,
          status: "evaluated",
          predictionResult: pred,
          failureMode,
          isAnomalous,
          anomalyReason,
        };
      });

      startTransition(() => {
        setRows(evaluatedRows);
      });
    } catch (err) {
      console.error("Batch prediction failure:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseAndEvaluateCSV(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseAndEvaluateCSV(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleGenerateTicket = (row: BatchTelemetryRow, idx: number) => {
    const ticket = createMaintenanceTicketFromRow(row, idx);
    onSelectTicket(ticket);
  };

  // KPIs
  const totalCount = rows.length;
  const criticalCount = rows.filter((r) => (r.predictionResult?.failure_probability || 0) > 0.65).length;
  const uncertainCount = rows.filter((r) => (r.predictionResult?.uncertainty_std || 0) > 0.08).length;
  const nominalCount = rows.filter((r) => !r.isAnomalous && r.status === "evaluated").length;

  const fleetHealthScore = totalCount > 0 ? ((totalCount - criticalCount) / totalCount) * 100 : 100;

  // Filtered rows
  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      searchQuery === "" ||
      row.machineId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.failureMode?.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === "anomalous") {
      return (row.predictionResult?.failure_probability || 0) > 0.65;
    }
    if (filterTab === "uncertain") {
      return (row.predictionResult?.uncertainty_std || 0) > 0.08;
    }
    if (filterTab === "nominal") {
      return !row.isAnomalous && row.status === "evaluated";
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Dropzone & Control Hub Header */}
      <Card className="border-zinc-800 bg-zinc-950/80 backdrop-blur-xl relative overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg md:text-xl font-bold text-zinc-100 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                Fleet CSV Telemetry Ingestion Hub
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Batch inference engine over AI4I 2020 predictive maintenance streams with automated failure mode classification and dispatch ticketing.
              </CardDescription>
            </div>

            {/* Actions: Download Sample CSV & Quick-Load Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="/batch_fleet_telemetry.csv"
                download="batch_fleet_telemetry.csv"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-zinc-900 border border-zinc-700 hover:border-cyan-500/50 hover:bg-zinc-800 text-zinc-200 transition-all shadow-sm"
                title="Download complete 24-machine telemetry dataset"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                Download Batch CSV
              </a>

              <Button
                variant="outline"
                size="sm"
                onClick={() => parseAndEvaluateCSV(SAMPLE_FLEET_DATASET_CSV, "batch_fleet_telemetry.csv")}
                className="text-xs h-8 gap-1.5 font-mono border-zinc-700 bg-zinc-900/80 text-cyan-300 hover:bg-zinc-800"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                Load Full Fleet (24 Units)
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => parseAndEvaluateCSV(SAMPLE_HIGH_FAILURE_CSV, "high_failure_dataset.csv")}
                className="text-xs h-8 gap-1.5 font-mono"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Critical Hazards (5 Units)
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0 space-y-4">
          {/* File Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative border-2 border-dashed rounded-2xl p-7 text-center transition-all duration-300 cursor-pointer select-none ${
              isDragging
                ? "border-cyan-400 bg-cyan-500/10 shadow-xl shadow-cyan-500/20"
                : "border-zinc-800/80 bg-zinc-900/30 hover:border-cyan-500/40 hover:bg-zinc-900/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2.5">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-cyan-400 shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:border-cyan-500/50">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-100">
                  {fileName ? (
                    <span className="text-cyan-400 font-mono flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Loaded: {fileName}
                    </span>
                  ) : (
                    "Drop Telemetry CSV here or click to browse"
                  )}
                </p>
                <p className="text-xs text-zinc-400 font-mono">
                  Schema: <span className="text-zinc-300">air_temperature, process_temperature, rotational_speed, torque, tool_wear, type</span>
                </p>
              </div>
            </div>
          </div>

          {/* Validation Warnings */}
          {parsingErrors.length > 0 && (
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Telemetry Warnings ({parsingErrors.length})
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-200/80">
                {parsingErrors.slice(0, 3).map((err, i) => (
                  <li key={i}>{err.message} (Row {err.row})</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fleet KPI Banner with VengeanceUI GlowBorderCard */}
      {rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-xs text-zinc-400 font-medium">Ingested Fleet Size</div>
            <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">{totalCount} Units</div>
            <div className="text-[11px] text-zinc-500 mt-1 font-mono flex items-center gap-1">
              <Database className="w-3 h-3 text-cyan-400" /> AI4I 2020 Batch Stream
            </div>
          </Card>

          {criticalCount > 0 ? (
            <GlowBorderCard colorPreset="hazard" borderRadius="0.75rem" className="p-4 bg-zinc-950/90">
              <div className="text-xs text-red-400 font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Critical Hazards (μ &gt; 0.65)
              </div>
              <div className="text-2xl font-black font-mono text-red-400 mt-1">{criticalCount} Units</div>
              <div className="text-[11px] text-red-300/80 mt-1 font-mono">
                Immediate Work Orders Required
              </div>
            </GlowBorderCard>
          ) : (
            <Card className="border-zinc-800 bg-zinc-900/60 p-4">
              <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Critical Hazards
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">0 Units</div>
              <div className="text-[11px] text-zinc-500 mt-1 font-mono">No critical failures detected</div>
            </Card>
          )}

          {uncertainCount > 0 ? (
            <GlowBorderCard colorPreset="sunset" borderRadius="0.75rem" className="p-4 bg-zinc-950/90">
              <div className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" /> High Uncertainty (σ &gt; 0.08)
              </div>
              <div className="text-2xl font-black font-mono text-amber-400 mt-1">{uncertainCount} Units</div>
              <div className="text-[11px] text-amber-300/80 mt-1 font-mono">
                Epistemic Divergence Detected
              </div>
            </GlowBorderCard>
          ) : (
            <Card className="border-zinc-800 bg-zinc-900/60 p-4">
              <div className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> High Uncertainty
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">0 Units</div>
              <div className="text-[11px] text-zinc-500 mt-1 font-mono">All predictions within confidence bound</div>
            </Card>
          )}

          <GlowBorderCard colorPreset="nature" borderRadius="0.75rem" className="p-4 bg-zinc-950/90">
            <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Fleet Health Index
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {fleetHealthScore.toFixed(0)}%
            </div>
            <div className="text-[11px] text-emerald-300/80 mt-1 font-mono">
              {nominalCount} Units in Nominal Range
            </div>
          </GlowBorderCard>
        </div>
      )}

      {/* Telemetry Evaluation Table */}
      {rows.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-md overflow-hidden">
          <CardHeader className="p-4 md:p-5 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: "all", label: `All Machines (${totalCount})` },
                { id: "anomalous", label: `Critical Hazards (${criticalCount})`, color: "text-red-400" },
                { id: "uncertain", label: `High Uncertainty (${uncertainCount})`, color: "text-amber-400" },
                { id: "nominal", label: `Nominal Units (${nominalCount})`, color: "text-emerald-400" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as typeof filterTab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                    filterTab === tab.id
                      ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  <span className={tab.color || ""}>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Search & Status Indicator */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter Machine ID or Mode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 font-mono transition-all w-48 md:w-56"
                />
              </div>

              {isEvaluating && (
                <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Evaluating...
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 tracking-wider uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Machine ID</th>
                    <th className="py-3 px-3">Variant</th>
                    <th className="py-3 px-3 text-right">Air [K]</th>
                    <th className="py-3 px-3 text-right">Proc [K]</th>
                    <th className="py-3 px-3 text-right">RPM</th>
                    <th className="py-3 px-3 text-right">Torque [Nm]</th>
                    <th className="py-3 px-3 text-right">Wear [min]</th>
                    <th className="py-3 px-3 text-center">Failure Prob (μ)</th>
                    <th className="py-3 px-3 text-center">Variance (σ)</th>
                    <th className="py-3 px-3">Diagnosed Mode</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-200">
                  {filteredRows.map((row, idx) => {
                    const prob = row.predictionResult?.failure_probability ?? 0;
                    const unc = row.predictionResult?.uncertainty_std ?? 0;
                    const isHazard = prob > 0.65;
                    const isUncertain = unc > 0.08;

                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors hover:bg-zinc-800/60 ${
                          isHazard
                            ? "bg-red-950/20 border-l-2 border-l-red-500"
                            : isUncertain
                            ? "bg-amber-950/15 border-l-2 border-l-amber-500"
                            : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 text-zinc-500">{row.rowIndex}</td>
                        <td className="py-2.5 px-3 font-bold text-zinc-100 flex items-center gap-1.5">
                          {row.machineId}
                          {isHazard && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-[10px]">
                            {row.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-zinc-300">{row.air_temperature.toFixed(1)}</td>
                        <td className="py-2.5 px-3 text-right text-zinc-300">{row.process_temperature.toFixed(1)}</td>
                        <td className="py-2.5 px-3 text-right text-cyan-300">{row.rotational_speed.toFixed(0)}</td>
                        <td className="py-2.5 px-3 text-right text-zinc-300">{row.torque.toFixed(1)}</td>
                        <td className="py-2.5 px-3 text-right text-zinc-300">{row.tool_wear.toFixed(0)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`font-bold ${
                              prob > 0.65 ? "text-red-400" : prob > 0.35 ? "text-amber-400" : "text-emerald-400"
                            }`}
                          >
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`font-medium ${unc > 0.08 ? "text-amber-300 font-bold" : "text-zinc-400"}`}>
                            ±{unc.toFixed(3)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {row.failureMode ? (
                            <Badge
                              variant={
                                row.failureMode.code === "OSF" || row.failureMode.code === "TWF"
                                  ? "destructive"
                                  : row.failureMode.code === "HDF" || row.failureMode.code === "PWF"
                                  ? "warning"
                                  : "success"
                              }
                              size="sm"
                            >
                              {row.failureMode.code}
                            </Badge>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onApplySingleRow && (
                              <button
                                type="button"
                                title="Load into Single Simulator"
                                onClick={() =>
                                  onApplySingleRow({
                                    air_temperature: row.air_temperature,
                                    process_temperature: row.process_temperature,
                                    rotational_speed: row.rotational_speed,
                                    torque: row.torque,
                                    tool_wear: row.tool_wear,
                                    type: row.type,
                                  })
                                }
                                className="p-1 rounded bg-zinc-800 hover:bg-cyan-500/20 text-zinc-400 hover:text-cyan-300 border border-zinc-700 transition-colors"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            )}

                            <Button
                              variant={isHazard ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => handleGenerateTicket(row, idx)}
                              className="text-xs h-7 gap-1 font-mono tracking-tight"
                            >
                              <Ticket className="w-3 h-3" />
                              {isHazard ? "Dispatch" : "Review"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredRows.length === 0 && (
              <div className="py-12 text-center text-zinc-500 text-xs font-mono">
                No telemetry records match the active filter criteria.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
