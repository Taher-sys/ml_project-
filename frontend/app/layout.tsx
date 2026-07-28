"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CustomCursor } from "@/components/CustomCursor";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en" className="dark">
      <head>
        <title>TrustAI-PM — Explainable & Uncertainty-Aware Predictive Maintenance</title>
        <meta name="description" content="Bayesian Deep Learning (Monte Carlo Dropout) and SHAP-powered industrial predictive maintenance dashboard." />
      </head>
      <body className="bg-industrial-glow text-slate-100 min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <QueryClientProvider client={queryClient}>
          <CustomCursor />
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
