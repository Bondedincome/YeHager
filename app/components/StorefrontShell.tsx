"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AdminHeader from "./AdminHeader";
import AdminFooter from "./AdminFooter";

export default function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isAdminLoginPage = pathname === "/admin/login";

  if (isAdminRoute && !isAdminLoginPage) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0d0d0d] text-white">
        <AdminHeader />
        <main className="flex-1 bg-[#fafafa] text-black">{children}</main>
        <AdminFooter />
      </div>
    );
  }

  if (isAdminLoginPage) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafafa] text-black">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
