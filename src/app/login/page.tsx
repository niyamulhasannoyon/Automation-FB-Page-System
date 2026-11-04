"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Radio,
} from "lucide-react";
import { Button } from "@/components/common/Button";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      // If logging in as admin, redirect directly to /admin
      if (data.user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setError(null);
    setIsAdminLoading(true);

    try {
      const res = await fetch("/api/auth/admin-login", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize admin session.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message);
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setIsDemoLoading(true);

    try {
      const res = await fetch("/api/auth/demo-login", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize demo session.");
      }

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message);
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background Neon Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/15 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-[1px] shadow-glow mx-auto mb-2">
            <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            AutoPage SaaS <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">v21.0</span>
          </h1>
          <p className="text-xs text-slate-400">
            Multi-Tenant Facebook Automation & E-Commerce Platform
          </p>
        </div>

        {/* Main Card */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 shadow-2xl space-y-6">
          {/* Super Admin & Merchant Quick Access Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isAdminLoading}
              onClick={handleAdminLogin}
              className="w-full font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.35)] text-xs py-2.5"
              icon={<ShieldCheck className="w-4 h-4 text-amber-300" />}
            >
              Super Admin Mode
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={isDemoLoading}
              onClick={handleDemoLogin}
              className="w-full font-semibold text-xs py-2.5"
              icon={<ArrowRight className="w-4 h-4 text-blue-400" />}
            >
              Merchant Demo
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-white/10" />
            <span className="text-[11px] font-mono uppercase text-slate-500">
              or continue with account
            </span>
            <div className="flex-1 h-[1px] bg-white/10" />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-300 mb-1.5">
                  Full Name / Merchant Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Arif Rahman"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="secondary"
              isLoading={isLoading}
              className="w-full font-semibold mt-2"
            >
              {isRegister ? "Create Account & Get Started" : "Sign In to Dashboard"}
            </Button>
          </form>

          {/* Switch Register/Login */}
          <div className="text-center pt-2 border-t border-white/5 space-y-1.5">
            <div>
              <Link
                href="/register"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Need a new merchant account? Register here →
              </Link>
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {isRegister
                  ? "Already have an account? Sign in here"
                  : "Or toggle quick registration on this page"}
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Encrypted with AES-256-GCM & JWT Session Authentication</span>
        </div>
      </div>
    </div>
  );
}
