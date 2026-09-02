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
} from "lucide-react";
import LogoMark from "./LogoMark";
import { useAuth } from "./AuthProvider";

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, orders } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const navItems = [
    {
      label: "Analytics",
      href: "/admin",
      icon: BarChart3,
      exact: true,
    },
    {
      label: "Store CMS",
      href: "/admin/appearance",
      icon: Sliders,
    },
    {
      label: "Products",
      href: "/admin/products",
      icon: ShoppingBag,
    },
    {
      label: "Users & Clients",
      href: "/admin/users",
      icon: Users,
    },
    {
      label: "Orders",
      href: "/admin/orders",
      icon: Receipt,
      badge: orders.filter((o) => o.status === "preparing" || o.status === "confirmed").length,
    },
  ];

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#111111] text-white border-b border-neutral-800 shadow-md">
      {/* Top Bar */}
      <div className="max-w-[1520px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand & Admin Badge */}
        <div className="flex items-center gap-5">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="bg-white p-1 rounded-sm">
              <LogoMark size="sm" />
            </div>
            <div className="hidden sm:block">
              <span className="block text-[10px] font-extrabold uppercase tracking-[0.25em] text-neutral-400">
                Atelier Administration
              </span>
              <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                Portal Management
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </span>
            </div>
          </Link>
        </div>

        {/* Center Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                  active
                    ? "bg-white text-black! shadow-sm"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-800/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      active ? "bg-black text-white" : "bg-neutral-700 text-white"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Live Storefront Link */}
          <Link
            href="/"
            target="_blank"
            className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-200 hover:text-white border border-neutral-700 hover:border-neutral-500 bg-neutral-900 transition-colors flex items-center gap-1.5"
          >
            <span>Live Store</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
          </Link>

          {/* User Profile / Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
            <div className="hidden md:flex items-center gap-2 text-right">
              <div className="text-right">
                <span className="block text-xs font-bold text-white leading-tight">
                  {user?.name || "Admin Staff"}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 flex items-center justify-end gap-1">
                  <Shield className="w-2.5 h-2.5 text-emerald-400" />
                  Super Admin
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
              title="Sign Out of Admin Portal"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Secondary Nav Bar */}
      <div className="lg:hidden border-t border-neutral-800 bg-neutral-900 px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none touch-pan-x">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3.5 py-2 min-h-[38px] text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-colors flex-shrink-0 ${
                active ? "bg-white text-black" : "text-neutral-300 hover:text-white bg-neutral-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    active ? "bg-black text-white" : "bg-neutral-700 text-white"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
