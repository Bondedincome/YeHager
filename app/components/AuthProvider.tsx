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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [usersList, setUsersList] = useState<AppUser[]>(INITIAL_USERS);
  const [orders, setOrders] = useState<CustomerOrder[]>(INITIAL_ORDERS);
  const [mounted, setMounted] = useState(false);

  const refreshState = useCallback(() => {
    const current = getActiveUser();
    setUser(current);
    setUsersList(getStoredUsers());
    setOrders(getStoredOrders());
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      refreshState();
    }, 0);

    const handleAuthChange = () => refreshState();
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
  }, [refreshState]);

  const login = async (emailOrUsername: string, pass: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrUsername,
          password: pass,
          clientUsers: usersList,
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

      const updated = [data.fullUser, ...usersList];
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: currentPass,
          newPassword: newPass,
          clientUsers: usersList,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Failed to update password.",
        };
      }

      // Update the user record with the new cryptographic hash & salt
      const updated = usersList.map((u) => {
        if (u.id === user.id) {
          return {
            ...u,
            passwordHash: data.passwordHash,
            passwordSalt: data.passwordSalt,
          };
        }
        return u;
      });

      saveStoredUsers(updated);
      setUsersList(updated);

      return { success: true, message: data.message };
    } catch {
      return { success: false, error: "Network error while updating password." };
    }
  };

  const logout = () => {
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

    // Sync order to Firestore API route in background
    try {
      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
  };

  const updateOrderDetails = (orderId: string, updates: Partial<CustomerOrder>) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, ...updates } : o));
    saveStoredOrders(updated);
    setOrders(updated);
  };

  const deleteOrder = (orderId: string) => {
    const updated = orders.filter((o) => o.id !== orderId);
    saveStoredOrders(updated);
    setOrders(updated);
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
  };

  const toggleUserStatus = (userId: string) => {
    const updated = usersList.map((u) =>
      u.id === userId ? { ...u, status: u.status === "active" ? ("suspended" as const) : ("active" as const) } : u
    );
    saveStoredUsers(updated);
    setUsersList(updated);
  };

  const deleteUser = (userId: string) => {
    const updated = usersList.filter((u) => u.id !== userId);
    saveStoredUsers(updated);
    setUsersList(updated);
  };

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
