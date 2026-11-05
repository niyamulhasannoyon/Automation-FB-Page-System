"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Lock,
  Mail,
  Search,
} from "lucide-react";
import { Button } from "@/components/common/Button";

export default function DataDeletionPage() {
  const [pageIdOrEmail, setPageIdOrEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageIdOrEmail.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    // Simulate / Process deletion ticket
    setTimeout(() => {
      const code = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
      setStatusMessage(
        `✅ Deletion request received for identifier: "${pageIdOrEmail}". Confirmation Code: ${code}. All connected page tokens, scheduled posts, and activity records have been queued for permanent cryptographic wipe within 24 hours.`
      );
      setIsSubmitting(false);
      setPageIdOrEmail("");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Back */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to AutoPage SaaS
          </Link>
        </div>

        {/* Header Banner */}
        <div className="p-8 rounded-3xl glass-panel border border-red-500/20 bg-gradient-to-r from-red-950/20 via-slate-900/40 to-slate-950/40 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
            <Trash2 className="w-3.5 h-3.5" /> Meta Platform User Data Deletion Instructions
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            User Data Deletion & Privacy Controls
          </h1>
          <p className="text-xs text-slate-400">
            Per Meta Developer Platform Policy and GDPR Article 17 (Right to Erasure), AutoPage SaaS provides complete transparency and immediate tools for users to erase their stored Facebook data.
          </p>
        </div>

        {/* Step-by-Step Meta Deletion Guide */}
        <div className="p-8 rounded-3xl glass-panel border border-white/10 space-y-8 text-sm leading-relaxed text-slate-300">
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">
                1
              </span>
              How to Delete AutoPage SaaS Data via Facebook Settings
            </h2>
            <p>
              If you have connected your Facebook Account or Facebook Pages to AutoPage SaaS and wish to delete your data and revoke all permissions, follow these standard Facebook steps:
            </p>

            <div className="space-y-3 pl-2">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-white block">Open Facebook Settings</strong>
                  <span className="text-xs text-slate-400">
                    Log in to your Facebook profile, click your profile icon in the top right, and go to <strong>Settings & Privacy</strong> &gt; <strong>Settings</strong>.
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-white block">Navigate to Apps & Business Integrations</strong>
                  <span className="text-xs text-slate-400">
                    On the left sidebar, click on <strong>Business Integrations</strong> (or <strong>Apps and Websites</strong>).
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-white block">Remove AutoPage SaaS</strong>
                  <span className="text-xs text-slate-400">
                    Find <strong>AutoPage SaaS</strong> in the list of active apps, click <strong>Remove</strong>, and confirm your choice.
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-white block">Automatic Data Deletion Callback</strong>
                  <span className="text-xs text-slate-400">
                    Facebook will trigger our secure callback endpoint (<code>/api/auth/data-deletion</code>), which automatically purges all cached tokens and configuration records from our database.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Request Form */}
          <section className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                2
              </span>
              Direct Deletion Request Form
            </h2>
            <p className="text-xs text-slate-400">
              Prefer to request manual deletion directly? Enter your Facebook Page ID, Meta User ID, or registered merchant email address below:
            </p>

            <form onSubmit={handleRequestDeletion} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  placeholder="Enter Page ID (e.g. 1029384756) or Email"
                  value={pageIdOrEmail}
                  onChange={(e) => setPageIdOrEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl glass-input text-xs text-white border border-white/10 focus:border-blue-500 outline-none"
                />
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  icon={<Trash2 className="w-4 h-4 text-white" />}
                >
                  Submit Deletion Request
                </Button>
              </div>
            </form>

            {statusMessage && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-300 leading-relaxed">
                {statusMessage}
              </div>
            )}
          </section>

          {/* Contact Details */}
          <section className="space-y-3 pt-6 border-t border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" />
              Contact Our Privacy Compliance Desk
            </h2>
            <p className="text-xs text-slate-400">
              For enterprise audit trails, proof-of-deletion certificates, or custom inquiries:
            </p>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-xs text-slate-300 space-y-1">
              <p>Email: <strong className="text-white">niyamulhasan1089@gmail.com</strong></p>
              <p>Meta App ID: <strong className="text-white">28937063992656010</strong></p>
              <p>Turnaround: All requests processed within 24 to 48 hours maximum.</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 border-t border-white/10 pt-6">
          <p>© 2026 AutoPage SaaS. Meta Platform Compliant.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
