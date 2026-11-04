"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  X,
  Facebook,
  KeyRound,
  Hash,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Zap,
  Info,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { TokenInspectionResult } from "@/types";

export function ConnectPageModal() {
  const isOpen = useAppStore((state) => state.isConnectModalOpen);
  const setOpen = useAppStore((state) => state.setConnectModalOpen);
  const showToast = useAppStore((state) => state.showToast);
  const fetchPages = useAppStore((state) => state.fetchPages);
  const setActivePage = useAppStore((state) => state.setActivePage);

  const [activeTab, setActiveTab] = useState<"system_user" | "byot" | "oauth">(
    "system_user"
  );
  const [pageId, setPageId] = useState("");
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  // Live Token Inspector state
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<{
    inspection: TokenInspectionResult;
    canAutoUpgrade: boolean;
    missingCrucialScopes: string[];
    recommendation: string;
    isPermanent: boolean;
    tokenType: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPageId("");
      setPageAccessToken("");
      setInspectionResult(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, stepNumber: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepNumber);
    showToast(`Copied: ${text}`, "info");
    setTimeout(() => setCopiedStep(null), 2000);
  };

  // Inspect token in real-time
  const inspectCurrentToken = async (tokenToTest: string) => {
    const trimmed = tokenToTest.trim();
    if (!trimmed || trimmed.length < 15) {
      setInspectionResult(null);
      return;
    }

    setIsInspecting(true);
    try {
      const res = await fetch("/api/pages/token-inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: trimmed,
          pageId: pageId.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.inspection) {
        setInspectionResult(data);
      } else {
        setInspectionResult(null);
      }
    } catch (err) {
      console.warn("Live token inspection error:", err);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPageAccessToken(val);
    if (val.trim().length >= 25) {
      inspectCurrentToken(val);
    } else {
      setInspectionResult(null);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pageId.trim() || !pageAccessToken.trim()) {
      setError("Please provide both Facebook Page ID and Access Token.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/pages/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: pageId.trim(),
          pageAccessToken: pageAccessToken.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to connect Facebook Page.");
      }

      if (data.autoUpgraded) {
        showToast(
          `🎉 Connected "${data.page.pageName}"! Short-lived token was auto-upgraded to Permanent Page Access Token (Never Expires).`,
          "success"
        );
      } else if (data.isPermanent) {
        showToast(
          `🛡️ Connected "${data.page.pageName}" with Permanent System User Token (Never Expires)!`,
          "success"
        );
      } else {
        showToast(
          `Connected "${data.page.pageName}". Note: ${data.warning || "Token is short-lived."}`,
          "info"
        );
      }

      await fetchPages();
      setActivePage(data.page);
      setOpen(false);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message);
      showToast(errorObj.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateOAuthConnect = async () => {
    setError(null);
    setIsOAuthLoading(true);

    try {
      const res = await fetch("/api/auth/facebook", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "OAuth connection failed.");
      }

      showToast(
        `Connected "${data.page.pageName}" via Facebook OAuth (Permanent Token)!`,
        "success"
      );
      await fetchPages();
      setActivePage(data.page);
      setOpen(false);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message);
      showToast(errorObj.message, "error");
    } finally {
      setIsOAuthLoading(false);
    }
  };

  const handleQuickDemoFill = (type: "system_user" | "short_lived") => {
    setPageId("10928491829384");
    if (type === "system_user") {
      setPageAccessToken(`demo_system_user_permanent_token_${Date.now()}`);
    } else {
      setPageAccessToken(`demo_short_lived_token_${Date.now()}`);
    }
    setTimeout(() => {
      inspectCurrentToken(`demo_${type}_token`);
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel border border-white/15 shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Facebook className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Connect Facebook Page
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-semibold">
                  Permanent Token Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                System User Permanent Token বা Auto-Upgrade Long-Lived Token ব্যবহার করে নিরবচ্ছিন্ন অটোমেশন নিশ্চিত করুন
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1.5 mt-5 p-1 rounded-xl bg-white/[0.03] border border-white/10 text-center">
          <button
            type="button"
            onClick={() => setActiveTab("system_user")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "system_user"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="truncate">System User Token</span>
            <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-200">
              Never Expires
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("byot")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "byot"
                ? "bg-blue-600 text-white shadow-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="truncate">Auto-Upgrade BYOT</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("oauth")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "oauth"
                ? "bg-blue-600 text-white shadow-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Facebook className="w-3.5 h-3.5" />
            <span className="truncate">Facebook OAuth</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: SYSTEM USER PERMANENT TOKEN (RECOMMENDED)        */}
        {/* ======================================================== */}
        {activeTab === "system_user" && (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Meta System User Permanent Token — কেন এটি সেরা?
                </h4>
                <Badge variant="success">কখনো এক্সপায়ার হয় না</Badge>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Graph API Explorer এর সাধারণ টোকেন ১-২ ঘণ্টা পর বন্ধ হয়ে যায়। কিন্তু Meta Business Suite এর <strong>System User</strong> থেকে নেওয়া টোকেনে Expiration সেট করা যায় <strong>&quot;Never&quot;</strong>, যা আপনার ফেসবুক পেজে আজীবন নিরবচ্ছিন্ন অটো-কমেন্ট এবং ইনবক্স রিপ্লাই চালু রাখে।
              </p>
            </div>

            {/* Step-by-Step Guide Accordion */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3 text-xs text-slate-300">
              <h5 className="font-semibold text-white flex items-center gap-2">
                <span>System User Permanent Token নেওয়ার ৫টি সহজ ধাপ:</span>
                <a
                  href="https://business.facebook.com/settings/system-users"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 text-[11px] underline flex items-center gap-1 ml-auto"
                >
                  Open Meta Business Settings <ExternalLink className="w-3 h-3" />
                </a>
              </h5>

              <ol className="list-decimal list-inside space-y-2.5 text-slate-300">
                <li className="leading-relaxed">
                  <strong className="text-white">System User তৈরি করুন:</strong>{" "}
                  Meta Business Settings &gt; <em>Users</em> &gt; <em>System Users</em>-এ গিয়ে <strong>Add</strong> চাপুন। Role দিন <strong>Admin</strong>।
                </li>
                <li className="leading-relaxed">
                  <strong className="text-white">পেজের পারমিশন অ্যাসাইন করুন:</strong>{" "}
                  <strong>Add Assets</strong> &gt; <em>Pages</em> এ আপনার পেজ সিলেক্ট করে <strong>Full Control (Manage Page)</strong> অথবা Content & Messages অন করে Save Changes দিন।
                </li>
                <li className="leading-relaxed">
                  <strong className="text-white">টোকেন জেনারেট করুন:</strong>{" "}
                  <strong>Generate New Token</strong> চাপুন &gt; আপনার Meta App সিলেক্ট করুন &gt; Token Expiration দিন <strong>&quot;Never&quot;</strong>।
                </li>
                <li className="leading-relaxed">
                  <strong className="text-white">পারমিশন (Scopes) সিলেক্ট করুন:</strong>
                  <div className="mt-1 flex flex-wrap gap-1.5 font-mono text-[11px]">
                    {["pages_show_list", "pages_read_engagement", "pages_manage_posts", "pages_messaging"].map(
                      (scope, idx) => (
                        <button
                          key={scope}
                          type="button"
                          onClick={() => handleCopy(scope, idx + 10)}
                          className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 flex items-center gap-1 cursor-pointer"
                          title="Click to copy"
                        >
                          {copiedStep === idx + 10 ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 opacity-60" />
                          )}
                          <span>{scope}</span>
                        </button>
                      )
                    )}
                  </div>
                </li>
                <li className="leading-relaxed">
                  <strong className="text-white">টোকেন কপি করুন:</strong>{" "}
                  Generate Token এ ক্লিক করে প্রাপ্ত টোকেনটি নিচের ইনপুটে পেস্ট করুন।
                </li>
              </ol>
            </div>

            {/* Form */}
            <form onSubmit={handleConnect} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-300 mb-1.5">
                  Facebook Page ID
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. 10928491829384"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-300">
                    System User Permanent Token (Never Expires)
                  </label>
                  {isInspecting && (
                    <span className="text-[10px] text-cyan-400 font-mono animate-pulse flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-spin" /> Verifying token...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <textarea
                    rows={3}
                    placeholder="EAA... (Paste System User Token)"
                    value={pageAccessToken}
                    onChange={handleTokenChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs font-mono placeholder:text-slate-600 resize-none"
                    required
                  />
                </div>
              </div>

              {/* Live Token Inspection Badge */}
              {inspectionResult && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    inspectionResult.isPermanent
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                      : inspectionResult.canAutoUpgrade
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-200"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      {inspectionResult.isPermanent ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span>
                        {inspectionResult.isPermanent
                          ? "Permanent Token Detected (Never Expires / আজীবন কার্যকর)"
                          : inspectionResult.canAutoUpgrade
                          ? "Short-Lived Token Detected (Auto-Upgrade Engine will convert to Permanent)"
                          : "Short-Lived Token (Expires in ~1-2 hours)"}
                      </span>
                    </span>

                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10">
                      {inspectionResult.tokenType}
                    </span>
                  </div>

                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {inspectionResult.recommendation}
                  </p>

                  {/* Scopes check */}
                  {inspectionResult.inspection.scopes.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-1 text-[10px] font-mono">
                      <span className="text-slate-400">Permissions:</span>
                      {["pages_read_engagement", "pages_manage_posts", "pages_messaging"].map(
                        (reqScope) => {
                          const hasScope =
                            inspectionResult.inspection.scopes.includes(reqScope);
                          return (
                            <span
                              key={reqScope}
                              className={`px-1.5 py-0.5 rounded ${
                                hasScope
                                  ? "bg-emerald-400/20 text-emerald-300"
                                  : "bg-rose-400/20 text-rose-300"
                              }`}
                            >
                              {hasScope ? "✓" : "✗"} {reqScope}
                            </span>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill("system_user")}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 font-mono underline cursor-pointer"
                >
                  Fill Sample Demo Permanent Token
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isLoading} variant="primary">
                    Verify & Connect Permanent Page
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: AUTO-UPGRADE TOKEN (BYOT)                         */}
        {/* ======================================================== */}
        {activeTab === "byot" && (
          <form onSubmit={handleConnect} className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                Automatic Token Converter (Auto-Upgrade)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Graph API Explorer থেকে নেওয়া সাধারণ ১-২ ঘণ্টার টোকেন এখানে পেস্ট করলে, AutoPage ব্যাকএন্ড স্বয়ংক্রিয়ভাবে Meta Graph API এক্সচেঞ্জ কলের মাধ্যমে এটিকে <strong>Permanent Long-Lived Page Access Token (Never Expires)</strong>-এ রূপান্তর করে নিবে!
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-300 mb-1.5">
                Facebook Page ID
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. 10928491829384"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-300">
                  Page or User Access Token (Graph API Explorer)
                </label>
                {isInspecting && (
                  <span className="text-[10px] text-cyan-400 font-mono animate-pulse">
                    Inspecting...
                  </span>
                )}
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <textarea
                  rows={3}
                  placeholder="EAA..."
                  value={pageAccessToken}
                  onChange={handleTokenChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs font-mono placeholder:text-slate-600 resize-none"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Required permissions: <code className="text-blue-400">pages_read_engagement</code>,{" "}
                <code className="text-blue-400">pages_manage_posts</code>,{" "}
                <code className="text-blue-400">pages_messaging</code>.
              </p>
            </div>

            {/* Live Token Inspection Badge */}
            {inspectionResult && (
              <div
                className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  inspectionResult.isPermanent
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                    : inspectionResult.canAutoUpgrade
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-200"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    {inspectionResult.isPermanent ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Zap className="w-4 h-4 text-cyan-400" />
                    )}
                    <span>
                      {inspectionResult.isPermanent
                        ? "Permanent Token (Never Expires)"
                        : "Short-Lived Token (Auto-Upgrade Engine Ready)"}
                    </span>
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded">
                    {inspectionResult.tokenType}
                  </span>
                </div>
                <p className="text-[11px] opacity-90">{inspectionResult.recommendation}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleQuickDemoFill("short_lived")}
                className="text-[11px] text-slate-400 hover:text-blue-400 font-mono underline cursor-pointer"
              >
                Fill Sample Short-Lived Demo Token
              </button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading} variant="primary">
                  Auto-Upgrade & Connect
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ONE-CLICK OAUTH                                   */}
        {/* ======================================================== */}
        {activeTab === "oauth" && (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Automatic Multi-Page Long-Lived Token Synchronization
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect using Meta Facebook Login dialog. AutoPage automatically exchanges OAuth credentials for 60-day Long-Lived User Tokens and pulls never-expiring Page Access Tokens.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href="/api/auth/facebook?action=login"
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-glow cursor-pointer"
              >
                <Facebook className="w-4 h-4 fill-white" />
                <span>Log In with Facebook (Live Meta App)</span>
                <ExternalLink className="w-3.5 h-3.5 ml-auto text-blue-200" />
              </a>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-[1px] bg-white/10" />
                <span className="text-[10px] font-mono uppercase text-slate-500">
                  or local sandbox evaluation
                </span>
                <div className="flex-1 h-[1px] bg-white/10" />
              </div>

              <Button
                type="button"
                variant="secondary"
                size="md"
                isLoading={isOAuthLoading}
                onClick={handleSimulateOAuthConnect}
                className="w-full font-semibold"
                icon={<Sparkles className="w-4 h-4 text-cyan-400" />}
              >
                1-Click Simulated OAuth Page Connect
              </Button>
            </div>

            <p className="text-[11px] text-slate-400 text-center pt-2">
              Requires <code className="text-blue-400">META_APP_ID</code> and <code className="text-blue-400">META_APP_SECRET</code> in environment for live production login.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
