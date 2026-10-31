"use client";

import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { LiveActivityFeed } from "@/components/dashboard/LiveActivityFeed";
import { Activity, ShieldCheck, Zap } from "lucide-react";

export default function LogsPage() {
  const activePage = useAppStore((state) => state.activePage);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Live Automation & Webhook Logs
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
            Idempotent Engine
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Detailed real-time execution logs for comments, Messenger orders, stock inquiries, and AI replies
          {activePage ? ` on ${activePage.pageName}` : ""}
        </p>
      </div>

      <LiveActivityFeed />
    </div>
  );
}
