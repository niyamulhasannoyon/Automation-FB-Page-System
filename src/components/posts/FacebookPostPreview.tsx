"use client";

import React from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  Globe2,
  MoreHorizontal,
} from "lucide-react";

interface FacebookPostPreviewProps {
  caption: string;
  imageUrl?: string;
}

export function FacebookPostPreview({
  caption,
  imageUrl,
}: FacebookPostPreviewProps) {
  const activePage = useAppStore((state) => state.activePage);

  const pageName = activePage?.pageName || "Your Facebook Page";
  const pagePicture = activePage?.pagePicture || "/placeholder-avatar.png";

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl bg-slate-900 border border-white/10 overflow-hidden shadow-2xl">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pagePicture}
            alt={pageName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20"
          />
          <div>
            <h4 className="text-sm font-semibold text-white leading-tight flex items-center gap-1.5">
              {pageName}
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <span>Just now</span>
              <span>•</span>
              <Globe2 className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </div>
        <button className="text-slate-400 hover:text-white p-1 rounded-lg">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Post Text / Caption */}
      <div className="px-4 pb-3">
        <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
          {caption || (
            <span className="text-slate-500 italic">
              Your post caption will appear here in real-time...
            </span>
          )}
        </p>
      </div>

      {/* Post Image (if provided) */}
      {imageUrl && imageUrl.trim().length > 0 && (
        <div className="relative w-full max-h-72 bg-black/40 overflow-hidden border-y border-white/5 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Post preview"
            className="w-full h-auto max-h-72 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60";
            }}
          />
        </div>
      )}

      {/* Realistic Engagement Stats */}
      <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px]">
            👍
          </div>
          <span>124</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span>18 comments</span>
          <span>4 shares</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-2 py-1.5 grid grid-cols-3 gap-1 text-slate-400 text-xs font-medium">
        <button className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
          <ThumbsUp className="w-4 h-4" />
          <span>Like</span>
        </button>
        <button className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span>Comment</span>
        </button>
        <button className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}
