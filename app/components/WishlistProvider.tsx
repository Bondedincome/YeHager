"use client";

import React, { createContext, useContext, useCallback, useMemo, useSyncExternalStore, ReactNode } from "react";

interface WishlistContextType {
  wishlistIds: number[];
  toggleWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const WISHLIST_STORAGE_KEY = "yehagere_wishlist";
const WISHLIST_UPDATED_EVENT = "wishlist-updated";
const emptyWishlist: number[] = [];
let cachedWishlist: number[] | undefined;

function readWishlist(): number[] {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return emptyWishlist;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return emptyWishlist;
    return parsed as number[];
  } catch {
    return emptyWishlist;
  }
}

function getWishlistSnapshot(): number[] {
  cachedWishlist ??= readWishlist();
  return cachedWishlist;
}

function subscribeToWishlist(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(WISHLIST_UPDATED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(WISHLIST_UPDATED_EVENT, onStoreChange);
  };
}

function setWishlistSnapshot(ids: number[]) {
  cachedWishlist = ids;
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable
  }
  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const wishlistIds = useSyncExternalStore(subscribeToWishlist, getWishlistSnapshot, () => emptyWishlist);

  const toggleWishlist = useCallback((productId: number) => {
    const next = wishlistIds.includes(productId)
      ? wishlistIds.filter((id) => id !== productId)
      : [...wishlistIds, productId];
    setWishlistSnapshot(next);
  }, [wishlistIds]);

  const isInWishlist = useCallback((productId: number) => {
    return wishlistIds.includes(productId);
  }, [wishlistIds]);

  const value = useMemo(
    () => ({
      wishlistIds,
      toggleWishlist,
      isInWishlist,
      wishlistCount: wishlistIds.length,
    }),
    [wishlistIds, toggleWishlist, isInWishlist]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}

