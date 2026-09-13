"use client";

import type { CustomerOrder, AppUser, UserRole, OrderItem, OrderStatus } from "./auth-seed";
import { INITIAL_USERS } from "./auth-seed";

export type { UserRole, AppUser, OrderItem, OrderStatus, CustomerOrder };
export { INITIAL_USERS };

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

function sanitizeUserForStorage(user: AppUser): AppUser {
  const safe = { ...user };
  delete safe.passwordHash;
  delete safe.passwordSalt;
  return safe;
}

export function getStoredUsers(): AppUser[] {
  if (typeof window === "undefined") return INITIAL_USERS.map(sanitizeUserForStorage);
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      const sanitizedInitial = INITIAL_USERS.map(sanitizeUserForStorage);
      localStorage.setItem(USERS_KEY, JSON.stringify(sanitizedInitial));
      return sanitizedInitial;
    }
    const parsed: AppUser[] = JSON.parse(raw);
    return parsed.map(sanitizeUserForStorage);
  } catch {
    return INITIAL_USERS.map(sanitizeUserForStorage);
  }
}

export function saveStoredUsers(users: AppUser[]) {
  if (typeof window === "undefined") return;
  try {
    // Strip any sensitive cryptographic hashes from client storage
    const sanitized = users.map(sanitizeUserForStorage);
    localStorage.setItem(USERS_KEY, JSON.stringify(sanitized));
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
    const parsed = JSON.parse(raw);
    return sanitizeUserForStorage(parsed);
  } catch {
    return null;
  }
}

export function setActiveUser(user: AppUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      const sanitized = sanitizeUserForStorage(user);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sanitized));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem("token");
      localStorage.removeItem("yehagere_auth_token");
    }
    window.dispatchEvent(new CustomEvent("yehagere_auth:updated"));
  } catch (e) {
    console.error("Failed to set active user", e);
  }
}
