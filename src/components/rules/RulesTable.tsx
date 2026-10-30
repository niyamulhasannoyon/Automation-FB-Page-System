"use client";

import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { IAutomationRule } from "@/types";
import { Switch } from "@/components/common/Switch";
import { Button } from "@/components/common/Button";
import {
  MessageSquareCode,
  Edit2,
  Trash2,
  Plus,
  Mail,
  MessageCircle,
} from "lucide-react";

export function RulesTable() {
  const activePage = useAppStore((state) => state.activePage);
  const toggleRuleStatus = useAppStore((state) => state.toggleRuleStatus);
  const deleteRule = useAppStore((state) => state.deleteRule);
  const setRuleModalOpen = useAppStore((state) => state.setRuleModalOpen);

  if (!activePage) {
    return (
      <div className="p-12 text-center rounded-2xl glass-panel border border-white/10">
        <MessageSquareCode className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Page Selected</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Please select a connected Facebook page from the top switcher to manage automation rules.
        </p>
      </div>
    );
  }

  const rules = activePage.rules || [];

  return (
    <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden">
      {/* Table Top Bar */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <span>Automation Rules</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {rules.length} {rules.length === 1 ? "rule" : "rules"}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-replies triggered by incoming comments and messenger keywords
          </p>
        </div>
        <Button
          onClick={() => setRuleModalOpen(true, null)}
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <MessageSquareCode className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white">No Rules Configured</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Create your first keyword trigger to automatically reply to user comments and send them private inbox messages!
          </p>
          <Button
            onClick={() => setRuleModalOpen(true, null)}
            size="sm"
            className="mt-4"
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Create First Rule
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 uppercase font-mono tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Trigger Keyword</th>
                <th className="px-6 py-3.5">Public Comment Reply</th>
                <th className="px-6 py-3.5">Private Inbox Message</th>
                <th className="px-6 py-3.5 text-center">Active</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {rules.map((rule: IAutomationRule) => (
                <tr
                  key={rule.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                        {rule.keyword}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                        {rule.matchType}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 max-w-xs">
                    {rule.commentReply ? (
                      <div className="flex items-start gap-1.5 text-slate-300">
                        <MessageCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span className="truncate">{rule.commentReply}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">None</span>
                    )}
                  </td>

                  <td className="px-6 py-4 max-w-xs">
                    {rule.sendPrivateInbox && rule.inboxReply ? (
                      <div className="flex items-start gap-1.5 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span className="truncate">{rule.inboxReply}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Disabled</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <Switch
                      checked={rule.isActive}
                      onChange={() =>
                        toggleRuleStatus(activePage.pageId, rule.id)
                      }
                      size="sm"
                    />
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setRuleModalOpen(true, rule)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        title="Edit Rule"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          deleteRule(activePage.pageId, rule.id)
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
