"use client";

import React, { useEffect, useRef } from "react";

interface DataPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  pulseSpeed: number;
  pulseOffset: number;
}

export const TechnicalBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Initialize technical micro-data points
    const pointCount = Math.min(60, Math.floor((width * height) / 25000));
    const points: DataPoint[] = [];

    for (let i = 0; i < pointCount; i++) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        size: Math.random() > 0.85 ? 2.0 : 1.2,
        alpha: 0.15 + Math.random() * 0.3,
        pulseSpeed: 0.015 + Math.random() * 0.02,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    let sweepAngle = 0;
    let time = 0;

    const render = () => {
      time += 0.016;
      sweepAngle += 0.003;
      if (sweepAngle > Math.PI * 2) sweepAngle = 0;

      // Base solid clear
      ctx.fillStyle = "#0D0F12";
      ctx.fillRect(0, 0, width, height);

      // --- 1. Subtle CAD Blueprint Grid ---
      const gridSize = 56;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(33, 38, 49, 0.4)"; // #212631 at 40%

      ctx.beginPath();
      // Vertical grid lines
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      // Horizontal grid lines
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // --- 2. Technical Intersection Reticles (+) ---
      ctx.strokeStyle = "rgba(126, 139, 155, 0.22)"; // #7E8B9B
      const reticleSize = 3;
      ctx.beginPath();
      for (let x = gridSize * 2; x < width; x += gridSize * 3) {
        for (let y = gridSize * 2; y < height; y += gridSize * 3) {
          ctx.moveTo(x - reticleSize, y);
          ctx.lineTo(x + reticleSize, y);
          ctx.moveTo(x, y - reticleSize);
          ctx.lineTo(x, y + reticleSize);
        }
      }
      ctx.stroke();

      // --- 3. Concentric Radar CAD Geometry (Primary Offset Upper Right) ---
      const radarCenterX = width * 0.78;
      const radarCenterY = height * 0.24;
      const maxRadius = Math.min(width, height) * 0.45;

      // Primary concentric radar range rings with enhanced 1.75px stroke & 0.25 opacity
      ctx.strokeStyle = "rgba(20, 184, 166, 0.26)"; // Clean slate teal / emerald telemetry
      ctx.lineWidth = 1.75;

      for (let r = 70; r <= maxRadius; r += 85) {
        ctx.beginPath();
        ctx.arc(radarCenterX, radarCenterY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Secondary Concentric CAD Rings (Lower Left telemetry node)
      const secCenterX = width * 0.16;
      const secCenterY = height * 0.74;
      const secMaxRadius = Math.min(width, height) * 0.32;
      ctx.strokeStyle = "rgba(16, 185, 129, 0.24)"; // Muted industrial emerald
      ctx.lineWidth = 1.5;

      for (let r = 50; r <= secMaxRadius; r += 70) {
        ctx.beginPath();
        ctx.arc(secCenterX, secCenterY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Radar Axis Crosshairs
      ctx.strokeStyle = "rgba(126, 139, 155, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.setLineDash([4, 6]);
      ctx.moveTo(radarCenterX - maxRadius - 20, radarCenterY);
      ctx.lineTo(radarCenterX + maxRadius + 20, radarCenterY);
      ctx.moveTo(radarCenterX, radarCenterY - maxRadius - 20);
      ctx.lineTo(radarCenterX, radarCenterY + maxRadius + 20);
      ctx.moveTo(secCenterX - secMaxRadius - 15, secCenterY);
      ctx.lineTo(secCenterX + secMaxRadius + 15, secCenterY);
      ctx.moveTo(secCenterX, secCenterY - secMaxRadius - 15);
      ctx.lineTo(secCenterX, secCenterY + secMaxRadius + 15);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Slow Radial Sweep (Muted Industrial Emerald / Teal, Opacity 18%)
      const sweepLength = maxRadius * 1.05;
      const sweepEndX = radarCenterX + Math.cos(sweepAngle) * sweepLength;
      const sweepEndY = radarCenterY + Math.sin(sweepAngle) * sweepLength;

      const sweepGradient = ctx.createLinearGradient(radarCenterX, radarCenterY, sweepEndX, sweepEndY);
      sweepGradient.addColorStop(0, "rgba(16, 185, 129, 0.20)"); // Muted emerald
      sweepGradient.addColorStop(1, "rgba(16, 185, 129, 0.0)");

      ctx.beginPath();
      ctx.moveTo(radarCenterX, radarCenterY);
      ctx.arc(radarCenterX, radarCenterY, sweepLength, sweepAngle - 0.22, sweepAngle);
      ctx.closePath();
      ctx.fillStyle = sweepGradient;
      ctx.fill();

      // --- 4. Drifting Technical Micro-Stars / Data Nodes ---
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around bounds
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Subtle luminance pulsation
        const currentAlpha = Math.max(
          0.08,
          p.alpha + Math.sin(time * p.pulseSpeed * 60 + p.pulseOffset) * 0.12
        );

        ctx.fillStyle = `rgba(237, 237, 237, ${currentAlpha})`; // Bone white
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 block w-full h-full"
    />
  );
};

export default TechnicalBackground;
