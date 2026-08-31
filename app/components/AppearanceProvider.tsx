"use client";

import React, { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

export type HeroBanner = {
  imageUrl: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink: string;
};

export type LookbookSection = {
  title: string;
  subtitle: string;
  categoryFilter?: string;
};

export type SplitSection = {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  campaignImageUrl: string;
  featuredProductIds: number[];
};

export type AnnouncementBar = {
  enabled: boolean;
  text: string;
  linkText?: string;
  linkUrl?: string;
};

export type SiteCMSContent = {
  announcement: AnnouncementBar;
  hero: HeroBanner;
  lookbook: LookbookSection;
  splitSection1: SplitSection;
  splitSection2: SplitSection;
  footerNotice: string;
};

export const DEFAULT_CMS_CONTENT: SiteCMSContent = {
  announcement: {
    enabled: true,
    text: "Complimentary worldwide express shipping on orders over Br 25,000 ETB",
    linkText: "Discover New In",
    linkUrl: "/products/1",
  },
  hero: {
    imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1800&auto=format&fit=crop&q=80",
    headline: "MATCHING SETS",
    subheadline: "The sets you'll live in—your most effortless outfits start here",
    ctaText: "Shop Now",
    ctaLink: "/products/3",
  },
  lookbook: {
    title: "Hello, Fall",
    subtitle: "Check every box: layers, denim, done. The layers that set the tone for fall.",
    categoryFilter: "all",
  },
  splitSection1: {
    title: "New In Denim: Low Slung Baggy",
    subtitle: "Meet your new favorite relaxed silhouette.",
    ctaText: "Shop New Denim",
    ctaLink: "/products/2",
    campaignImageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&auto=format&fit=crop&q=80",
    featuredProductIds: [2, 2, 2],
  },
  splitSection2: {
    title: "New In Denim: Low Slung Baggy",
    subtitle: "Meet your new favorite relaxed silhouette.",
    ctaText: "Shop New Denim",
    ctaLink: "/products/2",
    campaignImageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop&q=80",
    featuredProductIds: [2, 2, 2],
  },
  footerNotice: "YEHAGERÉ ATELIER • HAND-CRAFTED ETHIOPIAN TEXTILES & CONTEMPORARY TAILORING",
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
    return {
      ...DEFAULT_CMS_CONTENT,
      ...(parsed as Partial<SiteCMSContent>),
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
