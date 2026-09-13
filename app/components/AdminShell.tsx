"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, ArrowLeft, LogIn } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import AdminTopBar from "./AdminTopBar";
import AdminFooter from "./AdminFooter";
import { useAuth } from "./AuthProvider";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, authLoading } = useAuth();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("yehagere_admin_sidebar_collapsed") === "true";
      } catch {
        return false;
      }
    }
    return false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("yehagere_admin_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // 1. Session verification loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-2 border-[#d4af37] border-t-transparent animate-spin mb-4" />
        <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">Verifying Atelier Credentials</p>
        <p className="text-xs text-neutral-400 mt-1">Authenticating secure administrative session...</p>
      </div>
    );
  }

  // 2. Access Denied Guard: If not signed in or not an admin, block rendering of admin tools
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-neutral-900/80 border border-neutral-800 p-8 md:p-10 shadow-2xl backdrop-blur-md">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>

          <span className="inline-block px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-amber-400 bg-amber-500/10 border border-amber-500/20 mb-3">
            Restricted Administrative Access
          </span>

          <h1 className="text-2xl font-serif tracking-tight text-white mb-3">
            Atelier Executive Console
          </h1>

          <p className="text-sm text-neutral-400 leading-relaxed mb-8">
            {user ? (
              <>
                You are currently signed in as <span className="text-white font-medium">{user.email}</span> ({user.role}). Administrator privileges are required to access management controls, patron records, and financial analytics.
              </>
            ) : (
              <>
                You must be authenticated as an atelier administrator to access executive controls, inventory curation, and customer orders.
              </>
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/admin/login"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-black text-xs uppercase tracking-[0.15em] font-semibold py-3.5 px-5 hover:bg-[#d4af37] hover:text-black transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In to Console
            </Link>

            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 border border-neutral-700 text-neutral-300 text-xs uppercase tracking-[0.15em] font-semibold py-3.5 px-5 hover:border-neutral-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Admin Workspace
  return (
    <div className="min-h-screen flex bg-[#f8f8f8] text-black">
      {/* Side Navigation (Desktop Permanent Sticky Sidebar + Mobile Off-Canvas Drawer) */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Admin Workspace (Top Bar, Dynamic Route Content, System Footer) */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          onOpenMobile={() => setMobileOpen(true)}
        />

        <main className="flex-1 min-w-0 bg-[#f8f8f8]">{children}</main>

        <AdminFooter />
      </div>
    </div>
  );
}
