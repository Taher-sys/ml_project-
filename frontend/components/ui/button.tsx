import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "gradient" | "cyan";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", disabled, children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-zinc-100 text-zinc-950 hover:bg-zinc-200 active:scale-[0.98] shadow-sm",
      destructive: "bg-red-600/90 text-white hover:bg-red-500 active:scale-[0.98] shadow-md shadow-red-950/40 border border-red-500/30",
      outline: "border border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 active:scale-[0.98]",
      secondary: "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:scale-[0.98]",
      ghost: "hover:bg-zinc-800/80 text-zinc-300 hover:text-white",
      gradient: "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-zinc-950 font-bold hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 active:scale-[0.98]",
      cyan: "bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 hover:border-cyan-400 active:scale-[0.98] shadow-sm shadow-cyan-500/10",
    }[variant];

    const sizeStyles = {
      default: "h-9 px-4 py-2 text-sm",
      sm: "h-8 px-3 text-xs rounded-md",
      lg: "h-11 px-6 text-base rounded-xl font-semibold",
      icon: "h-9 w-9 p-0 flex items-center justify-center",
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
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
