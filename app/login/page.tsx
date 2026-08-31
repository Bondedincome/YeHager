"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, ArrowRight, UserCheck, Shield, Sparkles } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import LogoMark from "../components/LogoMark";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || "Login failed");
          setLoading(false);
          return;
        }
        if (res.user?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/account");
        }
      } else {
        const res = await register(name, email, password);
        if (!res.success) {
          setError(res.error || "Registration failed");
          setLoading(false);
          return;
        }
        router.push("/account");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string, pass: string) => {
    setEmail(userEmail);
    setPassword(pass);
    setError("");
    setLoading(true);
    const res = await login(userEmail, pass);
    if (res.success) {
      if (res.user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/account");
      }
    } else {
      setError(res.error || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-8 bg-[#fafafa]">
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Brand & Subtitle */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block hover:opacity-85 transition-opacity">
            <LogoMark size="lg" className="mx-auto" />
          </Link>
          <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">
            Atelier Client Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
            {mode === "login" ? "Sign In to Your Account" : "Create Patron Account"}
          </h1>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
            {mode === "login"
              ? "Access your saved wardrobe, previous Stripe receipts, order tracking, and expedited checkout."
              : "Join our private client roster for bespoke atelier updates, order histories, and private previews."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-neutral-200/80 p-1 rounded-none text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`py-2.5 transition-all ${
              mode === "login" ? "bg-white text-black shadow-xs" : "text-neutral-600 hover:text-black"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`py-2.5 transition-all ${
              mode === "register" ? "bg-white text-black shadow-xs" : "text-neutral-600 hover:text-black"
            }`}
          >
            New Account
          </button>
        </div>

        {/* Main Form Box */}
        <div className="bg-white border border-neutral-200 p-8 sm:p-10 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-black">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Daniot Mihrete"
                  className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-black flex items-center justify-between">
                <span>Email Address</span>
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@yehagere.com or admin"
                className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-black flex items-center justify-between">
                <span>Password</span>
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#f4f4f4] px-4 py-3 pr-11 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? "Verifying..." : mode === "login" ? "Sign In to Atelier" : "Create Account"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-8 pt-6 border-t border-neutral-100 space-y-3">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 text-center">
              Quick Switch Accounts
            </span>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("daniot.mihrete-ug@aau.edu.et", "password123")}
                className="w-full text-left px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs text-neutral-800 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-neutral-700" />
                  <div>
                    <span className="font-bold text-black block text-xs">Daniot Mihrete (Patron)</span>
                    <span className="text-[10px] text-neutral-500">2 Orders • VIP Client</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-neutral-400">Auto-fill →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin", "admin123")}
                className="w-full text-left px-3.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 text-xs transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-bold text-white block text-xs">Atelier Admin Portal</span>
                    <span className="text-[10px] text-neutral-400">admin / admin123 • Full Control</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-400">Staff Portal →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="text-center text-[11px] text-neutral-400 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
          <span>Encrypted 256-bit token authentication • Stripe PCI DSS Compliant</span>
        </div>
      </div>
    </div>
  );
}
