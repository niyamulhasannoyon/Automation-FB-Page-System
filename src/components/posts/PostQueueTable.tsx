"use client";

import React, { useState } from "react";
import { IScheduledPost } from "@/types";
import { Badge } from "@/components/common/Badge";
import { formatDate } from "@/lib/utils";
import {
  CalendarDays,
  ExternalLink,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

interface PostQueueTableProps {
  posts: IScheduledPost[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function PostQueueTable({
  posts,
  isLoading,
  onRefresh,
}: PostQueueTableProps) {
  const showToast = useAppStore((state) => state.showToast);
  const [isRunningCron, setIsRunningCron] = useState(false);

  const handleRunCron = async () => {
    setIsRunningCron(true);
    try {
      const res = await fetch("/api/cron/publish");
      const data = await res.json();
      if (res.ok) {
        showToast(
          data.message || "Scheduled post queue processed successfully!",
          "success"
        );
        onRefresh();
      } else {
        showToast(data.error || "Failed to trigger cron queue.", "error");
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, "error");
    } finally {
      setIsRunningCron(false);
    }
  };

  return (
    <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CalendarDays className="w-4 h-4 text-blue-400" />
          <h3 className="text-base font-semibold text-white">
            Publishing Queue & Post History
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
            {posts.length} {posts.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunCron}
            disabled={isRunningCron}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Trigger cron worker now to publish pending posts due"
          >
            <Play className={`w-3.5 h-3.5 ${isRunningCron ? "animate-spin" : ""}`} />
            <span>Process Queue Now</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Refresh Table"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`}
            />
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="p-12 text-center">
          <Clock className="w-10 h-10 text-slate-500 mx-auto mb-2.5" />
          <h4 className="text-sm font-semibold text-white">No Posts in Queue</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Use the composer above to publish your first post instantly or schedule it for automated delivery.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 uppercase font-mono tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Post Content</th>
                <th className="px-6 py-3.5">Media</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Scheduled / Published</th>
                <th className="px-6 py-3.5 text-right">Facebook Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {posts.map((post) => (
                <tr
                  key={post._id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4 max-w-xs">
                    <p className="font-medium text-white truncate">
                      {post.caption || "(No text - Photo only)"}
                    </p>
                    {post.errorLog && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 truncate">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{post.errorLog}</span>
                      </p>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {post.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.imageUrl}
                        alt="Thumbnail"
                        className="w-9 h-9 rounded-lg object-cover border border-white/10"
                      />
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">
                        Text Only
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {post.status === "published" && (
                      <Badge variant="success" size="sm">
                        Published
                      </Badge>
                    )}
                    {post.status === "pending" && (
                      <Badge variant="info" size="sm">
                        Pending
                      </Badge>
                    )}
                    {post.status === "failed" && (
                      <Badge variant="danger" size="sm">
                        Failed
                      </Badge>
                    )}
                  </td>

                  <td className="px-6 py-4 font-mono text-[11px] text-slate-300">
                    {formatDate(post.scheduledTime)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {post.fbPostId ? (
                      <a
                        href={`https://facebook.com/${post.fbPostId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-mono text-[11px] hover:underline"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>FB Post</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
