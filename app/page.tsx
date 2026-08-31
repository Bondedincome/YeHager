"use client";

import React from "react";
import Link from "next/link";
import { getAllProducts } from "./lib/products-store";
import FallLookbookCard from "./components/FallLookbookCard";
import MicroProductCard from "./components/MicroProductCard";

export default function Home() {
  const products = getAllProducts();

  // Find products for different sections
  const fallProducts = products.filter((p) => p.category === "fall" || p.category === "knitwear" || p.category === "outerwear").slice(0, 4);
  const fallbackFall = fallProducts.length === 4 ? fallProducts : products.slice(0, 4);

  // Denim & micro-card products
  const denimProduct = products.find((p) => p.id === 2) || products[0];
  const denimCards = [
    denimProduct,
    { ...denimProduct, id: 201, title: "Vintage low slung baggy jeans" },
    { ...denimProduct, id: 202, title: "Vintage low slung baggy jeans" },
  ];

  const denimCardsSection2 = [
    denimProduct,
    { ...denimProduct, id: 203, title: "Vintage low slung baggy jeans" },
    { ...denimProduct, id: 204, title: "Vintage low slung baggy jeans" },
  ];

  return (
    <main className="w-full bg-white text-black min-h-screen">
      {/* 1. HERO SECTION: MATCHING SETS */}
      <section className="relative w-full aspect-[16/9] sm:aspect-[21/9] min-h-[420px] max-h-[720px] bg-[#d9d9d9] overflow-hidden">
        {/* Background Editorial Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1800&auto=format&fit=crop&q=80"
          alt="Matching Sets Campaign"
          className="w-full h-full object-cover object-top"
        />

        {/* Hero Text Overlay at Bottom-Left */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent flex items-end">
          <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-8 pb-8 sm:pb-12 text-black">
            <div className="max-w-xl space-y-2 bg-white/40 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-4 sm:p-0 rounded-lg sm:rounded-none">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight uppercase text-black">
                MATCHING SETS
              </h1>
              <p className="text-xs sm:text-sm text-black font-normal">
                The sets you&apos;ll live in—your most effortless outfits start here
              </p>
              <div className="pt-1">
                <Link
                  href="/products/3"
                  className="text-xs sm:text-sm font-normal text-black underline underline-offset-4 hover:opacity-75 transition-opacity"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "HELLO, FALL" SECTION */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-16 pb-20">
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
            Hello, Fall
          </h2>
          <p className="text-xs sm:text-sm text-neutral-800 font-normal max-w-xl">
            Check every box: layers, denim, done. The layers that set the tone for fall.
          </p>
        </div>

        {/* 4-Column Lookbook Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {fallbackFall.map((product) => (
            <FallLookbookCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 3. SPLIT SECTION 1: NEW IN DENIM (Left: Micro cards & text, Right: Large Campaign Image) */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Heading, Subtitle, Shop Link, 3 Micro Cards */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-black">
                New In Denim: Low Slung Baggy
              </h2>
              <p className="text-xs sm:text-sm text-neutral-800 font-normal">
                Meet your new favorite relaxed silhouette.
              </p>
              <div>
                <Link
                  href="/products/2"
                  className="text-xs sm:text-sm font-normal text-black underline underline-offset-4 hover:opacity-75 transition-opacity"
                >
                  Shop New Denim
                </Link>
              </div>
            </div>

            {/* 3-Column Micro Product Cards */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-2">
              {denimCards.map((p, idx) => (
                <MicroProductCard key={`${p.id}-${idx}`} product={p} />
              ))}
            </div>
          </div>

          {/* Right Column: Large Campaign Photo */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[3/4] lg:aspect-[4/5] w-full bg-[#d9d9d9] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&auto=format&fit=crop&q=80"
                alt="New In Denim Silhouette"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. SPLIT SECTION 2: INVERTED SPLIT (Left: Large Campaign Image, Right: Text & Micro cards) */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Large Campaign Photo */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative aspect-[3/4] lg:aspect-[4/5] w-full bg-[#d9d9d9] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop&q=80"
                alt="Denim Relaxed Silhouette Look"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>

          {/* Right Column: Heading, Subtitle, Shop Link, 3 Micro Cards */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full order-1 lg:order-2">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-black">
                New In Denim: Low Slung Baggy
              </h2>
              <p className="text-xs sm:text-sm text-neutral-800 font-normal">
                Meet your new favorite relaxed silhouette.
              </p>
              <div>
                <Link
                  href="/products/2"
                  className="text-xs sm:text-sm font-normal text-black underline underline-offset-4 hover:opacity-75 transition-opacity"
                >
                  Shop New Denim
                </Link>
              </div>
            </div>

            {/* 3-Column Micro Product Cards */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-2">
              {denimCardsSection2.map((p, idx) => (
                <MicroProductCard key={`${p.id}-inv-${idx}`} product={p} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
