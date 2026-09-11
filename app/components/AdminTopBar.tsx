"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  Receipt,
  Store,
  ArrowUpRight,
  LogOut,
  Shield,
  ExternalLink,
} from "lucide-react";
import LogoMark from "./LogoMark";
import { useAuth } from "./AuthProvider";

interface AdminTopBarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMobile: () => void;
}

export default function AdminTopBar({
  collapsed,
  onToggleCollapse,
  onOpenMobile,
}: AdminTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, orders } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const pendingOrdersCount = orders.filter(
    (o) => o.status === "preparing" || o.status === "confirmed"
  ).length;

  const sectionTitles: { [key: string]: { label: string; parent: string } } = {
    "/admin": { label: "Analytics & Telemetry", parent: "Operations" },
    "/admin/products": { label: "Products & Stock Catalog", parent: "Inventory" },
    "/admin/orders": { label: "Orders & Dispatch Governance", parent: "Logistics" },
    "/admin/appearance": { label: "Storefront & Editorial CMS", parent: "Design" },
    "/admin/users": { label: "Users & Client Registry", parent: "Governance" },
    "/admin/settings": { label: "Settings, Promos & Cloud DB", parent: "System" },
  };

  // Match the best path prefix
  const matchedKey = Object.keys(sectionTitles)
    .sort((a, b) => b.length - a.length)
    .find((key) => (key === "/admin" ? pathname === "/admin" : pathname.startsWith(key)));

  const currentSection = matchedKey
    ? sectionTitles[matchedKey]
    : { label: "Administrative Console", parent: "Portal" };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* MOBILE TOP BAR (TOUCH-OPTIMIZED FOR VIEWPORTS < LG)           */}
      {/* ------------------------------------------------------------- */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#111111] text-white border-b border-neutral-800 px-3 sm:px-4 h-16 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenMobile}
            className="p-2 -ml-1 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
            aria-label="Open side navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/admin" className="flex items-center gap-2">
            <div className="bg-white p-1 rounded-xs flex-shrink-0">
              <LogoMark size="sm" />
            </div>
            <div className="min-w-0">
              <span className="block text-[8px] font-extrabold uppercase tracking-[0.2em] text-neutral-400 leading-none">
                YeHageré
              </span>
              <span className="text-xs font-bold text-white truncate block">Admin</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {pendingOrdersCount > 0 && (
            <Link
              href="/admin/orders"
              className="px-2 py-1 text-[11px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded flex items-center gap-1 min-h-[36px]"
              title={`${pendingOrdersCount} orders pending`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{pendingOrdersCount}</span>
            </Link>
          )}

          <Link
            href="/"
            target="_blank"
            className="px-2.5 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white border border-neutral-700 bg-neutral-900 rounded flex items-center gap-1 transition-colors min-h-[36px]"
            title="Preview Live Storefront"
          >
            <Store className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden xs:inline">Live</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* DESKTOP TOP BAR (STICKY HEADER ABOVE CONTENT ON LG+ SCREENS)  */}
      {/* ------------------------------------------------------------- */}
      <header className="hidden lg:flex h-16 bg-white border-b border-neutral-200 px-6 sm:px-8 items-center justify-between sticky top-0 z-30 shadow-2xs">
        {/* Left: Sidebar toggle & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded transition-colors"
            title={collapsed ? "Expand side navigation" : "Collapse side navigation"}
            aria-label={collapsed ? "Expand side navigation" : "Collapse side navigation"}
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          <div className="h-4 w-px bg-neutral-200" />

          {/* Breadcrumb path */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-extrabold uppercase tracking-[0.2em] text-neutral-400">
              YeHageré Atelier
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
            <span className="text-neutral-500 font-semibold">{currentSection.parent}</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
            <span className="font-bold text-black uppercase tracking-wider">
              {currentSection.label}
            </span>
          </div>
        </div>

        {/* Right: Quick shortcuts & Admin User chip */}
        <div className="flex items-center gap-3">
          {/* Pending Orders Pill */}
          {pendingOrdersCount > 0 && (
            <Link
              href="/admin/orders"
              className="px-3 py-1 text-xs font-bold bg-amber-50 border border-amber-300 text-amber-900 rounded flex items-center gap-1.5 hover:bg-amber-100 transition-colors shadow-2xs"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-700" />
              <span>{pendingOrdersCount} Pending Orders</span>
            </Link>
          )}

          {/* Live Storefront Link */}
          <Link
            href="/"
            target="_blank"
            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-black bg-white border border-neutral-300 hover:border-black rounded transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Open live customer storefront in new tab"
          >
            <Store className="w-3.5 h-3.5 text-neutral-600" />
            <span>Storefront</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
          </Link>

          <div className="h-4 w-px bg-neutral-200" />

          {/* User Profile Info */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center text-xs font-extrabold flex-shrink-0 shadow-2xs">
              {(user?.name || "AD").slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left leading-tight hidden xl:block">
              <span className="block text-xs font-bold text-black truncate max-w-[120px]">
                {user?.name || "Admin Staff"}
              </span>
              <span className="text-[10px] text-neutral-400 flex items-center gap-1 uppercase tracking-wider font-semibold">
                <Shield className="w-2.5 h-2.5 text-emerald-600" />
                Super Admin
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Sign Out"
              aria-label="Sign Out of Admin Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
