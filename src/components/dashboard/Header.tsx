"use client";

import React from "react";
import { PageSwitcher } from "./PageSwitcher";
import { useAppStore } from "@/store/useAppStore";
import { Switch } from "@/components/common/Switch";
import { RefreshCw, Radio, ShieldCheck, ShieldAlert } from "lucide-react";

export function Header() {
  const activePage = useAppStore((state) => state.activePage);
  const togglePageAutomation = useAppStore(
    (state) => state.togglePageAutomation
  );
  const fetchPages = useAppStore((state) => state.fetchPages);
  const isLoading = useAppStore((state) => state.isLoading);

  const handleToggle = () => {
    if (activePage) {
      togglePageAutomation(activePage.pageId);
    }
  };

  return (
    <header className="h-16 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <PageSwitcher />

        {activePage && (
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-white/10 text-xs">
            {activePage.isWebhookSubscribed ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" /> Webhook Subscribed
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-mono">
                <ShieldAlert className="w-3.5 h-3.5" /> Webhook Pending
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {activePage && (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-1.5">
              <Radio
                className={`w-3 h-3 ${
                  activePage.autoReplyEnabled
                    ? "text-emerald-400 animate-pulse"
                    : "text-slate-500"
                }`}
              />
              <span className="text-xs font-medium text-slate-300">
                {activePage.autoReplyEnabled ? "Automation Active" : "Automation Paused"}
              </span>
            </div>
            <Switch
              checked={activePage.autoReplyEnabled}
              onChange={handleToggle}
              size="sm"
            />
          </div>
        )}

        <button
          onClick={() => fetchPages()}
          title="Refresh Data"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-400" : ""}`}
          />
        </button>
      </div>
    </header>
  );
}
