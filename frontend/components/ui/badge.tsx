import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "warning" | "success" | "outline" | "cyan" | "volt";
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
    default: "border-[#2A3241] bg-[#181D24] text-[#EDEDED]",
    secondary: "border-[#212631] bg-[#13171D] text-[#7E8B9B]",
    destructive: "border-[#FF3B30]/50 bg-[#FF3B30]/10 text-[#FF3B30]",
    warning: "border-[#F5A623]/50 bg-[#F5A623]/10 text-[#F5A623]",
    success: "border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]",
    outline: "border-[#2A3241] text-[#7E8B9B] bg-transparent",
    cyan: "border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14B8A6]",
    volt: "border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]",
  }[variant];

  const sizeStyles = {
    default: "px-2.5 py-0.5 text-xs",
    sm: "px-2 py-0.5 text-[11px]",
    lg: "px-3 py-1 text-sm font-semibold",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-mono font-medium tracking-tight",
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
