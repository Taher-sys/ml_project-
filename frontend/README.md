# TrustAI-PM Frontend

Modern Next.js 15 (App Router) industrial dashboard built with React 19, TypeScript, Tailwind CSS v4, Framer Motion, and Recharts.

## Features

- **Interactive Telemetry Form**: Manual parameter tuning, preset failure/normal scenarios, and CSV batch upload.
- **Animated Prediction Cards**: Real-time count-up failure probability and status classification badges.
- **Radial Confidence Gauge**: SVG radial arc gauge displaying epistemic model confidence and variance standard deviation.
- **SHAP Explanation Chart**: Recharts horizontal bar chart visualizing signed feature contributions (positive = failure hazard, negative = safe operation).
- **Dynamic Recommendation Banner**: Color-shifting action banner with operator guidance.

## Setup & Development

```bash
npm install --legacy-peer-deps
npm run dev
```
