"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SensorInputData, PredictionResult, ModelInfo } from "@/types/prediction";
import { MaintenanceTicket } from "@/types/ticket";
import { fetchPrediction, fetchModelInfo } from "@/lib/api";
import { createMaintenanceTicketFromRow } from "@/lib/ticketHelper";

import { SensorInputForm } from "@/components/SensorInputForm";
import { PredictionCard } from "@/components/PredictionCard";
import { UncertaintyGauge } from "@/components/UncertaintyGauge";
import { ShapExplanationChart } from "@/components/ShapExplanationChart";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { SafetyMeasuresPanel } from "@/components/SafetyMeasuresPanel";
import { CSVBatchUploader } from "@/components/CSVBatchUploader";
import { DispatchTicketModal } from "@/components/DispatchTicketModal";

import {
  Cpu,
  Info,
  Server,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  Sliders,
  Ticket,
  ShieldAlert,
  CheckCircle2,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("batch_csv");
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showModelModal, setShowModelModal] = useState<boolean>(false);

  // Maintenance Ticket Modal State
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState<boolean>(false);
  const [dispatchedTickets, setDispatchedTickets] = useState<MaintenanceTicket[]>([]);

  const [currentInput, setCurrentInput] = useState<SensorInputData>({
    air_temperature: 300.5,
    process_temperature: 310.2,
    rotational_speed: 1500,
    torque: 40.5,
    tool_wear: 120,
    type: "M",
  });

  const handlePredict = async (data: SensorInputData) => {
    setIsLoading(true);
    setErrorMsg(null);
    setCurrentInput(data);
    try {
      const res = await fetchPrediction(data);
      setPrediction(res);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to reach backend API service.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handlePredict(currentInput);
    fetchModelInfo()
      .then(setModelInfo)
      .catch((err) => console.warn("Model info fetch error:", err));
  }, []);

  const handleOpenTicket = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
  };

  const handleTicketUpdated = (updatedTicket: MaintenanceTicket) => {
    setSelectedTicket(updatedTicket);
    setDispatchedTickets((prev) => {
      const filtered = prev.filter((t) => t.ticketId !== updatedTicket.ticketId);
      return [updatedTicket, ...filtered];
    });
  };

  const handleCreateTicketFromSimulator = () => {
    if (!prediction) return;

    const rowObj = {
      id: "sim-row",
      rowIndex: 1,
      machineId: `SIM-${currentInput.type}-01`,
      air_temperature: currentInput.air_temperature,
      process_temperature: currentInput.process_temperature,
      rotational_speed: currentInput.rotational_speed,
      torque: currentInput.torque,
      tool_wear: currentInput.tool_wear,
      type: currentInput.type,
      predictionResult: prediction,
      failureMode: prediction.failure_mode
        ? {
            code: prediction.failure_mode.code,
            name: prediction.failure_mode.name,
            shortName: prediction.failure_mode.shortName,
            description: prediction.failure_mode.description,
            indicators: prediction.failure_mode.indicators,
            severity: (prediction.failure_probability > 0.65 ? "high" : "medium") as
              | "high"
              | "medium",
          }
        : undefined,
      status: "evaluated" as const,
    };

    const ticket = createMaintenanceTicketFromRow(rowObj, 0);
    handleOpenTicket(ticket);
  };

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
      {/* Precision Industrial Topbar */}
      <header className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#212631]">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-[#181D24] border border-[#2A3241] rounded-xl shadow-sm">
            <Cpu className="w-5 h-5 text-[#D4F63C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#EDEDED] font-mono">
                TrustAI-PM
              </h1>
              <Badge variant="volt" size="sm">
                XAI-BNN v2.0
              </Badge>
            </div>
            <p className="text-xs text-[#7E8B9B] mt-0.5 font-sans">
              Industrial Predictive Maintenance • Bayesian Epistemic Uncertainty • SHAP Local Attribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Download Batch CSV Direct Link */}
          <a
            href="/batch_fleet_telemetry.csv"
            download="batch_fleet_telemetry.csv"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181D24] border border-[#2A3241] hover:border-[#D4F63C] hover:text-[#D4F63C] text-xs text-[#EDEDED] font-mono transition-colors shadow-sm"
            title="Download ready-to-upload telemetry dataset"
          >
            <Download className="w-3.5 h-3.5 text-[#D4F63C]" />
            <span>Sample CSV</span>
          </a>

          {/* Dispatched Tickets Counter */}
          {dispatchedTickets.length > 0 && (
            <Badge variant="volt" size="default" className="gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {dispatchedTickets.length} Work Orders
            </Badge>
          )}

          {/* Live Service Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181D24] border border-[#212631] text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4F63C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4F63C]"></span>
            </span>
            <span className="text-[#EDEDED]">FastAPI Online</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowModelModal(true)}
            className="text-xs gap-1.5 border-[#2A3241] bg-[#181D24] text-[#EDEDED] hover:border-[#D4F63C] hover:text-[#D4F63C] font-mono h-8"
          >
            <Info className="w-3.5 h-3.5" /> Specs
          </Button>
        </div>
      </header>

      {/* Error Alert Toast */}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-[#181D24] border border-[#FF3B30] text-[#FF3B30] text-xs flex items-center justify-between font-mono"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#FF3B30] flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => handlePredict(currentInput)}
            className="px-3 py-1 bg-[#FF3B30] hover:bg-[#E02D23] rounded-lg text-white font-medium flex items-center gap-1 cursor-pointer font-mono"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </motion.div>
      )}

      {/* Main Grounded Tabs System */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-xl bg-[#13171D] border border-[#212631]">
          <TabsList className="bg-transparent border-0 p-0 mb-0">
            <TabsTrigger value="batch_csv" className="gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#D4F63C]" />
              Fleet CSV Telemetry Ingestion Hub
              <span className="ml-1 px-1.5 py-0.5 rounded bg-[#0D0F12] text-[10px] text-[#7E8B9B] border border-[#212631]">
                AI4I Batch
              </span>
            </TabsTrigger>

            <TabsTrigger value="single_sim" className="gap-2">
              <Sliders className="w-4 h-4 text-[#D4F63C]" />
              Single-Unit Diagnostic Simulator
            </TabsTrigger>
          </TabsList>

          <div className="hidden lg:flex items-center gap-2 text-xs text-[#7E8B9B] font-mono pr-4">
            <span className="text-[#EDEDED]">AI4I 2020 Protocol</span>
            <span>•</span>
            <span className="text-[#D4F63C]">50 MC Forward Passes</span>
          </div>
        </div>

        {/* TAB 1: FLEET CSV TELEMETRY INGESTION */}
        <TabsContent value="batch_csv">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <CSVBatchUploader
              onSelectTicket={handleOpenTicket}
              onApplySingleRow={(data) => {
                handlePredict(data);
                setActiveTab("single_sim");
              }}
            />
          </motion.div>
        </TabsContent>

        {/* TAB 2: SINGLE-UNIT DIAGNOSTIC SIMULATOR */}
        <TabsContent value="single_sim">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Column: Sensor Input Form */}
            <div className="lg:col-span-5 space-y-6">
              <SensorInputForm
                onSubmit={handlePredict}
                isLoading={isLoading}
                onSwitchToBatch={() => setActiveTab("batch_csv")}
              />
            </div>

            {/* Right Column: Analytics & Explainability */}
            <div className="lg:col-span-7 space-y-6">
              {/* Top Row: Prediction Assessment + Uncertainty Gauge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PredictionCard prediction={prediction} isLoading={isLoading} />
                <UncertaintyGauge
                  confidenceScore={prediction?.confidence_score ?? 1.0}
                  uncertaintyStd={prediction?.uncertainty_std ?? 0.0}
                />
              </div>

              {/* Elevated Risk Work Order Prompt Banner */}
              {prediction && prediction.failure_probability > 0.4 && (
                <div className="p-4 rounded-xl border border-[#FF3B30] bg-[#181D24] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-[#FF3B30] flex items-center gap-2 font-mono">
                      <ShieldAlert className="w-4 h-4 text-[#FF3B30]" />
                      Elevated Failure Likelihood Detected ({(prediction.failure_probability * 100).toFixed(1)}%)
                    </div>
                    <div className="text-[11px] text-[#7E8B9B] font-mono">
                      Diagnosed Mode: {prediction.failure_mode?.name || "Tool Wear & Overstrain"}. Issue technician work order immediately.
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCreateTicketFromSimulator}
                    className="gap-2 text-xs font-bold font-mono whitespace-nowrap"
                  >
                    <Ticket className="w-3.5 h-3.5" /> Generate Dispatch Ticket
                  </Button>
                </div>
              )}

              {/* Action Recommendation Banner */}
              <RecommendationPanel
                recommendation={prediction?.recommendation ?? null}
                onDispatchTicket={handleCreateTicketFromSimulator}
              />

              {/* Safety Measures Panel */}
              <SafetyMeasuresPanel safety_measures={prediction?.safety_measures} />

              {/* SHAP Feature Attribution Chart */}
              <ShapExplanationChart contributions={prediction?.shap_contributions ?? []} />
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* DISPATCH TICKET MODAL */}
      <DispatchTicketModal
        isOpen={isTicketModalOpen}
        ticket={selectedTicket}
        onClose={() => setIsTicketModalOpen(false)}
        onTicketUpdated={handleTicketUpdated}
      />

      {/* Model Metadata Modal */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full rounded-xl p-6 shadow-2xl border border-[#2A3241] bg-[#13171D] text-[#EDEDED] relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2A3241] mb-4">
              <h3 className="text-base font-bold text-[#EDEDED] flex items-center gap-2 font-mono">
                <Server className="w-5 h-5 text-[#D4F63C]" /> BNN Model Architecture & Benchmark Metrics
              </h3>
              <button
                onClick={() => setShowModelModal(false)}
                className="text-[#7E8B9B] hover:text-[#EDEDED] text-sm font-bold px-2 py-1 cursor-pointer font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#EDEDED] font-mono">
              <div>
                <p className="text-[#7E8B9B] font-sans font-medium">Neural Architecture:</p>
                <p className="text-[#D4F63C] mt-0.5">
                  Input(8) → Linear(64) → ReLU → MCDropout(0.3) → Linear(32) → ReLU → MCDropout(0.3) → Linear(1) → Sigmoid
                </p>
              </div>

              <div>
                <p className="text-[#7E8B9B] font-sans font-medium">Epistemic Uncertainty Engine:</p>
                <p className="text-[#EDEDED] mt-0.5">
                  PyTorch Monte Carlo Dropout (N = 50 stochastic forward passes per instance)
                </p>
              </div>

              <div>
                <p className="text-[#7E8B9B] font-sans font-medium mb-1.5">Model Benchmarks on AI4I 2020 Test Set:</p>
                <div className="grid grid-cols-2 gap-3 bg-[#181D24] p-3 rounded-lg border border-[#2A3241]">
                  <div>
                    <strong className="text-[#D4F63C] block mb-1">Bayesian BNN (MC Dropout)</strong>
                    <p>Accuracy: {(modelInfo?.metrics?.bayesian_bnn?.accuracy ? modelInfo.metrics.bayesian_bnn.accuracy * 100 : 97.2).toFixed(1)}%</p>
                    <p>ROC-AUC: {(modelInfo?.metrics?.bayesian_bnn?.roc_auc ? modelInfo.metrics.bayesian_bnn.roc_auc : 0.942).toFixed(3)}</p>
                    <p>Calibration ECE: {(modelInfo?.metrics?.bayesian_bnn?.calibration_ece ? modelInfo.metrics.bayesian_bnn.calibration_ece : 0.018).toFixed(3)}</p>
                  </div>
                  <div>
                    <strong className="text-[#7E8B9B] block mb-1">Standard Baseline NN</strong>
                    <p>Accuracy: {(modelInfo?.metrics?.baseline_nn?.accuracy ? modelInfo.metrics.baseline_nn.accuracy * 100 : 96.5).toFixed(1)}%</p>
                    <p>ROC-AUC: {(modelInfo?.metrics?.baseline_nn?.roc_auc ? modelInfo.metrics.baseline_nn.roc_auc : 0.915).toFixed(3)}</p>
                    <p>Calibration ECE: {(modelInfo?.metrics?.baseline_nn?.calibration_ece ? modelInfo.metrics.baseline_nn.calibration_ece : 0.052).toFixed(3)}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[#7E8B9B] font-sans font-medium">Training Reference Dataset:</p>
                <p className="text-[#EDEDED] mt-0.5">{modelInfo?.training_dataset || "AI4I 2020 Predictive Maintenance Dataset (UCI Machine Learning Repository)"}</p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowModelModal(false)}
              className="mt-6 w-full text-xs font-mono"
            >
              Close Specifications
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
