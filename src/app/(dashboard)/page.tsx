"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Switch } from "@/components/common/Switch";
import { Badge } from "@/components/common/Badge";
import {
  MessageSquareCode,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Radio,
  Plus,
  Send,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { IScheduledPost } from "@/types";

export default function OverviewDashboardPage() {
  const activePage = useAppStore((state) => state.activePage);
  const pages = useAppStore((state) => state.pages);
  const setConnectModalOpen = useAppStore((state) => state.setConnectModalOpen);
  const togglePageAutomation = useAppStore((state) => state.togglePageAutomation);
  const setRuleModalOpen = useAppStore((state) => state.setRuleModalOpen);

  const [posts, setPosts] = useState<IScheduledPost[]>([]);

  // Fetch posts count for active page
  useEffect(() => {
    if (!activePage) {
      setPosts([]);
      return;
    }

    async function loadPosts() {
      try {
        const res = await fetch(`/api/posts?pageId=${activePage?.pageId}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.posts)) {
          setPosts(data.posts);
        }
      } catch (err) {
        console.error("Error loading posts count:", err);
      }
    }
    loadPosts();
  }, [activePage]);

  const activeRulesCount =
    activePage?.rules?.filter((r) => r.isActive).length || 0;
  const pendingPostsCount =
    posts.filter((p) => p.status === "pending").length || 0;
  const publishedPostsCount =
    posts.filter((p) => p.status === "published").length || 0;

  if (!activePage && pages.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl glass-panel border border-white/10 max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-glow mb-4">
          <Zap className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Welcome to AutoPage
        </h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          Connect your Facebook Page using our Bring Your Own Token (BYOT) flow
          to enable instant comment auto-replies, private inbox messages, and post scheduling.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => setConnectModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Connect First Facebook Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Active Page Hero Banner */}
      {activePage && (
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-white/15 relative overflow-hidden bg-gradient-to-r from-blue-900/20 via-indigo-900/10 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePage.pagePicture || "/placeholder-avatar.png"}
                alt={activePage.pageName}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/30 shadow-lg"
              />
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {activePage.pageName}
                  </h2>
                  <Badge variant={activePage.autoReplyEnabled ? "success" : "neutral"} size="sm">
                    {activePage.autoReplyEnabled ? "Automation Running" : "Paused"}
                  </Badge>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-2">
                  <span>Page ID: {activePage.pageId}</span>
                  <span>•</span>
                  <a
                    href={`https://facebook.com/${activePage.pageId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    View on Facebook <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>

            {/* Master Toggle Button */}
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.04] border border-white/10 shrink-0">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">
                  Master Auto-Reply
                </span>
                <span className="text-[11px] text-slate-400">
                  {activePage.autoReplyEnabled ? "Live on comments & messages" : "Temporarily paused"}
                </span>
              </div>
              <Switch
                checked={activePage.autoReplyEnabled}
                onChange={() => togglePageAutomation(activePage.pageId)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Metrics Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Keyword Rules"
          value={activeRulesCount}
          description="Rules actively matching incoming comments"
          icon={MessageSquareCode}
          glowColor="blue"
          badge={{
            text: `${activePage?.rules?.length || 0} Total`,
            variant: "info",
          }}
        />

        <StatCard
          title="Scheduled Queue"
          value={pendingPostsCount}
          description="Posts waiting to be published by cron"
          icon={CalendarDays}
          glowColor="indigo"
          badge={{
            text: "Upcoming",
            variant: "purple",
          }}
        />

        <StatCard
          title="Published Posts"
          value={publishedPostsCount}
          description="Posts published to Facebook via AutoPage"
          icon={Send}
          glowColor="emerald"
          badge={{
            text: "Live",
            variant: "success",
          }}
        />

        <StatCard
          title="Webhook Engine"
          value={activePage?.isWebhookSubscribed ? "Healthy" : "Pending"}
          description="Real-time Graph API event stream"
          icon={activePage?.isWebhookSubscribed ? ShieldCheck : ShieldAlert}
          glowColor={activePage?.isWebhookSubscribed ? "emerald" : "amber"}
          badge={{
            text: "v21.0",
            variant: activePage?.isWebhookSubscribed ? "success" : "warning",
          }}
        />
      </div>

      {/* Quick Launch & Active Rules Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions */}
        <Card className="p-6 space-y-4">
          <CardHeader className="p-0 border-none pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>

          <div className="space-y-2">
            <button
              onClick={() => setRuleModalOpen(true, null)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    Create Keyword Rule
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Auto-reply to public comments & send private inbox DM
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />
            </button>

            <Link
              href="/posts"
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    Publish or Schedule Post
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Compose new post with live Facebook preview
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/settings"
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    Webhook Diagnostic
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Verify Meta verification token & subscription status
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Card>

        {/* Right Column: Live Automation Rules Snippet */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div>
                <CardTitle>Active Keyword Automation</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Top rules executing on comments and Messenger for {activePage?.pageName}
                </p>
              </div>
              <Link
                href="/rules"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
              >
                <span>View All Rules</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>

            <CardContent className="flex-1">
              {(!activePage?.rules || activePage.rules.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <MessageSquareCode className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  No automation rules configured yet. Click "Create Keyword Rule" to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {activePage.rules.slice(0, 4).map((rule) => (
                    <div
                      key={rule.id}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white">
                          {rule.keyword}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-300 truncate">
                            {rule.commentReply || rule.inboxReply}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Match: <span className="uppercase">{rule.matchType}</span>
                            {rule.sendPrivateInbox && " • Private Inbox DM enabled"}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={rule.isActive ? "success" : "neutral"}
                        size="sm"
                      >
                        {rule.isActive ? "Active" : "Off"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
