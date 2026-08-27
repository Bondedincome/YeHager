"use client";

import React, { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

type Banner = {
  imageUrl?: string;
  headline?: string;
  subheadline?: string;
};

type Promo = {
  text: string;
  link?: string;
};

type AppearanceSettings = {
  banner?: Banner;
  featuredProductIds?: string[];
  promos?: Promo[];
};

type AppearanceContextValue = {
  appearance: AppearanceSettings;
  setAppearance: (v: AppearanceSettings) => void;
};

const DEFAULTS: AppearanceSettings = {
  banner: {
    imageUrl: "/hero-default.jpg",
    headline: "New Arrivals",
    subheadline: "Shop the latest drop",
  },
  featuredProductIds: [],
  promos: [],
};

const AppearanceContext = createContext<AppearanceContextValue | undefined>(undefined);
const APPEARANCE_STORAGE_KEY = "appearanceSettings";
const APPEARANCE_UPDATED_EVENT = "appearance:updated";
let cachedAppearance: AppearanceSettings | undefined;

function readAppearance(): AppearanceSettings {
  try {
    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return DEFAULTS;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return DEFAULTS;
    return parsed as AppearanceSettings;
  } catch {
    return DEFAULTS;
  }
}

function getAppearanceSnapshot() {
  cachedAppearance ??= readAppearance();
  return cachedAppearance;
}

function subscribeToAppearance(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(APPEARANCE_UPDATED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(APPEARANCE_UPDATED_EVENT, onStoreChange);
  };
}

function setAppearanceSnapshot(appearance: AppearanceSettings) {
  cachedAppearance = appearance;
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
  } catch {
    // Storage may be unavailable in private browsing or restricted environments.
  }
  window.dispatchEvent(new CustomEvent(APPEARANCE_UPDATED_EVENT, { detail: appearance }));
}

export default function AppearanceProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const appearance = useSyncExternalStore(subscribeToAppearance, getAppearanceSnapshot, () => DEFAULTS);
  const setAppearance = useCallback((value: AppearanceSettings) => {
    setAppearanceSnapshot(value);
  }, []);
  const contextValue = useMemo(() => ({ appearance, setAppearance }), [appearance, setAppearance]);

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
