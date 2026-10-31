"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { formatDate } from "@/lib/utils";
import { IAutomationLog } from "@/types";
import {
  Activity,
  RefreshCw,
  MessageSquare,
  ShoppingBag,
  Bot,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  ArrowRight,
} from "lucide-react";

export function LiveActivityFeed({ pageId }: { pageId?: string }) {
  const activePage = useAppStore((state) => state.activePage);
  const targetPageId = pageId || activePage?.pageId;

  const [logs, setLogs] = useState<IAutomationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!targetPageId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/logs?pageId=${targetPageId}&limit=25`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [targetPageId]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 15000); // Polling every 15s for live updates
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const getEventBadge = (type: string) => {
    switch (type) {
      case "order":
        return <Badge variant="success" size="sm">🛒 Order Auto-Extracted</Badge>;
      case "stock_inquiry":
        return <Badge variant="info" size="sm">📦 Stock Inquiry</Badge>;
      case "ai_reply":
        return <Badge variant="purple" size="sm">✨ AI Salesman</Badge>;
      case "comment":
        return <Badge variant="neutral" size="sm">💬 Comment Reply</Badge>;
      default:
        return <Badge variant="neutral" size="sm">📩 Messenger DM</Badge>;
    }
  };

  return (
    <Card className="border-white/10 bg-slate-900/40">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <span>Live Automation Activity Feed</span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-normal">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Stream
              </span>
            </CardTitle>
            <p className="text-[11px] text-slate-400">
              Real-time audit log of incoming comments, inbox messages, and bot responses
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchLogs}
          isLoading={isLoading}
          icon={<RefreshCw className="w-3 h-3" />}
        >
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        {logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
            No recent activity recorded yet. Run a test in the Bot Simulator or wait for Facebook comments.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log._id || log.eventId}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {getEventBadge(log.eventType)}
                    <span className="text-xs font-semibold text-white flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {log.senderName || "Customer"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      {formatDate(log.createdAt || new Date())}
                    </span>
                    <Badge
                      variant={log.status === "success" ? "success" : log.status === "duplicate" ? "warning" : "danger"}
                      size="sm"
                    >
                      {log.status === "success" ? "Success" : log.status === "duplicate" ? "Duplicate (Skipped)" : "Failed"}
                    </Badge>
                  </div>
                </div>

                {/* Message & Reply Exchange */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Customer Input
                    </span>
                    <p className="text-slate-200 line-clamp-2">
                      &quot;{log.inputMessage}&quot;
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-blue-300">
                        Bot Reply ({log.handledBy})
                      </span>
                    </div>
                    <p className="text-blue-100 line-clamp-2 whitespace-pre-line">
                      {log.replyMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
