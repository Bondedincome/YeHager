"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Receipt,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  CreditCard,
  Package,
  MapPin,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import { CustomerOrder, OrderStatus } from "../../lib/auth-store";

export default function AdminOrdersClient() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const { orders, updateOrderStatus } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusClass = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-50 text-emerald-800 border-emerald-300";
      case "shipped":
        return "bg-blue-50 text-blue-800 border-blue-300";
      case "preparing":
        return "bg-amber-50 text-amber-800 border-amber-300";
      default:
        return "bg-neutral-100 text-neutral-800 border-neutral-300";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] py-8 px-4 sm:px-8 space-y-8 max-w-[1520px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-neutral-500">
              Fulfillment &amp; Transactions
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black">
            Customer Orders &amp; Stripe Receipts
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Monitor incoming client checkouts, dispatch shipments, and track Stripe settled payments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="px-4 py-2 bg-white text-black border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Analytics Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-neutral-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="w-full sm:w-96 relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by #order number, client name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#f4f4f4] text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 pr-2">Filter:</span>
          {["all", "confirmed", "preparing", "shipped", "delivered"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                statusFilter === st ? "bg-black text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-neutral-400 mx-auto" />
            <h3 className="text-base font-bold text-black">No Orders Found</h3>
            <p className="text-xs text-neutral-500">
              No orders matched your search or status criteria.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id || highlightId === order.orderNumber;

            return (
              <div
                key={order.id}
                className={`bg-white border transition-all shadow-2xs ${
                  highlightId === order.orderNumber ? "border-black ring-1 ring-black" : "border-neutral-200"
                }`}
              >
                {/* Main Order Row */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Metadata */}
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Order #
                      </span>
                      <span className="text-sm font-bold font-mono text-black">#{order.orderNumber}</span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Client / Patron
                      </span>
                      <span className="text-xs font-bold text-black block">{order.customerName}</span>
                      <span className="text-[11px] text-neutral-500">{order.customerEmail}</span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Total Settled (Stripe)
                      </span>
                      <span className="text-xs font-bold text-black block">${order.totalUSD} USD</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Br{(order.totalETB || order.totalUSD * 125).toLocaleString()} ETB
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Order Date
                      </span>
                      <span className="text-xs text-neutral-700">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase text-neutral-500">Status:</span>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className={`text-xs font-bold uppercase tracking-wider py-1.5 px-3 border outline-none cursor-pointer ${getStatusClass(
                          order.status
                        )}`}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? "Hide Details" : "View Items"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Item Details */}
                {isExpanded && (
                  <div className="border-t border-neutral-200 bg-[#fafafa] p-6 space-y-6 animate-in slide-in-from-top-1 duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: Purchased Garments */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-black border-b border-neutral-200 pb-2">
                          Purchased Garments ({order.items.length})
                        </h4>
                        <div className="space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 bg-white p-3 border border-neutral-200">
                              <div className="flex items-center gap-3">
                                {item.imageUrl && (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-12 h-16 object-cover bg-neutral-100 border border-neutral-200"
                                  />
                                )}
                                <div>
                                  <h5 className="text-xs font-bold text-black">{item.title}</h5>
                                  <p className="text-[11px] text-neutral-500">
                                    Qty: {item.quantity} {item.size && `• Size: ${item.size}`}{" "}
                                    {item.color && `• Color: ${item.color}`}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-black font-mono">
                                ${item.price * item.quantity} USD
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Shipping & Payment Metadata */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-black border-b border-neutral-200 pb-2">
                          Delivery &amp; Stripe Settlement
                        </h4>
                        <div className="bg-white p-4 border border-neutral-200 space-y-3 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                              Shipping Destination
                            </span>
                            <p className="font-semibold text-black mt-0.5">
                              {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
                              {order.shippingAddress.country} ({order.shippingAddress.postalCode})
                            </p>
                          </div>

                          <div className="pt-2 border-t border-neutral-100 flex justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                Tracking Code
                              </span>
                              <span className="font-mono font-bold text-black">
                                {order.trackingNumber || "DHL-ET-9102847"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                Payment Method
                              </span>
                              <span className="font-semibold text-black">
                                Stripe (Card ending in {order.last4 || "4242"})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
