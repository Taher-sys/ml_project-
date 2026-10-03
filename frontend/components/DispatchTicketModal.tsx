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
          <Badge variant="destructive" size="lg" className="rounded">
            <ShieldAlert className="w-3.5 h-3.5" /> CRITICAL DISPATCH
          </Badge>
        );
      case "ELEVATED":
        return (
          <Badge variant="warning" size="lg" className="rounded">
            <AlertTriangle className="w-3.5 h-3.5" /> ELEVATED RISK
          </Badge>
        );
      default:
        return (
          <Badge variant="volt" size="lg" className="rounded">
            <Activity className="w-3.5 h-3.5" /> REVIEW REQUIRED
          </Badge>
        );
    }
  };

  const getFailureIcon = (code: FailureModeCode) => {
    switch (code) {
      case "TWF":
        return <Wrench className="w-5 h-5 text-[#FF3B30]" />;
      case "HDF":
        return <Flame className="w-5 h-5 text-[#FF3B30]" />;
      case "PWF":
        return <Zap className="w-5 h-5 text-[#10B981]" />;
      case "OSF":
        return <AlertTriangle className="w-5 h-5 text-[#FF3B30]" />;
      default:
        return <Activity className="w-5 h-5 text-[#10B981]" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl rounded-lg border border-[#2A3241] bg-[#181D24] text-[#EDEDED] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {ticket.urgency === "CRITICAL" && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF3B30] z-30" />
          )}

          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#2A3241] bg-[#13171D] sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded bg-[#181D24] border border-[#2A3241]">
                {getFailureIcon(ticket.failureMode.code)}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg md:text-xl font-bold tracking-tight text-[#EDEDED] flex items-center gap-2">
                    Maintenance Dispatch Ticket
                  </h2>
                  <span
                    onClick={handleCopyTicketId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#181D24] hover:bg-[#212631] text-[#10B981] text-xs font-mono font-bold cursor-pointer border border-[#2A3241] transition-colors"
                    title="Copy Ticket ID"
                  >
                    {ticket.ticketId}
                    {copiedId ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                  </span>
                </div>
                <p className="text-xs text-[#7E8B9B] flex items-center gap-2 mt-0.5">
                  <span>Machine ID: <strong className="text-[#EDEDED] font-mono">{ticket.machineId}</strong></span>
                  <span>•</span>
                  <span>Generated: {new Date(ticket.timestamp).toLocaleTimeString()}</span>
                  <span>•</span>
                  <span className="text-[#EDEDED] font-medium">{ticket.status}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {getUrgencyBadge(ticket.urgency)}
              <button
                onClick={onClose}
                className="p-1.5 rounded text-[#7E8B9B] hover:text-[#EDEDED] hover:bg-[#181D24] border border-[#2A3241] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-[#2A3241] bg-[#13171D]">
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#181D24] text-[#10B981] font-bold border border-[#2A3241]"
                      : "text-[#7E8B9B] hover:text-[#EDEDED] hover:bg-[#181D24]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#10B981]" : "text-[#7E8B9B]"}`} />
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
                <div className={`p-4 rounded border ${
                  ticket.failureMode.code === "OSF" || ticket.failureMode.code === "TWF"
                    ? "bg-[#13171D] border-[#FF3B30]/50"
                    : "bg-[#13171D] border-[#2A3241]"
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-[#181D24] border border-[#2A3241] text-[#10B981]">
                          {ticket.failureMode.code}
                        </span>
                        <h3 className="font-bold text-base text-[#EDEDED]">
                          {ticket.failureMode.name}
                        </h3>
                      </div>
                      <p className="text-xs text-[#7E8B9B] leading-relaxed max-w-2xl">
                        {ticket.failureMode.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-[#7E8B9B]">Decision Directive</div>
                      <div className="text-sm font-bold text-[#10B981] mt-0.5">
                        {ticket.prediction.recommendation}
                      </div>
                    </div>
                  </div>

                  {ticket.failureMode.indicators.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#2A3241]">
                      <span className="text-[11px] font-semibold text-[#7E8B9B] uppercase tracking-wider block mb-1.5">
                        Triggered Sensor Threshold Indicators:
                      </span>
                      <ul className="space-y-1">
                        {ticket.failureMode.indicators.map((ind, i) => (
                          <li key={i} className="text-xs text-[#EDEDED] flex items-center gap-2 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] shrink-0" />
                            {ind}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bayesian Probability & Uncertainty Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-[#2A3241] bg-[#13171D] rounded">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-xs font-medium text-[#7E8B9B]">
                        Predictive Failure Likelihood (μ)
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold font-mono text-[#FF3B30] flex items-baseline gap-2">
                        {(ticket.prediction.failure_probability * 100).toFixed(1)}%
                        <span className="text-xs font-normal text-[#7E8B9B]">mean probability</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      <Progress
                        value={ticket.prediction.failure_probability * 100}
                        indicatorClassName={
                          ticket.prediction.failure_probability > 0.65
                            ? "bg-[#FF3B30]"
                            : ticket.prediction.failure_probability > 0.35
                            ? "bg-[#F5A623]"
                            : "bg-[#10B981]"
                        }
                      />
                      <div className="flex justify-between text-[11px] text-[#7E8B9B] font-mono mt-1.5">
                        <span>0% Nominal</span>
                        <span>Threshold: 65%</span>
                        <span>100% Hazard</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-[#2A3241] bg-[#13171D] rounded">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-xs font-medium text-[#7E8B9B]">
                        Epistemic Uncertainty (σ across 50 MC passes)
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold font-mono text-[#10B981] flex items-baseline gap-2">
                        ±{ticket.prediction.uncertainty_std.toFixed(4)}
                        <span className="text-xs font-normal text-[#7E8B9B]">std deviation</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#EDEDED] font-mono">
                          {ticket.prediction.uncertainty_std > 0.08
                            ? "Elevated epistemic ambiguity (model divergence)"
                            : "High predictive consensus (low model variance)"}
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] text-[#7E8B9B]">
                        Evaluated across 50 stochastic PyTorch Monte Carlo Dropout inferences.
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-[#2A3241] bg-[#13171D] rounded">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-xs font-medium text-[#7E8B9B]">
                        Decision Engine Confidence Score
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold font-mono text-[#10B981] flex items-baseline gap-2">
                        {(ticket.prediction.confidence_score * 100).toFixed(1)}%
                        <span className="text-xs font-normal text-[#7E8B9B]">calibrated</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      <Progress
                        value={ticket.prediction.confidence_score * 100}
                        indicatorClassName="bg-[#10B981]"
                      />
                      <div className="mt-2 text-[11px] text-[#7E8B9B]">
                        Mapped to 2x2 action matrix for zero-false-positive technician deployment.
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Live Telemetry vs Baseline Reference Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider">
                      Live Telemetry vs. Nominal Training Baselines
                    </h4>
                    <span className="text-[11px] text-[#7E8B9B]">AI4I 2020 Standard Scale Reference</span>
                  </div>

                  <div className="rounded border border-[#2A3241] overflow-hidden bg-[#13171D]">
                    <table className="w-full text-xs">
                      <thead className="bg-[#0D0F12] text-[#7E8B9B] border-b border-[#2A3241] font-mono">
                        <tr>
                          <th className="py-2.5 px-3 text-left">Telemetry Metric</th>
                          <th className="py-2.5 px-3 text-right">Actual Ingested</th>
                          <th className="py-2.5 px-3 text-right">Dataset Baseline</th>
                          <th className="py-2.5 px-3 text-right">Deviation (Δ)</th>
                          <th className="py-2.5 px-3 text-center">Risk Direction</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#212631] font-mono text-[#EDEDED]">
                        {baselineComparisons.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#181D24]">
                            <td className="py-2 px-3 font-sans font-medium text-[#EDEDED]">{item.displayName}</td>
                            <td className="py-2 px-3 text-right font-bold text-[#10B981]">
                              {item.actualValue} {item.unit}
                            </td>
                            <td className="py-2 px-3 text-right text-[#7E8B9B]">
                              {item.baselineMean} {item.unit}
                            </td>
                            <td className={`py-2 px-3 text-right font-bold ${item.delta > 0 ? "text-[#FF3B30]" : "text-[#10B981]"}`}>
                              {item.delta > 0 ? `+${item.delta}` : item.delta} {item.unit}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {item.impactsRisk ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-[#FF3B30] bg-[#FF3B30]/10 px-2 py-0.5 rounded border border-[#FF3B30]/30">
                                  Increases Failure Risk
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30">
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
                    <h3 className="text-sm font-bold text-[#EDEDED] flex items-center gap-2 font-mono">
                      <Activity className="w-4 h-4 text-[#10B981]" /> Local Feature Attribution Waterfall
                    </h3>
                    <p className="text-xs text-[#7E8B9B]">
                      Signed SHAP coefficients: positive values (crimson) push toward failure, negative values (volt) keep machine safe.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-[#FF3B30]">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#FF3B30]" /> +Risk Driver
                    </span>
                    <span className="flex items-center gap-1.5 text-[#10B981]">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" /> -Safe Buffer
                    </span>
                  </div>
                </div>

                {/* Diverging Bar Chart */}
                <div className="h-64 rounded border border-[#2A3241] bg-[#13171D] p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
                    >
                      <XAxis
                        type="number"
                        stroke="#7E8B9B"
                        fontSize={11}
                        fontFamily="monospace"
                        tickFormatter={(val) => `${val}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#EDEDED"
                        fontSize={11}
                        fontFamily="monospace"
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.03)" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded bg-[#0D0F12] p-2.5 border border-[#2A3241] shadow-xl text-xs font-mono">
                                <div className="font-bold text-[#EDEDED] mb-1">{data.name}</div>
                                <div className={data.value > 0 ? "text-[#FF3B30]" : "text-[#10B981]"}>
                                  SHAP Impact: {data.value > 0 ? `+${data.value}%` : `${data.value}%`}
                                </div>
                                <div className="text-[#7E8B9B] text-[10px] mt-0.5">
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
                      <ReferenceLine x={0} stroke="#2A3241" strokeWidth={1.5} />
                      <Bar dataKey="value" radius={[2, 2, 2, 2]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.value > 0 ? "#FF3B30" : "#10B981"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Ranked Risk Drivers */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-[#7E8B9B] uppercase tracking-wider">
                    Ranked Root Cause Contributors & Corrective Action
                  </h4>
                  <div className="space-y-2">
                    {ticket.prediction.shap_contributions
                      .filter((c) => c.value > 0)
                      .slice(0, 3)
                      .map((driver, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded border border-[#FF3B30]/30 bg-[#13171D] text-xs font-mono"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded bg-[#FF3B30]/20 text-[#FF3B30] flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-[#EDEDED]">
                                {driver.feature.replace(/_/g, " ").toUpperCase()}
                              </span>
                              <span className="text-[#7E8B9B] text-[11px] ml-2">
                                (SHAP weight: +{(driver.value * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          <span className="text-[#FF3B30] font-medium">Primary Fault Driver</span>
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
                    <h3 className="text-sm font-bold text-[#EDEDED] flex items-center gap-2 font-mono">
                      <Wrench className="w-4 h-4 text-[#10B981]" /> Dynamic Standard Operating Procedure (SOP)
                    </h3>
                    <p className="text-xs text-[#7E8B9B]">
                      Tailored protocol generated specifically for {ticket.failureMode.name} on Machine {ticket.machineId}.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-[#10B981] font-bold">
                      {completedCount} / {checklist.length} Completed ({progressPct.toFixed(0)}%)
                    </span>
                    <Progress value={progressPct} indicatorClassName="bg-[#10B981]" className="w-32 h-1.5 mt-1" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`flex items-start gap-3 p-3.5 rounded border transition-all cursor-pointer select-none font-mono ${
                        item.completed
                          ? "bg-[#13171D] border-[#2A3241] text-[#7E8B9B] line-through"
                          : "bg-[#13171D] border-[#212631] hover:border-[#2A3241] text-[#EDEDED]"
                      }`}
                    >
                      <div className="mt-0.5">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            item.completed
                              ? "bg-[#10B981] border-[#10B981] text-[#0D1117]"
                              : "border-[#2A3241] bg-[#181D24]"
                          }`}
                        >
                          {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium font-sans">{item.step}</span>
                          {item.critical && (
                            <Badge variant="destructive" size="sm" className="rounded">
                              MANDATORY
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-[#7E8B9B] uppercase tracking-wider block mt-1">
                          Category: {item.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {ticket.prediction.safety_measures.length > 0 && (
                  <div className="p-4 rounded border border-[#2A3241] bg-[#13171D] space-y-2">
                    <h4 className="text-xs font-bold text-[#EDEDED] flex items-center gap-2 font-mono">
                      <ShieldAlert className="w-4 h-4 text-[#FF3B30]" /> Mandatory Equipment Safety Directives:
                    </h4>
                    <ul className="space-y-1.5 pl-2 font-mono">
                      {ticket.prediction.safety_measures.map((measure, i) => (
                        <li key={i} className="text-xs text-[#7E8B9B] flex items-start gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                          <span className="text-[#EDEDED]">{measure}</span>
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
                  <h3 className="text-sm font-bold text-[#EDEDED] flex items-center gap-2 font-mono">
                    <UserCheck className="w-4 h-4 text-[#10B981]" /> Technician Assignment & Dispatch Order
                  </h3>
                  <p className="text-xs text-[#7E8B9B]">
                    Assign field personnel, configure urgency override, and broadcast work order to shop-floor pager.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#EDEDED] block mb-1.5">
                      Assign Duty Technician
                    </label>
                    <select
                      value={technician}
                      onChange={(e) => setTechnician(e.target.value)}
                      className="w-full bg-[#13171D] border border-[#2A3241] rounded px-3.5 py-2.5 text-xs text-[#EDEDED] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors font-mono cursor-pointer"
                    >
                      {TECHNICIANS.map((tech) => (
                        <option key={tech.name} value={tech.name} className="bg-[#13171D] text-[#EDEDED]">
                          {tech.name} — {tech.role} ({tech.shift})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#EDEDED] block mb-1.5">
                      Priority Level Override
                    </label>
                    <select
                      value={priorityOverride}
                      onChange={(e) => setPriorityOverride(e.target.value as PriorityLevel)}
                      className="w-full bg-[#13171D] border border-[#2A3241] rounded px-3.5 py-2.5 text-xs text-[#EDEDED] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors font-mono cursor-pointer"
                    >
                      <option value="CRITICAL" className="bg-[#13171D] text-[#EDEDED]">CRITICAL (Immediate Line Stoppage)</option>
                      <option value="ELEVATED" className="bg-[#13171D] text-[#EDEDED]">ELEVATED (Inspect Within 2 Hours)</option>
                      <option value="STANDARD" className="bg-[#13171D] text-[#EDEDED]">STANDARD (Next Maintenance Window)</option>
                      <option value="LOW" className="bg-[#13171D] text-[#EDEDED]">LOW (Log For Next Shift Handover)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#EDEDED] block mb-1.5">
                    Technician Work Order Notes & Observations
                  </label>
                  <textarea
                    rows={3}
                    value={ticketNotes}
                    onChange={(e) => setTicketNotes(e.target.value)}
                    placeholder="Enter specific machine cell notes, spare part stock codes, or clearance requirements..."
                    className="w-full bg-[#13171D] border border-[#2A3241] rounded p-3 text-xs text-[#EDEDED] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors resize-none font-mono"
                  />
                </div>

                {dispatchSuccessMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded border border-[#10B981]/40 bg-[#13171D] text-[#10B981] text-xs flex items-center gap-2.5 font-mono"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>{dispatchSuccessMsg}</span>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer with Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 md:px-6 border-t border-[#2A3241] bg-[#13171D] sticky bottom-0 z-20">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs text-[#EDEDED] border-[#2A3241] hover:bg-[#181D24]"
              >
                <Printer className="w-3.5 h-3.5" /> Print Work Order
              </Button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="text-xs bg-[#181D24] hover:bg-[#212631] text-[#EDEDED] border border-[#2A3241]"
              >
                Close
              </Button>

              <Button
                variant="volt"
                size="sm"
                disabled={isDispatching}
                onClick={handleDispatch}
                className="gap-2 text-xs font-bold shadow-none"
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
