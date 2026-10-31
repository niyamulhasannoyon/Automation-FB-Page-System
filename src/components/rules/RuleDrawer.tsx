"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { IAutomationRule, MatchType } from "@/types";
import { Button } from "@/components/common/Button";
import { Switch } from "@/components/common/Switch";
import {
  X,
  Sparkles,
  MessageCircle,
  Mail,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export function RuleDrawer() {
  const isOpen = useAppStore((state) => state.isRuleModalOpen);
  const editingRule = useAppStore((state) => state.editingRule);
  const setOpen = useAppStore((state) => state.setRuleModalOpen);
  const activePage = useAppStore((state) => state.activePage);
  const saveRule = useAppStore((state) => state.saveRule);

  const [keyword, setKeyword] = useState("");
  const [matchType, setMatchType] = useState<MatchType>("contains");
  const [commentReply, setCommentReply] = useState("");
  const [sendPrivateInbox, setSendPrivateInbox] = useState(false);
  const [inboxReply, setInboxReply] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [testComment, setTestComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingRule) {
      setKeyword(editingRule.keyword);
      setMatchType(editingRule.matchType);
      setCommentReply(editingRule.commentReply || "");
      setSendPrivateInbox(editingRule.sendPrivateInbox || false);
      setInboxReply(editingRule.inboxReply || "");
      setIsActive(editingRule.isActive);
    } else {
      setKeyword("");
      setMatchType("contains");
      setCommentReply("Thanks for your comment! Check your inbox for details.");
      setSendPrivateInbox(true);
      setInboxReply(
        "Hi there! Thank you for inquiring. Here is the special link you asked for: https://example.com"
      );
      setIsActive(true);
    }
  }, [editingRule, isOpen]);

  if (!isOpen) return null;

  // Test Simulation Logic
  const doesTestMatch = () => {
    if (!testComment || !keyword) return false;
    const testNormalized = testComment.trim().toLowerCase();
    const keywordNormalized = keyword.trim().toLowerCase();
    if (matchType === "exact") {
      return testNormalized === keywordNormalized;
    }
    return testNormalized.includes(keywordNormalized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePage) return;
    if (!keyword.trim()) return;

    setIsSubmitting(true);

    const ruleData: IAutomationRule = {
      id: editingRule ? editingRule.id : `rule_${Date.now()}`,
      keyword: keyword.trim(),
      matchType,
      commentReply: commentReply.trim(),
      sendPrivateInbox,
      inboxReply: sendPrivateInbox ? inboxReply.trim() : "",
      isActive,
    };

    await saveRule(activePage.pageId, ruleData);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel border border-white/15 shadow-2xl p-6 sm:p-7 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {editingRule ? "Edit Automation Rule" : "Create Automation Rule"}
              </h3>
              <p className="text-xs text-slate-400">
                Target:{" "}
                <span className="text-blue-400 font-medium">
                  {activePage?.pageName}
                </span>
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

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto py-4 space-y-4 pr-1"
        >
          {/* Keyword and Match Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-300 mb-1.5">
                Trigger Keyword / Phrase
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. price, link, interested, info"
                required
                className="w-full px-3.5 py-2 rounded-xl glass-input text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-300 mb-1.5">
                Match Strategy
              </label>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value as MatchType)}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm font-medium bg-slate-900 cursor-pointer"
              >
                <option value="contains">Contains (Broad)</option>
                <option value="exact">Exact (Strict)</option>
              </select>
            </div>
          </div>

          {/* Public Comment Reply */}
          <div>
            <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                Public Comment Reply
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Posts directly beneath user&apos;s comment
              </span>
            </label>
            <textarea
              rows={2}
              value={commentReply}
              onChange={(e) => setCommentReply(e.target.value)}
              placeholder="e.g. Thanks for your comment! I just sent you a private message with the details 🚀"
              className="w-full px-3.5 py-2 rounded-xl glass-input text-xs placeholder:text-slate-600 resize-none"
            />
          </div>

          {/* Private Inbox Reply Section */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    Send Private Inbox Reply
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Dispatches a 1-on-1 private Messenger message to the commenter
                  </p>
                </div>
              </div>
              <Switch
                checked={sendPrivateInbox}
                onChange={setSendPrivateInbox}
                size="sm"
              />
            </div>

            {sendPrivateInbox && (
              <div className="pt-2 animate-in fade-in duration-150">
                <textarea
                  rows={3}
                  value={inboxReply}
                  onChange={(e) => setInboxReply(e.target.value)}
                  placeholder="Hey there! Thanks for engaging with our post. Here is your download/info link: ..."
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs placeholder:text-slate-600 resize-none"
                  required={sendPrivateInbox}
                />
              </div>
            )}
          </div>

          {/* Interactive Rule Simulator */}
          <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-blue-400 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3" /> Live Rule Tester
              </span>
              {testComment && (
                doesTestMatch() ? (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Matches Trigger!
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" /> No Match
                  </span>
                )
              )}
            </div>
            <input
              type="text"
              placeholder="Test a mock user comment here (e.g. 'Can I get the price?')"
              value={testComment}
              onChange={(e) => setTestComment(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg glass-input text-xs placeholder:text-slate-600"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-300 font-medium">
              Rule Status (Enable immediately)
            </span>
            <Switch checked={isActive} onChange={setIsActive} size="sm" />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} variant="primary">
              {editingRule ? "Save Changes" : "Create Rule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
