"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  ShoppingBag,
  MessageSquareCode,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Boxes,
  Send,
  Radio,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
  Globe,
  Bot,
  Flame,
  Award,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";

export default function WelcomeLandingPage() {
  const router = useRouter();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // Interactive Live Demo preview inside the hero
  const [demoInput, setDemoInput] = useState("আমার নাম রাকিব, ফোন 01712345678, ধানমন্ডি ৪/এ, ১টা পাঞ্জাবি লাগবে");
  const [demoReply, setDemoReply] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleTestBot = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setDemoReply(
        "🎉 ধন্যবাদ রাকিব! আপনার অর্ডার (#ORD-1001) সফলভাবে কনফার্ম করা হয়েছে!\n📦 পণ্য: Premium Cotton Panjabi\n💰 সর্বমোট: ৳1,850 (ক্যাশ অন ডেলিভারি)\n📱 মোবাইল: 01712345678\nশীঘ্রই ডেলিভারির জন্য যোগাযোগ করা হবে।"
      );
      setIsSimulating(false);
    }, 600);
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      const res = await fetch("/api/auth/demo-login", { method: "POST" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setIsAdminLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", { method: "POST" });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
      }
    } finally {
      setIsAdminLoading(false);
    }
  };

  const FEATURES = [
    {
      title: "Auto Post & Direct Media Upload",
      desc: "Instantly publish high-converting photo and text posts to Facebook pages with drag-and-drop media upload and Cloudinary CDN support.",
      icon: Send,
      badge: "Publishing",
      gradient: "from-blue-500/20 to-cyan-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Comment & Inbox Automation",
      desc: "Respond to customer comments in under 1 second. Send public replies and automated private Messenger DMs with smart keyword matching.",
      icon: MessageSquareCode,
      badge: "24/7 AI",
      gradient: "from-indigo-500/20 to-purple-500/10",
      border: "border-indigo-500/20",
    },
    {
      title: "Post Scheduler & Queue Engine",
      desc: "Schedule posts weeks in advance. Built-in Vercel Cron background worker reliably publishes posts every 5 minutes with zero server maintenance.",
      icon: CalendarDays,
      badge: "Cron Automated",
      gradient: "from-purple-500/20 to-pink-500/10",
      border: "border-purple-500/20",
    },
    {
      title: "Auto Order Collection Bot",
      desc: "Natural Language Bangladeshi address and phone number parser. Automatically extracts orders from Messenger, updates inventory, and confirms in Bengali.",
      icon: ShoppingBag,
      badge: "Social Commerce",
      gradient: "from-emerald-500/20 to-teal-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Zero Monthly Tool Fees",
      desc: "Stop paying expensive monthly subscription fees to third-party tools. Own your complete multi-tenant infrastructure with Bring-Your-Own-Token freedom.",
      icon: Award,
      badge: "Cost Saver",
      gradient: "from-amber-500/20 to-orange-500/10",
      border: "border-amber-500/20",
    },
    {
      title: "Bank-Grade AES-256 Security",
      desc: "Meta Page Tokens are encrypted with AES-256-GCM at rest, HMAC SHA-256 webhook signatures, edge JWT sessions, and strict multi-tenant isolation.",
      icon: ShieldCheck,
      badge: "Enterprise Safe",
      gradient: "from-blue-600/20 to-indigo-600/10",
      border: "border-blue-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] -left-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[60%] -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/welcome" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-glow">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                AutoPage <span className="text-[10px] text-blue-400 font-mono font-normal px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/20">v21.0</span>
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#simulator" className="hover:text-white transition-colors">Order Bot Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Production-Ready Multi-Tenant Facebook Automation SaaS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
          Automate Facebook Posts, Comments, and{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            Social Orders with Zero Fees.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The ultimate 100% commercial SaaS platform for modern Facebook merchants.
          Features 24/7 AI comment & DM automation, automated Bengali order extraction,
          post scheduling, and zero monthly tool overhead.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all cursor-pointer"
          >
            <span>Launch Free Merchant Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={handleDemoLogin}
            disabled={isDemoLoading}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 font-semibold text-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>{isDemoLoading ? "Loading Demo..." : "One-Click Demo Login"}</span>
          </button>

          <button
            onClick={handleAdminLogin}
            disabled={isAdminLoading}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold text-sm transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>{isAdminLoading ? "Loading..." : "Super Admin Panel"}</span>
          </button>
        </div>

        {/* Metrics Row */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { label: "Response Speed", val: "< 1.2s", sub: "Ultra-fast comment replies" },
            { label: "Order Capture", val: "100% Auto", sub: "BD phone & address parser" },
            { label: "Token Security", val: "AES-256", sub: "Encrypted at rest" },
            { label: "Cost Savings", val: "৳0 Monthly", sub: "Zero third-party tool fees" },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl glass-panel border border-white/5 text-center"
            >
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {stat.val}
              </div>
              <div className="text-xs font-semibold text-blue-400 mt-0.5">{stat.label}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Bot & Order Simulator Demo Section */}
      <section id="simulator" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="rounded-3xl glass-panel border border-blue-500/20 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Interactive Live Simulator
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                Bengali Order Bot & Stock Checker Engine
              </h2>
            </div>
            <Badge variant="info" className="self-start sm:self-auto font-mono text-xs">
              Layer 1 & 2 Active
            </Badge>
          </div>

          <div className="mt-6 space-y-4">
            <p className="text-xs text-slate-400">
              Type or select a customer query in Bengali to test instant order extraction, stock inquiries, or pricing:
            </p>

            <div className="flex flex-wrap gap-2">
              {[
                "আমার নাম রাকিব, ফোন 01712345678, ধানমন্ডি ৪/এ, ১টা পাঞ্জাবি লাগবে",
                "ইয়ারবাডস এর দাম কত এবং স্টক আছে?",
                "ঘড়ি স্টক আছে কি না জানাবেন?",
              ].map((sample, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDemoInput(sample)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs border border-white/10 transition-colors text-left"
                >
                  &quot;{sample.slice(0, 35)}...&quot;
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                placeholder="Type customer message..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <Button
                onClick={handleTestBot}
                isLoading={isSimulating}
                className="px-6 py-3 shrink-0 cursor-pointer"
              >
                Simulate Reply
              </Button>
            </div>

            {demoReply && (
              <div className="mt-4 p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-slate-200 text-xs font-sans leading-relaxed whitespace-pre-line animate-in fade-in">
                <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1 font-mono uppercase text-[10px]">
                  <Bot className="w-3.5 h-3.5" /> Bot Instant Response:
                </div>
                {demoReply}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="info" className="font-mono uppercase text-xs mb-3">
            Core Modules
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Designed for Commercial High-Volume Operations
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-4">
            Everything you need to automate your social commerce business from one unified control center.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className={`p-6 rounded-2xl glass-panel border ${feat.border} bg-gradient-to-br ${feat.gradient} hover:scale-[1.02] transition-all group`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.06] text-slate-300 font-semibold">
                    {feat.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing / Plan Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="purple" className="font-mono uppercase text-xs mb-3">
            SaaS Tiering
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Transparent, Predictable Plans
          </h2>
          <p className="text-slate-400 text-sm mt-3">
            Choose the plan that suits your scale. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="p-6 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-slate-400 font-semibold">Free Tier</span>
              <div className="text-3xl font-extrabold text-white mt-2">$0 <span className="text-xs font-normal text-slate-400">/ forever</span></div>
              <p className="text-xs text-slate-400 mt-2">Perfect for evaluating and individual content creators.</p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1 Connected Page</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Basic Keyword Auto-Replies</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 5 Scheduled Posts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Community Support</li>
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-8 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold text-center border border-white/10 transition-colors block"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Tier (Popular) */}
          <div className="p-6 rounded-2xl glass-panel border border-blue-500/40 bg-blue-600/10 flex flex-col justify-between shadow-glow relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase font-mono tracking-wider">
              Most Popular
            </div>
            <div>
              <span className="text-xs font-mono uppercase text-blue-400 font-semibold">Merchant Pro</span>
              <div className="text-3xl font-extrabold text-white mt-2">$29 <span className="text-xs font-normal text-slate-400">/ month</span></div>
              <p className="text-xs text-slate-300 mt-2">Ideal for high-volume Facebook e-commerce stores.</p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> 5 Connected Pages</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Auto Order Bot & Stock Decrement</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Unlimited Scheduled Posts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Private Messenger Reply Engine</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Live Simulator & Activity Logs</li>
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-8 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold text-center shadow-glow transition-all block"
            >
              Start 14-Day Trial
            </Link>
          </div>

          {/* Agency Tier */}
          <div className="p-6 rounded-2xl glass-panel border border-indigo-500/20 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-indigo-400 font-semibold">Agency & Enterprise</span>
              <div className="text-3xl font-extrabold text-white mt-2">$99 <span className="text-xs font-normal text-slate-400">/ month</span></div>
              <p className="text-xs text-slate-400 mt-2">For digital agencies managing dozens of client pages.</p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Unlimited Connected Pages</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Multi-Tenant Super Admin Access</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Cloudinary Media CDN Integration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Dedicated IP & Priority Webhooks</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> 24/7 Priority SLA Support</li>
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-8 w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold text-center border border-indigo-500/30 transition-colors block"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Security & Architecture */}
      <section id="security" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-white/5">
        <div className="p-8 rounded-3xl glass-panel border border-emerald-500/20 bg-emerald-950/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase font-bold">
              <ShieldCheck className="w-4 h-4" /> Production Grade Security Architecture
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Tenant-Isolated & Encrypted by Default
            </h3>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Every sensitive Facebook Page Access Token is encrypted with AES-256-GCM. Client responses never expose raw tokens. Webhooks are cryptographically authenticated using HMAC SHA-256 with automated replay deduplication.
            </p>
          </div>
          <Link
            href="/login"
            className="px-5 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold whitespace-nowrap transition-colors"
          >
            Access Secure Portal
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white">
            <Zap className="w-3 h-3" />
          </div>
          <span className="font-bold text-slate-300">AutoPage SaaS Platform</span>
        </div>
        <p>© 2026 AutoPage System. 100% Commercial, Multi-Tenant Facebook Social Commerce Platform.</p>
        <div className="flex items-center justify-center gap-6 mt-4">
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-slate-300 transition-colors">
            Terms of Service
          </Link>
          <Link href="/data-deletion" className="hover:text-slate-300 transition-colors">
            User Data Deletion
          </Link>
        </div>
      </footer>
    </div>
  );
}
