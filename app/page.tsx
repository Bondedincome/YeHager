"use client";

import { useState } from "react";
import Image from "next/image";
import ProductList from "./components/ProductList";
import CartButton from "./components/CartButton";
import { useAppearance } from "./components/AppearanceProvider";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { appearance } = useAppearance();
  const banner = appearance.banner;
  return (
    <div className="min-h-screen bg-[#f5ede4] text-[#1a1410] font-sans">
      <main className="flex w-full flex-col gap-8 px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Next.js" width={80} height={18} />
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium uppercase text-[#3d3228]">
            <a href="/" className="hover:text-[#8b5e34] transition">Home</a>
            <a href="/#products" className="hover:text-[#8b5e34] transition">Shop</a>
            <a href="/admin/login" className="hover:text-[#8b5e34] transition">Admin</a>
          </nav>

          <div className="flex items-center gap-4">
            <button type="button" className="text-[#3d3228] hover:text-[#8b5e34] transition p-2" aria-label="Search">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <CartButton />
            
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-[#3d3228] hover:text-[#8b5e34] transition p-2"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="md:hidden bg-white border-t border-[#8b5e34]/20 py-3 space-y-2">
            <a href="/" className="block px-4 py-2 text-sm text-[#3d3228] hover:text-[#8b5e34] hover:bg-[#f5ede4] transition rounded uppercase">Home</a>
            <a href="/#products" className="block px-4 py-2 text-sm text-[#3d3228] hover:text-[#8b5e34] hover:bg-[#f5ede4] transition rounded uppercase">Shop</a>
            <a href="/admin/login" className="block px-4 py-2 text-sm text-[#3d3228] hover:text-[#8b5e34] hover:bg-[#f5ede4] transition rounded uppercase">Admin</a>
          </nav>
        )}

        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
          {/* Left Column */}
          <div className="flex flex-col justify-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-[0.3em] text-[#8b5e34] uppercase">New Arrivals</span>
              <div className="h-px flex-1 bg-[#8b5e34]/20"></div>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold leading-[1.1] tracking-tight">
              {banner?.headline ?? (
                <>
                  Jackets for the
                  <br />
                  <span className="text-[#8b5e34]">Modern Man</span>
                </>
              )}
            </h1>
            
            <p className="max-w-md text-base text-[#5a4a3a] leading-relaxed">
              {banner?.subheadline ?? "Explore premium outerwear designed for city life with bold silhouettes, warm brown tones, and effortless polish for every season."}
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <a href="/#products" className="bg-[#1a1410] text-white px-8 py-3.5 rounded-full text-sm font-medium hover:bg-[#3d3228] transition inline-block">
                Shop Now
              </a>
              <a href="/#products" className="border-2 border-[#1a1410] text-[#1a1410] px-8 py-3.5 rounded-full text-sm font-medium hover:bg-[#1a1410] hover:text-white transition inline-block">
                New Arrivals
              </a>
            </div>
          </div>

        </section>

        {/* ARO Brand Grid */}
        <section className="mt-12">
          <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="text-2xl font-bold text-[#8b5e34]">YeHagere</span>
              <div className="h-px w-12 bg-[#8b5e34]/30"></div>
              <span className="text-sm font-medium text-[#5a4a3a]">Signature Collection</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {['WOMEN', 'MEN', 'SHOES', 'BAGS', 'ACCESSORIES'].map((label) => (
                <button type="button" key={label} className="text-xs font-bold tracking-[0.15em] text-[#5a4a3a] hover:text-[#8b5e34] transition px-3 py-1">
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="group">
                <div className="aspect-square w-full rounded-2xl bg-[#e8ddd0] flex items-center justify-center relative overflow-hidden">
                  <span className="text-4xl font-bold text-[#8b5e34]/30">YeHagere</span>
                  {i === 6 && (
                    <div className="absolute top-3 right-3 bg-[#8b5e34] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      50%
                    </div>
                  )}
                </div>
                <p className="text-center mt-2 text-sm font-medium text-[#3d3228]">ARO</p>
                <p className="text-center text-xs text-[#8b5e34] font-medium">Collection</p>
              </div>
            ))}
          </div>

          {/* Sale Banner */}
          <div className="mt-8 bg-[#e8ddd0] rounded-3xl p-6 sm:p-8 text-center">
            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-5xl font-bold text-[#8b5e34]">50%</span>
              <div className="hidden sm:block h-12 w-px bg-[#8b5e34]/30"></div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-bold tracking-[0.3em] text-[#8b5e34] uppercase">Limited Time Offer</p>
                <p className="text-2xl font-bold text-[#1a1410]">Shop the ARO Collection</p>
              </div>
              <a href="/#products" className="w-full rounded-full bg-[#1a1410] text-white px-8 py-3 text-sm font-medium hover:bg-[#3d3228] transition sm:w-auto inline-block text-center">
                Shop Now
              </a>
            </div>
          </div>
        </section>

        {/* New Arrivals */}
        <section id="products" className="mt-12">
          <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.3em] text-[#8b5e34] uppercase">New Arrivals</p>
              <h2 className="text-3xl font-bold text-[#1a1410] mt-1">Shop the latest drop</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {['WOMEN', 'MEN', 'SHOES', 'BAGS', 'ACCESSORIES'].map((label) => (
                <button type="button" key={label} className="text-xs font-bold tracking-[0.15em] text-[#5a4a3a] hover:text-[#8b5e34] transition px-3 py-1">
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ProductList />
        </section>
      </main>
    </div>
  );
}