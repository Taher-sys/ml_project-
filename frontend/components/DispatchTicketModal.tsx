"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertTriangle,
  Flame,
  Wrench,
  Zap,
  Activity,
  UserCheck,
  Send,
  Printer,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Copy,
  Check,
  ChevronRight,
  Gauge,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  MaintenanceTicket,
  UrgencyLevel,
  PriorityLevel,
  SOPChecklistItem,
  FailureModeCode,
  FeatureBaselineComparison,
} from "@/types/ticket";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BorderBeam } from "@/components/ui/border-beam";
import { dispatchMaintenanceTicket } from "@/lib/api";

interface DispatchTicketModalProps {
  isOpen: boolean;
  ticket: MaintenanceTicket | null;
  onClose: () => void;
  onTicketUpdated?: (updatedTicket: MaintenanceTicket) => void;
}

const TECHNICIANS = [
  { name: "Marcus Vance", role: "Senior Mechatronics Specialist", shift: "Shift A (Day)" },
  { name: "Elena Rostova", role: "Chief Reliability Engineer", shift: "Shift A (Day)" },
  { name: "Tariq Chen", role: "CNC Diagnostics Lead", shift: "Shift B (Evening)" },
  { name: "Sarah Connor", role: "Industrial Automation Tech", shift: "Shift C (Night)" },
];

const TRAINING_BASELINES: Record<string, { mean: number; unit: string; name: string }> = {
  air_temperature: { mean: 300.0, unit: "K", name: "Air Temperature" },
  process_temperature: { mean: 310.0, unit: "K", name: "Process Temperature" },
  rotational_speed: { mean: 1538.0, unit: "rpm", name: "Rotational Speed" },
  torque: { mean: 40.0, unit: "Nm", name: "Torque" },
  tool_wear: { mean: 108.0, unit: "min", name: "Tool Wear" },
};

export const DispatchTicketModal: React.FC<DispatchTicketModalProps> = ({
  isOpen,
  ticket,
  onClose,
  onTicketUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "shap" | "sop" | "workflow">("overview");
  const [technician, setTechnician] = useState<string>("");
  const [priorityOverride, setPriorityOverride] = useState<PriorityLevel>("CRITICAL");
  const [checklist, setChecklist] = useState<SOPChecklistItem[]>([]);
  const [ticketNotes, setTicketNotes] = useState<string>("");
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  useEffect(() => {
    if (ticket) {
      setTechnician(ticket.assignedTechnician || TECHNICIANS[0].name);
      setPriorityOverride(ticket.priorityOverride || (ticket.urgency === "CRITICAL" ? "CRITICAL" : "ELEVATED"));
      setChecklist(ticket.sopChecklist);
      setTicketNotes(ticket.notes || "");
      setDispatchSuccessMsg(null);
    }
  }, [ticket]);

  if (!isOpen || !ticket) return null;

  const toggleChecklistItem = (itemId: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item))
    );
  };

  const completedCount = checklist.filter((i) => i.completed).length;
  const progressPct = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  const handleCopyTicketId = () => {
    navigator.clipboard.writeText(ticket.ticketId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDispatch = async () => {
    setIsDispatching(true);
    setDispatchSuccessMsg(null);

    try {
      const topFeature =
        ticket.prediction.shap_contributions.length > 0
          ? ticket.prediction.shap_contributions[0].feature
          : "Torque";

      const payload = {
        ticketId: ticket.ticketId,
        ticket_id: ticket.ticketId,
        machineId: ticket.machineId,
        machine_id: ticket.machineId,
        timestamp: new Date().toISOString(),
        urgency: ticket.urgency,
        priorityOverride,
        priority_override: priorityOverride,
        assignedTechnician: technician,
        assigned_technician: technician,
        failureMode: ticket.failureMode,
        failure_mode: ticket.failureMode,
        failureProbability: ticket.prediction.failure_probability,
        failure_probability: ticket.prediction.failure_probability,
        uncertaintyStd: ticket.prediction.uncertainty_std,
        uncertainty_std: ticket.prediction.uncertainty_std,
        confidenceScore: ticket.prediction.confidence_score,
        confidence_score: ticket.prediction.confidence_score,
        topContributingFeature: topFeature,
        top_contributing_feature: topFeature,
        sensorData: ticket.sensorData,
        sensor_data: ticket.sensorData,
        sopChecklist: checklist,
        sop_checklist: checklist,
        notes: ticketNotes,
      };

      const res = await dispatchMaintenanceTicket(payload);

      setDispatchSuccessMsg(
        `Dispatched successfully! Dispatch ID: ${res.dispatchId}. Assigned to ${res.assignedTechnician}.`
      );

      const updatedTicket: MaintenanceTicket = {
        ...ticket,
        status: "DISPATCHED",
        assignedTechnician: technician,
        priorityOverride,
        sopChecklist: checklist,
        notes: ticketNotes,
        dispatchedAt: res.timestamp,
        dispatchId: res.dispatchId,
      };

      if (onTicketUpdated) {
        onTicketUpdated(updatedTicket);
      }
    } catch (err: unknown) {
      console.error("Dispatch error:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to dispatch ticket.";
      setDispatchSuccessMsg(`Dispatch error: ${errMsg}`);
    } finally {
      setIsDispatching(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Prepare SHAP chart data
  const chartData = ticket.prediction.shap_contributions.map((c) => ({
    name: c.feature.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    rawFeature: c.feature,
    value: Number((c.value * 100).toFixed(2)),
  }));

  // Baseline comparison table
  const baselineComparisons: FeatureBaselineComparison[] = Object.entries(TRAINING_BASELINES).map(
    ([key, meta]) => {
      const actual = Number((ticket.sensorData as unknown as Record<string, number>)[key] ?? 0);
      const delta = actual - meta.mean;
      const shapItem = ticket.prediction.shap_contributions.find((s) => s.feature.toLowerCase().includes(key));
      return {
        featureKey: key,
        displayName: meta.name,
        actualValue: actual,
        baselineMean: meta.mean,
        delta: Number(delta.toFixed(1)),
        unit: meta.unit,
        shapScore: shapItem ? shapItem.value : undefined,
        impactsRisk: (shapItem ? shapItem.value : 0) > 0,
      };
    }
  );

  const getUrgencyBadge = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case "CRITICAL":
        return (
          <Badge variant="destructive" size="lg" className="animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" /> CRITICAL DISPATCH
          </Badge>
        );
      case "ELEVATED":
        return (
          <Badge variant="warning" size="lg">
            <AlertTriangle className="w-3.5 h-3.5" /> ELEVATED RISK
          </Badge>
        );
      default:
        return (
          <Badge variant="cyan" size="lg">
            <Activity className="w-3.5 h-3.5" /> REVIEW REQUIRED
          </Badge>
        );
    }
  };

  const getFailureIcon = (code: FailureModeCode) => {
    switch (code) {
      case "TWF":
        return <Wrench className="w-5 h-5 text-rose-400" />;
      case "HDF":
        return <Flame className="w-5 h-5 text-amber-400" />;
      case "PWF":
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case "OSF":
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {ticket.urgency === "CRITICAL" && (
            <BorderBeam size={320} duration={10} colorFrom="#ef4444" colorTo="#f97316" />
          )}

          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/60 sticky top-0 z-20 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
                {getFailureIcon(ticket.failureMode.code)}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    Maintenance Dispatch Ticket
                  </h2>
                  <span
                    onClick={handleCopyTicketId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-xs font-mono font-bold cursor-pointer transition-colors"
                    title="Copy Ticket ID"
                  >
                    {ticket.ticketId}
                    {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                  <span>Machine ID: <strong className="text-zinc-200 font-mono">{ticket.machineId}</strong></span>
                  <span>•</span>
                  <span>Generated: {new Date(ticket.timestamp).toLocaleTimeString()}</span>
                  <span>•</span>
                  <span className="text-zinc-300 font-medium">{ticket.status}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {getUrgencyBadge(ticket.urgency)}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-zinc-800 bg-zinc-900/30">
            {[
              { id: "overview", label: "Diagnostic Overview", icon: Gauge },
              { id: "shap", label: "SHAP Root Cause Analysis", icon: Activity },
              { id: "sop", label: `Prescriptive SOP (${completedCount}/${checklist.length})`, icon: Wrench },
              { id: "workflow", label: "Technician Dispatch", icon: UserCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-zinc-800 text-cyan-400 font-bold border border-zinc-700/80 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-zinc-500"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-5 md:p-6 overflow-y-auto space-y-6 flex-1">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Failure Diagnosis Banner */}
                <div className={`p-4 rounded-xl border ${
                  ticket.failureMode.code === "OSF" || ticket.failureMode.code === "TWF"
                    ? "bg-red-950/20 border-red-500/40"
                    : ticket.failureMode.code === "HDF" || ticket.failureMode.code === "PWF"
                    ? "bg-amber-950/20 border-amber-500/40"
                    : "bg-cyan-950/20 border-cyan-500/40"
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-zinc-900 border border-zinc-700 text-cyan-300">
                          {ticket.failureMode.code}
                        </span>
                        <h3 className="font-bold text-base text-zinc-100">
                          {ticket.failureMode.name}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                        {ticket.failureMode.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-zinc-400">Decision Directive</div>
                      <div className="text-sm font-bold text-cyan-300 mt-0.5">
                        {ticket.prediction.recommendation}
                      </div>
                    </div>
                  </div>

                  {ticket.failureMode.indicators.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/80">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                        Triggered Sensor Threshold Indicators:
                      </span>
                      <ul className="space-y-1">
                        {ticket.failureMode.indicators.map((ind, i) => (
                          <li key={i} className="text-xs text-zinc-300 flex items-center gap-2 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                            {ind}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bayesian Probability & Uncertainty Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-zinc-800 bg-zinc-900/60">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-xs font-medium text-zinc-400">
                        Predictive Failure Likelihood (μ)
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold font-mono text-red-400 flex items-baseline gap-2">
                        {(ticket.prediction.failure_probability * 100).toFixed(1)}%
                        <span className="text-xs font-normal text-zinc-400">mean probability</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      <Progress
                        value={ticket.prediction.failure_probability * 100}
                        indicatorClassName={
                          ticket.prediction.failure_probability > 0.65
                            ? "bg-red-500"
                            : ticket.prediction.failure_probability > 0.35
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }
                      />
                      <div className="flex justify-between text-[11px] text-zinc-500 font-mono mt-1.5">
                        <span>0% Safe</span>
                        <span>Threshold: 65%</span>
                        <span>100% Failure</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-zinc-800 bg-zinc-900/60">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-xs font-medium text-zinc-400">
                        Epistemic Uncertainty (σ across 50 MC passes)
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold font-mono text-amber-400 flex items-baseline gap-2">
                        ±{ticket.prediction.uncertainty_std.toFixed(4)}
                        <span className="text-xs font-normal text-zinc-400">std deviation</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-300 font-mono">
                          {ticket.prediction.uncertainty_std > 0.08
                            ? "Elevated epistemic ambiguity (model divergence)"
                            : "High predictive consensus (low model variance)"}
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] text-zinc-500">
                        Evaluated across 50 stochastic PyTorch Monte Carlo Dropout inferences.
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-zinc-800 bg-zinc-900/60">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-xs font-medium text-zinc-400">
                        Decision Engine Confidence Score
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold font-mono text-cyan-400 flex items-baseline gap-2">
                        {(ticket.prediction.confidence_score * 100).toFixed(1)}%
                        <span className="text-xs font-normal text-zinc-400">calibrated</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      <Progress
                        value={ticket.prediction.confidence_score * 100}
                        indicatorClassName="bg-cyan-500"
                      />
                      <div className="mt-2 text-[11px] text-zinc-400">
                        Mapped to 2x2 action matrix for zero-false-positive technician deployment.
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Live Telemetry vs Baseline Reference Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Live Telemetry vs. Nominal Training Baselines
                    </h4>
                    <span className="text-[11px] text-zinc-500">AI4I 2020 Standard Scale Reference</span>
                  </div>

                  <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/40">
                    <table className="w-full text-xs">
                      <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 font-mono">
                        <tr>
                          <th className="py-2.5 px-3 text-left">Telemetry Metric</th>
                          <th className="py-2.5 px-3 text-right">Actual Ingested</th>
                          <th className="py-2.5 px-3 text-right">Dataset Baseline</th>
                          <th className="py-2.5 px-3 text-right">Deviation (Δ)</th>
                          <th className="py-2.5 px-3 text-center">Risk Direction</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 font-mono text-zinc-200">
                        {baselineComparisons.map((item, idx) => (
                          <tr key={idx} className="hover:bg-zinc-800/30">
                            <td className="py-2 px-3 font-sans font-medium text-zinc-300">{item.displayName}</td>
                            <td className="py-2 px-3 text-right font-bold text-cyan-300">
                              {item.actualValue} {item.unit}
                            </td>
                            <td className="py-2 px-3 text-right text-zinc-400">
                              {item.baselineMean} {item.unit}
                            </td>
                            <td className={`py-2 px-3 text-right font-bold ${item.delta > 0 ? "text-red-400" : "text-emerald-400"}`}>
                              {item.delta > 0 ? `+${item.delta}` : item.delta} {item.unit}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {item.impactsRisk ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                                  Increases Failure Risk
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                                  Mitigates Risk
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SHAP ROOT CAUSE ANALYSIS TAB */}
            {activeTab === "shap" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" /> Local Feature Attribution Waterfall
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Signed SHAP coefficients: positive values (red) push toward failure, negative values (green) keep machine safe.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-red-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> +Risk Driver
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> -Safe Buffer
                    </span>
                  </div>
                </div>

                {/* Diverging Bar Chart */}
                <div className="h-64 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
                    >
                      <XAxis
                        type="number"
                        stroke="#64748b"
                        fontSize={11}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg bg-zinc-900 p-2.5 border border-zinc-700 shadow-xl text-xs font-mono">
                                <div className="font-bold text-zinc-100 mb-1">{data.name}</div>
                                <div className={data.value > 0 ? "text-red-400" : "text-emerald-400"}>
                                  SHAP Impact: {data.value > 0 ? `+${data.value}%` : `${data.value}%`}
                                </div>
                                <div className="text-zinc-400 text-[10px] mt-0.5">
                                  {data.value > 0
                                    ? "Increases probability of equipment breakdown"
                                    : "Contributes to stable operational safety"}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
                      <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.value > 0 ? "#ef4444" : "#10b981"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Ranked Risk Drivers */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Ranked Root Cause Contributors & Corrective Action
                  </h4>
                  <div className="space-y-2">
                    {ticket.prediction.shap_contributions
                      .filter((c) => c.value > 0)
                      .slice(0, 3)
                      .map((driver, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-red-500/20 bg-red-950/10 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold font-mono">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-zinc-200">
                                {driver.feature.replace(/_/g, " ").toUpperCase()}
                              </span>
                              <span className="text-zinc-400 text-[11px] ml-2">
                                (SHAP weight: +{(driver.value * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          <span className="text-red-400 font-mono font-medium">Primary Fault Driver</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* PRESCRIPTIVE SOP TAB */}
            {activeTab === "sop" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-cyan-400" /> Dynamic Standard Operating Procedure (SOP)
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Tailored protocol generated specifically for {ticket.failureMode.name} on Machine {ticket.machineId}.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-cyan-300 font-bold">
                      {completedCount} / {checklist.length} Completed ({progressPct.toFixed(0)}%)
                    </span>
                    <Progress value={progressPct} className="w-32 h-1.5 mt-1" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                        item.completed
                          ? "bg-emerald-950/20 border-emerald-500/30 text-zinc-400 line-through"
                          : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 text-zinc-200"
                      }`}
                    >
                      <div className="mt-0.5">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            item.completed
                              ? "bg-emerald-500 border-emerald-500 text-zinc-950"
                              : "border-zinc-600 bg-zinc-800"
                          }`}
                        >
                          {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium font-sans">{item.step}</span>
                          {item.critical && (
                            <Badge variant="destructive" size="sm">
                              MANDATORY
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mt-1">
                          Category: {item.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {ticket.prediction.safety_measures.length > 0 && (
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
                    <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400" /> Mandatory Equipment Safety Directives:
                    </h4>
                    <ul className="space-y-1.5 pl-2">
                      {ticket.prediction.safety_measures.map((measure, i) => (
                        <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{measure}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* TECHNICIAN WORKFLOW & DISPATCH TAB */}
            {activeTab === "workflow" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-cyan-400" /> Technician Assignment & Dispatch Order
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Assign field personnel, configure urgency override, and broadcast work order to shop-floor pager.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                      Assign Duty Technician
                    </label>
                    <select
                      value={technician}
                      onChange={(e) => setTechnician(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500 transition-colors font-mono cursor-pointer"
                    >
                      {TECHNICIANS.map((tech) => (
                        <option key={tech.name} value={tech.name}>
                          {tech.name} — {tech.role} ({tech.shift})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                      Priority Level Override
                    </label>
                    <select
                      value={priorityOverride}
                      onChange={(e) => setPriorityOverride(e.target.value as PriorityLevel)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500 transition-colors font-mono cursor-pointer"
                    >
                      <option value="CRITICAL">CRITICAL (Immediate Line Stoppage)</option>
                      <option value="ELEVATED">ELEVATED (Inspect Within 2 Hours)</option>
                      <option value="STANDARD">STANDARD (Next Maintenance Window)</option>
                      <option value="LOW">LOW (Log For Next Shift Handover)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Technician Work Order Notes & Observations
                  </label>
                  <textarea
                    rows={3}
                    value={ticketNotes}
                    onChange={(e) => setTicketNotes(e.target.value)}
                    placeholder="Enter specific machine cell notes, spare part stock codes, or clearance requirements..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  />
                </div>

                {dispatchSuccessMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 text-xs flex items-center gap-2.5 font-mono"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{dispatchSuccessMsg}</span>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer with Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 md:px-6 border-t border-zinc-800 bg-zinc-900/60 sticky bottom-0 z-20">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs text-zinc-300"
              >
                <Printer className="w-3.5 h-3.5" /> Print Work Order
              </Button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                Close
              </Button>

              <Button
                variant="gradient"
                size="sm"
                disabled={isDispatching}
                onClick={handleDispatch}
                className="gap-2 text-xs font-bold"
              >
                {isDispatching ? (
                  <>
                    <Activity className="w-3.5 h-3.5 animate-spin" /> Dispatching Webhook...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Dispatch Work Order
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
