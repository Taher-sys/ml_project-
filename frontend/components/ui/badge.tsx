import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "warning" | "success" | "outline" | "cyan";
  size?: "default" | "sm" | "lg";
}

export function Badge({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "border-zinc-700 bg-zinc-800 text-zinc-100",
    secondary: "border-zinc-800 bg-zinc-900/90 text-zinc-300",
    destructive: "border-red-500/40 bg-red-500/15 text-red-400 shadow-sm shadow-red-500/20",
    warning: "border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-sm shadow-amber-500/20",
    success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/20",
    outline: "border-zinc-700 text-zinc-300 bg-transparent",
    cyan: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300 shadow-sm shadow-cyan-500/20",
  }[variant];

  const sizeStyles = {
    default: "px-2.5 py-0.5 text-xs",
    sm: "px-2 py-0.5 text-[11px]",
    lg: "px-3 py-1 text-sm font-semibold",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors font-mono-numeric tracking-wide",
        variantStyles,
        sizeStyles,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
