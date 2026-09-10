"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Lock, User, ShieldCheck } from "lucide-react";
import LogoMark from "../../components/LogoMark";
import { useAuth } from "../../components/AuthProvider";

export default function LoginClient() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await login(username, password);
      if (!res.success) {
        throw new Error(res.error || "Invalid username or password");
      }
      router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setUsername("admin");
    setPassword("admin123");
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-12 px-4 sm:px-6">
      {/* Top Header / Brand Logo */}
      <div className="max-w-md w-full mx-auto text-center pt-4">
        <Link href="/" className="inline-block hover:opacity-85 transition-opacity mb-6">
          <LogoMark size="lg" className="mx-auto" />
        </Link>
        <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1">
          Atelier &amp; Administration
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
          Staff Portal
        </h1>
        <p className="text-xs text-neutral-600 mt-2 max-w-xs mx-auto leading-relaxed">
          Sign in to manage the garment collections, inventory, and storefront curation.
        </p>
      </div>

      {/* Main Form Box */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-white border border-neutral-200 p-8 sm:p-10 shadow-none">
          <form onSubmit={submit} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-black uppercase tracking-wider flex items-center justify-between">
                <span>Username</span>
                <User className="w-3.5 h-3.5 text-neutral-400" />
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-[#f4f4f4] border-none px-4 py-3.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black transition-all"
                required
                autoComplete="username"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-black uppercase tracking-wider flex items-center justify-between">
                <span>Password</span>
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-[#f4f4f4] border-none px-4 py-3.5 pr-11 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black transition-all"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-[#fafafa] border border-red-200 text-red-600 text-xs p-3 text-center">
                {error}
              </div>
            )}

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black text-white py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {submitting ? "Authenticating..." : "Sign In to Atelier"}
              </button>
            </div>

            {/* Demo Credential Quick-Helper */}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                Default: <strong className="text-black font-semibold">admin</strong> / <strong className="text-black font-semibold">admin123</strong>
              </span>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="text-black underline font-semibold uppercase tracking-wider text-[10px] hover:opacity-75"
              >
                Auto-fill
              </button>
            </div>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Storefront
          </Link>
        </div>
      </div>

      {/* Subtle Bottom Footer */}
      <div className="text-center text-[11px] text-neutral-400 uppercase tracking-widest pb-4">
        YeHageré™ Atelier • Addis Ababa
      </div>
    </div>
  );
}
