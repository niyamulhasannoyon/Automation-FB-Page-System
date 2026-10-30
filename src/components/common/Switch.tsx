"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function Switch({
  checked,
  onChange,
  disabled = false,
  className,
  size = "md",
}: SwitchProps) {
  const isSmall = size === "sm";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed",
        isSmall ? "h-5 w-9" : "h-6 w-11",
        checked
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-glow"
          : "bg-slate-800 border border-white/10",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
          isSmall ? "h-3.5 w-3.5 mt-[3px]" : "h-4 w-4 mt-1",
          checked
            ? isSmall
              ? "translate-x-[18px]"
              : "translate-x-6"
            : isSmall
            ? "translate-x-1"
            : "translate-x-1"
        )}
      />
    </button>
  );
}
