"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Globe,
  ShoppingBag,
  Activity,
  Zap,
  Server,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Copy,
  Check,
  Crown,
  UserCheck,
  ExternalLink,
  Cpu,
  Clock,
  Radio,
  Sliders,
  DollarSign,
  MessageSquare,
  Bot,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Switch } from "@/components/common/Switch";
import { useAppStore } from "@/store/useAppStore";
import {
  IAdminStats,
  IAdminUserItem,
  IAdminPageItem,
  IOrder,
  IAutomationLog,
} from "@/types";

type AdminTab = "overview" | "users" | "pages" | "orders" | "logs";

export default function SuperAdminDashboardPage() {
  const showToast = useAppStore((state) => state.showToast);
  const currentUser = useAppStore((state) => state.currentUser);

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<IAdminStats | null>(null);
  const [users, setUsers] = useState<IAdminUserItem[]>([]);
  const [pages, setPages] = useState<IAdminPageItem[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [logs, setLogs] = useState<IAutomationLog[]>([]);

  // Loading states
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [pageSearch, setPageSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [logSearch, setLogSearch] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState<string>("all");
  const [logStatusFilter, setLogStatusFilter] = useState<string>("all");

  // Create User Modal state
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"merchant" | "admin">("merchant");
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Copied indicator for webhook URL
  const [hasCopiedUrl, setHasCopiedUrl] = useState(false);
  const [hasCopiedToken, setHasCopiedToken] = useState(false);

  // ==================== DATA FETCHING ====================

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      } else if (res.status === 403) {
        showToast("Super Admin privileges required.", "error");
      }
    } catch {
      showToast("Failed to fetch system stats.", "error");
    } finally {
      setIsLoadingStats(false);
    }
  }, [showToast]);

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      showToast("Failed to fetch users list.", "error");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [showToast]);

  const fetchPages = useCallback(async () => {
    setIsLoadingPages(true);
    try {
      const res = await fetch("/api/admin/pages");
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
      }
    } catch {
      showToast("Failed to fetch pages directory.", "error");
    } finally {
      setIsLoadingPages(false);
    }
  }, [showToast]);

  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      showToast("Failed to fetch orders.", "error");
    } finally {
      setIsLoadingOrders(false);
    }
  }, [showToast]);

  const fetchLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const params = new URLSearchParams();
      if (logTypeFilter !== "all") params.set("eventType", logTypeFilter);
      if (logStatusFilter !== "all") params.set("status", logStatusFilter);
      if (logSearch.trim()) params.set("search", logSearch.trim());
      params.set("limit", "100");

      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      showToast("Failed to fetch audit logs.", "error");
    } finally {
      setIsLoadingLogs(false);
    }
  }, [logTypeFilter, logStatusFilter, logSearch, showToast]);

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Tab switch effect
  useEffect(() => {
    if (activeTab === "overview") fetchStats();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "pages") fetchPages();
    if (activeTab === "orders") fetchOrders();
    if (activeTab === "logs") fetchLogs();
  }, [activeTab, fetchStats, fetchUsers, fetchPages, fetchOrders, fetchLogs]);

  // ==================== ACTIONS ====================

  // Emergency Pause
  const handleToggleEmergencyPause = async () => {
    if (!stats) return;
    const newStatus = !stats.emergencyPaused;
    setActionInProgress("pause");

    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "emergency_pause", paused: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setStats((prev) => (prev ? { ...prev, emergencyPaused: newStatus } : prev));
        showToast(data.message, newStatus ? "error" : "success");
      } else {
        showToast(data.error || "Failed to update emergency pause.", "error");
      }
    } catch {
      showToast("Network error executing emergency toggle.", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Test Database Connection
  const handleTestDatabase = async () => {
    setActionInProgress("test_db");
    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_db" }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        fetchStats();
      } else {
        showToast(data.error || "Database test failed.", "error");
      }
    } catch {
      showToast("Failed to ping database.", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Trigger Cron Worker
  const handleTriggerCron = async () => {
    setActionInProgress("cron");
    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger_cron" }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        fetchStats();
      } else {
        showToast(data.error || "Cron trigger failed.", "error");
      }
    } catch {
      showToast("Failed to trigger cron worker.", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Test Webhook Simulation
  const handleTestWebhook = async () => {
    setActionInProgress("test_webhook");
    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_webhook",
          message: "Test ping from Super Admin Console at " + new Date().toLocaleTimeString(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        fetchStats();
        if (activeTab === "logs") fetchLogs();
      } else {
        showToast(data.error || "Test webhook simulation failed.", "error");
      }
    } catch {
      showToast("Failed to simulate webhook event.", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Create User Form Submit
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) {
      showToast("All fields are required.", "error");
      return;
    }

    setIsSubmittingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role: newUserRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("User account created successfully!", "success");
        setIsCreateUserModalOpen(false);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("merchant");
        fetchUsers();
        fetchStats();
      } else {
        showToast(data.error || "Failed to create user.", "error");
      }
    } catch {
      showToast("Network error creating user.", "error");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Change User Role
  const handleToggleUserRole = async (user: IAdminUserItem) => {
    const targetRole = user.role === "admin" ? "merchant" : "admin";
    try {
      const res = await fetch(`/api/admin/users/${user._id || user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Role changed to ${targetRole.toUpperCase()}`, "success");
        fetchUsers();
        fetchStats();
      } else {
        showToast(data.error || "Failed to update role.", "error");
      }
    } catch {
      showToast("Network error updating role.", "error");
    }
  };

  // Delete User
  const handleDeleteUser = async (user: IAdminUserItem) => {
    if (!confirm(`Are you sure you want to delete user "${user.name}" (${user.email})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user._id || user.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        showToast("User deleted successfully.", "success");
        fetchUsers();
        fetchStats();
      } else {
        showToast(data.error || "Failed to delete user.", "error");
      }
    } catch {
      showToast("Network error deleting user.", "error");
    }
  };

  // Toggle Page Automation
  const handleTogglePageAutomation = async (page: IAdminPageItem) => {
    const newStatus = !page.autoReplyEnabled;
    try {
      const res = await fetch(`/api/admin/pages/${page.pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoReplyEnabled: newStatus }),
      });
      if (res.ok) {
        showToast(
          `Page automation ${newStatus ? "Activated" : "Paused"} for ${page.pageName}`,
          "success"
        );
        fetchPages();
        fetchStats();
      } else {
        showToast("Failed to update page automation state.", "error");
      }
    } catch {
      showToast("Network error updating page.", "error");
    }
  };

  // Re-subscribe Page Webhook
  const handleResubscribeWebhook = async (page: IAdminPageItem) => {
    setActionInProgress(`resub_${page.pageId}`);
    try {
      const res = await fetch(`/api/admin/pages/${page.pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resubscribe" }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        fetchPages();
        fetchStats();
      } else {
        showToast(data.error || "Failed to re-subscribe webhook.", "error");
      }
    } catch {
      showToast("Network error during webhook re-subscription.", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Disconnect Page
  const handleDeletePage = async (page: IAdminPageItem) => {
    if (
      !confirm(
        `Are you sure you want to forcibly disconnect page "${page.pageName}" (ID: ${page.pageId})?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/pages/${page.pageId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Page disconnected successfully.", "success");
        fetchPages();
        fetchStats();
      } else {
        showToast("Failed to disconnect page.", "error");
      }
    } catch {
      showToast("Network error disconnecting page.", "error");
    }
  };

  // Clear All Logs
  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to clear ALL automation activity logs? This action is irreversible.")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/logs", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        fetchLogs();
        fetchStats();
      } else {
        showToast(data.error || "Failed to clear logs.", "error");
      }
    } catch {
      showToast("Network error clearing logs.", "error");
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, type: "url" | "token") => {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setHasCopiedUrl(true);
      setTimeout(() => setHasCopiedUrl(false), 2500);
    } else {
      setHasCopiedToken(true);
      setTimeout(() => setHasCopiedToken(false), 2500);
    }
    showToast("Copied to clipboard!", "info");
  };

  // Filtered Lists
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole =
      userRoleFilter === "all" || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredPages = pages.filter((p) => {
    return (
      p.pageName.toLowerCase().includes(pageSearch.toLowerCase()) ||
      p.pageId.includes(pageSearch) ||
      (p.ownerName && p.ownerName.toLowerCase().includes(pageSearch.toLowerCase())) ||
      (p.ownerEmail && p.ownerEmail.toLowerCase().includes(pageSearch.toLowerCase()))
    );
  });

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerPhone.includes(orderSearch) ||
      o.productName.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus =
      orderStatusFilter === "all" || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ==================== SUPER ADMIN HERO HEADER ==================== */}
      <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-indigo-500/30 relative overflow-hidden bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-blue-950/20 shadow-[0_0_35px_rgba(99,102,241,0.15)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-[1px] shadow-[0_0_20px_rgba(168,85,247,0.35)] shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-300" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Super Admin Control Center
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-[11px] font-bold tracking-wider uppercase">
                  Owner Level
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Centralized multi-tenant command & control for all merchants, Facebook pages, webhooks, and orders.
              </p>
            </div>
          </div>

          {/* Emergency Killswitch & Platform Pulse */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    stats?.emergencyPaused
                      ? "bg-rose-500 animate-ping"
                      : "bg-emerald-400 animate-pulse"
                  }`}
                />
                <span className="text-xs font-semibold text-white">
                  {stats?.emergencyPaused ? "Platform Suspended" : "System All-Systems-Go"}
                </span>
              </div>
              <Button
                variant={stats?.emergencyPaused ? "primary" : "danger"}
                size="sm"
                isLoading={actionInProgress === "pause"}
                onClick={handleToggleEmergencyPause}
                className="text-xs font-bold"
              >
                {stats?.emergencyPaused ? "Resume Automations" : "Emergency Killswitch"}
              </Button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchStats}
              disabled={isLoadingStats}
              icon={
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoadingStats ? "animate-spin text-blue-400" : ""}`}
                />
              }
            >
              Sync
            </Button>
          </div>
        </div>

        {/* Diagnostic Meta Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-5 text-slate-400">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span>DB:</span>
              <span className="text-white font-medium">
                {stats?.databaseStatus.mode === "mongodb"
                  ? "MongoDB Atlas Cloud"
                  : "Local JSON Persistent"}
              </span>
              <span className="text-emerald-400">({stats?.databaseStatus.pingMs || 0}ms)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              <span>Meta API:</span>
              <span className="text-white font-medium">v21.0 Webhook Active</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Uptime:</span>
              <span className="text-white font-medium">
                {Math.floor((stats?.systemUptime || 0) / 60)} min
              </span>
            </div>
          </div>

          <div className="text-slate-400">
            Logged in as:{" "}
            <span className="text-indigo-300 font-semibold">
              {currentUser?.name || "Super Admin"} ({currentUser?.email || "admin@autopage.io"})
            </span>
          </div>
        </div>
      </div>

      {/* ==================== ADMIN TABS NAVIGATION ==================== */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "overview"
              ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Zap className="w-4 h-4 text-indigo-400" />
          <span>System Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "users"
              ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Merchants & Users</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">
            {stats?.totalUsers || users.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("pages")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "pages"
              ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>All Facebook Pages</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">
            {stats?.totalPages || pages.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "orders"
              ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          <span>Commerce Orders</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">
            {stats?.totalOrders || orders.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "logs"
              ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Activity className="w-4 h-4 text-pink-400" />
          <span>Global Audit Logs</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">
            {stats?.todayLogs || 0} today
          </span>
        </button>
      </div>

      {/* ==================== TAB 1: SYSTEM OVERVIEW ==================== */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card glow className="border-indigo-500/20">
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase font-mono tracking-wider">
                    Total Revenue / GMV
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                    ৳{(stats?.totalGmv || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-mono text-emerald-400">BDT</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  From {stats?.totalOrders || 0} automated Messenger & manual orders
                </p>
              </CardContent>
            </Card>

            <Card glow className="border-blue-500/20">
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase font-mono tracking-wider">
                    Platform Tenants
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                    {stats?.totalUsers || 0}
                  </span>
                  <span className="text-xs font-mono text-slate-400">accounts</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {stats?.totalMerchants || 0} Merchants · {stats?.totalAdmins || 0} Super Admins
                </p>
              </CardContent>
            </Card>

            <Card glow className="border-emerald-500/20">
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase font-mono tracking-wider">
                    Connected Pages
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Globe className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                    {stats?.totalPages || 0}
                  </span>
                  <span className="text-xs font-mono text-emerald-400">
                    ({stats?.totalActivePages || 0} active)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {stats?.totalWebhookSubscribed || 0} verified webhook subscriptions
                </p>
              </CardContent>
            </Card>

            <Card glow className="border-purple-500/20">
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase font-mono tracking-wider">
                    Automation Events
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                    {stats?.totalLogs || 0}
                  </span>
                  <span className="text-xs font-mono text-indigo-400">
                    (+{stats?.todayLogs || 0} today)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Total comments, DMs & AI sales conversions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Diagnostic Actions & Meta Configuration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health Diagnostics */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    Interactive Diagnostic Control
                  </CardTitle>
                  <CardDescription>
                    Trigger immediate health checks and verify automated workers.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-white">MongoDB Cloud Cluster</h4>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {stats?.databaseStatus.uriMasked || "mongodb+srv://...cluster0"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    isLoading={actionInProgress === "test_db"}
                    onClick={handleTestDatabase}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Ping Database
                  </Button>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Simulate Webhook Event</h4>
                    <p className="text-[11px] text-slate-400">
                      Dispatches a synthetic customer message through the automation pipeline.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    isLoading={actionInProgress === "test_webhook"}
                    onClick={handleTestWebhook}
                    icon={<Bot className="w-3.5 h-3.5 text-blue-400" />}
                  >
                    Test Pipeline
                  </Button>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Manual Cron Worker Run</h4>
                    <p className="text-[11px] text-slate-400">
                      Instantly publish due posts from the scheduled queue.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    isLoading={actionInProgress === "cron"}
                    onClick={handleTriggerCron}
                    icon={<Play className="w-3.5 h-3.5 text-emerald-400" />}
                  >
                    Execute Worker
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Meta Webhook Reference */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-blue-400" />
                    Meta App Webhook Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure these parameters in Meta Developer Portal (App Dashboard → Webhooks).
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-slate-400">
                    Callback URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={
                        typeof window !== "undefined"
                          ? `${window.location.origin}/api/webhook`
                          : "http://localhost:3000/api/webhook"
                      }
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-slate-300"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        copyToClipboard(
                          `${window.location.origin}/api/webhook`,
                          "url"
                        )
                      }
                      icon={
                        hasCopiedUrl ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      {hasCopiedUrl ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-slate-400">
                    Verify Token (hub.verify_token)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={stats?.metaStatus.verifyToken || "fb_auto_verify_token_secure_2025"}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-slate-300"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        copyToClipboard(
                          stats?.metaStatus.verifyToken || "fb_auto_verify_token_secure_2025",
                          "token"
                        )
                      }
                      icon={
                        hasCopiedToken ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      {hasCopiedToken ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Subscribed Fields:</p>
                    <p className="font-mono text-[11px] text-blue-200">
                      feed, messages, messaging_postbacks
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: USERS & MERCHANTS ==================== */}
      {activeTab === "users" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Merchants & System Users
              </h2>
              <p className="text-xs text-slate-400">
                Manage registered tenant accounts, promote users to Super Admin, or delete users.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateUserModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add New User
              </Button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white"
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl glass-input text-xs text-slate-200 w-full sm:w-auto"
            >
              <option value="all">All Roles</option>
              <option value="admin">Super Admin Only</option>
              <option value="merchant">Merchant Only</option>
            </select>
          </div>

          {/* Users Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] border-b border-white/5 text-[11px] font-mono uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Connected Pages</th>
                    <th className="px-6 py-4">Joined Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                        Loading registered users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        No users found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isAdmin = u.role === "admin";
                      const isSelf = u.email === currentUser?.email || u._id === currentUser?.userId;

                      return (
                        <tr key={u._id || u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isAdmin
                                    ? "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-glow"
                                    : "bg-white/10 text-slate-200"
                                }`}
                              >
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-white flex items-center gap-1.5">
                                  {u.name}
                                  {isSelf && (
                                    <span className="text-[10px] text-indigo-400 font-mono">(You)</span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {isAdmin ? (
                              <Badge variant="purple">
                                <Crown className="w-3 h-3 text-amber-300" /> Super Admin
                              </Badge>
                            ) : (
                              <Badge variant="neutral">Merchant</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-300">
                            {u.connectedPagesCount} {u.connectedPagesCount === 1 ? "page" : "pages"}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-400">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Active"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isSelf && (
                                <button
                                  onClick={() => handleToggleUserRole(u)}
                                  title={
                                    isAdmin
                                      ? "Demote to Merchant"
                                      : "Promote to Super Admin"
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-semibold transition-all cursor-pointer"
                                >
                                  {isAdmin ? "Demote" : "Promote to Admin"}
                                </button>
                              )}

                              {!isSelf && u.email !== "admin@autopage.io" && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  title="Delete User"
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ==================== TAB 3: ALL FACEBOOK PAGES ==================== */}
      {activeTab === "pages" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Global Facebook Pages Directory
              </h2>
              <p className="text-xs text-slate-400">
                Complete overview of every page connected across all merchants in the platform.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter pages by name, ID or owner..."
                value={pageSearch}
                onChange={(e) => setPageSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoadingPages ? (
              <div className="col-span-full p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                Loading connected Facebook pages...
              </div>
            ) : filteredPages.length === 0 ? (
              <div className="col-span-full p-12 text-center text-slate-400">
                No connected pages found.
              </div>
            ) : (
              filteredPages.map((page) => (
                <Card key={page.pageId} className="space-y-4 p-5 border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={page.pagePicture || "/placeholder-avatar.png"}
                        alt={page.pageName}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white truncate max-w-[180px]">
                          {page.pageName}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-400">ID: {page.pageId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {page.isWebhookSubscribed ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Webhook Subscribed" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" title="Webhook Pending" />
                      )}
                    </div>
                  </div>

                  {/* Tenant Owner info */}
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Owner / Tenant:</span>
                      <span className="text-white font-medium">{page.ownerName || "Merchant"}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Email:</span>
                      <span className="font-mono text-slate-300 truncate max-w-[160px]">{page.ownerEmail || "N/A"}</span>
                    </div>
                  </div>

                  {/* Stats Mini Row */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                      <span className="text-slate-400 block text-[10px]">Rules</span>
                      <span className="text-white font-bold">{page.rules?.length || 0}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                      <span className="text-slate-400 block text-[10px]">Orders</span>
                      <span className="text-emerald-400 font-bold">{page.ordersCount || 0}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                      <span className="text-slate-400 block text-[10px]">Status</span>
                      <span className={page.autoReplyEnabled ? "text-emerald-400 font-bold" : "text-slate-400 font-bold"}>
                        {page.autoReplyEnabled ? "Active" : "Paused"}
                      </span>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        size="sm"
                        checked={page.autoReplyEnabled}
                        onChange={() => handleTogglePageAutomation(page)}
                      />
                      <span className="text-[11px] text-slate-300">
                        {page.autoReplyEnabled ? "Running" : "Paused"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        isLoading={actionInProgress === `resub_${page.pageId}`}
                        onClick={() => handleResubscribeWebhook(page)}
                        className="text-[11px] px-2 py-1"
                        title="Force re-subscribe webhook with Meta"
                      >
                        Re-sub
                      </Button>
                      <button
                        onClick={() => handleDeletePage(page)}
                        title="Force disconnect page"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: COMMERCE ORDERS ==================== */}
      {activeTab === "orders" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                All Platform Orders
              </h2>
              <p className="text-xs text-slate-400">
                Live commercial transactions generated via the automated Messenger AI Sales engine.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search orders, phone, customer..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl glass-input text-xs text-slate-200 w-full sm:w-auto"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] border-b border-white/5 text-[11px] font-mono uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Order #</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoadingOrders ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                        Loading platform orders...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        No orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order._id || order.orderNumber} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-white">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-white">{order.customerName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{order.customerPhone}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{order.customerAddress}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-200">{order.productName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">Qty: {order.quantity}</p>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-emerald-400">
                          ৳{order.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px]">
                          {order.source === "messenger_auto" ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20">
                              Messenger Bot
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-300">
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              order.status === "confirmed"
                                ? "success"
                                : order.status === "shipped"
                                ? "info"
                                : order.status === "pending"
                                ? "warning"
                                : "danger"
                            }
                          >
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-400 text-[11px]">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Just now"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ==================== TAB 5: GLOBAL AUDIT LOGS ==================== */}
      {activeTab === "logs" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Global Automation Audit Logs
              </h2>
              <p className="text-xs text-slate-400">
                Real-time event stream of comments, Messenger DMs, AI bot replies, and webhook receipts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="danger"
                size="sm"
                onClick={handleClearLogs}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Clear All Logs
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchLogs}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? "animate-spin text-blue-400" : ""}`} />}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search logs by customer message, reply, event ID..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white"
              />
            </div>

            <select
              value={logTypeFilter}
              onChange={(e) => setLogTypeFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl glass-input text-xs text-slate-200 w-full sm:w-auto"
            >
              <option value="all">All Event Types</option>
              <option value="comment">Comments</option>
              <option value="message">Messenger DMs</option>
              <option value="order">Orders Placed</option>
              <option value="stock_inquiry">Stock Inquiries</option>
              <option value="ai_reply">AI Sales Replies</option>
            </select>

            <select
              value={logStatusFilter}
              onChange={(e) => setLogStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl glass-input text-xs text-slate-200 w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="duplicate">Duplicate Ignored</option>
            </select>
          </div>

          {/* Logs Stream */}
          <Card>
            <div className="divide-y divide-white/5">
              {isLoadingLogs ? (
                <div className="p-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                  Streaming live audit events...
                </div>
              ) : logs.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  No automation activity recorded matching your filters.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log._id || log.eventId} className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            log.status === "success"
                              ? "success"
                              : log.status === "failed"
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                        >
                          {log.eventType}
                        </Badge>
                        <span className="font-semibold text-white">
                          {log.senderName || "Customer"}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          (Page ID: {log.pageId})
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                        <span>Handled by: <span className="text-indigo-300 font-semibold">{log.handledBy}</span></span>
                        <span>{log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : "Just now"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-slate-400">Customer Input:</span>
                        <p className="text-slate-200">{log.inputMessage || "(Empty payload)"}</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-emerald-400">Automated Dispatch:</span>
                        <p className="text-slate-200">{log.replyMessage || "(No reply dispatched)"}</p>
                      </div>
                    </div>

                    {log.error && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
                        Error Trace: {log.error}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ==================== CREATE USER MODAL ==================== */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-3xl glass-panel border border-indigo-500/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white tracking-tight">Create New User Account</h3>
              </div>
              <button
                onClick={() => setIsCreateUserModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Niyamul Hasan"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-slate-400">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-slate-400">Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-slate-400">Role Privilege</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as "merchant" | "admin")}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-white"
                >
                  <option value="merchant">🏬 Merchant (Standard Store Owner)</option>
                  <option value="admin">👑 Super Admin (Full System Control)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateUserModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmittingUser}
                >
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
