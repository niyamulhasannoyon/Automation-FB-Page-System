import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Eye,
  Server,
  FileText,
  UserCheck,
  Mail,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export const metadata = {
  title: "Privacy Policy | AutoPage SaaS",
  description:
    "Official Privacy Policy for AutoPage SaaS Facebook Page Automation Suite, adhering to Meta Platform Terms and GDPR compliance.",
};

export default function PrivacyPolicyPage() {
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
        <div className="p-8 rounded-3xl glass-panel border border-blue-500/20 bg-gradient-to-r from-blue-950/30 via-slate-900/40 to-slate-950/40 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> Meta Platform Compliance & Data Privacy
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: {lastUpdated} • Applicable to AutoPage SaaS and Meta Facebook Integrations
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="p-8 rounded-3xl glass-panel border border-white/10 space-y-8 text-sm leading-relaxed text-slate-300">
          {/* Section 1: Introduction */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">
                1
              </span>
              Overview & Scope
            </h2>
            <p>
              AutoPage SaaS (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the AutoPage Facebook Page Automation Platform. This Privacy Policy details how we collect, store, encrypt, and process information when you connect your Facebook Pages, configure automated comment replies, schedule posts, and utilize AI customer engagement tools.
            </p>
            <p>
              By accessing AutoPage SaaS or connecting a Meta Facebook Page, you acknowledge and agree to the practices outlined in this policy in accordance with Meta Platform Terms and General Data Protection Regulations (GDPR).
            </p>
          </section>

          {/* Section 2: Data We Access & Collect */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">
                2
              </span>
              Data We Access & Collect
            </h2>
            <p>
              When authorized through Meta Facebook Login or via Business System User tokens, AutoPage SaaS accesses only the minimum necessary permissions required to fulfill automated commerce and response services:
            </p>
            <ul className="space-y-2 list-none pl-2">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Page Information:</strong> Page Name, Page ID, Profile Picture, and Page Access Tokens.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Public Comments & Feed Activity:</strong> Public comments left on your connected page posts to trigger automated rule-based and AI replies.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Direct Messenger Webhook Events:</strong> Customer inquiries and order details (Name, Phone, Delivery Address, Product Inquiries) sent directly to your Facebook Page Messenger inbox.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">User Account Credentials:</strong> Store name, merchant contact email, and session authentication identifiers.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 3: Token Encryption & Security */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">
                3
              </span>
              Security & AES-256-GCM Token Encryption
            </h2>
            <p>
              We enforce enterprise-grade security protocols across all layers:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5" /> AES-256-GCM Encryption
                </div>
                <p className="text-xs text-slate-400">
                  Every Facebook Page Access Token is encrypted at rest using AES-256-GCM cryptographic standards. Client browsers never receive unmasked token credentials.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
                  <Server className="w-3.5 h-3.5" /> HMAC SHA-256 Webhooks
                </div>
                <p className="text-xs text-slate-400">
                  All Meta webhook payloads are cryptographically verified using HMAC SHA-256 signatures with automated replay attack deduplication.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Data Retention & Deletion */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">
                4
              </span>
              Data Retention, User Rights & Deletion
            </h2>
            <p>
              You maintain complete ownership of your Facebook Page data. In compliance with Meta Platform Policies and GDPR:
            </p>
            <ul className="space-y-2 list-none pl-2">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Disconnection & Immediate Purge:</strong> When you disconnect a Facebook Page from your AutoPage dashboard, all associated access tokens, automated rules, and scheduled posts are permanently destroyed.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Data Deletion Request:</strong> You or any Facebook user may request total deletion of their personal data at any time via our{" "}
                  <Link href="/data-deletion" className="text-blue-400 underline hover:text-blue-300">
                    User Data Deletion Request Page
                  </Link>
                  .
                </span>
              </li>
            </ul>
          </section>

          {/* Section 5: Third-Party Disclosures */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">
                5
              </span>
              Third-Party Service Providers
            </h2>
            <p>
              AutoPage SaaS does not sell, rent, or trade your Facebook data to advertisers or third parties. We interact only with authorized infrastructure providers necessary for service operations:
            </p>
            <p className="text-xs text-slate-400">
              • <strong>Meta Graph API:</strong> For fetching comments, publishing replies, and sending Messenger confirmations.
              <br />
              • <strong>Google Gemini API:</strong> For processing contextual AI sales and customer query responses (only sanitized customer queries are processed).
              <br />
              • <strong>MongoDB Atlas:</strong> Encrypted multi-tenant cloud storage.
            </p>
          </section>

          {/* Section 6: Contact */}
          <section className="space-y-3 pt-4 border-t border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" />
              Contact & Data Protection Officer
            </h2>
            <p className="text-xs text-slate-400">
              For any questions regarding this Privacy Policy, your rights, or data deletion inquiries, please contact our Data Protection Officer:
            </p>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-xs text-slate-300 space-y-1">
              <p>Email: <strong className="text-white">niyamulhasan1089@gmail.com</strong></p>
              <p>Application: <strong className="text-white">AutoPage SaaS (App ID: 28937063992656010)</strong></p>
              <p>Jurisdiction: Global / Meta Platform Terms Compliant</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 border-t border-white/10 pt-6">
          <p>© 2026 AutoPage SaaS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms of Service
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
