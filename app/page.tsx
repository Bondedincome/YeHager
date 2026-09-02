"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAllProducts, Product } from "./lib/products-store";
import FallLookbookCard from "./components/FallLookbookCard";
import MicroProductCard from "./components/MicroProductCard";
import { useAppearance } from "./components/AppearanceProvider";

export default function Home() {
  const { cms } = useAppearance();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Initial fetch from API / local store
    fetch("/api/products")
      .then((r) => r.json())
      .then((res) => {
        const items = Array.isArray(res) ? res : res?.data ?? [];
        setProducts(items.length > 0 ? items : getAllProducts());
      })
      .catch(() => {
        setProducts(getAllProducts());
      });
  }, []);

  const catalog = products.length > 0 ? products : getAllProducts();

  // Find products for different sections
  const fallProducts = catalog
    .filter((p) => p.category === "fall" || p.category === "knitwear" || p.category === "outerwear")
    .slice(0, 4);
  const fallbackFall = fallProducts.length === 4 ? fallProducts : catalog.slice(0, 4);

  // Denim & micro-card products
  const denimProduct = catalog.find((p) => p.id === 2) || catalog[0];
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
      {/* 0. ANNOUNCEMENT BAR (CMS Control) */}
      {cms.announcement.enabled && cms.announcement.text && (
        <div className="bg-black text-white text-[11px] font-medium py-2 px-4 text-center tracking-wider uppercase flex items-center justify-center gap-3">
          <span>{cms.announcement.text}</span>
          {cms.announcement.linkText && (
            <Link
              href={cms.announcement.linkUrl || "/products/1"}
              className="underline underline-offset-2 hover:text-neutral-300 font-bold ml-1"
            >
              {cms.announcement.linkText} →
            </Link>
          )}
        </div>
      )}

      {/* 1. HERO SECTION: MATCHING SETS (CMS Control) */}
      <section className="relative w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] min-h-[460px] max-h-[720px] bg-[#d9d9d9] overflow-hidden">
        {/* Background Editorial Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cms.hero.imageUrl}
          alt={cms.hero.headline}
          className="w-full h-full object-cover object-top"
        />

        {/* Hero Text Overlay at Bottom-Left */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex items-end">
          <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-8 pb-8 sm:pb-12 text-white">
            <div className="max-w-xl space-y-2.5 bg-black/40 sm:bg-transparent backdrop-blur-xs sm:backdrop-blur-none p-4 sm:p-0">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight uppercase text-white drop-shadow-sm leading-tight">
                {cms.hero.headline}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-100 font-normal leading-relaxed drop-shadow-sm line-clamp-3 sm:line-clamp-none">
                {cms.hero.subheadline}
              </p>
              <div className="pt-2">
                <Link
                  href={cms.hero.ctaLink || "/products/3"}
                  className="inline-block text-xs sm:text-sm font-semibold text-white underline underline-offset-4 hover:text-neutral-200 transition-colors drop-shadow-sm"
                >
                  {cms.hero.ctaText || "Shop Now"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "HELLO, FALL" SECTION (CMS Control) */}
      <section id="fall-lookbook" className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-12 sm:pt-16 pb-16 sm:pb-20 scroll-mt-20">
        <div className="mb-6 sm:mb-8 space-y-1.5 sm:space-y-2">
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-black">
            {cms.lookbook.title}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-800 font-normal max-w-xl">
            {cms.lookbook.subtitle}
          </p>
        </div>

        {/* 4-Column Lookbook Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {fallbackFall.map((product) => (
            <FallLookbookCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 3. SPLIT SECTION 1: NEW IN DENIM (CMS Control) */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
          {/* Left Column: Heading, Subtitle, Shop Link, Micro Cards */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full">
            <div className="space-y-2 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-black">
                {cms.splitSection1.title}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-800 font-normal">
                {cms.splitSection1.subtitle}
              </p>
              <div>
                <Link
                  href={cms.splitSection1.ctaLink || "/products/2"}
                  className="text-xs sm:text-sm font-normal text-black underline underline-offset-4 hover:opacity-75 transition-opacity"
                >
                  {cms.splitSection1.ctaText || "Shop New Denim"}
                </Link>
              </div>
            </div>

            {/* Responsive Micro Product Cards: horizontal scroll snap on mobile, 3-col on sm+ */}
            <div className="flex overflow-x-auto pb-4 pt-2 gap-3 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 snap-x snap-mandatory">
              {denimCards.map((p, idx) => (
                <div key={`${p.id}-${idx}`} className="w-[180px] sm:w-auto flex-shrink-0 snap-start">
                  <MicroProductCard product={p} />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Large Campaign Photo */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[3/4] lg:aspect-[4/5] w-full bg-[#d9d9d9] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cms.splitSection1.campaignImageUrl}
                alt={cms.splitSection1.title}
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. SPLIT SECTION 2: INVERTED SPLIT (CMS Control) */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 sm:py-10 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
          {/* Left Column: Large Campaign Photo */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative aspect-[3/4] lg:aspect-[4/5] w-full bg-[#d9d9d9] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cms.splitSection2.campaignImageUrl}
                alt={cms.splitSection2.title}
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>

          {/* Right Column: Heading, Subtitle, Shop Link, Micro Cards */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full order-1 lg:order-2">
            <div className="space-y-2 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-black">
                {cms.splitSection2.title}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-800 font-normal">
                {cms.splitSection2.subtitle}
              </p>
              <div>
                <Link
                  href={cms.splitSection2.ctaLink || "/products/2"}
                  className="text-xs sm:text-sm font-normal text-black underline underline-offset-4 hover:opacity-75 transition-opacity"
                >
                  {cms.splitSection2.ctaText || "Shop New Denim"}
                </Link>
              </div>
            </div>

            {/* Responsive Micro Product Cards */}
            <div className="flex overflow-x-auto pb-4 pt-2 gap-3 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 snap-x snap-mandatory">
              {denimCardsSection2.map((p, idx) => (
                <div key={`${p.id}-inv-${idx}`} className="w-[180px] sm:w-auto flex-shrink-0 snap-start">
                  <MicroProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
