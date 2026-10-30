"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { PostComposer } from "@/components/posts/PostComposer";
import { FacebookPostPreview } from "@/components/posts/FacebookPostPreview";
import { PostQueueTable } from "@/components/posts/PostQueueTable";
import { IScheduledPost } from "@/types";
import { CalendarDays, AlertCircle } from "lucide-react";

export default function PostsPage() {
  const activePage = useAppStore((state) => state.activePage);

  const [caption, setCaption] = useState(
    "Exciting updates are coming to our community! 🚀 Drop a comment below if you'd like early VIP access."
  );
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80"
  );
  const [posts, setPosts] = useState<IScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (!activePage) {
      setPosts([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts?pageId=${activePage.pageId}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.posts)) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activePage]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (!activePage) {
    return (
      <div className="p-12 text-center rounded-2xl glass-panel border border-white/10">
        <CalendarDays className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Page Selected</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Please select a connected Facebook page from the header to compose and schedule posts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Post Studio & Publishing Scheduler
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Compose updates, preview exactly how they render on Facebook, and publish immediately or schedule for the future
        </p>
      </div>

      {/* Split-Screen: Composer (Left) vs Live Facebook Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Composer Left (7 Cols) */}
        <div className="lg:col-span-7">
          <PostComposer
            caption={caption}
            setCaption={setCaption}
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            onPostCreated={fetchPosts}
          />
        </div>

        {/* Live Preview Right (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Live Facebook Feed Preview
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Pixel Accurate
            </span>
          </div>

          <FacebookPostPreview caption={caption} imageUrl={imageUrl} />
        </div>
      </div>

      {/* Post Queue Table */}
      <PostQueueTable
        posts={posts}
        isLoading={isLoading}
        onRefresh={fetchPosts}
      />
    </div>
  );
}
