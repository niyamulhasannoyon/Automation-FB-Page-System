"use client";

import React, { useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ConnectPageModal } from "@/components/dashboard/ConnectPageModal";
import { RuleDrawer } from "@/components/rules/RuleDrawer";
import { Toast } from "@/components/common/Toast";
import { useAppStore } from "@/store/useAppStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetchPages = useAppStore((state) => state.fetchPages);
  const fetchCurrentUser = useAppStore((state) => state.fetchCurrentUser);

  useEffect(() => {
    fetchPages();
    fetchCurrentUser();
  }, [fetchPages, fetchCurrentUser]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-200">
          {children}
        </main>
      </div>

      {/* Modals & Floating Notifications */}
      <ConnectPageModal />
      <RuleDrawer />
      <Toast />
    </div>
  );
}
