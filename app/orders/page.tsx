"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Package,
  Truck,
  ArrowLeft,
  Printer,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";

function OrdersContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const { userOrders } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredOrders = userOrders.filter((o) => {
    if (filterStatus === "all") return true;
    return o.status === filterStatus;
  });

  const printReceipt = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-white text-black py-10 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <div className="space-y-1">
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Account
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
              Transactions &amp; Order History
            </h1>
            <p className="text-xs text-neutral-500">
              Official archive of all your YeHageré purchases, Stripe receipts, and live courier tracking.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors self-start sm:self-auto"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-bold uppercase tracking-wider">
          {["all", "confirmed", "preparing", "shipped", "delivered"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 transition-colors ${
                filterStatus === st ? "bg-black text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Order Cards List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-[#fafafa] border border-neutral-200 p-12 text-center space-y-4">
            <Package className="w-12 h-12 text-neutral-400 mx-auto" />
            <h2 className="text-base font-bold text-black">No Orders Found</h2>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              No orders matched your current filter. Explore our wardrobe to make your first purchase.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const isHighlighted = highlightId === order.orderNumber;
              return (
                <div
                  key={order.id}
                  className={`bg-white border transition-all ${
                    isHighlighted ? "border-black ring-1 ring-black" : "border-neutral-200"
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-6 bg-[#fafafa] border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-6">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Order Number
                        </span>
                        <span className="text-sm font-bold text-black font-mono">#{order.orderNumber}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Date
                        </span>
                        <span className="text-xs text-neutral-800">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Total Amount
                        </span>
                        <span className="text-xs font-bold text-black">
                          ${order.totalUSD} USD{" "}
                          <span className="text-neutral-500 font-normal">
                            (Br{order.totalETB ? order.totalETB.toLocaleString() : (order.totalUSD * 125).toLocaleString()} ETB)
                          </span>
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Payment Gateway
                        </span>
                        <span className="text-xs font-semibold text-black">Stripe (Card ending {order.last4 || "4242"})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-black text-white">
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="p-6 divide-y divide-neutral-100 space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="pt-4 first:pt-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {item.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-16 h-20 object-cover bg-neutral-100 border border-neutral-200"
                            />
                          )}
                          <div className="space-y-0.5">
                            <h3 className="text-xs font-bold text-black">{item.title}</h3>
                            <p className="text-[11px] text-neutral-500">
                              Quantity: {item.quantity} {item.size && `• Size: ${item.size}`}{" "}
                              {item.color && `• Color: ${item.color}`}
                            </p>
                            <p className="text-xs font-bold text-black mt-1">
                              ${item.price * item.quantity} USD
                            </p>
                          </div>
                        </div>

                        <span className="text-xs text-neutral-500 font-mono">
                          ${item.price} each
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Shipment & Invoice Info */}
                  <div className="p-6 bg-[#fbfbfb] border-t border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-neutral-600">
                          Tracking Reference: <strong className="text-black font-mono">{order.trackingNumber || "DHL-ET-9102847"}</strong>
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Shipping to: {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.country}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={printReceipt}
                        className="px-3.5 py-2 border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider text-black bg-white transition-colors flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Official Receipt</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center p-8 text-xs font-bold uppercase tracking-wider text-neutral-400">
          Loading Transactions...
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
