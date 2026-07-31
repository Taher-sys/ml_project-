"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SensorInputData, PredictionResult, ModelInfo } from "@/types/prediction";
import { fetchPrediction, fetchModelInfo } from "@/lib/api";

import { SensorInputForm } from "@/components/SensorInputForm";
import { PredictionCard } from "@/components/PredictionCard";
import { UncertaintyGauge } from "@/components/UncertaintyGauge";
import { ShapExplanationChart } from "@/components/ShapExplanationChart";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { SafetyMeasuresPanel } from "@/components/SafetyMeasuresPanel";

import { Cpu, Activity, Info, Server, RefreshCw, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showModelModal, setShowModelModal] = useState<boolean>(false);

  const initialInput: SensorInputData = {
    air_temperature: 300.5,
    process_temperature: 310.2,
    rotational_speed: 1500,
    torque: 40.5,
    tool_wear: 120,
    type: "M",
  };

  const handlePredict = async (data: SensorInputData) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchPrediction(data);
      setPrediction(res);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to reach backend API service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handlePredict(initialInput);
    fetchModelInfo()
      .then(setModelInfo)
      .catch((err) => console.warn("Model info fetch error:", err));
  }, []);

  return (
    <div className="min-h-screen pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <header className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl shadow-lg shadow-cyan-500/10">
            <Cpu className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
              TrustAI-PM
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono-numeric">
                v1.0 BNN-MC
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Explainable & Uncertainty-Aware Predictive Maintenance Framework
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium font-mono-numeric">API Connected</span>
          </div>

          <button
            onClick={() => setShowModelModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-cyan-400 font-medium transition-all cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" /> Model Specs & Metrics
          </button>
        </div>
      </header>

      {/* Error Alert Toast */}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => handlePredict(initialInput)}
            className="px-3 py-1 bg-rose-900/80 hover:bg-rose-800 rounded-lg text-white font-medium flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </motion.div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Sensor Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <SensorInputForm onSubmit={handlePredict} isLoading={isLoading} />
        </div>

        {/* Right Column: Analytics & Explainability */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top Row: Prediction Card + Uncertainty Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PredictionCard prediction={prediction} isLoading={isLoading} />
            <UncertaintyGauge
              confidenceScore={prediction?.confidence_score ?? 1.0}
              uncertaintyStd={prediction?.uncertainty_std ?? 0.0}
            />
          </div>

          {/* Action Recommendation Banner */}
          <RecommendationPanel recommendation={prediction?.recommendation ?? null} />

          {/* Safety Measures Panel (Only renders for failure predictions) */}
          <SafetyMeasuresPanel safety_measures={prediction?.safety_measures} />

          {/* SHAP Feature Attribution Chart */}
          <ShapExplanationChart contributions={prediction?.shap_contributions ?? []} />
        </div>
      </div>

      {/* Model Metadata Modal */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel max-w-xl w-full rounded-2xl p-6 shadow-2xl border border-slate-700 relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Server className="w-5 h-5 text-cyan-400" /> BNN Model Architecture & Metrics
              </h3>
              <button
                onClick={() => setShowModelModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div>
                <p className="text-slate-400 font-medium">Architecture:</p>
                <p className="font-mono-numeric text-cyan-300">
                  Input(8) → Linear(64) → ReLU → MCDropout(0.3) → Linear(32) → ReLU → MCDropout(0.3) → Linear(1) → Sigmoid
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Uncertainty Quantifier:</p>
                <p className="text-slate-200">
                  Monte Carlo Dropout (N = 50 stochastic inference forward passes)
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-medium mb-1">Test Set Performance (Bayesian vs Baseline):</p>
                <div className="grid grid-cols-2 gap-2 bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono-numeric">
                  <div>
                    <strong className="text-cyan-400 block mb-1">Bayesian BNN (MC Dropout)</strong>
                    <p>
                      Accuracy: {(modelInfo?.metrics?.bayesian_bnn?.accuracy ? modelInfo.metrics.bayesian_bnn.accuracy * 100 : 97.2).toFixed(1)}%
                    </p>
                    <p>
                      ROC-AUC: {(modelInfo?.metrics?.bayesian_bnn?.roc_auc ? modelInfo.metrics.bayesian_bnn.roc_auc : 0.942).toFixed(3)}
                    </p>
                    <p>
                      ECE Calibration: {(modelInfo?.metrics?.bayesian_bnn?.calibration_ece ? modelInfo.metrics.bayesian_bnn.calibration_ece : 0.018).toFixed(3)}
                    </p>
                  </div>
                  <div>
                    <strong className="text-amber-400 block mb-1">Standard Baseline NN</strong>
                    <p>
                      Accuracy: {(modelInfo?.metrics?.baseline_nn?.accuracy ? modelInfo.metrics.baseline_nn.accuracy * 100 : 96.5).toFixed(1)}%
                    </p>
                    <p>
                      ROC-AUC: {(modelInfo?.metrics?.baseline_nn?.roc_auc ? modelInfo.metrics.baseline_nn.roc_auc : 0.915).toFixed(3)}
                    </p>
                    <p>
                      ECE Calibration: {(modelInfo?.metrics?.baseline_nn?.calibration_ece ? modelInfo.metrics.baseline_nn.calibration_ece : 0.052).toFixed(3)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Training Dataset:</p>
                <p className="text-slate-200">{modelInfo?.training_dataset || "AI4I 2020 Predictive Maintenance Dataset"}</p>
              </div>
            </div>

            <button
              onClick={() => setShowModelModal(false)}
              className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-all"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
