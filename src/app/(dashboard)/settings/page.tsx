"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import {
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Radio,
  ExternalLink,
  Trash2,
  Server,
  Key,
  Database,
  RefreshCw,
  Sparkles,
  Bot,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";

interface DatabaseStatus {
  isConnected: boolean;
  mode: "mongodb_active" | "local_persistent_store";
  location: string;
  currentUri: string;
  rawUriHint: string;
}

interface AiSalesmanStatus {
  hasGeminiKey: boolean;
  activeEngine: string;
}

export default function SettingsPage() {
  const activePage = useAppStore((state) => state.activePage);
  const removePage = useAppStore((state) => state.removePage);
  const showToast = useAppStore((state) => state.showToast);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Database Connection Manager State
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [aiStatus, setAiStatus] = useState<AiSalesmanStatus | null>(null);
  const [customUriInput, setCustomUriInput] = useState("");
  const [testingDb, setTestingDb] = useState(false);
  const [reconnectingDb, setReconnectingDb] = useState(false);
  const [applyingDb, setApplyingDb] = useState(false);
  const [dbOperationResult, setDbOperationResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  // AI Test prompt state
  const [aiTestPrompt, setAiTestPrompt] = useState("পাঞ্জাবি অর্ডার করব কিভাবে?");
  const [aiTestResult, setAiTestResult] = useState<string | null>(null);
  const [aiTesting, setAiTesting] = useState(false);

  // Token Management & Permanent Token Upgrade State
  const updatePageToken = useAppStore((state) => state.updatePageToken);
  const [showTokenUpdater, setShowTokenUpdater] = useState(false);
  const [newTokenInput, setNewTokenInput] = useState("");
  const [updatingToken, setUpdatingToken] = useState(false);
  const [inspectingNewToken, setInspectingNewToken] = useState(false);
  const [tokenInspection, setTokenInspection] = useState<{
    inspection: any;
    canAutoUpgrade: boolean;
    missingCrucialScopes: string[];
    recommendation: string;
    isPermanent: boolean;
    tokenType: string;
  } | null>(null);
  const [showSystemUserGuide, setShowSystemUserGuide] = useState(false);

  const handleInspectNewToken = async (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || trimmed.length < 15 || !activePage) {
      setTokenInspection(null);
      return;
    }
    setInspectingNewToken(true);
    try {
      const res = await fetch("/api/pages/token-inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: trimmed, pageId: activePage.pageId }),
      });
      const data = await res.json();
      if (res.ok && data.inspection) {
        setTokenInspection(data);
      }
    } catch {
      // ignore
    } finally {
      setInspectingNewToken(false);
    }
  };

  const handleApplyNewToken = async () => {
    if (!newTokenInput.trim() || !activePage) return;
    setUpdatingToken(true);
    try {
      const res = await updatePageToken(activePage.pageId, newTokenInput.trim());
      if (res.success) {
        setNewTokenInput("");
        setTokenInspection(null);
        setShowTokenUpdater(false);
      }
    } finally {
      setUpdatingToken(false);
    }
  };

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const webhookUrl = `${appUrl}/api/webhook`;
  const verifyToken =
    process.env.NEXT_PUBLIC_META_WEBHOOK_VERIFY_TOKEN ||
    "my_secret_token_9x7k2p8q1m4_safe";

  // Load Database & AI Status
  const loadDatabaseStatus = async () => {
    try {
      const res = await fetch("/api/settings/database");
      const data = await res.json();
      if (res.ok) {
        setDbStatus(data.database);
        setAiStatus(data.aiSalesman);
      }
    } catch (err) {
      console.error("Error loading database settings:", err);
    }
  };

  useEffect(() => {
    loadDatabaseStatus();
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`Copied ${field} to clipboard!`, "info");
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Test Reconnect Database
  const handleTestDatabaseReconnect = async () => {
    setReconnectingDb(true);
    setDbOperationResult(null);

    try {
      const res = await fetch("/api/settings/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reconnect" }),
      });
      const data = await res.json();

      setDbOperationResult({
        success: data.success,
        message: data.message,
      });

      if (data.database) {
        setDbStatus(data.database);
      }

      if (data.success) {
        showToast("Connected to MongoDB successfully!", "success");
      } else {
        showToast(
          "MongoDB offline. Local JSON fallback active (.data/db.json).",
          "info"
        );
      }
    } catch (err: unknown) {
      const error = err as Error;
      setDbOperationResult({
        success: false,
        message: "Failed to run database test: " + error.message,
      });
      showToast(error.message, "error");
    } finally {
      setReconnectingDb(false);
    }
  };

  // Test custom URI without applying
  const handleTestCustomUri = async () => {
    if (!customUriInput.trim()) {
      showToast("Please enter a MongoDB connection string to test.", "info");
      return;
    }

    setTestingDb(true);
    setDbOperationResult(null);

    try {
      const res = await fetch("/api/settings/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          uri: customUriInput.trim(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        setDbOperationResult({
          success: true,
          message: `Connection successful! Ping latency: ${data.latencyMs}ms. Ready to apply.`,
          latencyMs: data.latencyMs,
        });
        showToast(`MongoDB reachable (${data.latencyMs}ms)!`, "success");
      } else {
        setDbOperationResult({
          success: false,
          message: `Connection test failed: ${data.error || "Server unreachable"}`,
        });
        showToast("Connection failed to specified URI", "error");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setDbOperationResult({
        success: false,
        message: "Network error during test: " + error.message,
      });
    } finally {
      setTestingDb(false);
    }
  };

  // Apply new custom URI
  const handleApplyCustomUri = async () => {
    if (!customUriInput.trim()) {
      showToast("Please enter a MongoDB connection string to apply.", "info");
      return;
    }

    setApplyingDb(true);
    setDbOperationResult(null);

    try {
      const res = await fetch("/api/settings/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply",
          uri: customUriInput.trim(),
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDbOperationResult({
          success: true,
          message: `${data.message} Latency: ${data.latencyMs}ms.`,
          latencyMs: data.latencyMs,
        });
        if (data.database) {
          setDbStatus(data.database);
        }
        setCustomUriInput("");
        showToast("MongoDB connection updated successfully!", "success");
      } else {
        setDbOperationResult({
          success: false,
          message: `Failed to apply URI: ${data.error || "Connection error"}`,
        });
        showToast(data.error || "Failed to switch MongoDB URI", "error");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setDbOperationResult({
        success: false,
        message: "Error applying URI: " + error.message,
      });
    } finally {
      setApplyingDb(false);
    }
  };

  // Test AI Salesman Prompt
  const handleTestAiSalesman = async () => {
    if (!aiTestPrompt.trim() || !activePage) return;
    setAiTesting(true);
    setAiTestResult(null);

    try {
      const res = await fetch("/api/orders/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: activePage.pageId,
          message: aiTestPrompt.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiTestResult(data.reply);
      } else {
        setAiTestResult("Error: " + (data.error || "Simulation failed"));
      }
    } catch (err: unknown) {
      const error = err as Error;
      setAiTestResult("Error: " + error.message);
    } finally {
      setAiTesting(false);
    }
  };

  const handleTestWebhookChallenge = async () => {
    setTestingWebhook(true);
    setTestResult(null);

    try {
      const challenge = "test_challenge_" + Math.floor(Math.random() * 100000);
      const res = await fetch(
        `/api/webhook?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(
          verifyToken
        )}&hub.challenge=${challenge}`
      );
      const text = await res.text();

      if (res.ok && text === challenge) {
        setTestResult(
          `Webhook verification handshake successful! Challenge echoed: "${text}"`
        );
        showToast("Webhook endpoint verified successfully!", "success");
      } else {
        setTestResult(
          `Handshake returned unexpected response (HTTP ${res.status}): ${text}`
        );
        showToast("Webhook test failed.", "error");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setTestResult(`Test failed: ${error.message}`);
      showToast(error.message, "error");
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleDeletePage = async () => {
    if (!activePage) return;
    const confirmed = window.confirm(
      `Are you sure you want to disconnect "${activePage.pageName}"? This will remove all keyword rules, inventory, and scheduled posts for this page.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    await removePage(activePage.pageId);
    setIsDeleting(false);
  };

  if (!activePage) {
    return (
      <div className="p-12 text-center rounded-2xl glass-panel border border-white/10">
        <Server className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Page Selected</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Please select a connected Facebook page from the header to inspect its configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          System Settings & Database Manager
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage live MongoDB connection pool, AI salesman configuration, and Meta Graph API webhooks
        </p>
      </div>

      {/* ======================================================== */}
      {/* 1. LIVE MONGODB CONNECTION MANAGER CARD                 */}
      {/* ======================================================== */}
      <Card className="border-indigo-500/20 bg-gradient-to-r from-indigo-950/20 via-slate-900/30 to-slate-950/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Live Database & Storage Engine</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Mongoose connection pool with automatic local fallback engine
              </p>
            </div>
          </div>

          <Badge
            variant={dbStatus?.isConnected ? "success" : "warning"}
          >
            {dbStatus?.isConnected
              ? "MongoDB Live Connected"
              : "Local JSON Fallback (.data/db.json)"}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Connection Status Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Storage Engine Mode
              </span>
              <p className="text-xs font-semibold text-white mt-1 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    dbStatus?.isConnected ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                <span>
                  {dbStatus?.isConnected
                    ? "MongoDB Active"
                    : "Local Persistent File"}
                </span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 sm:col-span-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Active Storage Location
              </span>
              <p className="text-xs font-mono text-cyan-300 mt-1 truncate">
                {dbStatus?.location || "Checking connection..."}
              </p>
            </div>
          </div>

          {/* Current Masked URI & Test Reconnect Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-300">
                Active Connection URI
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {dbStatus?.rawUriHint || ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={dbStatus?.currentUri || "mongodb://127.0.0.1:27017/fb_page_automation"}
                className="flex-1 px-3.5 py-2 rounded-xl glass-input text-xs font-mono text-slate-300 select-all"
              />
              <Button
                size="sm"
                variant="outline"
                isLoading={reconnectingDb}
                onClick={handleTestDatabaseReconnect}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Test Database Reconnect
              </Button>
            </div>
          </div>

          {/* Switch or Test Custom MongoDB URI */}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-white">
                Switch or Test New MongoDB URI
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Paste your MongoDB Atlas (mongodb+srv://...) or local connection string to test and switch live without server restart
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="mongodb+srv://username:password@cluster.mongodb.net/dbname"
                value={customUriInput}
                onChange={(e) => setCustomUriInput(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl glass-input text-xs font-mono text-white placeholder:text-slate-600"
              />
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  isLoading={testingDb}
                  onClick={handleTestCustomUri}
                >
                  Test Connection
                </Button>
                <Button
                  size="sm"
                  isLoading={applyingDb}
                  onClick={handleApplyCustomUri}
                >
                  Apply & Reconnect
                </Button>
              </div>
            </div>

            {/* Test or Apply Result Banner */}
            {dbOperationResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2.5 ${
                  dbOperationResult.success
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                }`}
              >
                {dbOperationResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{dbOperationResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* 2. AI SMART SALESMAN CONFIGURATION CARD                 */}
      {/* ======================================================== */}
      <Card className="border-blue-500/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>AI Smart Salesman Engine</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Google Gemini API integration with smart Bengali conversational parser
              </p>
            </div>
          </div>

          <Badge variant={aiStatus?.hasGeminiKey ? "success" : "purple"}>
            {aiStatus?.hasGeminiKey
              ? "Gemini API Active"
              : "Smart Bengali Simulator Active"}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">
              Active Salesman Model
            </span>
            <p className="text-xs font-semibold text-white">
              {aiStatus?.activeEngine || "Google Gemini 1.5 Flash"}
            </p>
            <p className="text-[11px] text-slate-400">
              {aiStatus?.hasGeminiKey
                ? "Configured via GEMINI_API_KEY in environment variables."
                : "No GEMINI_API_KEY detected in env. Using high-performance Bengali/Banglish contextual sales engine."}
            </p>
          </div>

          {/* Quick AI Test Prompt */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-semibold text-slate-300">
              Test AI Salesman Response
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiTestPrompt}
                onChange={(e) => setAiTestPrompt(e.target.value)}
                placeholder="Ask about store policy, product or delivery..."
                className="flex-1 px-3.5 py-2 rounded-xl glass-input text-xs text-white"
              />
              <Button
                size="sm"
                variant="outline"
                isLoading={aiTesting}
                onClick={handleTestAiSalesman}
                icon={<Sparkles className="w-3.5 h-3.5 text-blue-400" />}
              >
                Test AI
              </Button>
            </div>

            {aiTestResult && (
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                <span className="text-[10px] font-mono text-cyan-400 font-semibold block mb-1">
                  AI Salesman Output:
                </span>
                {aiTestResult}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* 3. WEBHOOK CONFIGURATION CARD (Meta Graph API)          */}
      {/* ======================================================== */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Meta Webhook Connection Details</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure these in your Facebook Developer App under Webhooks &gt; Page
              </p>
            </div>
          </div>

          <Badge
            variant={activePage.isWebhookSubscribed ? "success" : "warning"}
          >
            {activePage.isWebhookSubscribed ? "Subscribed" : "Pending Subscription"}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Callback URL */}
          <div>
            <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-300 mb-1.5">
              Callback URL (Must be publicly accessible or ngrok)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 px-3.5 py-2 rounded-xl glass-input text-xs font-mono text-slate-300 select-all"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleCopy(webhookUrl, "Callback URL")}
                icon={
                  copiedField === "Callback URL" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )
                }
              >
                Copy
              </Button>
            </div>
          </div>

          {/* Verify Token */}
          <div>
            <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-300 mb-1.5">
              Verify Token
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={verifyToken}
                className="flex-1 px-3.5 py-2 rounded-xl glass-input text-xs font-mono text-slate-300 select-all"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleCopy(verifyToken, "Verify Token")}
                icon={
                  copiedField === "Verify Token" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )
                }
              >
                Copy
              </Button>
            </div>
          </div>

          {/* Subscribed Fields */}
          <div>
            <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-300 mb-2">
              Required Webhook Fields
            </label>
            <div className="flex flex-wrap gap-2">
              {["feed", "messages", "messaging_postbacks"].map((field) => (
                <span
                  key={field}
                  className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-blue-300"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>

          {/* Test Challenge Button & Result */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white">
                  Test Webhook Verification Challenge
                </h4>
                <p className="text-[11px] text-slate-400">
                  Simulates Meta&apos;s GET verification handshake to ensure the endpoint responds properly
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                isLoading={testingWebhook}
                onClick={handleTestWebhookChallenge}
              >
                Simulate Meta Challenge
              </Button>
            </div>

            {testResult && (
              <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 font-mono text-xs text-slate-300">
                {testResult}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* 4. TOKEN HEALTH & PERMANENT ACCESS MANAGER               */}
      {/* ======================================================== */}
      <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-950/15 via-slate-900/30 to-slate-950/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Token Health & Permanent Access Manager</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Meta System User Permanent Token status, expiration monitoring, and token renewal
              </p>
            </div>
          </div>

          <Badge variant={activePage.isPermanent ? "success" : "warning"}>
            {activePage.isPermanent
              ? "Permanent (Never Expires) ♾️"
              : "Short-Lived Token ⚠️"}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Facebook Page ID
              </span>
              <p className="text-xs font-mono text-white mt-1">
                {activePage.pageId}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Token Type
              </span>
              <p className="text-xs font-semibold text-white mt-1 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    activePage.isPermanent ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                <span className="capitalize">
                  {activePage.tokenType === "system_user"
                    ? "System User Permanent"
                    : activePage.tokenType === "page_permanent"
                    ? "Page Access (Permanent)"
                    : activePage.tokenType === "demo"
                    ? "Simulated Permanent"
                    : activePage.isPermanent
                    ? "Permanent Token"
                    : "Short-Lived Token"}
                </span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Token Expiration
              </span>
              <p
                className={`text-xs font-mono mt-1 ${
                  activePage.isPermanent ? "text-emerald-300" : "text-amber-300"
                }`}
              >
                {activePage.isPermanent
                  ? "Never Expires (Permanent)"
                  : activePage.tokenExpiresAt
                  ? new Date(activePage.tokenExpiresAt).toLocaleDateString()
                  : "Expires in ~1-2 Hours"}
              </p>
            </div>
          </div>

          {/* Scopes & Permissions */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                Granted Automation Scopes
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Required for 24/7 Comments & Messenger
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "pages_read_engagement",
                "pages_manage_posts",
                "pages_messaging",
              ].map((scope) => {
                const hasScope =
                  activePage.tokenScopes && activePage.tokenScopes.length > 0
                    ? activePage.tokenScopes.includes(scope)
                    : true;
                return (
                  <span
                    key={scope}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 ${
                      hasScope
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                        : "bg-white/5 border border-white/10 text-slate-400"
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{scope}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Action to Update / Upgrade Token */}
          <div className="pt-2 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white">
                  Renew or Upgrade Access Token
                </h4>
                <p className="text-[11px] text-slate-400">
                  Replace an expiring token with a Meta System User Permanent Token without disconnecting or losing data
                </p>
              </div>

              <Button
                size="sm"
                variant={showTokenUpdater ? "secondary" : "outline"}
                onClick={() => setShowTokenUpdater(!showTokenUpdater)}
                icon={<Key className="w-3.5 h-3.5 text-emerald-400" />}
              >
                {showTokenUpdater ? "Cancel" : "Update / Upgrade Token"}
              </Button>
            </div>

            {/* Token Updater Form */}
            {showTokenUpdater && (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3 animate-in fade-in duration-200">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      New Permanent Token (System User / Long-Lived)
                    </label>
                    {inspectingNewToken && (
                      <span className="text-[10px] text-cyan-400 font-mono animate-pulse">
                        Testing token with Meta...
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={newTokenInput}
                    onChange={(e) => {
                      setNewTokenInput(e.target.value);
                      handleInspectNewToken(e.target.value);
                    }}
                    placeholder="Paste your System User Permanent Token (EAA...)"
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono text-white placeholder:text-slate-600 resize-none"
                  />
                </div>

                {tokenInspection && (
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      tokenInspection.isPermanent
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                    }`}
                  >
                    <p className="font-semibold flex items-center gap-1.5">
                      {tokenInspection.isPermanent ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span>
                        {tokenInspection.isPermanent
                          ? "Permanent Token Verified (Never Expires)"
                          : "Short-Lived Token (Auto-Upgrade Engine will convert to Permanent)"}
                      </span>
                    </p>
                    <p className="text-[11px] opacity-90">
                      {tokenInspection.recommendation}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSystemUserGuide(!showSystemUserGuide)}
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <span>System User Token কীভাবে নেবেন?</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <Button
                    size="sm"
                    variant="primary"
                    isLoading={updatingToken}
                    onClick={handleApplyNewToken}
                    disabled={!newTokenInput.trim()}
                  >
                    Verify & Apply Permanent Token
                  </Button>
                </div>

                {/* Collapsible System User Guide */}
                {showSystemUserGuide && (
                  <div className="mt-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs text-slate-300">
                    <p className="font-semibold text-white">
                      Meta Business Suite থেকে Permanent Token নেওয়ার নিয়ম:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px]">
                      <li>
                        <a
                          href="https://business.facebook.com/settings/system-users"
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 underline"
                        >
                          Meta Business Settings &gt; System Users
                        </a>
                        -এ যান।
                      </li>
                      <li>
                        <strong>Add System User</strong> দিয়ে নাম দিন (e.g. AutoPage Bot) এবং Role দিন <strong>Admin</strong>।
                      </li>
                      <li>
                        <strong>Add Assets</strong> &gt; <em>Pages</em> থেকে আপনার ফেসবুক পেজ সিলেক্ট করে Full Control অন করুন।
                      </li>
                      <li>
                        <strong>Generate New Token</strong> চাপুন, App সিলেক্ট করুন এবং Token Expiration দিন <strong>&quot;Never&quot;</strong>।
                      </li>
                      <li>
                        Permissions: <code className="text-emerald-300">pages_read_engagement</code>, <code className="text-emerald-300">pages_manage_posts</code>, <code className="text-emerald-300">pages_messaging</code> সিলেক্ট করে টোকেন কপি করুন।
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* 5. DANGER ZONE: DISCONNECT PAGE                          */}
      {/* ======================================================== */}
      <Card className="border-rose-500/20 bg-rose-500/[0.02]">
        <CardHeader className="border-rose-500/10">
          <div>
            <CardTitle className="text-rose-400">Danger Zone</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Disconnect this page and erase all associated keyword automation rules and orders
            </p>
          </div>
        </CardHeader>

        <CardContent className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-white">
              Disconnect {activePage.pageName}
            </h4>
            <p className="text-[11px] text-slate-400">
              AutoPage will stop listening to incoming comments and Messenger webhooks for this page.
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            isLoading={isDeleting}
            onClick={handleDeletePage}
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Disconnect Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
