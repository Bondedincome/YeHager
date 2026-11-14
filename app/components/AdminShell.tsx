"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LogIn } from "./icons";
import AdminSidebar from "./AdminSidebar";
import AdminTopBar from "./AdminTopBar";
import LogoMark from "./LogoMark";
import { useAuth } from "./AuthProvider";

const COLLAPSE_KEY = "yehagere_admin_sidebar_collapsed";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, authLoading, mutationError } = useAuth();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <div className="size-8 rounded-full border-2 border-black border-t-transparent animate-spin" />
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white border border-neutral-200 rounded-lg p-8 text-center space-y-5">
          <LogoMark size="md" className="mx-auto" />
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Admin access only</h1>
            <p className="text-sm text-neutral-600">
              {user
                ? `You're signed in as ${user.email}, which isn't an admin account.`
                : "Sign in with an admin account to continue."}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/admin/login" className="btn-primary rounded-md">
              <LogIn className="size-4" /> Sign in
            </Link>
            <Link href="/" className="h-11 flex items-center justify-center gap-2 text-sm text-neutral-600 hover:text-black">
              <ArrowLeft className="size-4" /> Back to store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white text-black">
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 min-w-0">
          {mutationError && (
            <div className="mx-4 sm:mx-8 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {mutationError}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
