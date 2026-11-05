import React from "react";
import Link from "next/link";
import {
  FileText,
  ShieldAlert,
  Scale,
  CheckCircle2,
  ArrowLeft,
  Mail,
} from "lucide-react";

export const metadata = {
  title: "Terms of Service | AutoPage SaaS",
  description:
    "Official Terms of Service for AutoPage SaaS Facebook Page Automation Suite, adhering to Meta Developer policies.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "November 5, 2026";

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
        <div className="p-8 rounded-3xl glass-panel border border-indigo-500/20 bg-gradient-to-r from-indigo-950/30 via-slate-900/40 to-slate-950/40 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
            <Scale className="w-3.5 h-3.5" /> Legal Agreement & Acceptable Use
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: {lastUpdated} • Applicable to AutoPage SaaS (App ID: 28937063992656010)
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="p-8 rounded-3xl glass-panel border border-white/10 space-y-8 text-sm leading-relaxed text-slate-300">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">
                1
              </span>
              Acceptance of Terms
            </h2>
            <p>
              By accessing, registering, or connecting a Facebook Page to AutoPage SaaS (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use the Service.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">
                2
              </span>
              Compliance with Meta Platform Policies
            </h2>
            <p>
              AutoPage SaaS operates strictly on top of Meta Facebook Graph API. As a user of AutoPage SaaS:
            </p>
            <ul className="space-y-2 list-none pl-2">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  You warrant that you hold legitimate administrative authority over any Facebook Page connected to the Service.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  You agree to comply with Meta&apos;s Community Standards, Commercial Terms, and Platform Rules.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  You must not use automated messaging or comment replies to broadcast deceptive advertisements, bulk spam, or harassing content.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">
                3
              </span>
              Acceptable Use Policy
            </h2>
            <p>
              You agree that you will not use AutoPage SaaS to:
            </p>
            <ul className="space-y-1.5 list-disc pl-5 text-xs text-slate-400">
              <li>Violate any local, national, or international consumer protection laws.</li>
              <li>Impersonate individuals or organizations without authorization.</li>
              <li>Exceed Meta Graph API rate limits intentionally or bypass security controls.</li>
              <li>Transmit malicious software, unauthorized web crawlers, or harmful code.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">
                4
              </span>
              Account Security & Token Management
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. AutoPage SaaS protects all Page Access Tokens via AES-256-GCM encryption at rest. If you suspect any compromise of your Facebook account, you must immediately revoke permissions in your Facebook Business Integrations settings.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">
                5
              </span>
              Limitation of Liability
            </h2>
            <p>
              AutoPage SaaS is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. Under no circumstances will AutoPage SaaS or its developers be held liable for any indirect, incidental, special, or consequential damages resulting from downtime, Meta Graph API outages, or Facebook page restrictions imposed by Meta.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 pt-4 border-t border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" />
              Contact Information
            </h2>
            <p className="text-xs text-slate-400">
              For questions regarding these Terms of Service:
            </p>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-xs text-slate-300 space-y-1">
              <p>Email: <strong className="text-white">niyamulhasan1089@gmail.com</strong></p>
              <p>Platform: <strong className="text-white">AutoPage SaaS</strong></p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 border-t border-white/10 pt-6">
          <p>© 2026 AutoPage SaaS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/data-deletion" className="hover:text-slate-300 transition-colors">
              Data Deletion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
