"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu } from "./icons";
import { ADMIN_NAV, isAdminLinkActive } from "./AdminSidebar";

interface AdminTopBarProps {
  onOpenMobile: () => void;
}

export default function AdminTopBar({ onOpenMobile }: AdminTopBarProps) {
  const pathname = usePathname();
  const current = ADMIN_NAV.find((item) => isAdminLinkActive(pathname, item.href, "exact" in item ? item.exact : false));

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-neutral-200 px-4 sm:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden size-10 -ml-2 flex items-center justify-center rounded-md hover:bg-neutral-100"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <h1 className="text-base font-semibold">{current?.label ?? "Admin"}</h1>
      </div>

      <Link
        href="/"
        target="_blank"
        className="h-9 px-3 rounded-md border border-neutral-300 text-sm flex items-center gap-1.5 hover:border-black transition-colors"
      >
        View store
        <ArrowUpRight className="size-4" />
      </Link>
    </header>
  );
}
