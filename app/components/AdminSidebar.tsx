"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChartLine,
  LayoutTemplate,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Receipt,
  Settings,
  ShoppingBag,
  Users,
  X,
} from "./icons";
import LogoMark from "./LogoMark";
import { useAuth } from "./AuthProvider";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", icon: BarChart3, exact: true },
  { label: "Orders", href: "/admin/orders", icon: Receipt },
  { label: "Profit & loss", href: "/admin/analytics", icon: ChartLine },
  { label: "Products", href: "/admin/products", icon: ShoppingBag },
  { label: "Homepage", href: "/admin/appearance", icon: LayoutTemplate },
  { label: "Customers", href: "/admin/users", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
] as const;

export function isAdminLinkActive(pathname: string | null, href: string, exact?: boolean) {
  if (!pathname) return false;
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return exact ? path === href : path === href || path.startsWith(href + "/");
}

export default function AdminSidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, orders } = useAuth();

  const pending = orders.filter((o) => o.status === "preparing" || o.status === "confirmed").length;

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const renderNav = (compact: boolean, onNavigate?: () => void) => (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {ADMIN_NAV.map((item) => {
        const active = isAdminLinkActive(pathname, item.href, "exact" in item ? item.exact : false);
        const Icon = item.icon;
        const badge = item.href === "/admin/orders" ? pending : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={compact ? item.label : undefined}
            className={`relative flex items-center gap-3 h-10 rounded-md text-sm transition-colors ${
              compact ? "justify-center" : "px-3"
            } ${active ? "bg-black text-white font-semibold" : "text-neutral-700 hover:bg-neutral-100"}`}
          >
            <Icon className="size-5" />
            {!compact && <span className="flex-1">{item.label}</span>}
            {badge > 0 &&
              (compact ? (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-amber-500" />
              ) : (
                <span
                  className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                    active ? "bg-white text-black" : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {badge}
                </span>
              ))}
          </Link>
        );
      })}
    </nav>
  );

  const renderUser = (compact: boolean) => (
    <div className={`border-t border-neutral-200 p-3 flex items-center gap-3 ${compact ? "flex-col" : ""}`}>
      <div className="size-9 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold shrink-0">
        {(user?.name || "A").slice(0, 1).toUpperCase()}
      </div>
      {!compact && (
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{user?.name || "Admin"}</p>
          <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
        </div>
      )}
      <button
        type="button"
        onClick={handleLogout}
        className="size-9 flex items-center justify-center rounded-md text-neutral-500 hover:text-black hover:bg-neutral-100"
        title="Sign out"
        aria-label="Sign out"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white flex flex-col">
            <div className="h-16 px-4 flex items-center justify-between border-b border-neutral-200">
              <Link href="/admin" onClick={onCloseMobile} className="flex items-center gap-2">
                <LogoMark size="sm" />
                <span className="text-xs font-semibold text-neutral-500">Admin</span>
              </Link>
              <button
                type="button"
                onClick={onCloseMobile}
                className="size-10 flex items-center justify-center rounded-md hover:bg-neutral-100"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            {renderNav(false, onCloseMobile)}
            {renderUser(false)}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 bg-white border-r border-neutral-200 shrink-0 transition-[width] duration-200 ${
          collapsed ? "w-[72px]" : "w-60"
        }`}
      >
        <div className={`h-16 flex items-center border-b border-neutral-200 ${collapsed ? "justify-center" : "justify-between px-4"}`}>
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2 min-w-0">
              <LogoMark size="sm" />
              <span className="text-xs font-semibold text-neutral-500">Admin</span>
            </Link>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="size-9 flex items-center justify-center rounded-md text-neutral-500 hover:text-black hover:bg-neutral-100"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
          </button>
        </div>
        {renderNav(collapsed)}
        {renderUser(collapsed)}
      </aside>
    </>
  );
}
