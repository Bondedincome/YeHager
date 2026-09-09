"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getAllProducts, Product } from "./lib/products-store";
import FallLookbookCard from "./components/FallLookbookCard";
import MicroProductCard from "./components/MicroProductCard";
import { useAppearance } from "./components/AppearanceProvider";

export default function Home() {
  const { cms } = useAppearance();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
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

  const catalog = useMemo(() => (products.length > 0 ? products : getAllProducts()), [products]);

  // Lookbook items dynamically filtered by CMS categoryFilter and limited by itemLimit
  const lookbookProducts = useMemo(() => {
    const filter = cms.lookbook.categoryFilter;
    const limit = cms.lookbook.itemLimit || 4;
    let filtered: Product[];

    if (!filter || filter === "all") {
      filtered = catalog;
    } else {
      filtered = catalog.filter((p) => p.category === filter);
      if (filtered.length === 0) filtered = catalog;
    }
    return filtered.slice(0, limit);
  }, [catalog, cms.lookbook.categoryFilter, cms.lookbook.itemLimit]);

  // Dynamic products for Split Section 1
  const split1Products = useMemo(() => {
    const ids = cms.splitSection1.featuredProductIds || [];
    const matched = ids
      .map((id) => catalog.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
    return matched.length > 0 ? matched.slice(0, 3) : catalog.slice(0, 3);
  }, [catalog, cms.splitSection1.featuredProductIds]);

  // Dynamic products for Split Section 2
  const split2Products = useMemo(() => {
    const ids = cms.splitSection2.featuredProductIds || [];
    const matched = ids
      .map((id) => catalog.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
    return matched.length > 0 ? matched.slice(0, 3) : catalog.slice(3, 6);
  }, [catalog, cms.splitSection2.featuredProductIds]);

  // Announcement theme styling
  const announcementThemeClass = useMemo(() => {
    switch (cms.announcement.themeColor) {
      case "emerald":
        return "bg-[#062c1e] text-emerald-100 border-b border-emerald-800/40";
      case "burgundy":
        return "bg-[#3b0d18] text-[#fce7ed] border-b border-[#69182a]/40";
      case "ochre":
        return "bg-[#452c08] text-[#fef3c7] border-b border-[#734a0f]/40";
      case "navy":
        return "bg-[#0b172a] text-[#e0e7ff] border-b border-[#1e293b]/40";
      default:
        return "bg-black text-white";
    }
  }, [cms.announcement.themeColor]);

  // Hero overlay gradient styling
  const heroOverlayClass = useMemo(() => {
    switch (cms.hero.overlayOpacity) {
      case "subtle":
        return "from-black/55 via-black/20 to-transparent";
      case "heavy":
        return "from-black/95 via-black/60 to-black/25";
      default:
        return "from-black/80 via-black/35 to-transparent";
    }
  }, [cms.hero.overlayOpacity]);

  // Hero alignment styling
  const heroAlignmentClass = useMemo(() => {
    switch (cms.hero.alignment) {
      case "center":
        return "items-end justify-center text-center";
      case "right":
        return "items-end justify-end text-right";
      default:
        return "items-end justify-start text-left";
    }
  }, [cms.hero.alignment]);

  return (
    <main className="w-full bg-white text-black min-h-screen">
      {/* 0. ANNOUNCEMENT BAR (CMS Control) */}
      {cms.announcement.enabled && cms.announcement.text && (
        <div
          className={`${announcementThemeClass} text-[11px] font-medium py-2 px-4 text-center tracking-wider uppercase flex items-center justify-center gap-3 transition-colors`}
        >
          <span>{cms.announcement.text}</span>
          {cms.announcement.linkText && (
            <Link
              href={cms.announcement.linkUrl || "/products/1"}
              className="underline underline-offset-2 hover:opacity-80 font-bold ml-1 inline-flex items-center gap-1"
            >
              <span>{cms.announcement.linkText}</span>
              <span>&rarr;</span>
            </Link>
          )}
        </div>
      )}

      {/* 1. HERO SECTION: EDITORIAL CAMPAIGN (CMS Control) */}
      <section className="relative w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] min-h-[480px] max-h-[740px] bg-[#d9d9d9] overflow-hidden">
        {/* Background Editorial Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cms.hero.imageUrl}
          alt={cms.hero.headline}
          className="w-full h-full object-cover object-top"
        />

        {/* Hero Text Overlay with Configurable Opacity & Alignment */}
        <div className={`absolute inset-0 bg-gradient-to-t ${heroOverlayClass} flex ${heroAlignmentClass}`}>
          <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-8 pb-8 sm:pb-14 text-white">
            <div
              className={`max-w-xl space-y-3 p-4 sm:p-0 ${
                cms.hero.alignment === "center"
                  ? "mx-auto text-center"
                  : cms.hero.alignment === "right"
                  ? "ml-auto text-right"
                  : "text-left"
              }`}
            >
              {/* Optional Hero Badge */}
              {cms.hero.badge && (
                <div>
                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-[0.25em] bg-white/15 backdrop-blur-sm border border-white/25 px-2.5 py-1 text-white">
                    {cms.hero.badge}
                  </span>
                </div>
              )}

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight uppercase text-white drop-shadow-sm leading-tight">
                {cms.hero.headline}
              </h1>

              <p className="text-xs sm:text-sm text-neutral-100 font-normal leading-relaxed drop-shadow-sm line-clamp-3 sm:line-clamp-none">
                {cms.hero.subheadline}
              </p>

              <div
                className={`pt-2 flex items-center gap-4 flex-wrap ${
                  cms.hero.alignment === "center"
                    ? "justify-center"
                    : cms.hero.alignment === "right"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <Link
                  href={cms.hero.ctaLink || "/products/3"}
                  className="inline-block text-xs sm:text-sm font-bold uppercase tracking-wider text-white underline underline-offset-4 hover:text-neutral-200 transition-colors drop-shadow-sm"
                >
                  {cms.hero.ctaText || "Shop Now"}
                </Link>

                {cms.hero.secondaryCtaText && (
                  <Link
                    href={cms.hero.secondaryCtaLink || "#fall-lookbook"}
                    className="inline-block text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-300 hover:text-white transition-colors drop-shadow-sm"
                  >
                    {cms.hero.secondaryCtaText} &rarr;
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LOOKBOOK SECTION (CMS Control) */}
      <section id="fall-lookbook" className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-12 sm:pt-16 pb-16 sm:pb-20 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div className="space-y-1.5 sm:space-y-2">
            {cms.lookbook.badge && (
              <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-neutral-500 block">
                {cms.lookbook.badge}
              </span>
            )}
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-black">
              {cms.lookbook.title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-700 font-normal max-w-xl">
              {cms.lookbook.subtitle}
            </p>
          </div>

          {cms.lookbook.viewAllLinkText && (
            <Link
              href="/#catalog"
              className="text-xs font-bold uppercase tracking-wider text-black underline underline-offset-4 hover:opacity-75 transition-opacity self-start sm:self-end"
            >
              {cms.lookbook.viewAllLinkText} &rarr;
            </Link>
          )}
        </div>

        {/* Configurable Lookbook Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {lookbookProducts.map((product) => (
            <FallLookbookCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 3. SPLIT SECTION 1 (CMS Control: Products, Copy, Reverse Layout) */}
      {(cms.splitSection1.enabled ?? true) && (
        <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 sm:py-10 border-t border-neutral-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
            {/* Column A (Text + Micro Cards) */}
            <div
              className={`lg:col-span-7 flex flex-col justify-between h-full ${
                cms.splitSection1.reverseLayout ? "order-1 lg:order-2" : "order-1"
              }`}
            >
              <div className="space-y-2 mb-4 sm:mb-6">
                {cms.splitSection1.badge && (
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-neutral-500 block">
                    {cms.splitSection1.badge}
                  </span>
                )}
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-black">
                  {cms.splitSection1.title}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-700 font-normal max-w-xl">
                  {cms.splitSection1.subtitle}
                </p>
                <div>
                  <Link
                    href={cms.splitSection1.ctaLink || "/products/2"}
                    className="text-xs sm:text-sm font-semibold text-black underline underline-offset-4 hover:opacity-75 transition-opacity"
                  >
                    {cms.splitSection1.ctaText || "Shop Collection"}
                  </Link>
                </div>
              </div>

              {/* Live CMS-Selected Micro Product Cards */}
              <div className="flex overflow-x-auto pb-4 pt-2 gap-3 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 snap-x snap-mandatory">
                {split1Products.map((p, idx) => (
                  <div key={`split1-${p.id}-${idx}`} className="w-[180px] sm:w-auto flex-shrink-0 snap-start">
                    <MicroProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>

            {/* Column B (Editorial Photo) */}
            <div
              className={`lg:col-span-5 ${
                cms.splitSection1.reverseLayout ? "order-2 lg:order-1" : "order-2"
              }`}
            >
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
      )}

      {/* 4. SPLIT SECTION 2 (CMS Control: Products, Copy, Reverse Layout) */}
      {(cms.splitSection2.enabled ?? true) && (
        <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 sm:py-10 border-t border-neutral-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
            {/* Column A (Editorial Photo) */}
            <div
              className={`lg:col-span-5 ${
                cms.splitSection2.reverseLayout ? "order-2 lg:order-1" : "order-2 lg:order-2"
              }`}
            >
              <div className="relative aspect-[3/4] lg:aspect-[4/5] w-full bg-[#d9d9d9] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cms.splitSection2.campaignImageUrl}
                  alt={cms.splitSection2.title}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>

            {/* Column B (Text + Micro Cards) */}
            <div
              className={`lg:col-span-7 flex flex-col justify-between h-full ${
                cms.splitSection2.reverseLayout ? "order-1 lg:order-2" : "order-1 lg:order-1"
              }`}
            >
              <div className="space-y-2 mb-4 sm:mb-6">
                {cms.splitSection2.badge && (
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-neutral-500 block">
                    {cms.splitSection2.badge}
                  </span>
                )}
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-black">
                  {cms.splitSection2.title}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-700 font-normal max-w-xl">
                  {cms.splitSection2.subtitle}
                </p>
                <div>
                  <Link
                    href={cms.splitSection2.ctaLink || "/products/4"}
                    className="text-xs sm:text-sm font-semibold text-black underline underline-offset-4 hover:opacity-75 transition-opacity"
                  >
                    {cms.splitSection2.ctaText || "Explore Outerwear"}
                  </Link>
                </div>
              </div>

              {/* Live CMS-Selected Micro Product Cards */}
              <div className="flex overflow-x-auto pb-4 pt-2 gap-3 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 snap-x snap-mandatory">
                {split2Products.map((p, idx) => (
                  <div key={`split2-${p.id}-${idx}`} className="w-[180px] sm:w-auto flex-shrink-0 snap-start">
                    <MicroProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. ATELIER HERITAGE & PROVENANCE STORY SECTION (CMS Control) */}
      {cms.storySection?.enabled && (
        <section className="bg-[#111111] text-white py-16 sm:py-24 mt-12 border-t border-neutral-800">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              {/* Left Column: Image with artisan motif */}
              <div className="lg:col-span-5 relative">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-900 border border-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cms.storySection.imageUrl}
                    alt={cms.storySection.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/70 backdrop-blur-md border border-neutral-700/60">
                    <p className="text-xs italic text-neutral-200">
                      &ldquo;{cms.storySection.quote}&rdquo;
                    </p>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-2">
                      — {cms.storySection.quoteAuthor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Narrative & Stats */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-emerald-400 block mb-2">
                    {cms.storySection.badge}
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                    {cms.storySection.title}
                  </h2>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
                  <p>{cms.storySection.paragraph1}</p>
                  <p>{cms.storySection.paragraph2}</p>
                </div>

                {/* Provenance Stat Highlights */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-800">
                  <div>
                    <span className="block text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {cms.storySection.stat1Value}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mt-0.5 block">
                      {cms.storySection.stat1Label}
                    </span>
                  </div>
                  <div>
                    <span className="block text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {cms.storySection.stat2Value}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mt-0.5 block">
                      {cms.storySection.stat2Label}
                    </span>
                  </div>
                  <div>
                    <span className="block text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                      {cms.storySection.stat3Value}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mt-0.5 block">
                      {cms.storySection.stat3Label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
