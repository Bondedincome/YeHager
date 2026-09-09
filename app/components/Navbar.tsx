"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  User,
  Search,
  ShoppingBag,
  X,
  Shield,
  LogOut,
  Menu,
  ChevronRight,
  Package,
} from "lucide-react";
import LogoMark from "./LogoMark";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import { useAuth } from "./AuthProvider";
import { getAllProducts, Product } from "../lib/products-store";

export default function Navbar() {
  const router = useRouter();
  const { count } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchResults =
    searchQuery.trim().length > 1
      ? getAllProducts()
          .filter(
            (p: Product) =>
              p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.category?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 5)
      : [];

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [searchOpen]);

  // Handle outside click to close desktop user dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen]);

  // Handle Escape key to close overlays
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      router.push(`/products/${searchResults[0].id}`);
      setSearchOpen(false);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-8 h-14 sm:h-16 flex items-center justify-between relative">
          {/* Left Navigation: Hamburger on mobile, Text links on md+ */}
          <div className="flex items-center">
            {/* Mobile Hamburger Button (Min 44x44px touch target) */}
            <button
              onClick={() => {
                setMobileMenuOpen(true);
                setSearchOpen(false);
              }}
              className="md:hidden w-11 h-11 flex items-center justify-center text-black hover:text-neutral-600 transition-colors -ml-2"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 stroke-[1.75]" />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link
                href="/"
                className="text-sm font-normal tracking-wide text-black hover:text-neutral-500 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-sm font-normal tracking-wide text-black hover:text-neutral-500 transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-sm font-normal tracking-wide text-black hover:text-neutral-500 transition-colors"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Center Logo Mark */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center pointer-events-auto">
            <Link href="/" aria-label="YeHagere Homepage" className="inline-block py-1">
              <LogoMark size="md" className="hover:opacity-85 transition-opacity" />
            </Link>
          </div>

          {/* Right Icon Actions (Optimized spacing for mobile) */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 text-black">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center hover:text-neutral-600 transition-colors"
              aria-label={`Wishlist (${wishlistCount})`}
            >
              <Heart className="w-[18px] h-[18px] sm:w-5 sm:h-5 stroke-[1.75]" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 bg-black text-white text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Account / User Menu (Desktop only in header; accessible in mobile menu drawer) */}
            <div className="relative hidden sm:block" ref={dropdownRef}>
              {isAuthenticated ? (
                <div>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center hover:text-neutral-600 transition-colors"
                    aria-label="Account Menu"
                  >
                    <div className="w-6 h-6 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center uppercase">
                      {user?.name ? user.name[0] : "U"}
                    </div>
                  </button>

                  {/* Account Dropdown */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 shadow-xl py-2 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="text-xs font-bold text-black truncate">{user?.name}</p>
                        <p className="text-[11px] text-neutral-500 truncate">{user?.email}</p>
                      </div>

                      <Link
                        href="/account"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-black font-medium"
                      >
                        My Account &amp; Profile
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-black font-medium"
                      >
                        Order History &amp; Receipts
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block px-4 py-2.5 text-xs text-black bg-neutral-100 hover:bg-neutral-200 font-bold border-y border-neutral-200"
                        >
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-black" />
                            <span>Atelier Admin Portal</span>
                          </div>
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center hover:text-neutral-600 transition-colors"
                  aria-label="Account Login"
                  title="Account Login"
                >
                  <User className="w-5 h-5 stroke-[1.75]" />
                </Link>
              )}
            </div>

            {/* Search Toggle */}
            <button
              onClick={() => {
                setSearchOpen(!searchOpen);
                if (mobileMenuOpen) setMobileMenuOpen(false);
              }}
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center hover:text-neutral-600 transition-colors"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px] sm:w-5 sm:h-5 stroke-[1.75]" />
            </button>

            {/* Cart Bag */}
            <Link
              href="/cart"
              className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center hover:text-neutral-600 transition-colors"
              aria-label={`Shopping Bag (${count})`}
            >
              <ShoppingBag className="w-[18px] h-[18px] sm:w-5 sm:h-5 stroke-[1.75]" />
              {count > 0 && (
                <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 bg-black text-white text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Slide-down Search Overlay with Instant Results */}
        {searchOpen && (
          <div className="border-t border-neutral-100 bg-white px-3 sm:px-8 py-3 shadow-md animate-in slide-in-from-top-2 duration-200">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2.5">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 flex-shrink-0" />
                {/* Prevent iOS Safari 16px zoom bug by setting text-base on mobile */}
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search silhouettes, denim, sets, polos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-base sm:text-sm outline-none bg-transparent placeholder:text-neutral-400 py-1"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-[11px] text-neutral-500 hover:text-black uppercase px-2 py-1 font-semibold"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="p-1.5 text-neutral-500 hover:text-black transition-colors"
                  aria-label="Close search"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </form>

              {/* Instant Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-neutral-100 divide-y divide-neutral-100 max-h-64 overflow-y-auto">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 pb-1">
                    Matching Silhouettes ({searchResults.length})
                  </div>
                  {searchResults.map((p) => (
                    <Link
                      key={p.id}
                      href={`/products/${p.id}`}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className="flex items-center justify-between py-2.5 hover:bg-neutral-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="w-8 h-10 object-cover bg-neutral-100 flex-shrink-0"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-black group-hover:underline">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            {p.subtitle || "Atelier Silhouette"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-black">${p.price} USD</span>
                    </Link>
                  ))}
                </div>
              )}
              {searchQuery.trim().length > 1 && searchResults.length === 0 && (
                <p className="mt-2 text-xs text-neutral-500 text-center py-2">
                  No matching garments found for &ldquo;{searchQuery}&rdquo;.
                </p>
              )}
            </div>
          </div>
        )}
      </header>

      {/* MOBILE SLIDE-OUT MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content with Full Scrollability for Short Screens */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl z-50 flex flex-col justify-between animate-in slide-in-from-left duration-250">
            {/* Sticky Drawer Top Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between flex-shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <LogoMark size="sm" />
                <span className="text-xs font-bold uppercase tracking-widest text-black">
                  YeHageré
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-black -mr-2"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Middle Container */}
            <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
              {/* Quick Search in Mobile Drawer */}
              <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchResults.length > 0) {
                      router.push(`/products/${searchResults[0].id}`);
                      setMobileMenuOpen(false);
                      setSearchQuery("");
                    }
                  }}
                  className="relative flex items-center"
                >
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search collection..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-neutral-200 pl-9 pr-8 py-2 text-base sm:text-xs text-black outline-none placeholder:text-neutral-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 text-neutral-400 hover:text-black p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>

                {/* Instant Drawer Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white border border-neutral-100 shadow-sm divide-y divide-neutral-100 max-h-48 overflow-y-auto">
                    {searchResults.map((p) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.id}`}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center justify-between p-2 hover:bg-neutral-50 text-xs"
                      >
                        <span className="font-semibold text-black truncate pr-2">{p.title}</span>
                        <span className="text-neutral-500 flex-shrink-0">${p.price}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Main Navigation Links */}
              <nav className="p-4 space-y-0.5">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-sm font-bold uppercase tracking-wider text-black border-b border-neutral-100 hover:text-neutral-500"
                >
                  <span>Home</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>

                <Link
                  href="/products/2"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-sm font-bold uppercase tracking-wider text-black border-b border-neutral-100 hover:text-neutral-500"
                >
                  <span>Low Slung Denim</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>

                <Link
                  href="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-sm font-medium text-neutral-800 border-b border-neutral-100 hover:text-black"
                >
                  <span className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-neutral-500" />
                    <span>Saved Wishlist</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {wishlistCount > 0 && (
                      <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {wishlistCount}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </div>
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-sm font-medium text-neutral-800 border-b border-neutral-100 hover:text-black"
                >
                  <span className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-neutral-500" />
                    <span>Shopping Bag</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {count > 0 && (
                      <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {count}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </div>
                </Link>

                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-sm font-medium text-neutral-800 border-b border-neutral-100 hover:text-black"
                >
                  <span>About Atelier</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>

                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-sm font-medium text-neutral-800 border-b border-neutral-100 hover:text-black"
                >
                  <span>Contact &amp; Concierge</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>

                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-sm font-medium text-neutral-800 border-b border-neutral-100 hover:text-black"
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-neutral-500" />
                    <span>Order History &amp; Tracking</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>
              </nav>

              {/* Account Quick Status */}
              <div className="p-4 bg-neutral-50 mx-4 mb-4 border border-neutral-100 space-y-2">
                {isAuthenticated ? (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                      Signed in as
                    </span>
                    <p className="text-xs font-bold text-black truncate">{user?.name}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{user?.email}</p>
                    <div className="pt-2 flex items-center gap-3">
                      <Link
                        href="/account"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-xs font-bold uppercase tracking-wider text-black underline"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          logout();
                        }}
                        className="text-xs text-rose-600 font-medium hover:underline"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-black mb-1">Patron Access</p>
                    <p className="text-[11px] text-neutral-500 mb-2">
                      Sign in to track orders, save your wishlist, and check out with Stripe.
                    </p>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full py-2.5 bg-black text-white! text-center text-xs font-bold uppercase tracking-wider"
                    >
                      Sign In / Register
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer: Admin Link & Currency Info */}
            <div className="p-4 sm:p-5 border-t border-neutral-100 space-y-2.5 bg-white flex-shrink-0">
              {isAdmin ? (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 bg-neutral-900 text-white text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Atelier Admin Portal</span>
                </Link>
              ) : (
                <Link
                  href="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center text-[11px] text-neutral-400 hover:text-black uppercase tracking-wider"
                >
                  Staff Admin Access
                </Link>
              )}

              <div className="text-[10px] text-neutral-400 text-center uppercase tracking-wider">
                Prices shown in USD &amp; ETB (Br) • Worldwide Shipping
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
