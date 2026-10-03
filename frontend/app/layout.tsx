import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrustAI-PM — Explainable & Uncertainty-Aware Predictive Maintenance",
  description:
    "Enterprise Bayesian Deep Learning (Monte Carlo Dropout) and SHAP-powered industrial predictive maintenance dashboard with VengeanceUI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-industrial-glow text-slate-100 min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
