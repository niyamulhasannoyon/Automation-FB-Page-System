"use client";

import React from "react";
import { PageSwitcher } from "./PageSwitcher";
import { useAppStore } from "@/store/useAppStore";
import { Switch } from "@/components/common/Switch";
import Link from "next/link";
import { RefreshCw, Radio, ShieldCheck, ShieldAlert, LogOut, Crown } from "lucide-react";

export function Header() {
  const activePage = useAppStore((state) => state.activePage);
  const togglePageAutomation = useAppStore(
    (state) => state.togglePageAutomation
  );
  const fetchPages = useAppStore((state) => state.fetchPages);
  const isLoading = useAppStore((state) => state.isLoading);
  const currentUser = useAppStore((state) => state.currentUser);
  const showToast = useAppStore((state) => state.showToast);

  const isAdmin = currentUser?.role === "admin";

  const handleToggle = () => {
    if (activePage) {
      togglePageAutomation(activePage.pageId);
    }
  };

  const handleQuickSwitchToAdmin = async () => {
    try {
      const res = await fetch("/api/auth/admin-login", { method: "POST" });
      if (res.ok) {
        showToast("Switched session to Super Admin!", "success");
        window.location.href = "/admin";
      } else {
        showToast("Failed to switch to admin.", "error");
      }
    } catch {
      showToast("Network error during admin elevation.", "error");
    }
  };

  return (
    <header className="h-16 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <PageSwitcher />

        {activePage && (
          <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-white/10 text-xs">
            {activePage.isWebhookSubscribed ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" /> Webhook Subscribed
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-mono">
                <ShieldAlert className="w-3.5 h-3.5" /> Webhook Pending
              </span>
            )}

            {activePage.isPermanent ? (
              <span
                className="hidden xl:flex items-center gap-1 text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
                title="Permanent Token Active (Never Expires) - 24/7 Uninterrupted Automation"
              >
                ♾️ Permanent Token
              </span>
            ) : (
              <Link
                href="/settings"
                className="hidden xl:flex items-center gap-1 text-amber-400 hover:text-amber-300 font-mono text-[11px] bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/25 transition-colors"
                title="Short-lived token detected. Click to upgrade to Permanent System User Token"
              >
                ⚠️ Short-Lived Token (Upgrade)
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* User Identity / Role Pill */}
        {isAdmin ? (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold hover:border-indigo-400 transition-all shadow-[0_0_12px_rgba(99,102,241,0.2)]"
            title="Logged in as Super Admin - Click to open Admin Panel"
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Super Admin</span>
          </Link>
        ) : (
          <button
            onClick={handleQuickSwitchToAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-500/15 text-slate-300 hover:text-indigo-300 border border-white/10 hover:border-indigo-500/30 text-xs font-medium transition-all cursor-pointer"
            title="Switch to Super Admin Mode"
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="hidden sm:inline">Merchant</span>
            <span className="text-[10px] font-mono text-indigo-400 font-semibold bg-indigo-500/20 px-1 rounded">
              Switch Admin
            </span>
          </button>
        )}

        {activePage && (
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10">
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

        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          title="Sign Out"
          className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/20 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
