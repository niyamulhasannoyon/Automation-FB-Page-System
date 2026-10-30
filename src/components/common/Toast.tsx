"use client";

import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toast() {
  const toast = useAppStore((state) => state.toast);
  const clearToast = useAppStore((state) => state.clearToast);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  };

  const borders = {
    success: "border-emerald-500/30 bg-slate-900/90 shadow-emerald-500/10",
    error: "border-rose-500/30 bg-slate-900/90 shadow-rose-500/10",
    info: "border-blue-500/30 bg-slate-900/90 shadow-blue-500/10",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl text-sm text-slate-100",
          borders[toast.type]
        )}
      >
        {icons[toast.type]}
        <p className="flex-1 font-medium">{toast.message}</p>
        <button
          onClick={clearToast}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
