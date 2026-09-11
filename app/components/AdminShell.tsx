"use client";

import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopBar from "./AdminTopBar";
import AdminFooter from "./AdminFooter";

export default function AdminShell({ children }: { children: React.ReactNode }) {
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
