import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "gradient" | "cyan" | "volt";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", disabled, children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-[#10B981] text-[#0D1117] hover:bg-[#059669] font-bold font-mono active:scale-[0.99] border border-[#10B981]",
      volt: "bg-[#10B981] text-[#0D1117] hover:bg-[#059669] font-bold font-mono active:scale-[0.99] border border-[#10B981]",
      destructive: "bg-[#FF3B30] text-white hover:bg-[#E02D23] font-bold font-mono border border-[#FF3B30] active:scale-[0.99]",
      outline: "border border-[#2A3241] bg-[#181D24] text-[#EDEDED] hover:border-[#10B981] hover:text-[#10B981] hover:bg-[#13171D] active:scale-[0.99]",
      secondary: "border border-[#212631] bg-[#13171D] text-[#7E8B9B] hover:text-[#EDEDED] hover:border-[#2A3241] hover:bg-[#181D24] active:scale-[0.99]",
      ghost: "hover:bg-[#181D24] text-[#7E8B9B] hover:text-[#EDEDED]",
      gradient: "bg-[#10B981] text-[#0D1117] hover:bg-[#059669] font-bold font-mono active:scale-[0.99] border border-[#10B981]",
      cyan: "border border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14B8A6] hover:bg-[#14B8A6]/20 active:scale-[0.99]",
    }[variant];

    const sizeStyles = {
      default: "h-9 px-4 py-2 text-xs",
      sm: "h-8 px-3 text-xs rounded-lg",
      lg: "h-11 px-6 text-sm rounded-xl font-bold",
      icon: "h-9 w-9 p-0 flex items-center justify-center rounded-lg",
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-mono font-medium transition-colors focus-visible:outline-none focus-visible:border-[#10B981] disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none",
          variantStyles,
          sizeStyles,
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
