"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, User, Search, ShoppingBag, X, Shield, LogOut } from "lucide-react";
import LogoMark from "./LogoMark";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import { useAuth } from "./AuthProvider";

export default function Navbar() {
  const { count } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Left Navigation Links */}
        <nav className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/"
            className="text-sm sm:text-base font-normal tracking-wide text-black hover:text-neutral-500 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="text-sm sm:text-base font-normal tracking-wide text-black hover:text-neutral-500 transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm sm:text-base font-normal tracking-wide text-black hover:text-neutral-500 transition-colors"
          >
            Contact
          </Link>
        </nav>

        {/* Center Logo Mark */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
          <Link href="/" aria-label="YeHagere Homepage">
            <LogoMark size="md" className="hover:opacity-85 transition-opacity" />
          </Link>
        </div>

        {/* Right Icon Actions */}
        <div className="flex items-center gap-4 sm:gap-6 text-black">
          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="relative p-1 hover:text-neutral-600 transition-colors"
            aria-label={`Wishlist (${wishlistCount})`}
          >
            <Heart className="w-5 h-5 stroke-[1.75]" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Account / User Menu */}
          <div className="relative">
            {isAuthenticated ? (
              <div>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 hover:text-neutral-600 transition-colors"
                  aria-label="Account Menu"
                >
                  <div className="w-6 h-6 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center uppercase">
                    {user?.name ? user.name[0] : "U"}
                  </div>
                  {isAdmin && (
                    <span className="hidden sm:inline-block bg-neutral-100 text-black text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider rounded">
                      Admin
                    </span>
                  )}
                </button>

                {/* Account Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 shadow-xl py-2 z-50 text-left">
                    <div className="px-4 py-2 border-b border-neutral-100">
                      <p className="text-xs font-bold text-black truncate">{user?.name}</p>
                      <p className="text-[11px] text-neutral-500 truncate">{user?.email}</p>
                    </div>

                    <Link
                      href="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-black font-medium"
                    >
                      My Account &amp; Profile
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-black font-medium"
                    >
                      Order History &amp; Receipts
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs text-black bg-neutral-100 hover:bg-neutral-200 font-bold border-y border-neutral-200"
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
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-1.5"
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
                className="p-1 hover:text-neutral-600 transition-colors"
                aria-label="Account Login"
                title="Account Login"
              >
                <User className="w-5 h-5 stroke-[1.75]" />
              </Link>
            )}
          </div>

          {/* Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-1 hover:text-neutral-600 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5 stroke-[1.75]" />
          </button>

          {/* Cart Bag */}
          <Link
            href="/cart"
            className="relative p-1 hover:text-neutral-600 transition-colors"
            aria-label={`Shopping Bag (${count})`}
          >
            <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Slide-down Search Overlay */}
      {searchOpen && (
        <div className="border-t border-neutral-100 bg-white px-4 sm:px-8 py-4 animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Search className="w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search collections, denim, polos, sets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-base outline-none bg-transparent placeholder:text-neutral-400 py-1"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-neutral-500 hover:text-black uppercase"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setSearchOpen(false)}
              className="p-1 text-neutral-500 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
