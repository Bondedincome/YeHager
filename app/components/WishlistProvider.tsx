"use client";

import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { apiFetch } from "../lib/api";

interface WishlistContextType {
  wishlistIds: Array<number | string>;
  toggleWishlist: (productId: number | string) => void;
  isInWishlist: (productId: number | string) => boolean;
  wishlistCount: number;
  syncError: string | null;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const WISHLIST_STORAGE_KEY = "yehagere_wishlist";
const WISHLIST_UPDATED_EVENT = "wishlist-updated";
const emptyWishlist: Array<number | string> = [];
let cachedWishlist: Array<number | string> | undefined;

function readWishlist(): Array<number | string> {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return emptyWishlist;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return emptyWishlist;
    return parsed as Array<number | string>;
  } catch {
    return emptyWishlist;
  }
}

function getWishlistSnapshot(): Array<number | string> {
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

function setWishlistSnapshot(ids: Array<number | string>) {
  cachedWishlist = ids;
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable
  }
  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, authLoading } = useAuth();
  const wishlistIds = useSyncExternalStore(subscribeToWishlist, getWishlistSnapshot, () => emptyWishlist);
  const [syncStatus, setSyncStatus] = useState<{ userId: string | null; error: string | null }>({ userId: null, error: null });
  const previousUserId = useRef<string | null>(null);
  const syncError = syncStatus.userId === (user?.id ?? null) ? syncStatus.error : null;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      if (previousUserId.current !== null) setWishlistSnapshot([]);
      previousUserId.current = null;
      return;
    }

    let active = true;
    const previousAccountId = previousUserId.current;
    const sameAccount = previousAccountId === user.id;
    const switchedAccounts = previousAccountId !== null && !sameAccount;
    if (switchedAccounts) setWishlistSnapshot([]);
    const guestIds = sameAccount || switchedAccounts
      ? []
      : [...getWishlistSnapshot()].filter((id) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id));
    previousUserId.current = user.id;
    apiFetch("wishlist")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load your saved items.");
        const payload = await response.json();
        const savedIds = payload.data ?? payload;
        if (!Array.isArray(savedIds)) throw new Error("Wishlist response was invalid.");
        const mergedIds = [...new Set([...savedIds, ...guestIds].map(String))];
        for (const productId of mergedIds) {
          if (!savedIds.some((savedId: string) => String(savedId) === productId)) {
            const addResponse = await apiFetch("wishlist", {
              method: "POST",
              body: JSON.stringify({ productId }),
            });
            if (!addResponse.ok) throw new Error("Could not sync your saved items.");
          }
        }
        if (active) {
          setWishlistSnapshot(mergedIds);
          setSyncStatus({ userId: user.id, error: null });
        }
      })
      .catch((error: unknown) => {
        if (active) setSyncStatus({ userId: user.id, error: error instanceof Error ? error.message : "Could not sync your saved items." });
      });

    return () => { active = false; };
  }, [authLoading, user]);

  const toggleWishlist = useCallback(async (productId: number | string) => {
    const next = wishlistIds.includes(productId)
      ? wishlistIds.filter((id) => id !== productId)
      : [...wishlistIds, productId];
    setWishlistSnapshot(next);
    if (!user) return;

    setSyncStatus({ userId: user.id, error: null });
    try {
      const response = wishlistIds.includes(productId)
        ? await apiFetch(`wishlist/${encodeURIComponent(String(productId))}`, { method: "DELETE" })
        : await apiFetch("wishlist", {
            method: "POST",
            body: JSON.stringify({ productId: String(productId) }),
          });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Could not update your saved items.");
    } catch (error) {
      setWishlistSnapshot(wishlistIds);
      setSyncStatus({ userId: user.id, error: error instanceof Error ? error.message : "Could not update your saved items." });
    }
  }, [wishlistIds, user]);

  const isInWishlist = useCallback((productId: number | string) => {
    return wishlistIds.includes(productId);
  }, [wishlistIds]);

  const value = useMemo(
    () => ({
      wishlistIds,
      toggleWishlist,
      isInWishlist,
      wishlistCount: wishlistIds.length,
      syncError,
    }),
    [wishlistIds, toggleWishlist, isInWishlist, syncError]
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

