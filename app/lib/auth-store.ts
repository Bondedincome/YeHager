"use client";

import { useState, useEffect, useCallback } from "react";

export type UserRole = "admin" | "customer" | "vip";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  memberSince: string;
  status: "active" | "suspended";
  totalOrders: number;
  totalSpentUSD: number;
  phone?: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
};

export type OrderItem = {
  id: number;
  title: string;
  price: number;
  priceETB?: number;
  quantity: number;
  size?: string;
  color?: string;
  imageUrl?: string;
};

export type OrderStatus = "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled";

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  userId?: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  totalUSD: number;
  totalETB: number;
  status: OrderStatus;
  paymentMethod: "stripe" | "card" | "apple_pay";
  paymentIntentId?: string;
  last4?: string;
  createdAt: string;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  trackingNumber?: string;
};

export const INITIAL_USERS: AppUser[] = [
  {
    id: "usr_admin_1",
    name: "YeHageré Atelier Director",
    email: "admin@yehagere.com",
    role: "admin",
    memberSince: "2024-01-10",
    status: "active",
    totalOrders: 4,
    totalSpentUSD: 1420,
    phone: "+251 91 123 4567",
    shippingAddress: {
      street: "Bole Medhanialem St., Suite 400",
      city: "Addis Ababa",
      state: "Addis Ababa",
      zip: "1000",
      country: "Ethiopia",
    },
  },
  {
    id: "usr_cust_1",
    name: "Daniot Mihrete",
    email: "daniot.mihrete-ug@aau.edu.et",
    role: "vip",
    memberSince: "2024-03-15",
    status: "active",
    totalOrders: 5,
    totalSpentUSD: 1890,
    phone: "+251 92 987 6543",
    shippingAddress: {
      street: "Kazanchis Heritage Quarter, No. 12",
      city: "Addis Ababa",
      state: "Addis Ababa",
      zip: "1000",
      country: "Ethiopia",
    },
  },
  {
    id: "usr_cust_2",
    name: "Elena Vance",
    email: "elena.vance@studio-atelier.com",
    role: "customer",
    memberSince: "2024-06-20",
    status: "active",
    totalOrders: 2,
    totalSpentUSD: 680,
    phone: "+1 (415) 555-0199",
    shippingAddress: {
      street: "742 Evergreen Terrace",
      city: "San Francisco",
      state: "CA",
      zip: "94107",
      country: "United States",
    },
  },
  {
    id: "usr_cust_3",
    name: "Marcus Thorne",
    email: "marcus.thorne@arch-collective.org",
    role: "customer",
    memberSince: "2024-08-01",
    status: "active",
    totalOrders: 1,
    totalSpentUSD: 340,
    phone: "+44 20 7946 0912",
    shippingAddress: {
      street: "18 Kensington Church St",
      city: "London",
      state: "Greater London",
      zip: "W8 4EP",
      country: "United Kingdom",
    },
  },
];

export const INITIAL_ORDERS: CustomerOrder[] = [
  {
    id: "ord_101",
    orderNumber: "YH-948210",
    userId: "usr_cust_1",
    customerEmail: "daniot.mihrete-ug@aau.edu.et",
    customerName: "Daniot Mihrete",
    items: [
      {
        id: 3,
        title: "The Tibeb Linen Matching Set",
        price: 320,
        priceETB: 40000,
        quantity: 1,
        size: "M",
        color: "Natural Ecru",
        imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
      },
      {
        id: 2,
        title: "Vintage Low Slung Baggy Denim",
        price: 240,
        priceETB: 30000,
        quantity: 1,
        size: "32",
        color: "Washed Indigo",
        imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
      },
    ],
    totalUSD: 560,
    totalETB: 70000,
    status: "delivered",
    paymentMethod: "stripe",
    paymentIntentId: "pi_3NqX82YeHagereStripe_01",
    last4: "4242",
    createdAt: "2026-08-20T14:22:00Z",
    shippingAddress: {
      street: "Kazanchis Heritage Quarter, No. 12",
      city: "Addis Ababa",
      postalCode: "1000",
      country: "Ethiopia",
    },
    trackingNumber: "DHL-ET-8829104",
  },
  {
    id: "ord_102",
    orderNumber: "YH-840192",
    userId: "usr_cust_1",
    customerEmail: "daniot.mihrete-ug@aau.edu.et",
    customerName: "Daniot Mihrete",
    items: [
      {
        id: 1,
        title: "Washed Ribbed Knit Henley",
        price: 180,
        priceETB: 22500,
        quantity: 2,
        size: "L",
        color: "Oatmeal Melange",
        imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80",
      },
    ],
    totalUSD: 360,
    totalETB: 45000,
    status: "shipped",
    paymentMethod: "stripe",
    paymentIntentId: "pi_3NqX82YeHagereStripe_02",
    last4: "4242",
    createdAt: "2026-08-28T09:15:00Z",
    shippingAddress: {
      street: "Kazanchis Heritage Quarter, No. 12",
      city: "Addis Ababa",
      postalCode: "1000",
      country: "Ethiopia",
    },
    trackingNumber: "DHL-ET-9102847",
  },
  {
    id: "ord_103",
    orderNumber: "YH-772914",
    userId: "usr_cust_2",
    customerEmail: "elena.vance@studio-atelier.com",
    customerName: "Elena Vance",
    items: [
      {
        id: 4,
        title: "Artisan Hand-Loomed Overcoat",
        price: 460,
        priceETB: 57500,
        quantity: 1,
        size: "S",
        color: "Charcoal Slate",
        imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80",
      },
    ],
    totalUSD: 460,
    totalETB: 57500,
    status: "preparing",
    paymentMethod: "stripe",
    paymentIntentId: "pi_3NqX82YeHagereStripe_03",
    last4: "8821",
    createdAt: "2026-08-30T11:40:00Z",
    shippingAddress: {
      street: "742 Evergreen Terrace",
      city: "San Francisco",
      postalCode: "94107",
      country: "United States",
    },
    trackingNumber: "FEDEX-US-1029384",
  },
];

const USERS_KEY = "yehagere_users_list_v2";
const ORDERS_KEY = "yehagere_orders_list_v2";
const CURRENT_USER_KEY = "yehagere_active_user_v2";

export function getStoredUsers(): AppUser[] {
  if (typeof window === "undefined") return INITIAL_USERS;
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: AppUser[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent("yehagere_users:updated"));
  } catch (e) {
    console.error("Failed to save users", e);
  }
}

export function getStoredOrders(): CustomerOrder[] {
  if (typeof window === "undefined") return INITIAL_ORDERS;
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveStoredOrders(orders: CustomerOrder[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent("yehagere_orders:updated"));
  } catch (e) {
    console.error("Failed to save orders", e);
  }
}

export function getActiveUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setActiveUser(user: AppUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.setItem("token", `auth_${user.id}_${Date.now()}`);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem("token");
    }
    window.dispatchEvent(new CustomEvent("yehagere_auth:updated"));
  } catch (e) {
    console.error("Failed to set active user", e);
  }
}
