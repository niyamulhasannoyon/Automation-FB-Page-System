"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/common/Button";

export function ConnectPageModal() {
  const isOpen = useAppStore((state) => state.isConnectModalOpen);
  const setOpen = useAppStore((state) => state.setConnectModalOpen);
  const showToast = useAppStore((state) => state.showToast);
  const fetchPages = useAppStore((state) => state.fetchPages);
  const setActivePage = useAppStore((state) => state.setActivePage);

  const [pageId, setPageId] = useState("");
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, stepNumber: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepNumber);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pageId.trim() || !pageAccessToken.trim()) {
      setError("Please provide both Page ID and Page Access Token.");
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

      showToast(
        `Successfully connected "${data.page.pageName}"!`,
        "success"
      );

      // Refresh pages list and set as active page
      await fetchPages();
      setActivePage(data.page);
      setOpen(false);
      setPageId("");
      setPageAccessToken("");
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message);
      showToast(errorObj.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl glass-panel border border-white/15 shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Facebook className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Connect Facebook Page
              </h3>
              <p className="text-xs text-slate-400">
                Bring Your Own Token (BYOT) — No App Review Required
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

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleConnect} className="mt-5 space-y-4">
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
            <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-300 mb-1.5">
              Page Access Token (Permanent / Long-Lived)
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <textarea
                rows={3}
                placeholder="EAA..."
                value={pageAccessToken}
                onChange={(e) => setPageAccessToken(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs font-mono placeholder:text-slate-600 resize-none"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Must include permissions: <code className="text-blue-400">pages_read_engagement</code>,{" "}
              <code className="text-blue-400">pages_manage_posts</code>,{" "}
              <code className="text-blue-400">pages_messaging</code>.
            </p>
          </div>

          {/* Collapsible Helper Guide */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs font-medium text-slate-300 hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                How to get your Page Access Token in 30 seconds
              </span>
              {showGuide ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showGuide && (
              <div className="p-4 pt-1 border-t border-white/5 space-y-3 text-xs text-slate-300">
                <ol className="list-decimal list-inside space-y-2 text-slate-400">
                  <li>
                    Open{" "}
                    <a
                      href="https://developers.facebook.com/tools/explorer/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 underline inline-flex items-center gap-1 font-semibold"
                    >
                      Meta Graph API Explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    In the <strong>Meta App</strong> dropdown, select your Meta App.
                  </li>
                  <li>
                    Under <strong>User or Page</strong>, select <strong>Page Access Token</strong> and pick your Facebook Page.
                  </li>
                  <li>
                    Add Permissions:{" "}
                    <span className="text-slate-200 font-mono text-[11px]">
                      pages_read_engagement, pages_manage_posts, pages_messaging
                    </span>
                  </li>
                  <li>
                    Click <strong>Generate Access Token</strong> and copy the token string into the field above.
                  </li>
                </ol>
                <div className="pt-2 flex items-center justify-between border-t border-white/5">
                  <span className="text-[11px] text-slate-400">
                    Verify tool endpoint:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        "me/accounts?fields=id,name,access_token",
                        1
                      )
                    }
                    className="text-[11px] font-mono text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {copiedStep === 1 ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>me/accounts</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} variant="primary">
              Verify & Connect Page
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
