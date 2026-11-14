"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Heart,
  LogOut,
  Menu,
  Package,
  Search,
  Shield,
  ShoppingBag,
  User,
  X,
} from "./icons";
import LogoMark from "./LogoMark";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import { useAuth } from "./AuthProvider";
import { useAppearance } from "./AppearanceProvider";
import { Product } from "../lib/products-store";
import { apiFetch } from "../lib/api";
import { formatProductPrice, toList } from "../lib/format";

type NavCategory = { id: number | string; name: string; slug: string };

const ANNOUNCEMENT_THEMES: Record<string, string> = {
  black: "bg-black text-white",
  emerald: "bg-[#0f3d2e] text-white",
  burgundy: "bg-[#4a1020] text-white",
  ochre: "bg-[#6b4a12] text-white",
  navy: "bg-[#0b172a] text-white",
};

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute top-1.5 right-1 min-w-4 h-4 px-1 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
      {count}
    </span>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { count } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cms } = useAppearance();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<NavCategory[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch("products")
      .then((r) => (r.ok ? r.json() : []))
      .then((payload) => setProducts(toList<Product>(payload)))
      .catch(() => setProducts([]));
    apiFetch("categories")
      .then((r) => (r.ok ? r.json() : []))
      .then((payload) => setCategories(toList<NavCategory>(payload)))
      .catch(() => setCategories([]));
  }, []);

  // Close overlays on route change
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
    setAccountOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [accountOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
        setAccountOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter((p) =>
        [p.title, p.subtitle, (p as { categoryName?: string }).categoryName]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [products, searchQuery]);

  const navLinks = useMemo(
    () => [
      { label: "New In", href: "/products" },
      ...categories.slice(0, 4).map((c) => ({ label: c.name, href: `/products?category=${encodeURIComponent(c.slug)}` })),
      { label: "About", href: "/about" },
    ],
    [categories]
  );

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      router.push(`/products/${results[0].id}`);
      closeSearch();
    }
  };

  const announcement = cms.announcement;
  const iconBtn = "relative w-10 h-10 flex items-center justify-center hover:opacity-60 transition-opacity";

  return (
    <>
      {announcement.enabled && announcement.text && (
        <div
          className={`${ANNOUNCEMENT_THEMES[announcement.themeColor || "black"] ?? ANNOUNCEMENT_THEMES.black} text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-center px-4 py-2.5`}
        >
          <span>{announcement.text}</span>
          {announcement.linkText && (
            <Link href={announcement.linkUrl || "/products"} className="ml-3 underline underline-offset-4 hover:opacity-80">
              {announcement.linkText}
            </Link>
          )}
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white border-b border-line">
        <div className="max-w-[1600px] mx-auto px-2 sm:px-6 h-16 grid grid-cols-[1fr_auto_1fr] lg:grid-cols-[auto_1fr_auto] items-center gap-4">
          {/* Left: menu + search on mobile, logo on desktop */}
          <div className="flex items-center lg:hidden">
            <button type="button" onClick={() => setMenuOpen(true)} className={iconBtn} aria-label="Open menu">
              <Menu className="size-5" />
            </button>
            <button type="button" onClick={() => setSearchOpen(true)} className={iconBtn} aria-label="Search">
              <Search className="size-5" />
            </button>
          </div>

          <Link href="/" aria-label="YeHagere home" className="justify-self-center lg:justify-self-start">
            <LogoMark size="md" />
          </Link>

          {/* Center nav (desktop) */}
          <nav className="hidden lg:flex items-center justify-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="eyebrow text-[12px] py-2 border-b-2 border-transparent hover:border-black transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={`${iconBtn} hidden lg:flex`}
              aria-label="Search"
            >
              <Search className="size-5" />
            </button>

            <div className="relative hidden sm:block" ref={accountRef}>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  className={iconBtn}
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                >
                  <User className="size-5" />
                </button>
              ) : (
                <Link href="/login" className={iconBtn} aria-label="Sign in">
                  <User className="size-5" />
                </Link>
              )}

              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-line shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-line">
                    <p className="text-sm font-bold truncate">{user?.name}</p>
                    <p className="text-xs text-muted truncate">{user?.email}</p>
                  </div>
                  <Link href="/account" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface">
                    <User className="size-4" /> My account
                  </Link>
                  <Link href="/orders" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface">
                    <Package className="size-4" /> Orders
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface">
                      <Shield className="size-4" /> Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAccountOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm border-t border-line hover:bg-surface"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </div>
              )}
            </div>

            <Link href="/wishlist" className={`${iconBtn} hidden sm:flex`} aria-label={`Wishlist (${wishlistCount})`}>
              <Heart className="size-5" />
              <Badge count={wishlistCount} />
            </Link>

            <Link href="/cart" className={iconBtn} aria-label={`Bag (${count})`}>
              <ShoppingBag className="size-5" />
              <Badge count={count} />
            </Link>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeSearch} />
          <div className="relative bg-white">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
              <form onSubmit={submitSearch} className="h-16 flex items-center gap-3 border-b border-black">
                <Search className="size-5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-full text-base outline-none bg-transparent placeholder:text-neutral-400"
                />
                <button type="button" onClick={closeSearch} className={iconBtn} aria-label="Close search">
                  <X className="size-5" />
                </button>
              </form>

              <div className="py-6 max-h-[70vh] overflow-y-auto">
                {searchQuery.trim().length < 2 ? (
                  <p className="text-sm text-muted">Type at least two letters to search.</p>
                ) : results.length === 0 ? (
                  <p className="text-sm text-muted">No results for &ldquo;{searchQuery}&rdquo;.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {results.map((p) => (
                      <Link key={p.id} href={`/products/${p.id}`} onClick={closeSearch} className="group">
                        <div className="aspect-[2/3] bg-surface overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                        </div>
                        <p className="mt-2 text-xs font-bold uppercase tracking-wide line-clamp-1 group-hover:underline">
                          {p.title}
                        </p>
                        <p className="text-xs text-neutral-700">{formatProductPrice(p)}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-full max-w-sm bg-white flex flex-col">
            <div className="h-16 px-2 flex items-center justify-between border-b border-line">
              <button type="button" onClick={() => setMenuOpen(false)} className={iconBtn} aria-label="Close menu">
                <X className="size-5" />
              </button>
              <LogoMark size="sm" />
              <span className="w-10" />
            </div>

            <nav className="flex-1 overflow-y-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between px-5 py-4 border-b border-line text-sm font-bold uppercase tracking-wide"
                >
                  {link.label}
                  <ChevronRight className="size-4" />
                </Link>
              ))}
              <Link
                href="/contact"
                className="flex items-center justify-between px-5 py-4 border-b border-line text-sm font-bold uppercase tracking-wide"
              >
                Contact
                <ChevronRight className="size-4" />
              </Link>

              <div className="px-5 py-5 space-y-4 text-sm">
                <Link href="/wishlist" className="flex items-center gap-3">
                  <Heart className="size-4" /> Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                </Link>
                <Link href="/orders" className="flex items-center gap-3">
                  <Package className="size-4" /> Orders
                </Link>
                {isAuthenticated ? (
                  <>
                    <Link href="/account" className="flex items-center gap-3">
                      <User className="size-4" /> {user?.name || "My account"}
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="flex items-center gap-3">
                        <Shield className="size-4" /> Admin
                      </Link>
                    )}
                    <button type="button" onClick={logout} className="flex items-center gap-3">
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="flex items-center gap-3">
                    <User className="size-4" /> Sign in / Register
                  </Link>
                )}
              </div>
            </nav>

            {!isAuthenticated && (
              <div className="p-5 border-t border-line">
                <Link href="/login" className="btn-primary w-full">
                  Sign in <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
