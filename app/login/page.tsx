"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  Shield,
  Sparkles,
  CheckCircle2,
  XCircle,
  KeyRound,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import LogoMark from "../components/LogoMark";
import { getPasswordStrengthInfo } from "../lib/auth-security";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, register } = useAuth();

  const strength = getPasswordStrengthInfo(password);
  const passwordsMatch = !confirmPassword || password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
      if (!strength.hasLetter) {
        setError("Password must contain at least one letter.");
        return;
      }
      if (!strength.hasNumber) {
        setError("Password must contain at least one number.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please verify your confirmation.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || "Authentication failed. Please verify your credentials.");
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
          setError(res.error || "Registration failed. Please check your information.");
          setLoading(false);
          return;
        }
        router.push("/account");
      }
    } catch {
      setError("An unexpected error occurred. Please check your connection.");
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
      setError(res.error || "Authentication failed.");
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
              ? "Access your saved wardrobe, order tracking, order history, and expedited bespoke checkout."
              : "Join our private patron roster with encrypted biometric-grade security and private atelier previews."}
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
        <div className="bg-white border border-neutral-200 p-6 sm:p-10 shadow-sm space-y-6">
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
                <span>Email Address / ID</span>
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@yehagere.com or admin"
                className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                autoComplete="username"
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
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Registration Password Security Meter & Criteria */}
            {mode === "register" && password.length > 0 && (
              <div className="space-y-2 p-3 bg-neutral-50 border border-neutral-200">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500 font-semibold">Password Strength:</span>
                  <span
                    className={`font-bold uppercase tracking-wider ${
                      strength.score <= 1
                        ? "text-rose-600"
                        : strength.score === 2
                        ? "text-amber-600"
                        : strength.score === 3
                        ? "text-sky-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {strength.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="grid grid-cols-4 gap-1 h-1.5">
                  <div
                    className={`h-full rounded-xs transition-colors ${
                      strength.score >= 1 ? (strength.score === 1 ? "bg-rose-500" : "bg-emerald-500") : "bg-neutral-200"
                    }`}
                  />
                  <div
                    className={`h-full rounded-xs transition-colors ${
                      strength.score >= 2 ? (strength.score === 2 ? "bg-amber-500" : "bg-emerald-500") : "bg-neutral-200"
                    }`}
                  />
                  <div
                    className={`h-full rounded-xs transition-colors ${
                      strength.score >= 3 ? (strength.score === 3 ? "bg-sky-500" : "bg-emerald-500") : "bg-neutral-200"
                    }`}
                  />
                  <div
                    className={`h-full rounded-xs transition-colors ${
                      strength.score >= 4 ? "bg-emerald-500" : "bg-neutral-200"
                    }`}
                  />
                </div>

                {/* Requirements checklist */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-neutral-600">
                  <div className="flex items-center gap-1.5">
                    {strength.hasMinLength ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-neutral-400" />
                    )}
                    <span>8+ characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {strength.hasLetter ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-neutral-400" />
                    )}
                    <span>Letters (a-z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {strength.hasNumber ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-neutral-400" />
                    )}
                    <span>Numbers (0-9)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {strength.hasSpecial ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <span className="w-3 h-3 inline-block rounded-full bg-neutral-200 text-center text-[8px] leading-3 text-neutral-500">•</span>
                    )}
                    <span>Symbol (optional)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Password Field (Register Mode) */}
            {mode === "register" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-black flex items-center justify-between">
                  <span>Confirm Password</span>
                  <KeyRound className="w-3.5 h-3.5 text-neutral-400" />
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#f4f4f4] px-4 py-3 pr-11 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Passwords do not match</span>
                  </p>
                )}
                {confirmPassword.length > 0 && passwordsMatch && (
                  <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Passwords match</span>
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || (mode === "register" && (!passwordsMatch || !strength.hasMinLength || !strength.hasLetter || !strength.hasNumber))}
                className="w-full bg-black text-white py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? "Verifying..." : mode === "login" ? "Sign In to Atelier" : "Create Secure Account"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Secure Fast Sign-In Access Bar */}
          <div className="pt-6 border-t border-neutral-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
                Authorized Patron &amp; Staff Access
              </span>
              <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                PBKDF2 Secured
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("daniot.mihrete-ug@aau.edu.et", "password123")}
                className="w-full text-left px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs text-neutral-800 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-neutral-700 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-black block text-xs">Daniot Mihrete</span>
                    <span className="text-[10px] text-neutral-500">VIP Patron Account • Addis Ababa</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 hover:text-black">
                  Fast Sign-in →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin@yehagere.com", "admin123")}
                className="w-full text-left px-3.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 text-xs transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white block text-xs">Atelier Director</span>
                    <span className="text-[10px] text-neutral-400">Staff Administrator Portal</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-400">
                  Staff Sign-in →
                </span>
              </button>
            </div>
          </div>

          {/* Cryptographic Security Details */}
          <div className="p-3 bg-neutral-50 border border-neutral-200/70 text-[11px] text-neutral-500 space-y-1.5">
            <div className="flex items-center gap-1.5 text-neutral-700 font-bold uppercase tracking-wider text-[10px]">
              <Shield className="w-3.5 h-3.5 text-black" />
              <span>Cryptographic Security Standards</span>
            </div>
            <ul className="space-y-1 text-[10px] text-neutral-600 list-disc list-inside">
              <li>100,000 PBKDF2-SHA256 derivation rounds with unique 16-byte random salts.</li>
              <li>Constant-time equality comparison prevents timing side-channel attacks.</li>
              <li>HMAC-SHA256 signed session tokens with automated expiration.</li>
              <li>Brute-force protection: automatic temporary lockout after consecutive failures.</li>
            </ul>
          </div>
        </div>

        {/* Security badge */}
        <div className="text-center text-[11px] text-neutral-400 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
          <span>Encrypted Session Authentication • PCI DSS &amp; GDPR Compliant</span>
        </div>
      </div>
    </div>
  );
}
