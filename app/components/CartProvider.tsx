"use client";

import React, { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

export type CartItem = {
  id: number;
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
  removeItem: (id: number) => void;
  clear: () => void;
  count: number;
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

export function CartProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const items = useSyncExternalStore(subscribeToCart, getCartSnapshot, () => emptyCart);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    const itemExists = items.some((cartItem) => cartItem.id === item.id);
    const nextItems = itemExists
      ? items.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + qty } : cartItem,
        )
      : [...items, { ...item, quantity: qty }];
    setCartSnapshot(nextItems);
  }, [items]);

  const removeItem = useCallback((id: number) => {
    setCartSnapshot(items.filter((item) => item.id !== id));
  }, [items]);

  const clear = useCallback(() => {
    setCartSnapshot(emptyCart);
  }, []);

  const count = items.reduce((total, item) => total + item.quantity, 0);
  const value = useMemo(() => ({ items, addItem, removeItem, clear, count }), [items, addItem, removeItem, clear, count]);

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
