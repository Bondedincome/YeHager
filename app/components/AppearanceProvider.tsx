"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { apiClient } from "../lib/api";

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
  categoryFilter?: string;
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
    text: "Free delivery in Addis Ababa on orders over Br25,000",
    linkText: "Shop new in",
    linkUrl: "/products",
    themeColor: "black",
    tickerMode: false,
  },
  hero: {
    imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1800&auto=format&fit=crop&q=80",
    headline: "Matching Sets",
    subheadline: "The sets you'll live in. Your most effortless outfits start here.",
    ctaText: "Shop now",
    ctaLink: "/products",
    badge: "New season",
    secondaryCtaText: "",
    secondaryCtaLink: "",
    alignment: "left",
    overlayOpacity: "medium",
  },
  lookbook: {
    title: "New In",
    subtitle: "Layers, denim, done. The pieces that set the tone this season.",
    categoryFilter: "all",
    badge: "",
    viewAllLinkText: "Shop all",
    itemLimit: 4,
  },
  splitSection1: {
    enabled: true,
    title: "Low Slung Denim",
    subtitle: "Meet your new favourite relaxed fit, cut from Ethiopian cotton.",
    ctaText: "Shop denim",
    ctaLink: "/products",
    campaignImageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&auto=format&fit=crop&q=80",
    featuredProductIds: [2, 1, 3],
    badge: "",
    reverseLayout: false,
  },
  splitSection2: {
    enabled: true,
    title: "Hand-Loomed Outerwear",
    subtitle: "Warmth woven with traditional techniques, cut for everyday wear.",
    ctaText: "Shop outerwear",
    ctaLink: "/products",
    campaignImageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop&q=80",
    featuredProductIds: [4, 5, 2],
    badge: "",
    reverseLayout: true,
  },
  storySection: {
    enabled: true,
    badge: "Our story",
    title: "Hand-loomed in Addis Ababa",
    paragraph1: "Every YeHagere piece starts with organic Ethiopian cotton, spun by hand and woven on traditional wooden pit looms.",
    paragraph2: "We pay our weavers fair wages and make clothes built to last for years, not seasons.",
    imageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&auto=format&fit=crop&q=80",
    quote: "Made with lots of hearts and souls.",
    quoteAuthor: "YeHagere",
    stat1Value: "100%",
    stat1Label: "Organic cotton",
    stat2Value: "48+ hrs",
    stat2Label: "Loom time per piece",
    stat3Value: "Fair wage",
    stat3Label: "For every weaver",
  },
  footerNotice: "Handmade in Ethiopia",
  footer: {
    notice: "Handmade in Ethiopia",
    conciergePhone: "+251 91 123 4567",
    conciergeEmail: "hello@yehagere.com",
    boutiqueAddress: "Bole, Addis Ababa, Ethiopia",
    openingHours: "Mon – Sat, 9:00 – 19:30",
    instagramUrl: "https://instagram.com",
    tiktokUrl: "https://tiktok.com",
    telegramUrl: "https://t.me",
    facebookUrl: "https://facebook.com",
  },
};

/**
 * Old built-in defaults that are now retired. If a saved CMS still holds one of
 * these exact strings (i.e. the admin never changed it), swap in the new default.
 */
const RETIRED_DEFAULTS = new Set([
  "AUTUMN / WINTER '26 ATELIER CAPSULE",
  "ATELIER HERITAGE & PROVENANCE",
  "YeHageré Lead Atelier Master",
  "YEHAGERÉ ATELIER • HAND-CRAFTED ETHIOPIAN TEXTILES & CONTEMPORARY TAILORING",
  "Discover Atelier Heritage",
  "Special Addis Ababa Pop-Up • Private Appointments Available via Atelier Concierge",
  "#fall-lookbook",
  "Explore Lookbook",
]);

function dropRetired<T extends object>(saved: Partial<T> | undefined, defaults: T): T {
  const merged = { ...defaults, ...(saved || {}) } as T;
  for (const key of Object.keys(merged) as (keyof T)[]) {
    const value = merged[key];
    if (typeof value === "string" && RETIRED_DEFAULTS.has(value)) {
      merged[key] = defaults[key];
    }
  }
  return merged;
}

type AppearanceContextValue = {
  cms: SiteCMSContent;
  /** "loading" until the server copy has been fetched once. */
  status: "loading" | "ready" | "error";
  updatedAt: string | null;
  /** Saves the full content to the server. Throws with a readable message on failure. */
  saveCMS: (content: SiteCMSContent) => Promise<void>;
  /** Clears server content so everyone sees the defaults. */
  resetCMS: () => Promise<void>;
};

const AppearanceContext = createContext<AppearanceContextValue | undefined>(undefined);

/** Server endpoint (NestJS SiteContentModule). */
const CMS_ENDPOINT = "site-content/homepage";
/** Local cache of the last server copy, used only for a fast first paint. */
const CMS_CACHE_KEY = "yehagere_cms_cache_v3";
/** Old key from when content lived only in the browser. Read for one-time import. */
export const LEGACY_CMS_STORAGE_KEY = "yehagere_cms_content_v2";
const CMS_UPDATED_EVENT = "yehagere_cms:updated";

type StoreState = {
  cms: SiteCMSContent;
  status: AppearanceContextValue["status"];
  updatedAt: string | null;
};

const SERVER_STATE: StoreState = { cms: DEFAULT_CMS_CONTENT, status: "loading", updatedAt: null };
let state: StoreState | undefined;
let fetchStarted = false;

/** Merge any stored/partial content with defaults so missing fields never break the page. */
export function normalizeCMS(raw: unknown): SiteCMSContent {
  if (!raw || typeof raw !== "object") return DEFAULT_CMS_CONTENT;
  const p = raw as Partial<SiteCMSContent>;
  const D = DEFAULT_CMS_CONTENT;
  const footer = dropRetired(p.footer, D.footer);
  const footerNotice = p.footerNotice && !RETIRED_DEFAULTS.has(p.footerNotice) ? p.footerNotice : footer.notice;
  return {
    announcement: dropRetired(p.announcement, D.announcement),
    hero: dropRetired(p.hero, D.hero),
    lookbook: dropRetired(p.lookbook, D.lookbook),
    splitSection1: dropRetired(p.splitSection1, D.splitSection1),
    splitSection2: dropRetired(p.splitSection2, D.splitSection2),
    storySection: dropRetired(p.storySection, D.storySection),
    footerNotice,
    footer: { ...footer, notice: footerNotice },
  };
}

function readCache(): SiteCMSContent {
  try {
    const raw = localStorage.getItem(CMS_CACHE_KEY);
    return raw ? normalizeCMS(JSON.parse(raw)) : DEFAULT_CMS_CONTENT;
  } catch {
    return DEFAULT_CMS_CONTENT;
  }
}

function getSnapshot(): StoreState {
  state ??= { cms: readCache(), status: "loading", updatedAt: null };
  return state;
}

function setState(next: Partial<StoreState>) {
  state = { ...getSnapshot(), ...next };
  if (next.cms) {
    try {
      localStorage.setItem(CMS_CACHE_KEY, JSON.stringify(next.cms));
    } catch {
      // storage unavailable — the server copy is still the source of truth
    }
  }
  window.dispatchEvent(new Event(CMS_UPDATED_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CMS_UPDATED_EVENT, onChange);
  return () => window.removeEventListener(CMS_UPDATED_EVENT, onChange);
}

type ServerPayload = { content: unknown; updatedAt: string | null };

async function fetchFromServer() {
  const result = await apiClient<ServerPayload>(CMS_ENDPOINT, { cache: "no-store" });
  if (result.error !== undefined) {
    setState({ status: "error" });
    return;
  }
  setState({
    cms: result.data?.content ? normalizeCMS(result.data.content) : DEFAULT_CMS_CONTENT,
    updatedAt: result.data?.updatedAt ?? null,
    status: "ready",
  });
}

export default function AppearanceProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE);

  useEffect(() => {
    if (fetchStarted) return;
    fetchStarted = true;
    void fetchFromServer();
  }, []);

  const saveCMS = useCallback(async (content: SiteCMSContent) => {
    const body = { ...content, footer: { ...content.footer, notice: content.footerNotice } };
    const result = await apiClient<ServerPayload>(CMS_ENDPOINT, {
      method: "PUT",
      body: JSON.stringify({ content: body }),
    });
    if (result.error !== undefined) {
      throw new Error(
        result.status === 401 || result.status === 403
          ? "You need to be signed in as an admin to save."
          : result.error || "Could not save. Please try again."
      );
    }
    setState({
      cms: normalizeCMS(result.data?.content ?? body),
      updatedAt: result.data?.updatedAt ?? new Date().toISOString(),
      status: "ready",
    });
  }, []);

  const resetCMS = useCallback(async () => {
    const result = await apiClient(CMS_ENDPOINT, { method: "DELETE" });
    if (result.error !== undefined) throw new Error(result.error || "Could not reset. Please try again.");
    setState({ cms: DEFAULT_CMS_CONTENT, updatedAt: null, status: "ready" });
  }, []);

  const value = useMemo(
    () => ({ cms: snapshot.cms, status: snapshot.status, updatedAt: snapshot.updatedAt, saveCMS, resetCMS }),
    [snapshot, saveCMS, resetCMS]
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used within AppearanceProvider");
  return ctx;
}
