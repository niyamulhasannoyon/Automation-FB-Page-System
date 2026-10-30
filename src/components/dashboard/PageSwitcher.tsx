"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { ChevronDown, Check, Plus, Facebook } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pages = useAppStore((state) => state.pages);
  const activePage = useAppStore((state) => state.activePage);
  const setActivePage = useAppStore((state) => state.setActivePage);
  const setConnectModalOpen = useAppStore((state) => state.setConnectModalOpen);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all text-left text-sm cursor-pointer"
      >
        {activePage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePage.pagePicture || "/placeholder-avatar.png"}
              alt={activePage.pageName}
              className="w-6 h-6 rounded-full object-cover ring-1 ring-blue-500/40"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white leading-tight">
                {activePage.pageName}
              </span>
              <span className="text-[10px] font-mono text-slate-400 leading-tight">
                ID: {activePage.pageId}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 py-0.5">
            <Facebook className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-slate-300">
              Select or Connect Page
            </span>
          </div>
        )}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-slate-400 ml-1 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-2xl glass-panel border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 text-[10px] font-mono uppercase text-slate-400">
            Connected Facebook Pages ({pages.length})
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 my-1">
            {pages.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                No pages connected yet.
              </div>
            ) : (
              pages.map((page) => {
                const isSelected = activePage?.pageId === page.pageId;
                return (
                  <button
                    key={page.pageId}
                    onClick={() => {
                      setActivePage(page);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer",
                      isSelected
                        ? "bg-blue-600/15 border border-blue-500/30 text-white"
                        : "hover:bg-white/5 text-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={page.pagePicture || "/placeholder-avatar.png"}
                        alt={page.pageName}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate text-white">
                          {page.pageName}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 truncate">
                          {page.pageId}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-white/10 mt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                setConnectModalOpen(true);
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Connect Another Page</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
