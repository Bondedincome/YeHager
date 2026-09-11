"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Sliders,
  ShoppingBag,
  Users,
  Receipt,
  ArrowUpRight,
  LogOut,
  Shield,
  Settings,
  X,
  PanelLeftClose,
  PanelLeft,
  Database,
  ShieldCheck,
  Store,
} from "lucide-react";
import LogoMark from "./LogoMark";
import { useAuth } from "./AuthProvider";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function AdminSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
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

  const navGroups = [
    {
      title: "Core Operations",
      items: [
        {
          label: "Analytics & KPIs",
          shortLabel: "Analytics",
          href: "/admin",
          icon: BarChart3,
          exact: true,
          description: "Telemetry, revenue & trends",
        },
        {
          label: "Products & Stock",
          shortLabel: "Products",
          href: "/admin/products",
          icon: ShoppingBag,
          description: "Catalog & inventory control",
        },
        {
          label: "Orders & Dispatch",
          shortLabel: "Orders",
          href: "/admin/orders",
          icon: Receipt,
          badge: pendingOrdersCount,
          description: "Fulfillment & tracking",
        },
      ],
    },
    {
      title: "Studio & Governance",
      items: [
        {
          label: "Storefront CMS",
          shortLabel: "CMS",
          href: "/admin/appearance",
          icon: Sliders,
          description: "Hero, lookbook & editorial",
        },
        {
          label: "Users & Clients",
          shortLabel: "Users",
          href: "/admin/users",
          icon: Users,
          description: "Customer accounts & roles",
        },
        {
          label: "Settings & Promos",
          shortLabel: "Settings",
          href: "/admin/settings",
          icon: Settings,
          description: "Rates, promos & cloud DB",
        },
      ],
    },
  ];

  const isLinkActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* MOBILE SIDE NAVIGATION DRAWER (OFF-CANVAS SLIDE-IN)           */}
      {/* ------------------------------------------------------------- */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Sidebar */}
          <aside className="relative w-80 max-w-[85vw] bg-[#111111] text-white flex flex-col h-full shadow-2xl border-r border-neutral-800 z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <Link href="/admin" onClick={onCloseMobile} className="flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-xs">
                  <LogoMark size="sm" />
                </div>
                <div>
                  <span className="block text-[9px] font-extrabold uppercase tracking-[0.25em] text-neutral-400">
                    YeHageré Atelier
                  </span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    Admin Navigation
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={onCloseMobile}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {navGroups.map((group) => (
                <div key={group.title} className="space-y-1.5">
                  <div className="px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-neutral-400">
                    {group.title}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isLinkActive(item);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onCloseMobile}
                          className={`w-full flex items-center justify-between px-3.5 py-3 rounded text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] ${
                            active
                              ? "bg-white text-black font-extrabold shadow-sm"
                              : "text-neutral-300 hover:text-white hover:bg-neutral-800/80"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${active ? "text-black" : "text-neutral-400"}`} />
                            <div className="text-left">
                              <div>{item.label}</div>
                              <div
                                className={`text-[10px] font-normal tracking-normal lowercase first-letter:uppercase ${
                                  active ? "text-neutral-600" : "text-neutral-400"
                                }`}
                              >
                                {item.description}
                              </div>
                            </div>
                          </div>

                          {item.badge !== undefined && item.badge > 0 && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                                active ? "bg-black text-white" : "bg-amber-400 text-black"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Storefront Link in Drawer */}
              <div className="pt-2 border-t border-neutral-800 space-y-2">
                <Link
                  href="/"
                  target="_blank"
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-neutral-800/80 border border-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Store className="w-4 h-4 text-neutral-400" />
                    <span>Live Storefront</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-neutral-400" />
                </Link>
              </div>
            </div>

            {/* Mobile Drawer Footer with User & Sign Out */}
            <div className="p-4 border-t border-neutral-800 bg-[#0c0c0c] space-y-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {user?.name || "Admin Staff"}
                  </div>
                  <div className="text-[10px] text-neutral-400 flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>Super Admin</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/60 rounded transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              <div className="text-[10px] text-neutral-400 pt-2 border-t border-neutral-800/60 flex items-center justify-between">
                <span>Atelier OS v2.4</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Firestore Live
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DESKTOP PERMANENT SIDEBAR (VISIBLE ON LG+ SCREENS)            */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 bg-[#111111] text-white border-r border-neutral-800 z-40 transition-[width] duration-200 flex-shrink-0 select-none ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Sidebar Header / Brand */}
        <div className="h-16 px-4 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
          <Link href="/admin" className="flex items-center gap-3 overflow-hidden group">
            <div className="bg-white p-1 rounded-xs flex-shrink-0">
              <LogoMark size="sm" />
            </div>
            {!collapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <span className="block text-[9px] font-extrabold uppercase tracking-[0.25em] text-neutral-400 truncate">
                  YeHageré Atelier
                </span>
                <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                  Admin Portal
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                </span>
              </div>
            )}
          </Link>

          {/* Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            title={collapsed ? "Expand side navigation" : "Collapse side navigation"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-neutral-400 mb-1.5">
                  {group.title}
                </div>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isLinkActive(item);
                  const Icon = item.icon;

                  if (collapsed) {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group relative flex items-center justify-center w-full h-11 rounded transition-colors ${
                          active
                            ? "bg-white text-black font-extrabold shadow-sm"
                            : "text-neutral-300 hover:text-white hover:bg-neutral-800/80"
                        }`}
                        title={item.label}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />

                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${
                              active ? "bg-black" : "bg-amber-400"
                            }`}
                          />
                        )}

                        {/* Hover Floating Tooltip */}
                        <div className="absolute left-full ml-3 px-3 py-2 bg-neutral-950 text-white text-xs font-bold uppercase tracking-wider rounded shadow-2xl border border-neutral-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                          <div className="flex items-center gap-2">
                            <span>{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[10px] font-extrabold rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-normal text-neutral-400 lowercase first-letter:uppercase tracking-normal">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                        active
                          ? "bg-white text-black font-extrabold shadow-sm"
                          : "text-neutral-300 hover:text-white hover:bg-neutral-800/80"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-black" : "text-neutral-400"}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold flex-shrink-0 ${
                            active ? "bg-black text-white" : "bg-amber-400 text-black"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Storefront Link */}
          <div className="pt-2 border-t border-neutral-800/80">
            {collapsed ? (
              <Link
                href="/"
                target="_blank"
                className="group relative flex items-center justify-center w-full h-11 rounded text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors"
                title="Preview Live Storefront"
              >
                <Store className="w-5 h-5 flex-shrink-0" />
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-neutral-950 text-white text-xs font-bold uppercase tracking-wider rounded shadow-xl border border-neutral-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  Preview Storefront
                </div>
              </Link>
            ) : (
              <Link
                href="/"
                target="_blank"
                className="flex items-center justify-between px-3 py-2 rounded text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-neutral-400" />
                  <span className="uppercase tracking-wider text-[11px] font-bold">Storefront</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
              </Link>
            )}
          </div>
        </div>

        {/* System Diagnostics Indicator */}
        {!collapsed && (
          <div className="p-3 mx-3 mb-3 bg-neutral-900/90 border border-neutral-800 rounded text-[11px] space-y-1 text-neutral-400">
            <div className="flex items-center justify-between font-bold text-neutral-300">
              <span className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-400" />
                Firestore DB
              </span>
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-extrabold">
                Live
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-neutral-400" />
                Stripe Payments
              </span>
              <span className="text-[10px] text-neutral-400">Ready</span>
            </div>
          </div>
        )}

        {/* Admin Profile & Logout Footer */}
        <div className="p-3 border-t border-neutral-800 bg-[#0c0c0c] flex-shrink-0">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-9 h-9 rounded bg-neutral-800 flex items-center justify-center text-xs font-extrabold text-white border border-neutral-700"
                title={user?.name || "Admin Staff"}
              >
                {(user?.name || "AD").slice(0, 2).toUpperCase()}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center text-xs font-extrabold text-white border border-neutral-700 flex-shrink-0">
                  {(user?.name || "AD").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate leading-tight">
                    {user?.name || "Admin Staff"}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Super Admin</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors flex-shrink-0"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
