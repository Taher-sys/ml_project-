"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface GlowBorderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  width?: string;
  height?: string;
  borderRadius?: string;
  colorPreset?: "nature" | "ocean" | "sunset" | "aurora" | "hazard" | "custom" | "volt";
}

export const GlowBorderCard = React.forwardRef<HTMLDivElement, GlowBorderCardProps>(
  (
    {
      children,
      className,
      width = "100%",
      height,
      colorPreset = "volt",
      style,
      ...props
    },
    ref
  ) => {
    const presetBorder = {
      hazard: "border-[#FF3B30] bg-[#181D24]",
      sunset: "border-[#F5A623] bg-[#181D24]",
      nature: "border-[#10B981] bg-[#181D24]",
      volt: "border-[#10B981] bg-[#181D24]",
      ocean: "border-[#14B8A6] bg-[#181D24]",
      aurora: "border-[#10B981] bg-[#181D24]",
      custom: "border-[#2A3241] bg-[#181D24]",
    }[colorPreset] || "border-[#2A3241] bg-[#181D24]";

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl border transition-colors shadow-sm",
          presetBorder,
          className
        )}
        style={{
          width,
          height: height || "auto",
          ...style,
        }}
        {...props}
      >
        <div className="relative z-10 w-full h-full">{children}</div>
      </div>
    );
  }
);

GlowBorderCard.displayName = "GlowBorderCard";

export default GlowBorderCard;
