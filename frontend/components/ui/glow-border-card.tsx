"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Props for the GlowBorderCard component from VengeanceUI
 */
export interface GlowBorderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  width?: string;
  height?: string;
  aspectRatio?: string;
  borderRadius?: string;
  animationDuration?: number;
  gradientColors?: string[];
  borderWidth?: string;
  blurAmount?: string;
  inset?: string;
  colorPreset?: "nature" | "ocean" | "sunset" | "aurora" | "hazard" | "custom";
  paused?: boolean;
}

const colorPresets: Record<string, string[]> = {
  nature: ["#10b981", "#34d399", "#6ee7b7", "#059669", "#047857", "#065f46", "#10b981"],
  ocean: ["#06b6d4", "#0284c7", "#38bdf8", "#0ea5e9", "#0369a1", "#0284c7", "#06b6d4"],
  sunset: ["#f59e0b", "#f97316", "#ef4444", "#dc2626", "#ea580c", "#d97706", "#f59e0b"],
  aurora: ["#00ff87", "#22ffaa", "#44ffcc", "#60efff", "#88ddff", "#bb99ff", "#dd77ee", "#00ff87"],
  hazard: ["#f43f5e", "#ef4444", "#dc2626", "#b91c1c", "#f97316", "#f43f5e"],
  custom: ["#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"],
};

export const GlowBorderCard = React.forwardRef<HTMLDivElement, GlowBorderCardProps>(
  (
    {
      children,
      className,
      width = "100%",
      height,
      aspectRatio,
      borderRadius = "1rem",
      animationDuration = 6,
      gradientColors,
      borderWidth = "2px",
      blurAmount = "8px",
      inset = "-2px",
      colorPreset = "ocean",
      paused = false,
      style,
      ...props
    },
    ref
  ) => {
    const colors = gradientColors || colorPresets[colorPreset] || colorPresets.ocean;

    const colorVars: Record<string, string> = {};
    for (let i = 0; i < 10; i++) {
      colorVars[`--glow-color-${i + 1}`] = colors[i % colors.length];
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden isolate rounded-2xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl shadow-xl transition-all duration-300",
          className
        )}
        style={{
          width,
          height: height || "auto",
          aspectRatio: height ? "unset" : aspectRatio,
          borderRadius,
          "--glow-animation-duration": `${animationDuration}s`,
          ...colorVars,
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        <div
          className={cn(
            "pointer-events-none absolute -z-10 rounded-[inherit] glow-conic opacity-70 transition-opacity duration-300",
            paused && "[animation-play-state:paused]"
          )}
          style={{
            inset,
            borderWidth,
            filter: `blur(${blurAmount})`,
          }}
        />
        <div className="relative z-10 w-full h-full">{children}</div>
      </div>
    );
  }
);

GlowBorderCard.displayName = "GlowBorderCard";

export default GlowBorderCard;
