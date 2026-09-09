"use client";

import React, { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

export type HeroBanner = {
  imageUrl: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink: string;
  badge?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  alignment?: "left" | "center" | "right";
  overlayOpacity?: "subtle" | "medium" | "heavy";
};

export type LookbookSection = {
  title: string;
  subtitle: string;
  categoryFilter?: "all" | "sets" | "fall" | "knitwear" | "denim" | "outerwear";
  badge?: string;
  viewAllLinkText?: string;
  itemLimit?: number;
};

export type SplitSection = {
  enabled?: boolean;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  campaignImageUrl: string;
  featuredProductIds: number[];
  badge?: string;
  reverseLayout?: boolean;
};

export type AnnouncementBar = {
  enabled: boolean;
  text: string;
  linkText?: string;
  linkUrl?: string;
  themeColor?: "black" | "emerald" | "burgundy" | "ochre" | "navy";
  tickerMode?: boolean;
};

export type StorySection = {
  enabled: boolean;
  badge: string;
  title: string;
  paragraph1: string;
  paragraph2: string;
  imageUrl: string;
  quote: string;
  quoteAuthor: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
};

export type FooterCMS = {
  notice: string;
  conciergePhone: string;
  conciergeEmail: string;
  boutiqueAddress: string;
  openingHours: string;
  instagramUrl: string;
  tiktokUrl: string;
  telegramUrl: string;
  facebookUrl: string;
};

export type SiteCMSContent = {
  announcement: AnnouncementBar;
  hero: HeroBanner;
  lookbook: LookbookSection;
  splitSection1: SplitSection;
  splitSection2: SplitSection;
  storySection: StorySection;
  footerNotice: string;
  footer: FooterCMS;
};

export const DEFAULT_CMS_CONTENT: SiteCMSContent = {
  announcement: {
    enabled: true,
    text: "Complimentary worldwide express shipping on orders over Br 25,000 ETB",
    linkText: "Discover New In",
    linkUrl: "/products/1",
    themeColor: "black",
    tickerMode: false,
  },
  hero: {
    imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1800&auto=format&fit=crop&q=80",
    headline: "MATCHING SETS",
    subheadline: "The sets you'll live in—your most effortless outfits start here",
    ctaText: "Shop Now",
    ctaLink: "/products/3",
    badge: "AUTUMN / WINTER '26 ATELIER CAPSULE",
    secondaryCtaText: "Explore Lookbook",
    secondaryCtaLink: "#fall-lookbook",
    alignment: "left",
    overlayOpacity: "medium",
  },
  lookbook: {
    title: "Hello, Fall",
    subtitle: "Check every box: layers, denim, done. The layers that set the tone for fall.",
    categoryFilter: "all",
    badge: "SEASONAL EDIT",
    viewAllLinkText: "View Full Lookbook",
    itemLimit: 4,
  },
  splitSection1: {
    enabled: true,
    title: "New In Denim: Low Slung Baggy",
    subtitle: "Meet your new favorite relaxed silhouette, tailored with Ethiopian cotton selvedge.",
    ctaText: "Shop New Denim",
    ctaLink: "/products/2",
    campaignImageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&auto=format&fit=crop&q=80",
    featuredProductIds: [2, 1, 3],
    badge: "SIGNATURE SILHOUETTES",
    reverseLayout: false,
  },
  splitSection2: {
    enabled: true,
    title: "Hand-Loomed Outerwear & Coats",
    subtitle: "Warmth infused with ancestral weave techniques, crafted for modern cosmopolitan silhouettes.",
    ctaText: "Explore Outerwear",
    ctaLink: "/products/4",
    campaignImageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop&q=80",
    featuredProductIds: [4, 5, 2],
    badge: "CAPSULE HIGHLIGHT",
    reverseLayout: true,
  },
  storySection: {
    enabled: true,
    badge: "ATELIER HERITAGE & PROVENANCE",
    title: "Preserving Centuries-Old Hand-Loom Traditions in Modern Addis Ababa",
    paragraph1: "Every YeHageré silhouette is born from the convergence of ancestral Ethiopian hand-weaving and contemporary architectural tailoring. We spin sustainably farmed organic cotton on traditional drop spindles before weaving each textile on custom wooden pit looms.",
    paragraph2: "By circumventing industrial synthetic manufacturing, we honor our artisanal community with dignified wages, fair-trade workshop environments, and heirloom-grade garments engineered to endure for decades.",
    imageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&auto=format&fit=crop&q=80",
    quote: "True luxury is born when ancient cultural craftsmanship meets intentional, slow-fashion minimalism.",
    quoteAuthor: "YeHageré Lead Atelier Master",
    stat1Value: "100%",
    stat1Label: "Organic Ethiopian Cotton",
    stat2Value: "48+ Hrs",
    stat2Label: "Artisan Hand-Loom Time",
    stat3Value: "Fair Wage",
    stat3Label: "Cooperative Guarantee",
  },
  footerNotice: "YEHAGERÉ ATELIER • HAND-CRAFTED ETHIOPIAN TEXTILES & CONTEMPORARY TAILORING",
  footer: {
    notice: "YEHAGERÉ ATELIER • HAND-CRAFTED ETHIOPIAN TEXTILES & CONTEMPORARY TAILORING",
    conciergePhone: "+251 91 123 4567",
    conciergeEmail: "concierge@yehagere.com",
    boutiqueAddress: "Bole Sub-City, Kebele 03, Addis Ababa, Ethiopia",
    openingHours: "Mon – Sat: 9:00 AM – 7:30 PM EAT",
    instagramUrl: "https://instagram.com",
    tiktokUrl: "https://tiktok.com",
    telegramUrl: "https://t.me",
    facebookUrl: "https://facebook.com",
  },
};

type AppearanceContextValue = {
  cms: SiteCMSContent;
  updateCMS: (v: Partial<SiteCMSContent>) => void;
  resetCMS: () => void;
};

const AppearanceContext = createContext<AppearanceContextValue | undefined>(undefined);
const CMS_STORAGE_KEY = "yehagere_cms_content_v2";
const CMS_UPDATED_EVENT = "yehagere_cms:updated";
let cachedCMS: SiteCMSContent | undefined;

function readCMS(): SiteCMSContent {
  try {
    const raw = localStorage.getItem(CMS_STORAGE_KEY);
    if (!raw) return DEFAULT_CMS_CONTENT;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return DEFAULT_CMS_CONTENT;
    const p = parsed as Partial<SiteCMSContent>;
    return {
      ...DEFAULT_CMS_CONTENT,
      ...p,
      announcement: { ...DEFAULT_CMS_CONTENT.announcement, ...(p.announcement || {}) },
      hero: { ...DEFAULT_CMS_CONTENT.hero, ...(p.hero || {}) },
      lookbook: { ...DEFAULT_CMS_CONTENT.lookbook, ...(p.lookbook || {}) },
      splitSection1: { ...DEFAULT_CMS_CONTENT.splitSection1, ...(p.splitSection1 || {}) },
      splitSection2: { ...DEFAULT_CMS_CONTENT.splitSection2, ...(p.splitSection2 || {}) },
      storySection: { ...DEFAULT_CMS_CONTENT.storySection, ...(p.storySection || {}) },
      footer: { ...DEFAULT_CMS_CONTENT.footer, ...(p.footer || {}) },
    };
  } catch {
    return DEFAULT_CMS_CONTENT;
  }
}

function getCMSSnapshot(): SiteCMSContent {
  cachedCMS ??= readCMS();
  return cachedCMS;
}

function subscribeToCMS(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CMS_UPDATED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CMS_UPDATED_EVENT, onStoreChange);
  };
}

function setCMSSnapshot(newContent: SiteCMSContent) {
  cachedCMS = newContent;
  try {
    localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(newContent));
  } catch {
    // Storage fail-safe
  }
  window.dispatchEvent(new CustomEvent(CMS_UPDATED_EVENT, { detail: newContent }));
}

export default function AppearanceProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const cms = useSyncExternalStore(subscribeToCMS, getCMSSnapshot, () => DEFAULT_CMS_CONTENT);

  const updateCMS = useCallback((partial: Partial<SiteCMSContent>) => {
    const current = getCMSSnapshot();
    const updated: SiteCMSContent = {
      ...current,
      ...partial,
    };
    setCMSSnapshot(updated);
  }, []);

  const resetCMS = useCallback(() => {
    setCMSSnapshot(DEFAULT_CMS_CONTENT);
  }, []);

  const contextValue = useMemo(() => ({ cms, updateCMS, resetCMS }), [cms, updateCMS, resetCMS]);

  return (
    <AppearanceContext.Provider value={contextValue}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used within AppearanceProvider");
  return ctx;
}
