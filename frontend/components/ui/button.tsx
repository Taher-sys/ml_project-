import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "gradient" | "cyan" | "volt";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", disabled, children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-[#D4F63C] text-[#0D0F12] hover:bg-[#CEF238] font-bold font-mono active:scale-[0.99] border border-[#D4F63C]",
      volt: "bg-[#D4F63C] text-[#0D0F12] hover:bg-[#CEF238] font-bold font-mono active:scale-[0.99] border border-[#D4F63C]",
      destructive: "bg-[#FF3B30] text-white hover:bg-[#E02D23] font-bold font-mono border border-[#FF3B30] active:scale-[0.99]",
      outline: "border border-[#2A3241] bg-[#181D24] text-[#EDEDED] hover:border-[#D4F63C] hover:text-[#D4F63C] hover:bg-[#13171D] active:scale-[0.99]",
      secondary: "border border-[#212631] bg-[#13171D] text-[#7E8B9B] hover:text-[#EDEDED] hover:border-[#2A3241] hover:bg-[#181D24] active:scale-[0.99]",
      ghost: "hover:bg-[#181D24] text-[#7E8B9B] hover:text-[#EDEDED]",
      gradient: "bg-[#D4F63C] text-[#0D0F12] hover:bg-[#CEF238] font-bold font-mono active:scale-[0.99] border border-[#D4F63C]",
      cyan: "border border-[#D4F63C]/40 bg-[#D4F63C]/10 text-[#D4F63C] hover:bg-[#D4F63C]/20 active:scale-[0.99]",
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
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-mono font-medium transition-colors focus-visible:outline-none focus-visible:border-[#D4F63C] disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none",
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
