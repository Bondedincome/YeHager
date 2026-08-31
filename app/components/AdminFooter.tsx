"use client";

import React from "react";
import Link from "next/link";
import { Database, ShieldCheck, Cpu } from "lucide-react";

export default function AdminFooter() {
  return (
    <footer className="bg-[#111111] text-neutral-400 text-xs border-t border-neutral-800 py-8 px-4 sm:px-8 mt-auto">
      <div className="max-w-[1520px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left System Specs */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[11px]">
          <div className="flex items-center gap-1.5 text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="font-bold uppercase tracking-wider text-white">Atelier OS v2.4</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Database className="w-3.5 h-3.5 text-neutral-400" />
            <span>Firestore Database: <strong className="text-neutral-300">Connected</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span>Stripe Payments Engine: <strong className="text-neutral-300">Live</strong></span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 text-neutral-400">
            <Cpu className="w-3.5 h-3.5 text-neutral-400" />
            <span>Environment: Production Sandbox</span>
          </div>
        </div>

        {/* Right Navigation / Fast Links */}
        <div className="flex items-center gap-5 text-[11px] uppercase tracking-wider">
          <Link href="/admin" className="hover:text-white transition-colors">
            Analytics
          </Link>
          <Link href="/admin/appearance" className="hover:text-white transition-colors">
            CMS Studio
          </Link>
          <Link href="/admin/products" className="hover:text-white transition-colors">
            Inventory
          </Link>
          <Link href="/admin/users" className="hover:text-white transition-colors">
            Users
          </Link>
          <Link href="/admin/orders" className="hover:text-white transition-colors">
            Orders
          </Link>
          <Link href="/" target="_blank" className="text-neutral-300 hover:text-white underline underline-offset-2">
            Storefront
          </Link>
        </div>
      </div>
      <div className="max-w-[1520px] mx-auto mt-4 pt-4 border-t border-neutral-800/80 text-[10px] text-neutral-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>©2026 YeHageré Atelier Management &amp; Merchandising Portal. All administrative rights reserved.</span>
        <span>Secure Session ID: YH-ADM-2026-X49</span>
      </div>
    </footer>
  );
}
