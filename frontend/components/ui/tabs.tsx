"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (v: string) => void;
}>({ activeTab: "", setActiveTab: () => {} });

interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ children, defaultValue = "", value, onValueChange, className }: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = React.useState(defaultValue);
  const activeTab = value ?? internalActiveTab;

  const setActiveTab = React.useCallback(
    (nextValue: string) => {
      if (value === undefined) {
        setInternalActiveTab(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [onValueChange, value]
  );

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center justify-center rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-1 text-zinc-400 backdrop-blur-md",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold font-mono tracking-tight transition-all duration-150 cursor-pointer select-none",
        isActive
          ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/80 text-cyan-300"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
  lazy = false,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  lazy?: boolean;
}) {
  const { activeTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  if (lazy && !isActive) {
    return null;
  }

  return (
    <div className={cn("mt-4 outline-none", isActive ? "block" : "hidden", className)}>
      {children}
    </div>
  );
}
