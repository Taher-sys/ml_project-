import type { Metadata } from "next";
import { Providers } from "./providers";
import { TechnicalBackground } from "@/components/TechnicalBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrustAI-PM — Explainable & Uncertainty-Aware Predictive Maintenance",
  description:
    "Stealth-industrial Bayesian Deep Learning (Monte Carlo Dropout) and SHAP-powered predictive maintenance engineering dashboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0D0F12] text-[#EDEDED] min-h-screen antialiased selection:bg-[#10B981] selection:text-[#0D1117] relative overflow-x-hidden">
        {/* Contained, Grounded Technical Backdrop with Zero Pointer Events */}
        <TechnicalBackground />

        {/* Solid High-Contrast Grounded Application Content (z-index: 10) */}
        <div className="relative z-10 min-h-screen">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
