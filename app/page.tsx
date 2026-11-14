"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Product } from "./lib/products-store";
import { apiFetch } from "./lib/api";
import { productCategory, toList } from "./lib/format";
import ProductCard from "./components/ProductCard";
import { useAppearance, SplitSection } from "./components/AppearanceProvider";

const OVERLAY: Record<string, string> = {
  subtle: "from-black/40 via-black/5 to-transparent",
  medium: "from-black/60 via-black/15 to-transparent",
  heavy: "from-black/80 via-black/40 to-black/10",
};

function pickProducts(catalog: Product[], ids: number[] | undefined, fallbackStart: number) {
  const matched = (ids ?? [])
    .map((id) => catalog.find((p) => String(p.id) === String(id)))
    .filter((p): p is Product => Boolean(p));
  return matched.length > 0 ? matched.slice(0, 3) : catalog.slice(fallbackStart, fallbackStart + 3);
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  link,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  link?: { text?: string; href: string };
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div className="space-y-2 max-w-2xl">
        {eyebrow && <p className="eyebrow text-muted">{eyebrow}</p>}
        <h2 className="heading-display text-3xl sm:text-5xl">{title}</h2>
        {subtitle && <p className="text-sm text-neutral-700">{subtitle}</p>}
      </div>
      {link?.text && (
        <Link href={link.href} className="link-underline self-start sm:self-end whitespace-nowrap">
          {link.text}
        </Link>
      )}
    </div>
  );
}

function FeatureSection({ section, products }: { section: SplitSection; products: Product[] }) {
  return (
    <section className="max-w-[1600px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
        <Link
          href={section.ctaLink || "/products"}
          className={`group relative block aspect-[4/5] lg:aspect-auto lg:min-h-[640px] bg-surface overflow-hidden ${
            section.reverseLayout ? "lg:order-2" : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={section.campaignImageUrl}
            alt={section.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <div className="absolute left-5 right-5 bottom-6 sm:left-8 sm:bottom-8 text-white space-y-4">
            {section.badge && <p className="eyebrow">{section.badge}</p>}
            <h2 className="heading-display text-4xl sm:text-6xl">{section.title}</h2>
            <span className="btn-light">{section.ctaText || "Shop now"}</span>
          </div>
        </Link>

        <div className="flex flex-col justify-center">
          {section.subtitle && <p className="text-sm text-neutral-700 mb-6 max-w-lg">{section.subtitle}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-8">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { cms } = useAppearance();
  const [catalog, setCatalog] = useState<Product[]>([]);

  useEffect(() => {
    apiFetch("products")
      .then((r) => {
        if (!r.ok) throw new Error(`Product request failed (${r.status})`);
        return r.json();
      })
      .then((payload) => setCatalog(toList<Product>(payload)))
      .catch(() => setCatalog([]));
  }, []);

  const newIn = useMemo(() => {
    const filter = cms.lookbook.categoryFilter;
    const limit = cms.lookbook.itemLimit || 4;
    const filtered =
      !filter || filter === "all" ? catalog : catalog.filter((p) => productCategory(p) === filter.toLowerCase());
    return (filtered.length > 0 ? filtered : catalog).slice(0, limit);
  }, [catalog, cms.lookbook.categoryFilter, cms.lookbook.itemLimit]);

  const feature1 = useMemo(() => pickProducts(catalog, cms.splitSection1.featuredProductIds, 0), [catalog, cms.splitSection1.featuredProductIds]);
  const feature2 = useMemo(() => pickProducts(catalog, cms.splitSection2.featuredProductIds, 3), [catalog, cms.splitSection2.featuredProductIds]);

  const hero = cms.hero;
  const align = hero.alignment || "left";
  const alignClass =
    align === "center" ? "items-center text-center" : align === "right" ? "items-end text-right" : "items-start text-left";

  const story = cms.storySection;
  const stats = story
    ? [
        [story.stat1Value, story.stat1Label],
        [story.stat2Value, story.stat2Label],
        [story.stat3Value, story.stat3Label],
      ].filter(([v]) => v)
    : [];

  const shopAllHref =
    cms.lookbook.categoryFilter && cms.lookbook.categoryFilter !== "all"
      ? `/products?category=${encodeURIComponent(cms.lookbook.categoryFilter)}`
      : "/products";

  return (
    <div className="w-full">
      {/* HERO */}
      <section className="relative w-full h-[78vh] min-h-[520px] max-h-[900px] bg-surface overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hero.imageUrl} alt={hero.headline} className="absolute inset-0 w-full h-full object-cover object-top" />
        <div className={`absolute inset-0 bg-gradient-to-t ${OVERLAY[hero.overlayOpacity || "medium"] ?? OVERLAY.medium}`} />

        <div className="relative h-full max-w-[1600px] mx-auto px-5 sm:px-10 pb-12 sm:pb-16 flex flex-col justify-end">
          <div className={`flex flex-col gap-4 sm:gap-5 text-white ${alignClass}`}>
            {hero.badge && <p className="eyebrow text-xs">{hero.badge}</p>}
            <h1 className="heading-display text-5xl sm:text-7xl lg:text-8xl max-w-4xl">{hero.headline}</h1>
            {hero.subheadline && <p className="text-sm sm:text-base max-w-lg text-white/90">{hero.subheadline}</p>}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={hero.ctaLink || "/products"} className="btn-light">
                {hero.ctaText || "Shop now"}
              </Link>
              {hero.secondaryCtaText && (
                <Link
                  href={hero.secondaryCtaLink || "/products"}
                  className="btn-outline border-white text-white hover:bg-white hover:text-black"
                >
                  {hero.secondaryCtaText}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* NEW IN */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-6">
        <SectionHeading
          eyebrow={cms.lookbook.badge}
          title={cms.lookbook.title}
          subtitle={cms.lookbook.subtitle}
          link={{ text: cms.lookbook.viewAllLinkText, href: shopAllHref }}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10">
          {newIn.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {(cms.splitSection1.enabled ?? true) && <FeatureSection section={cms.splitSection1} products={feature1} />}
      {(cms.splitSection2.enabled ?? true) && <FeatureSection section={cms.splitSection2} products={feature2} />}

      {/* OUR STORY */}
      {story?.enabled && (
        <section className="border-t border-line mt-8">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="relative aspect-[4/5] bg-neutral-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={story.imageUrl} alt={story.title} className="absolute inset-0 w-full h-full object-cover" />
            </div>

            <div className="space-y-6 max-w-xl">
              {story.badge && <p className="eyebrow text-muted">{story.badge}</p>}
              <h2 className="heading-display text-4xl sm:text-6xl">{story.title}</h2>
              <div className="space-y-4 text-sm sm:text-base text-neutral-700 leading-relaxed">
                {story.paragraph1 && <p>{story.paragraph1}</p>}
                {story.paragraph2 && <p>{story.paragraph2}</p>}
              </div>

              {story.quote && (
                <blockquote className="border-l-2 border-black pl-4">
                  <p className="text-base font-semibold">&ldquo;{story.quote}&rdquo;</p>
                  {story.quoteAuthor && <footer className="eyebrow text-muted mt-2">{story.quoteAuthor}</footer>}
                </blockquote>
              )}

              {stats.length > 0 && (
                <dl className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-300">
                  {stats.map(([value, label]) => (
                    <div key={label}>
                      <dt className="heading-display text-2xl sm:text-4xl">{value}</dt>
                      <dd className="text-xs text-neutral-600 mt-1">{label}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <Link href="/about" className="btn-primary">
                About us
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
