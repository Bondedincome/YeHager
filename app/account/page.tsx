"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  CreditCard,
  MapPin,
  Clock,
  Shield,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  LogOut,
  CheckCircle2,
  Truck,
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";

export default function AccountPage() {
  const { user, isAuthenticated, isAdmin, logout, userOrders } = useAuth();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<"orders" | "profile" | "addresses">("orders");

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="max-w-md w-full space-y-6 bg-[#fafafa] border border-neutral-200 p-8 sm:p-10">
          <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-black">Sign In to View Your Account</h1>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Track your shipments, view your Stripe payment receipts, and manage your wardrobe orders.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full bg-black text-white py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors inline-block"
            >
              Sign In to Account
            </Link>
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black transition-colors"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Delivered
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3 h-3" />
            In Transit
          </span>
        );
      case "preparing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Preparing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-300">
            Confirmed
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white text-black py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Top Account Header Card */}
        <div className="bg-[#fafafa] border border-neutral-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-black text-white text-2xl font-bold flex items-center justify-center uppercase">
              {user.name ? user.name[0] : "P"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black">{user.name}</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-black text-white">
                  {user.role === "admin" ? "Staff Admin" : user.role === "vip" ? "VIP Patron" : "Patron Member"}
                </span>
              </div>
              <p className="text-xs text-neutral-500">{user.email}</p>
              <p className="text-[11px] text-neutral-400">Patron Member since {user.memberSince || "2024"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2.5 bg-neutral-900 text-white hover:bg-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors border border-neutral-800"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Portal</span>
              </Link>
            )}
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="px-4 py-2.5 border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-neutral-200 p-5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
              Total Orders Placed
            </span>
            <p className="text-2xl font-extrabold text-black">{userOrders.length || user.totalOrders || 0}</p>
            <span className="text-[10px] text-neutral-400">Verified purchases</span>
          </div>
          <div className="border border-neutral-200 p-5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
              Total Investment
            </span>
            <p className="text-2xl font-extrabold text-black">
              ${userOrders.reduce((sum, o) => sum + o.totalUSD, 0) || user.totalSpentUSD || 0} USD
            </p>
            <span className="text-[10px] text-neutral-400">
              ≈ Br{((userOrders.reduce((sum, o) => sum + o.totalUSD, 0) || user.totalSpentUSD || 0) * 125).toLocaleString()} ETB
            </span>
          </div>
          <div className="border border-neutral-200 p-5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
              Payment Method
            </span>
            <div className="flex items-center gap-2 pt-1">
              <CreditCard className="w-5 h-5 text-black" />
              <span className="text-sm font-bold text-black">Stripe Secure Card</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">Active &amp; Verified</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-neutral-200 flex items-center gap-8 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setSelectedTab("orders")}
            className={`pb-3 transition-colors border-b-2 ${
              selectedTab === "orders" ? "border-black text-black" : "border-transparent text-neutral-400 hover:text-black"
            }`}
          >
            Order History &amp; Receipts ({userOrders.length})
          </button>
          <button
            onClick={() => setSelectedTab("addresses")}
            className={`pb-3 transition-colors border-b-2 ${
              selectedTab === "addresses" ? "border-black text-black" : "border-transparent text-neutral-400 hover:text-black"
            }`}
          >
            Shipping Addresses
          </button>
          <button
            onClick={() => setSelectedTab("profile")}
            className={`pb-3 transition-colors border-b-2 ${
              selectedTab === "profile" ? "border-black text-black" : "border-transparent text-neutral-400 hover:text-black"
            }`}
          >
            Patron Profile
          </button>
        </div>

        {/* Tab 1: Orders History */}
        {selectedTab === "orders" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-black">Previous Transactions &amp; Receipts</h2>
                <p className="text-xs text-neutral-500">
                  Every order includes Stripe transaction reference and live courier tracking.
                </p>
              </div>
              <Link
                href="/cart"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black underline underline-offset-4 hover:opacity-75"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Shop New Pieces</span>
              </Link>
            </div>

            {userOrders.length === 0 ? (
              <div className="bg-[#fafafa] border border-neutral-200 p-12 text-center space-y-4">
                <Package className="w-10 h-10 text-neutral-400 mx-auto stroke-[1.5]" />
                <h3 className="text-base font-bold text-black">No Orders Placed Yet</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  When you purchase pieces using our secure Stripe checkout, your receipts, tracking, and garments will appear here.
                </p>
                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-block bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                  >
                    Explore Garments
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white border border-neutral-200 divide-y divide-neutral-100 hover:border-neutral-400 transition-all shadow-2xs"
                  >
                    {/* Order Header */}
                    <div className="p-5 bg-[#fafafa] flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            Order Number
                          </span>
                          <span className="text-sm font-bold text-black font-mono">#{order.orderNumber}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            Date Placed
                          </span>
                          <span className="text-xs text-neutral-700">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            Total Paid (Stripe)
                          </span>
                          <span className="text-xs font-bold text-black">
                            ${order.totalUSD} USD{" "}
                            <span className="text-neutral-400 font-normal">
                              (Br{order.totalETB ? order.totalETB.toLocaleString() : (order.totalUSD * 125).toLocaleString()} ETB)
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>

                    {/* Order Line Items */}
                    <div className="p-5 space-y-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-14 h-18 object-cover bg-neutral-100 border border-neutral-200"
                              />
                            ) : (
                              <div className="w-14 h-18 bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs text-neutral-400">
                                Garment
                              </div>
                            )}
                            <div>
                              <h4 className="text-xs font-bold text-black">{item.title}</h4>
                              <p className="text-[11px] text-neutral-500">
                                Qty: {item.quantity} {item.size && `• Size: ${item.size}`}{" "}
                                {item.color && `• Color: ${item.color}`}
                              </p>
                              <p className="text-xs font-semibold text-black mt-1">
                                ${item.price * item.quantity} USD
                              </p>
                            </div>
                          </div>

                          <span className="text-[11px] text-neutral-400 font-mono">
                            ${item.price} each
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer & Tracking */}
                    <div className="p-4 bg-[#fbfbfb] flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 text-neutral-500">
                        <span>Courier Tracking: <strong className="text-black font-mono">{order.trackingNumber || "DHL-ET-8849102"}</strong></span>
                        <span>•</span>
                        <span>Payment: <strong className="text-black">Stripe (Card ending in {order.last4 || "4242"})</strong></span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/orders?highlight=${order.orderNumber}`}
                          className="px-3 py-1.5 border border-neutral-300 hover:border-black text-[11px] font-bold uppercase tracking-wider text-black bg-white transition-colors"
                        >
                          View Receipt
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Addresses */}
        {selectedTab === "addresses" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-black">Primary Shipping Destination</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#fafafa] border border-neutral-200 p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                    Default Destination
                  </span>
                  <MapPin className="w-4 h-4 text-neutral-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-black">{user.name}</p>
                  <p className="text-xs text-neutral-600 mt-1">
                    {user.shippingAddress?.street || "Kazanchis Heritage Quarter, No. 12"}
                  </p>
                  <p className="text-xs text-neutral-600">
                    {user.shippingAddress?.city || "Addis Ababa"},{" "}
                    {user.shippingAddress?.zip || "1000"},{" "}
                    {user.shippingAddress?.country || "Ethiopia"}
                  </p>
                  <p className="text-xs text-neutral-500 mt-2 font-mono">
                    Phone: {user.phone || "+251 91 123 4567"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Profile */}
        {selectedTab === "profile" && (
          <div className="space-y-6 max-w-xl">
            <h2 className="text-lg font-bold text-black">Patron Information</h2>
            <div className="bg-[#fafafa] border border-neutral-200 p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Full Name
                </label>
                <p className="text-sm font-semibold text-black">{user.name}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Email Address
                </label>
                <p className="text-sm font-semibold text-black">{user.email}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Account Tier
                </label>
                <p className="text-sm font-semibold text-black uppercase tracking-wider">
                  {user.role} Patron
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
