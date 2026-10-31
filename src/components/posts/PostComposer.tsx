"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/common/Button";
import {
  Send,
  Calendar,
  Image as ImageIcon,
  Clock,
  Sparkles,
  AlertCircle,
  UploadCloud,
  Loader2,
  X,
} from "lucide-react";

interface PostComposerProps {
  caption: string;
  setCaption: (caption: string) => void;
  imageUrl: string;
  setImageUrl: (url: string) => void;
  onPostCreated: () => void;
}

export function PostComposer({
  caption,
  setCaption,
  imageUrl,
  setImageUrl,
  onPostCreated,
}: PostComposerProps) {
  const activePage = useAppStore((state) => state.activePage);
  const showToast = useAppStore((state) => state.showToast);

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image.");
      }

      setImageUrl(data.url);
      showToast("Media uploaded successfully!", "success");
    } catch (err: unknown) {
      const errObj = err as Error;
      setError(errObj.message);
      showToast(errObj.message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const SAMPLE_IMAGES = [
    {
      label: "Tech Graphic",
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    },
    {
      label: "Modern SaaS",
      url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80",
    },
    {
      label: "Cyber Neon",
      url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!activePage) {
      setError("Please select an active Facebook page first.");
      return;
    }

    if (!caption.trim() && !imageUrl.trim()) {
      setError("Please enter a caption or an image URL.");
      return;
    }

    if (isScheduled && !scheduledDateTime) {
      setError("Please select a date and time for scheduled publication.");
      return;
    }

    setIsPublishing(true);

    try {
      const res = await fetch("/api/posts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: activePage.pageId,
          caption: caption.trim(),
          imageUrl: imageUrl.trim() || undefined,
          scheduledTime: isScheduled ? new Date(scheduledDateTime).toISOString() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to publish post.");
      }

      showToast(
        isScheduled
          ? "Post successfully added to the schedule queue!"
          : "Post published to Facebook Page live!",
        "success"
      );

      // Reset form
      setCaption("");
      setImageUrl("");
      setIsScheduled(false);
      setScheduledDateTime("");
      onPostCreated();
    } catch (err: unknown) {
      const errObj = err as Error;
      setError(errObj.message);
      showToast(errObj.message, "error");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 rounded-2xl glass-panel border border-white/10 space-y-4"
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h3 className="text-base font-semibold text-white">Post Studio</h3>
          <p className="text-xs text-slate-400">
            Publish directly or schedule automated release via Graph API
          </p>
        </div>

        {/* Publish Mode Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-medium">
          <button
            type="button"
            onClick={() => setIsScheduled(false)}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              !isScheduled
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Publish Now
          </button>
          <button
            type="button"
            onClick={() => setIsScheduled(true)}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              isScheduled
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Caption Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-300">
            Post Caption / Message
          </label>
          <span className="text-[11px] font-mono text-slate-500">
            {caption.length} characters
          </span>
        </div>
        <textarea
          rows={5}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What's happening on your page today? Type your announcement, questions, or product reveal..."
          className="w-full px-4 py-3 rounded-xl glass-input text-sm leading-relaxed placeholder:text-slate-600 resize-none"
        />
      </div>

      {/* Media Upload & URL Section */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>Photo / Media Asset (Optional)</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500 font-normal">
            Max 10MB • Drag & Drop Ready
          </span>
        </label>

        {/* Drag-and-Drop Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 ${
            isDragging
              ? "border-blue-500 bg-blue-500/10 shadow-glow"
              : "border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          {isUploading ? (
            <div className="flex items-center gap-2 text-xs text-blue-400 font-mono py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading media file to server...</span>
            </div>
          ) : imageUrl ? (
            <div className="flex items-center justify-between w-full px-2">
              <div className="flex items-center gap-3 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Uploaded media preview"
                  className="w-12 h-12 rounded-lg object-cover ring-1 ring-white/20"
                />
                <div className="text-left min-w-0">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Image Selected
                  </span>
                  <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
                    {imageUrl}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageUrl("");
                }}
                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  Drop image here, or <span className="text-blue-400 underline">browse files</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Supports PNG, JPG, WEBP, or GIF up to 10MB
                </p>
              </div>
            </>
          )}
        </div>

        {/* Or enter external image URL */}
        <div className="pt-1">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Or paste external image link (e.g. https://images.unsplash.com/...)"
            className="w-full px-4 py-2 rounded-xl glass-input text-xs font-mono placeholder:text-slate-600"
          />

          {/* Presets */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-mono text-slate-500">Presets:</span>
            {SAMPLE_IMAGES.map((img) => (
              <button
                key={img.label}
                type="button"
                onClick={() => setImageUrl(img.url)}
                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer"
              >
                {img.label}
              </button>
            ))}
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="text-[10px] font-mono text-rose-400 hover:underline ml-auto cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scheduled Date/Time Picker */}
      {isScheduled && (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2 animate-in fade-in duration-150">
          <label className="text-xs font-semibold uppercase font-mono tracking-wider text-blue-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Select Target Date & Time</span>
          </label>
          <input
            type="datetime-local"
            value={scheduledDateTime}
            onChange={(e) => setScheduledDateTime(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono text-slate-200"
            required={isScheduled}
          />
          <p className="text-[11px] text-slate-400">
            Posts will automatically be dispatched by the scheduler cron when the time arrives.
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Meta Graph API v21.0</span>
        </div>

        <Button
          type="submit"
          isLoading={isPublishing}
          variant="primary"
          icon={
            isScheduled ? (
              <Calendar className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )
          }
        >
          {isScheduled ? "Schedule Post" : "Publish Live Now"}
        </Button>
      </div>
    </form>
  );
}
