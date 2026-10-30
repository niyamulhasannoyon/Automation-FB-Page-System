"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { RulesTable } from "@/components/rules/RulesTable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { MessageSquareText, Save, Info } from "lucide-react";

export default function RulesPage() {
  const activePage = useAppStore((state) => state.activePage);
  const updateDefaultInboxReply = useAppStore(
    (state) => state.updateDefaultInboxReply
  );

  const [defaultReply, setDefaultReply] = useState("");
  const [isSavingDefault, setIsSavingDefault] = useState(false);

  useEffect(() => {
    if (activePage?.defaultInboxReply) {
      setDefaultReply(activePage.defaultInboxReply);
    }
  }, [activePage]);

  const handleSaveDefaultReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePage) return;
    setIsSavingDefault(true);
    await updateDefaultInboxReply(activePage.pageId, defaultReply.trim());
    setIsSavingDefault(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Context */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Comment & Messenger Automation Rules
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure instant automated responses for Facebook post comments and Messenger conversations
        </p>
      </div>

      {/* Rules Table */}
      <RulesTable />

      {/* Default Messenger Fallback Auto-Reply */}
      {activePage && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <MessageSquareText className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Default Messenger Greeting & Fallback</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automatically sent when a user messages your page and no specific keyword rule matches
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSaveDefaultReply} className="space-y-4">
              <textarea
                rows={3}
                value={defaultReply}
                onChange={(e) => setDefaultReply(e.target.value)}
                placeholder="e.g. Hello! Thanks for reaching out to us. We will get back to you within a few minutes!"
                className="w-full px-4 py-3 rounded-xl glass-input text-xs leading-relaxed placeholder:text-slate-600 resize-none"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    Replies via Meta Graph API:{" "}
                    <code className="text-slate-300 font-mono text-[11px]">
                      /{activePage.pageId}/messages
                    </code>
                  </span>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSavingDefault}
                  icon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Default Reply
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
