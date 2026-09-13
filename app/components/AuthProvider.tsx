"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  AppUser,
  CustomerOrder,
  getActiveUser,
  setActiveUser,
  getStoredUsers,
  saveStoredUsers,
  getStoredOrders,
  saveStoredOrders,
  INITIAL_USERS,
  INITIAL_ORDERS,
} from "../lib/auth-store";

type AuthContextType = {
  user: AppUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authLoading: boolean;
  login: (emailOrUsername: string, pass: string) => Promise<{ success: boolean; error?: string; user?: AppUser }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string; user?: AppUser }>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => void;
  orders: CustomerOrder[];
  userOrders: CustomerOrder[];
  placeOrder: (orderData: Omit<CustomerOrder, "id" | "createdAt" | "orderNumber">) => Promise<CustomerOrder>;
  updateOrderStatus: (orderId: string, status: CustomerOrder["status"]) => void;
  updateOrderDetails: (orderId: string, updates: Partial<CustomerOrder>) => void;
  deleteOrder: (orderId: string) => void;
  usersList: AppUser[];
  addUser: (userData: Omit<AppUser, "id" | "memberSince" | "totalOrders" | "totalSpentUSD">) => void;
  updateUserRole: (userId: string, role: AppUser["role"]) => void;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [usersList, setUsersList] = useState<AppUser[]>(INITIAL_USERS);
  const [orders, setOrders] = useState<CustomerOrder[]>(INITIAL_ORDERS);
  const [mounted, setMounted] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Server-side session verification
  const verifySessionWithServer = useCallback(async () => {
    try {
      setAuthLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("yehagere_auth_token") : null;
      
      const res = await fetch("/api/auth/me", {
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.authenticated && data.user) {
          setUser(data.user);
          setActiveUser(data.user);
          return;
        }
      }

      // If server verification fails or token is expired/invalid, clear session
      if (token) {
        localStorage.removeItem("yehagere_auth_token");
      }
      setActiveUser(null);
      setUser(null);
    } catch {
      // Offline fallback: if network error, do not grant admin privileges arbitrarily
      const local = getActiveUser();
      if (local && local.role !== "admin") {
        setUser(local);
      } else {
        setUser(null);
      }
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const refreshState = useCallback(() => {
    setUsersList(getStoredUsers());
    setOrders(getStoredOrders());
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      refreshState();
      verifySessionWithServer();
    }, 0);

    // Background synchronization with Cloud Firestore
    fetch("/api/users", {
      headers: getAuthHeaders(),
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((res) => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setUsersList((prev) => {
            const merged = [...res.data];
            for (const p of prev) {
              if (!merged.some((m) => m.id === p.id || m.email.toLowerCase() === p.email.toLowerCase())) {
                merged.push(p);
              }
            }
            saveStoredUsers(merged);
            return merged;
          });
        }
      })
      .catch(() => {});

    fetch("/api/orders", {
      headers: getAuthHeaders(),
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((res) => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setOrders((prev) => {
            const merged = [...res.data];
            for (const p of prev) {
              if (!merged.some((m) => m.id === p.id || m.orderNumber === p.orderNumber)) {
                merged.push(p);
              }
            }
            saveStoredOrders(merged);
            return merged;
          });
        }
      })
      .catch(() => {});

    const handleAuthChange = () => {
      refreshState();
    };
    const handleUsersChange = () => setUsersList(getStoredUsers());
    const handleOrdersChange = () => setOrders(getStoredOrders());

    window.addEventListener("yehagere_auth:updated", handleAuthChange);
    window.addEventListener("yehagere_users:updated", handleUsersChange);
    window.addEventListener("yehagere_orders:updated", handleOrdersChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("yehagere_auth:updated", handleAuthChange);
      window.removeEventListener("yehagere_users:updated", handleUsersChange);
      window.removeEventListener("yehagere_orders:updated", handleOrdersChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [refreshState, verifySessionWithServer]);

  const login = async (emailOrUsername: string, pass: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          emailOrUsername,
          password: pass,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Authentication failed. Please verify your credentials.",
        };
      }

      if (data.token && typeof window !== "undefined") {
        localStorage.setItem("yehagere_auth_token", data.token);
      }

      setActiveUser(data.user);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch {
      return {
        success: false,
        error: "Unable to connect to authentication server. Please check your network.",
      };
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          password: pass,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Registration failed.",
        };
      }

      if (data.token && typeof window !== "undefined") {
        localStorage.setItem("yehagere_auth_token", data.token);
      }

      const updated = [data.user, ...usersList];
      saveStoredUsers(updated);
      setUsersList(updated);
      setActiveUser(data.user);
      setUser(data.user);
      return { success: true, user: data.user };
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
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          userId: user.id,
          currentPassword: currentPass,
          newPassword: newPass,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Failed to update password.",
        };
      }

      return { success: true, message: data.message };
    } catch {
      return { success: false, error: "Network error while updating password." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // Safe ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("yehagere_auth_token");
    }
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

    const updatedOrders = [newOrder, ...orders];
    saveStoredOrders(updatedOrders);
    setOrders(updatedOrders);

    // Sync order to Firestore API route
    try {
      fetch("/api/orders", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(newOrder),
      }).catch(() => {
        // Safe ignore
      });
    } catch {
      // Safe ignore
    }

    // Update user stats if matched
    if (user || newOrder.customerEmail) {
      const targetEmail = (user?.email || newOrder.customerEmail).toLowerCase();
      const updatedUsers = usersList.map((u) => {
        if (u.email.toLowerCase() === targetEmail) {
          return {
            ...u,
            totalOrders: (u.totalOrders || 0) + 1,
            totalSpentUSD: (u.totalSpentUSD || 0) + newOrder.totalUSD,
          };
        }
        return u;
      });
      saveStoredUsers(updatedUsers);
      setUsersList(updatedUsers);
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: CustomerOrder["status"]) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
    saveStoredOrders(updated);
    setOrders(updated);

    fetch("/api/orders", {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ orderId, updates: { status } }),
    }).catch(() => {});
  };

  const updateOrderDetails = (orderId: string, updates: Partial<CustomerOrder>) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, ...updates } : o));
    saveStoredOrders(updated);
    setOrders(updated);

    fetch("/api/orders", {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ orderId, updates }),
    }).catch(() => {});
  };

  const deleteOrder = (orderId: string) => {
    const updated = orders.filter((o) => o.id !== orderId);
    saveStoredOrders(updated);
    setOrders(updated);

    fetch(`/api/orders?orderId=${encodeURIComponent(orderId)}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include",
    }).catch(() => {});
  };

  const addUser = (userData: Omit<AppUser, "id" | "memberSince" | "totalOrders" | "totalSpentUSD">) => {
    const newUser: AppUser = {
      ...userData,
      id: `usr_${Date.now()}`,
      memberSince: new Date().toISOString().split("T")[0],
      totalOrders: 0,
      totalSpentUSD: 0,
    };
    const updated = [newUser, ...usersList];
    saveStoredUsers(updated);
    setUsersList(updated);

    // Persist to Firestore via authenticated admin route
    fetch("/api/users", {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(userData),
    }).catch(() => {});
  };

  const updateUserRole = (userId: string, role: AppUser["role"]) => {
    const updated = usersList.map((u) => (u.id === userId ? { ...u, role } : u));
    saveStoredUsers(updated);
    setUsersList(updated);
    if (user?.id === userId) {
      const active = { ...user, role };
      setActiveUser(active);
      setUser(active);
    }

    // Persist to Firestore
    fetch("/api/users", {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ userId, updates: { role } }),
    }).catch(() => {});
  };

  const toggleUserStatus = (userId: string) => {
    const targetUser = usersList.find((u) => u.id === userId);
    const newStatus = targetUser?.status === "active" ? ("suspended" as const) : ("active" as const);

    const updated = usersList.map((u) =>
      u.id === userId ? { ...u, status: newStatus } : u
    );
    saveStoredUsers(updated);
    setUsersList(updated);

    // Persist to Firestore
    fetch("/api/users", {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ userId, updates: { status: newStatus } }),
    }).catch(() => {});
  };

  const deleteUser = (userId: string) => {
    const updated = usersList.filter((u) => u.id !== userId);
    saveStoredUsers(updated);
    setUsersList(updated);

    // Persist to Firestore
    fetch(`/api/users?userId=${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include",
    }).catch(() => {});
  };

  const syncWithDatabase = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch("/api/migrate", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          users: usersList,
          orders: orders,
        }),
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, message: data.message || "Data successfully verified with PostgreSQL backend." };
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
