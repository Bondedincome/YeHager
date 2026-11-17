"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Product } from "./lib/products-store";
import { apiFetch } from "./lib/api";
import { productCategory, toList, toProduct } from "./lib/format";
import ProductCard from "./components/ProductCard";
import SectionMedia from "./components/SectionMedia";
import {
  useAppearance,
  HomeSectionKey,
  Overlay,
  PromoBanner,
  SiteCMSContent,
  SplitSection,
  TextTone,
} from "./components/AppearanceProvider";

/** Gradient from the text side so copy stays readable. */
const OVERLAY_BOTTOM: Record<Overlay, string> = {
  none: "",
  subtle: "bg-gradient-to-t from-black/40 via-black/5 to-transparent",
  medium: "bg-gradient-to-t from-black/60 via-black/15 to-transparent",
  heavy: "bg-gradient-to-t from-black/80 via-black/40 to-black/10",
};

/** Even tint, for text that sits in the middle of the media. */
const OVERLAY_FLAT: Record<Overlay, string> = {
  none: "",
  subtle: "bg-black/20",
  medium: "bg-black/35",
  heavy: "bg-black/55",
};

const LIGHT_OVERLAY: Record<Overlay, string> = {
  none: "",
  subtle: "bg-white/20",
  medium: "bg-white/35",
  heavy: "bg-white/55",
};

const overlayClass = (overlay: Overlay = "medium", tone: TextTone = "light", centered = false) =>
  tone === "dark" ? LIGHT_OVERLAY[overlay] : centered ? OVERLAY_FLAT[overlay] : OVERLAY_BOTTOM[overlay];

const ALIGN = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
} as const;

const tone = (t: TextTone = "light") => (t === "dark" ? "text-black" : "text-white");
const lightBtn = (t: TextTone = "light") => (t === "dark" ? "btn-primary" : "btn-light");
const outlineBtn = (t: TextTone = "light") =>
  t === "dark"
    ? "btn-outline"
    : "btn-outline border-white text-white hover:bg-white hover:text-black";

function pickProducts(catalog: Product[], ids: (number | string)[] | undefined, fallbackStart: number) {
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

function Hero({ hero }: { hero: SiteCMSContent["hero"] }) {
  const align = hero.alignment || "left";
  const vertical = hero.verticalPosition || "bottom";
  const height =
    hero.height === "full"
      ? "h-[calc(100svh-7rem)] min-h-[520px]"
      : hero.height === "medium"
      ? "h-[60vh] min-h-[440px] max-h-[720px]"
      : "h-[78vh] min-h-[520px] max-h-[900px]";
  const justify = vertical === "top" ? "justify-start pt-12 sm:pt-16" : vertical === "center" ? "justify-center" : "justify-end";
  const textTone = hero.textColor || "light";

  return (
    <section className={`relative w-full ${height} bg-surface overflow-hidden`}>
      <SectionMedia
        mediaType={hero.mediaType}
        imageUrl={hero.imageUrl}
        mobileImageUrl={hero.mobileImageUrl}
        videoUrl={hero.videoUrl}
        alt={hero.headline}
        imageClassName="object-cover object-top"
        controlsPosition={vertical === "bottom" && align === "right" ? "top-right" : "bottom-right"}
      />
      <div className={`absolute inset-0 pointer-events-none ${overlayClass(hero.overlayOpacity, textTone, vertical !== "bottom")}`} />

      <div className={`relative h-full max-w-[1600px] mx-auto px-5 sm:px-10 pb-12 sm:pb-16 flex flex-col ${justify}`}>
        <div className={`flex flex-col gap-4 sm:gap-5 ${tone(textTone)} ${ALIGN[align]}`}>
          {hero.badge && <p className="eyebrow text-xs">{hero.badge}</p>}
          <h1 className="heading-display text-5xl sm:text-7xl lg:text-8xl max-w-4xl">{hero.headline}</h1>
          {hero.subheadline && (
            <p className={`text-sm sm:text-base max-w-lg ${textTone === "dark" ? "text-neutral-800" : "text-white/90"}`}>
              {hero.subheadline}
            </p>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            {hero.ctaText && (
              <Link href={hero.ctaLink || "/products"} className={lightBtn(textTone)}>
                {hero.ctaText}
              </Link>
            )}
            {hero.secondaryCtaText && (
              <Link href={hero.secondaryCtaLink || "/products"} className={outlineBtn(textTone)}>
                {hero.secondaryCtaText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureSection({ section, products }: { section: SplitSection; products: Product[] }) {
  const href = section.ctaLink || "/products";
  return (
    <section className="max-w-[1600px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
        <div
          className={`group relative aspect-[4/5] lg:aspect-auto lg:min-h-[640px] bg-surface overflow-hidden ${
            section.reverseLayout ? "lg:order-2" : ""
          }`}
        >
          <SectionMedia
            mediaType={section.mediaType}
            imageUrl={section.campaignImageUrl}
            videoUrl={section.videoUrl}
            alt={section.title}
            className="transition-transform duration-700 group-hover:scale-[1.02]"
            controlsPosition="top-right"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
          {/* Whole image is clickable; sits under the video's pause button. */}
          <Link href={href} className="absolute inset-0" aria-label={section.ctaText || section.title} tabIndex={-1} />
          <div className="absolute left-5 right-5 bottom-6 sm:left-8 sm:bottom-8 text-white space-y-4 pointer-events-none">
            {section.badge && <p className="eyebrow">{section.badge}</p>}
            <h2 className="heading-display text-4xl sm:text-6xl">{section.title}</h2>
            <Link href={href} className="btn-light pointer-events-auto">
              {section.ctaText || "Shop now"}
            </Link>
          </div>
        </div>

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

function Promo({ banner }: { banner: PromoBanner }) {
  const height = banner.height === "short" ? "h-[340px]" : banner.height === "tall" ? "h-[80vh] min-h-[560px]" : "h-[520px]";
  const t = banner.textColor || "light";
  return (
    <section className={`relative w-full ${height} bg-surface overflow-hidden my-8`}>
      <SectionMedia
        mediaType={banner.mediaType}
        imageUrl={banner.imageUrl}
        videoUrl={banner.videoUrl}
        alt={banner.headline || "Promotion"}
      />
      <div className={`absolute inset-0 pointer-events-none ${overlayClass(banner.overlayOpacity, t, true)}`} />
      <div className="relative h-full max-w-[1600px] mx-auto px-5 sm:px-10 flex flex-col justify-center">
        <div className={`flex flex-col gap-4 ${tone(t)} ${ALIGN[banner.alignment || "center"]}`}>
          {banner.badge && <p className="eyebrow text-xs">{banner.badge}</p>}
          {banner.headline && <h2 className="heading-display text-4xl sm:text-6xl max-w-3xl">{banner.headline}</h2>}
          {banner.text && (
            <p className={`text-sm sm:text-base max-w-lg ${t === "dark" ? "text-neutral-800" : "text-white/90"}`}>{banner.text}</p>
          )}
          {banner.ctaText && (
            <Link href={banner.ctaLink || "/products"} className={`${lightBtn(t)} mt-2`}>
              {banner.ctaText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

export default function Home() {
  const { cms } = useAppearance();
  const [catalog, setCatalog] = useState<Product[]>([]);

  useEffect(() => {
    apiFetch("products")
      .then((r) => {
        if (!r.ok) throw new Error(`Product request failed (${r.status})`);
        return r.json();
      })
      .then((payload) => setCatalog(toList<Product>(payload).map(toProduct)))
      .catch(() => setCatalog([]));
  }, []);

  const lb = cms.lookbook;
  const newIn = useMemo(() => {
    const filter = lb.categoryFilter;
    const limit = lb.itemLimit || 4;
    const filtered =
      !filter || filter === "all" ? catalog : catalog.filter((p) => productCategory(p) === filter.toLowerCase());
    const list = [...(filtered.length > 0 ? filtered : catalog)];
    if (lb.sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (lb.sort === "price-desc") list.sort((a, b) => b.price - a.price);
    return list.slice(0, limit);
  }, [catalog, lb.categoryFilter, lb.itemLimit, lb.sort]);

  const feature1 = useMemo(() => pickProducts(catalog, cms.splitSection1.featuredProductIds, 0), [catalog, cms.splitSection1.featuredProductIds]);
  const feature2 = useMemo(() => pickProducts(catalog, cms.splitSection2.featuredProductIds, 3), [catalog, cms.splitSection2.featuredProductIds]);

  const story = cms.storySection;
  const stats = [
    [story.stat1Value, story.stat1Label],
    [story.stat2Value, story.stat2Label],
    [story.stat3Value, story.stat3Label],
  ].filter(([v]) => v);

  const shopAllHref =
    lb.categoryFilter && lb.categoryFilter !== "all"
      ? `/products?category=${encodeURIComponent(lb.categoryFilter)}`
      : "/products";

  const sections: Record<HomeSectionKey, React.ReactNode> = {
    lookbook:
      (lb.enabled ?? true) && newIn.length > 0 ? (
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-6">
          <SectionHeading
            eyebrow={lb.badge}
            title={lb.title}
            subtitle={lb.subtitle}
            link={{ text: lb.viewAllLinkText, href: shopAllHref }}
          />
          <div className={`grid ${GRID_COLS[lb.columns || 4] ?? GRID_COLS[4]} gap-x-3 gap-y-10`}>
            {newIn.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null,
    splitSection1: (cms.splitSection1.enabled ?? true) ? <FeatureSection section={cms.splitSection1} products={feature1} /> : null,
    splitSection2: (cms.splitSection2.enabled ?? true) ? <FeatureSection section={cms.splitSection2} products={feature2} /> : null,
    promoBanner: cms.promoBanner.enabled ? <Promo banner={cms.promoBanner} /> : null,
    storySection: story.enabled ? (
      <section className="border-t border-line mt-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className={`relative aspect-[4/5] bg-neutral-200 overflow-hidden ${story.imageSide === "right" ? "lg:order-2" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {story.imageUrl && <img src={story.imageUrl} alt={story.title} className="absolute inset-0 w-full h-full object-cover" />}
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

            {story.ctaText && (
              <Link href={story.ctaLink || "/about"} className="btn-primary">
                {story.ctaText}
              </Link>
            )}
          </div>
        </div>
      </section>
    ) : null,
  };

  return (
    <div className="w-full">
      <Hero hero={cms.hero} />
      {cms.sectionOrder.map((key) => (
        <React.Fragment key={key}>{sections[key]}</React.Fragment>
      ))}
    </div>
  );
}
