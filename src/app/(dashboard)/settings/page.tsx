"use client";

import React, { useState } from "react";
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
} from "lucide-react";

export default function SettingsPage() {
  const activePage = useAppStore((state) => state.activePage);
  const removePage = useAppStore((state) => state.removePage);
  const showToast = useAppStore((state) => state.showToast);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const webhookUrl = `${appUrl}/api/webhook`;
  const verifyToken =
    process.env.NEXT_PUBLIC_META_WEBHOOK_VERIFY_TOKEN ||
    "fb_auto_verify_token_secure_2025";

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`Copied ${field} to clipboard!`, "info");
    setTimeout(() => setCopiedField(null), 2000);
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
      `Are you sure you want to disconnect "${activePage.pageName}"? This will remove all keyword rules and scheduled posts for this page.`
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
          Page Settings & Meta Webhook Inspector
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Inspect Meta Graph API webhook subscription endpoints, verification tokens, and tenant access
        </p>
      </div>

      {/* Webhook Configuration Card */}
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

      {/* Tenant Credentials & Access Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Tenant Credentials</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Connected Page ID and access token encryption status
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                Facebook Page ID
              </span>
              <p className="text-sm font-mono text-white mt-1">
                {activePage.pageId}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                Page Access Token
              </span>
              <p className="text-sm font-mono text-slate-400 mt-1">
                {activePage.pageAccessToken
                  ? `••••••••••••••••••••${activePage.pageAccessToken.slice(-6)}`
                  : "Not set"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone: Disconnect Page */}
      <Card className="border-rose-500/20 bg-rose-500/[0.02]">
        <CardHeader className="border-rose-500/10">
          <div>
            <CardTitle className="text-rose-400">Danger Zone</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Disconnect this page and erase all associated keyword automation rules
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
