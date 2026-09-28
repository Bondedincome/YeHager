"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useAuth } from "./AuthProvider";
import { apiFetch } from "../lib/api";

export type CartItem = {
  id: number | string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  size?: string;
  color?: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (id: number | string) => void;
  clear: () => void;
  count: number;
  syncError: string | null;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const CART_STORAGE_KEY = "cart";
const CART_UPDATED_EVENT = "cart-updated";
const emptyCart: CartItem[] = [];
let cachedCart: CartItem[] | undefined;

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return emptyCart;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return emptyCart;
    return parsed as CartItem[];
  } catch {
    return emptyCart;
  }
}

function getCartSnapshot() {
  cachedCart ??= readCart();
  return cachedCart;
}

function subscribeToCart(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CART_UPDATED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CART_UPDATED_EVENT, onStoreChange);
  };
}

function setCartSnapshot(items: CartItem[]) {
  cachedCart = items;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage may be unavailable in private browsing or restricted environments.
  }
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

function lineKey(item: Pick<CartItem, "id" | "size" | "color">) {
  return `${item.id}:${item.size ?? ""}:${item.color ?? ""}`;
}

function normalizeCartItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    id: item.productId ?? item.id,
    title: item.title,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 1,
    imageUrl: item.imageUrl,
    size: item.size,
    color: item.color,
  }));
}

export function CartProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, authLoading } = useAuth();
  const items = useSyncExternalStore(subscribeToCart, getCartSnapshot, () => emptyCart);
  const [syncError, setSyncError] = useState<string | null>(null);
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const userId = user?.id ?? null;
    const changedAccount = previousUserId.current !== null && previousUserId.current !== userId;
    if (changedAccount) setCartSnapshot([]);
    previousUserId.current = userId;
    if (!userId) return;

    let active = true;
    const guestItems = changedAccount
      ? []
      : getCartSnapshot().filter((item) => typeof item.id === "string" && /^[0-9a-f-]{36}$/i.test(item.id));
    apiFetch("cart")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load your saved cart.");
        const payload = await response.json();
        const remoteItems = normalizeCartItems((payload.data ?? payload).items);
        const merged = new Map(remoteItems.map((item) => [lineKey(item), item]));
        for (const item of guestItems) {
          const key = lineKey(item);
          const existing = merged.get(key);
          merged.set(key, { ...item, quantity: item.quantity + (existing?.quantity ?? 0) });
        }

        const nextItems = [...merged.values()];
        const saveResponse = await apiFetch("cart", {
          method: "PUT",
          body: JSON.stringify({ items: nextItems.map((item) => ({
            productId: String(item.id),
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })) }),
        });
        const savedPayload = await saveResponse.json();
        if (!saveResponse.ok) throw new Error(savedPayload.message || "Could not sync your cart.");
        if (active) {
          setCartSnapshot(normalizeCartItems((savedPayload.data ?? savedPayload).items));
          setSyncError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) setSyncError(error instanceof Error ? error.message : "Could not sync your cart.");
      });

    return () => { active = false; };
  }, [authLoading, user?.id]);

  const persistIfSignedIn = useCallback(async (nextItems: CartItem[], previousItems: CartItem[]) => {
    if (!user) return;
    setSyncError(null);
    try {
      const response = await apiFetch("cart", {
        method: "PUT",
        body: JSON.stringify({ items: nextItems.map((item) => ({
          productId: String(item.id),
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Could not save your cart.");
      setCartSnapshot(normalizeCartItems((payload.data ?? payload).items));
    } catch (error) {
      setCartSnapshot(previousItems);
      setSyncError(error instanceof Error ? error.message : "Could not save your cart.");
    }
  }, [user]);

  const addItem = useCallback(async (item: Omit<CartItem, "quantity">, qty = 1) => {
    const previousItems = items;
    const itemExists = items.some((cartItem) => lineKey(cartItem) === lineKey(item));
    const nextItems = itemExists
      ? items.map((cartItem) => lineKey(cartItem) === lineKey(item)
          ? { ...cartItem, quantity: cartItem.quantity + qty }
          : cartItem)
      : [...items, { ...item, quantity: qty }];
    setCartSnapshot(nextItems);
    await persistIfSignedIn(nextItems, previousItems);
  }, [items, persistIfSignedIn]);

  const removeItem = useCallback(async (id: number | string) => {
    const previousItems = items;
    const nextItems = items.filter((item) => item.id !== id);
    setCartSnapshot(nextItems);
    await persistIfSignedIn(nextItems, previousItems);
  }, [items, persistIfSignedIn]);

  const clear = useCallback(async () => {
    const previousItems = items;
    setCartSnapshot(emptyCart);
    if (user) {
      try {
        const response = await apiFetch("cart", { method: "DELETE" });
        if (!response.ok) throw new Error("Could not clear your saved cart.");
        setSyncError(null);
      } catch (error) {
        setCartSnapshot(previousItems);
        setSyncError(error instanceof Error ? error.message : "Could not clear your saved cart.");
      }
    }
  }, [items, user]);

  const count = items.reduce((total, item) => total + item.quantity, 0);
  const value = useMemo(() => ({ items, addItem, removeItem, clear, count, syncError }), [items, addItem, removeItem, clear, count, syncError]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
