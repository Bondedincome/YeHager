"use client";

import type { CustomerOrder, AppUser, UserRole, OrderItem, OrderStatus } from "./auth-seed";

export type { UserRole, AppUser, OrderItem, OrderStatus, CustomerOrder };

/** Ids of the sample users/orders that used to be seeded into browser storage. */
const RETIRED_SAMPLE_IDS = new Set(["usr_admin_1", "usr_cust_1", "usr_cust_2", "usr_cust_3", "ord_101", "ord_102", "ord_103"]);
const notSample = <T extends { id: string }>(item: T) => !RETIRED_SAMPLE_IDS.has(item.id);

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
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed: AppUser[] = JSON.parse(raw);
    return parsed.filter(notSample).map(sanitizeUserForStorage);
  } catch {
    return [];
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
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed: CustomerOrder[] = JSON.parse(raw);
    return parsed.filter(notSample);
  } catch {
    return [];
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
