"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquareCode,
  CalendarDays,
  Settings,
  PlusCircle,
  Zap,
  Globe,
  Radio,
  ShoppingBag,
  Activity,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: "Orders & Stock",
    href: "/orders",
    icon: ShoppingBag,
    badge: "AI Bot",
  },
  {
    label: "Automation Rules",
    href: "/rules",
    icon: MessageSquareCode,
    badge: "Live",
  },
  {
    label: "Post Studio",
    href: "/posts",
    icon: CalendarDays,
    badge: null,
  },
  {
    label: "Live Activity Logs",
    href: "/logs",
    icon: Activity,
    badge: "Live",
  },
  {
    label: "Settings & Database",
    href: "/settings",
    icon: Settings,
    badge: null,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const activePage = useAppStore((state) => state.activePage);
  const setConnectModalOpen = useAppStore((state) => state.setConnectModalOpen);

  return (
    <aside className="w-64 border-r border-white/10 bg-slate-950/80 backdrop-blur-2xl flex flex-col h-screen sticky top-0 shrink-0 z-30">
      {/* Brand & App Title */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-glow">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              AutoPage <span className="text-[10px] text-blue-400 font-mono font-normal">v21.0</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Meta Automation Engine</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider uppercase text-slate-400 font-mono">
          Platform
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-blue-600/10 text-white border border-blue-500/20 shadow-glow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-blue-400"
                      : "text-slate-400 group-hover:text-slate-300"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/20">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Current Active Tenant Mini Card & Add Page Button */}
      <div className="p-4 border-t border-white/5 space-y-3">
        {activePage ? (
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                Active Tenant
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> Live
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePage.pagePicture || "/placeholder-avatar.png"}
                alt={activePage.pageName}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500/30"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {activePage.pageName}
                </p>
                <p className="text-[10px] font-mono text-slate-400 truncate">
                  ID: {activePage.pageId}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
            <Globe className="w-4 h-4 shrink-0" />
            <span>No page selected yet.</span>
          </div>
        )}

        <button
          onClick={() => setConnectModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 hover:border-white/20 transition-all cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
          <span>Connect New Page</span>
        </button>
      </div>
    </aside>
  );
}
