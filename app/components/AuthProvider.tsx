"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  AppUser,
  CustomerOrder,
  setActiveUser,
  getStoredUsers,
  saveStoredUsers,
  getStoredOrders,
  saveStoredOrders,
} from "../lib/auth-store";
import { apiFetch } from "../lib/api";

type AuthContextType = {
  user: AppUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authLoading: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string; user?: AppUser }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string; user?: AppUser }>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => void;
  orders: CustomerOrder[];
  userOrders: CustomerOrder[];
  placeOrder: (orderData: Omit<CustomerOrder, "id" | "createdAt" | "orderNumber">) => Promise<CustomerOrder>;
  updateOrderStatus: (orderId: string, status: CustomerOrder["status"]) => Promise<boolean>;
  updateOrderDetails: (orderId: string, updates: Partial<CustomerOrder>) => Promise<boolean>;
  deleteOrder: (orderId: string) => Promise<boolean>;
  usersList: AppUser[];
  addUser: (userData: Omit<AppUser, "id" | "memberSince" | "totalOrders" | "totalSpentUSD"> & { password: string }) => Promise<boolean>;
  updateUserRole: (userId: string, role: AppUser["role"]) => Promise<boolean>;
  toggleUserStatus: (userId: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  mutationError: string | null;
  syncWithDatabase: () => Promise<{ success: boolean; message: string }>;
  syncWithFirestore: () => Promise<{ success: boolean; message: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("yehagere_auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

function normalizeUser(value: Record<string, unknown>): AppUser {
  let shippingAddress = value.shippingAddress;
  if (typeof shippingAddress === "string") {
    try {
      shippingAddress = JSON.parse(shippingAddress);
    } catch {
      shippingAddress = undefined;
    }
  }

  const name = typeof value.name === "string"
    ? value.name
    : `${String(value.firstName || "")} ${String(value.lastName || "")}`.trim();

  return {
    ...value,
    name,
    avatarUrl: value.avatarUrl ?? value.profileImage,
    shippingAddress,
  } as AppUser;
}

function normalizeOrder(value: Record<string, unknown>): CustomerOrder {
  const backendStatus = String(value.orderStatus ?? value.status ?? "confirmed").toLowerCase();
  return {
    ...value,
    id: String(value.id),
    orderNumber: String(value.orderNumber ?? ""),
    customerEmail: String(value.customerEmail ?? ""),
    customerName: String(value.customerName ?? ""),
    status: backendStatus === "processing" ? "preparing" : backendStatus as CustomerOrder["status"],
    totalUSD: Number(value.totalUSD ?? value.total ?? 0),
    totalETB: Number(value.totalETB ?? 0),
    items: (value.items ?? value.itemsData ?? []) as CustomerOrder["items"],
    internalNotes: String(value.internalNotes ?? value.notes ?? "") || undefined,
    shippingAddress: (value.shippingAddress ?? { street: "", city: "", postalCode: "", country: "" }) as CustomerOrder["shippingAddress"],
    createdAt: String(value.createdAt ?? new Date().toISOString()),
  } as CustomerOrder;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [mounted, setMounted] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Server-side session verification
  const verifySessionWithServer = useCallback(async () => {
    try {
      setAuthLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("yehagere_auth_token") : null;
      
      const res = await apiFetch("auth/me", {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const response = await res.json();
        const data = response.data ?? response;
        const sessionUser = normalizeUser(data.user ?? data);
        if (sessionUser?.id) {
          setUser(sessionUser);
          setActiveUser(sessionUser);
          return;
        }
      }

      // If server verification fails or token is expired/invalid, clear session
      if (token) {
        localStorage.removeItem("yehagere_auth_token");
      }
      setUsersList([]);
      setOrders([]);
      saveStoredUsers([]);
      saveStoredOrders([]);
      setActiveUser(null);
      setUser(null);
    } catch {
      setUsersList([]);
      setOrders([]);
      saveStoredUsers([]);
      saveStoredOrders([]);
      setActiveUser(null);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      verifySessionWithServer();
    }, 0);
    const handleUsersChange = () => setUsersList(getStoredUsers());
    const handleOrdersChange = () => setOrders(getStoredOrders());

    window.addEventListener("yehagere_users:updated", handleUsersChange);
    window.addEventListener("yehagere_orders:updated", handleOrdersChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("yehagere_users:updated", handleUsersChange);
      window.removeEventListener("yehagere_orders:updated", handleOrdersChange);
    };
  }, [verifySessionWithServer]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    const loadProtectedData = async () => {
      if (user.role === "admin") {
        const usersResponse = await apiFetch("users", { headers: getAuthHeaders() });
        if (!usersResponse.ok) throw new Error("Could not load users from NestJS.");
        const usersPayload = await usersResponse.json();
        const users = usersPayload.data ?? usersPayload;
        if (!Array.isArray(users)) throw new Error("NestJS returned an invalid users response.");
        const normalizedUsers = users.map(normalizeUser);
        if (active) {
          saveStoredUsers(normalizedUsers);
          setUsersList(normalizedUsers);
        }
      } else if (active) {
        setUsersList([]);
      }

      const ordersResponse = await apiFetch("orders", { headers: getAuthHeaders() });
      if (!ordersResponse.ok) throw new Error("Could not load orders from NestJS.");
      const ordersPayload = await ordersResponse.json();
      const responseOrders = ordersPayload.data ?? ordersPayload;
      if (!Array.isArray(responseOrders)) throw new Error("NestJS returned an invalid orders response.");
      const normalizedOrders = responseOrders.map(normalizeOrder);
      if (active) {
        saveStoredOrders(normalizedOrders);
        setOrders(normalizedOrders);
        setMutationError(null);
      }
    };

    loadProtectedData().catch((error: unknown) => {
      if (active) {
        setUsersList([]);
        setOrders([]);
        setMutationError(error instanceof Error ? error.message : "Could not load account data from NestJS.");
      }
    });

    return () => { active = false; };
  }, [user]);

  const login = async (identifier: string, pass: string) => {
    try {
      const res = await apiFetch("auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier,
          password: pass,
        }),
      });

      const response = await res.json();
      const data = response.data ?? response;
      const token = data.access_token ?? data.token;

      if (!res.ok || !token || !data.user) {
        return {
          success: false,
          error: response.message || data.error || "Authentication failed. Please verify your credentials.",
        };
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("yehagere_auth_token", token);
      }

      const authUser = normalizeUser(data.user);
      setUsersList([]);
      setOrders([]);
      setActiveUser(authUser);
      setUser(authUser);
      return { success: true, user: authUser };
    } catch {
      return {
        success: false,
        error: "Unable to connect to authentication server. Please check your network.",
      };
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    try {
      const [firstName, ...lastNameParts] = name.trim().split(/\s+/);
      const res = await apiFetch("auth/register", {
        method: "POST",
        body: JSON.stringify({
          firstName,
          lastName: lastNameParts.join(" ") || firstName,
          email,
          password: pass,
        }),
      });

      const response = await res.json();
      const data = response.data ?? response;
      const token = data.access_token ?? data.token;

      if (!res.ok || !token || !data.user) {
        return {
          success: false,
          error: data.error || "Registration failed.",
        };
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("yehagere_auth_token", token);
      }

      const authUser = normalizeUser(data.user);
      setUsersList([]);
      setOrders([]);
      const updated = [authUser, ...usersList];
      saveStoredUsers(updated);
      setUsersList(updated);
      setActiveUser(authUser);
      setUser(authUser);
      return { success: true, user: authUser };
    } catch {
      return {
        success: false,
        error: "Failed to establish secure patron connection.",
      };
    }
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!user) {
      return { success: false, error: "Please log in to change your password." };
    }
    try {
      const res = await apiFetch("auth/change-password", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword: currentPass,
          newPassword: newPass,
        }),
      });

      const response = await res.json();
      const data = response.data ?? response;

      if (!res.ok || !response.success) {
        return {
          success: false,
          error: response.message || data.error || "Failed to update password.",
        };
      }

      return { success: true, message: response.message || "Password updated successfully." };
    } catch {
      return { success: false, error: "Network error while updating password." };
    }
  };

  const logout = async () => {
    try {
      await apiFetch("auth/logout", { method: "POST" });
    } catch {
      // Safe ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("yehagere_auth_token");
    }
    setUsersList([]);
    setOrders([]);
    saveStoredUsers([]);
    saveStoredOrders([]);
    setMutationError(null);
    setActiveUser(null);
    setUser(null);
  };

  const placeOrder = async (orderData: Omit<CustomerOrder, "id" | "createdAt" | "orderNumber">) => {
    const generatedOrderNumber = `YH-${Math.floor(100000 + Math.random() * 900000)}`;
    const trackingNumber = `DHL-ET-${Math.floor(1000000 + Math.random() * 9000000)}`;

    const newOrder: CustomerOrder = {
      ...orderData,
      id: `ord_${Date.now()}`,
      orderNumber: generatedOrderNumber,
      createdAt: new Date().toISOString(),
      status: "confirmed",
      trackingNumber,
    };

    setMutationError(null);
    try {
      const response = await apiFetch("orders", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...newOrder,
          total: newOrder.totalUSD,
          orderStatus: "CONFIRMED",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || payload.error || "Order could not be saved.");
      const persistedOrder = normalizeOrder(payload.data ?? payload);
      const updatedOrders = [persistedOrder, ...orders];
      saveStoredOrders(updatedOrders);
      setOrders(updatedOrders);

      if (user && user.email.toLowerCase() === persistedOrder.customerEmail.toLowerCase()) {
        const updatedUser = {
          ...user,
          totalOrders: (user.totalOrders || 0) + 1,
          totalSpentUSD: (user.totalSpentUSD || 0) + persistedOrder.totalUSD,
        };
        const updatedUsers = usersList.map((item) => item.id === user.id ? updatedUser : item);
        saveStoredUsers(updatedUsers);
        setUsersList(updatedUsers);
        setUser(updatedUser);
        setActiveUser(updatedUser);
      }
      return persistedOrder;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Order could not be saved.";
      setMutationError(message);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, status: CustomerOrder["status"]): Promise<boolean> => {
    setMutationError(null);
    try {
      const response = await apiFetch(`orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ orderStatus: status === "preparing" ? "PROCESSING" : status.toUpperCase() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || payload.error || "Order status could not be updated.");
      const updated = orders.map((order) => order.id === orderId ? { ...order, status } : order);
      saveStoredOrders(updated);
      setOrders(updated);
      return true;
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Order status could not be updated.");
      return false;
    }
  };

  const updateOrderDetails = async (orderId: string, updates: Partial<CustomerOrder>): Promise<boolean> => {
    const { status, totalUSD, ...otherUpdates } = updates;
    const { internalNotes, ...persistedUpdates } = otherUpdates;
    setMutationError(null);
    try {
      const response = await apiFetch(`orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...persistedUpdates,
          ...(internalNotes !== undefined ? { notes: internalNotes } : {}),
          ...(status !== undefined ? { orderStatus: status === "preparing" ? "PROCESSING" : status.toUpperCase() } : {}),
          ...(totalUSD !== undefined ? { total: totalUSD } : {}),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || payload.error || "Order details could not be updated.");
      const updated = orders.map((order) => order.id === orderId ? { ...order, ...updates } : order);
      saveStoredOrders(updated);
      setOrders(updated);
      return true;
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Order details could not be updated.");
      return false;
    }
  };

  const deleteOrder = async (orderId: string): Promise<boolean> => {
    setMutationError(null);
    try {
      const response = await apiFetch(`orders/${encodeURIComponent(orderId)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || payload.error || "Order could not be deleted.");
      const updated = orders.filter((order) => order.id !== orderId);
      saveStoredOrders(updated);
      setOrders(updated);
      return true;
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Order could not be deleted.");
      return false;
    }
  };

  const addUser = async (userData: Omit<AppUser, "id" | "memberSince" | "totalOrders" | "totalSpentUSD"> & { password: string }): Promise<boolean> => {
    const { password, ...profileData } = userData;
    setMutationError(null);
    try {
      const [firstName, ...lastNameParts] = profileData.name.trim().split(/\s+/);
      const response = await apiFetch("users", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          firstName,
          lastName: lastNameParts.join(" ") || firstName,
          email: profileData.email,
          phone: profileData.phone,
          role: profileData.role,
          password,
          shippingAddress: profileData.shippingAddress ? JSON.stringify(profileData.shippingAddress) : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || payload.error || "User could not be created.");
      const created = normalizeUser(payload.data ?? payload);
      const updated = [created, ...usersList];
      saveStoredUsers(updated);
      setUsersList(updated);
      return true;
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "User could not be created.");
      return false;
    }
  };

  const updateUserRole = async (userId: string, role: AppUser["role"]): Promise<boolean> => {
    setMutationError(null);
    try {
      const response = await apiFetch(`users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || payload.error || "User role could not be updated.");
      const updated = usersList.map((item) => item.id === userId ? { ...item, role } : item);
      saveStoredUsers(updated);
      setUsersList(updated);
      if (user?.id === userId) {
        const active = { ...user, role };
        setActiveUser(active);
        setUser(active);
      }
      return true;
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "User role could not be updated.");
      return false;
    }
  };

  const toggleUserStatus = async (userId: string): Promise<boolean> => {
    const targetUser = usersList.find((u) => u.id === userId);
    const newStatus = targetUser?.status === "active" ? ("suspended" as const) : ("active" as const);
    if (!targetUser) return false;
    setMutationError(null);
    try {
      const response = await apiFetch(`users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || payload.error || "User status could not be updated.");
      const updated = usersList.map((item) => item.id === userId ? { ...item, status: newStatus } : item);
      saveStoredUsers(updated);
      setUsersList(updated);
      return true;
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "User status could not be updated.");
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    setMutationError(null);
    try {
      const response = await apiFetch(`users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || payload.error || "User could not be deleted.");
      const updated = usersList.filter((item) => item.id !== userId);
      saveStoredUsers(updated);
      setUsersList(updated);
      return true;
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "User could not be deleted.");
      return false;
    }
  };

  const syncWithDatabase = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiFetch("products/seed", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: data.message || "NestJS catalog seed completed." };
      }
      return { success: false, message: data.error || "Sync encountered an issue." };
    } catch {
      return { success: false, message: "Network error while connecting to database status endpoint." };
    }
  };

  const syncWithFirestore = syncWithDatabase;

  const userOrders = mounted && user
    ? orders.filter(
        (o) =>
          (o.userId && o.userId === user.id) ||
          o.customerEmail.toLowerCase() === user.email.toLowerCase()
      )
    : [];

  const value: AuthContextType = {
    user,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin",
    authLoading,
    login,
    register,
    changePassword,
    logout,
    orders,
    userOrders,
    placeOrder,
    updateOrderStatus,
    updateOrderDetails,
    deleteOrder,
    usersList,
    mutationError,
    addUser,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    syncWithDatabase,
    syncWithFirestore,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
