"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function InteractiveHoverButton({
  children,
  className,
  ...props
}: InteractiveHoverButtonProps) {
  return (
    <button
      className={cn(
        "group relative w-auto cursor-pointer overflow-hidden rounded-xl border border-cyan-500/40 bg-zinc-950/80 px-5 py-2.5 text-center text-xs font-bold text-cyan-300 backdrop-blur-md shadow-md shadow-cyan-500/10 transition-all duration-300 hover:border-cyan-400 hover:shadow-cyan-500/20 active:scale-[0.98]",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-cyan-400 transition-all duration-300 group-hover:scale-[35] group-hover:bg-cyan-500"></div>
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </div>
      <div className="absolute top-0 left-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 font-black text-zinc-950 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        <span>{children}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </button>
  );
}

export default InteractiveHoverButton;
