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
  logout: () => void;
  orders: CustomerOrder[];
  userOrders: CustomerOrder[];
  placeOrder: (orderData: Omit<CustomerOrder, "id" | "createdAt" | "orderNumber">) => Promise<CustomerOrder>;
  updateOrderStatus: (orderId: string, status: CustomerOrder["status"]) => void;
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
    const trimmed = emailOrUsername.trim().toLowerCase();
    
    // Check if staff/admin login
    if (trimmed === "admin" || trimmed === "admin@yehagere.com") {
      if (pass === "admin123" || pass === "admin") {
        const adminUser = usersList.find((u) => u.role === "admin") || INITIAL_USERS[0];
        setActiveUser(adminUser);
        setUser(adminUser);
        return { success: true, user: adminUser };
      }
      return { success: false, error: "Incorrect password for admin access." };
    }

    // Customer match
    const existing = usersList.find((u) => u.email.toLowerCase() === trimmed);
    if (existing) {
      if (existing.status === "suspended") {
        return { success: false, error: "Your account is temporarily suspended. Please contact atelier support." };
      }
      setActiveUser(existing);
      setUser(existing);
      return { success: true, user: existing };
    }

    // Auto register simple customer if password provided
    if (trimmed.includes("@") && pass.length >= 4) {
      const newUser: AppUser = {
        id: `usr_${Date.now()}`,
        name: trimmed.split("@")[0].replace(/[^a-zA-Z]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Atelier Guest",
        email: trimmed,
        role: "customer",
        memberSince: new Date().toISOString().split("T")[0],
        status: "active",
        totalOrders: 0,
        totalSpentUSD: 0,
      };
      const updated = [newUser, ...usersList];
      saveStoredUsers(updated);
      setUsersList(updated);
      setActiveUser(newUser);
      setUser(newUser);
      return { success: true, user: newUser };
    }

    return { success: false, error: "Invalid email or password. Please try again." };
  };

  const register = async (name: string, email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !pass) {
      return { success: false, error: "Please provide valid credentials." };
    }

    const existing = usersList.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    const newUser: AppUser = {
      id: `usr_${Date.now()}`,
      name: name.trim() || "Atelier Patron",
      email: trimmedEmail,
      role: "customer",
      memberSince: new Date().toISOString().split("T")[0],
      status: "active",
      totalOrders: 0,
      totalSpentUSD: 0,
    };

    const updated = [newUser, ...usersList];
    saveStoredUsers(updated);
    setUsersList(updated);
    setActiveUser(newUser);
    setUser(newUser);
    return { success: true, user: newUser };
  };

  const logout = () => {
    setActiveUser(null);
    setUser(null);
  };

  const placeOrder = async (orderData: Omit<CustomerOrder, "id" | "createdAt" | "orderNumber">) => {
    const newOrder: CustomerOrder = {
      ...orderData,
      id: `ord_${Date.now()}`,
      orderNumber: `YH-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      status: "confirmed",
      trackingNumber: `DHL-ET-${Math.floor(1000000 + Math.random() * 9000000)}`,
    };

    const updatedOrders = [newOrder, ...orders];
    saveStoredOrders(updatedOrders);
    setOrders(updatedOrders);

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
    logout,
    orders,
    userOrders,
    placeOrder,
    updateOrderStatus,
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
