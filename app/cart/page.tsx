"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trash2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useCart } from "../components/CartProvider";
import { getSupabase } from "../lib/supabase";

export default function CartPage() {
  const { items, removeItem, clear, count } = useCart();
  const [orderConfirmation, setOrderConfirmation] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Price calculations in USD and ETB
  const totalUSD = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalETB = totalUSD * 125;

  const handleCheckout = async () => {
    const confirmationId = `YH-${Math.floor(100000 + Math.random() * 900000)}`;
    setIsCheckingOut(true);
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("orders").insert({
          order_number: confirmationId,
          items: items.map((i) => ({
            id: i.id,
            title: i.title,
            price: i.price,
            quantity: i.quantity,
          })),
          total_usd: totalUSD,
          total_etb: totalETB,
          status: "confirmed",
        });
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsCheckingOut(false);
      setOrderConfirmation(confirmationId);
      clear();
    }
  };

  return (
    <div className="min-h-screen bg-white text-black py-10 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
              Shopping Bag
            </h1>
            <p className="text-xs text-neutral-500">
              {count} {count === 1 ? "item" : "items"} in your bag
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-black hover:opacity-75"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        {orderConfirmation ? (
          <div className="bg-[#f9f9f9] border border-neutral-200 p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto">
            <CheckCircle2 className="w-12 h-12 text-black mx-auto stroke-[1.5]" />
            <h2 className="text-xl font-bold text-black">Order Placed Successfully</h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Thank you for shopping with YeHagere. Your confirmation number is{" "}
              <span className="font-bold text-black">#{orderConfirmation}</span>. We will notify you once your order ships.
            </p>
            <div className="pt-4">
              <Link
                href="/"
                onClick={() => setOrderConfirmation(null)}
                className="inline-block bg-black text-white px-8 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
              >
                Return to Storefront
              </Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <p className="text-lg font-bold text-black">Your bag is empty</p>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Explore our new arrivals, effortless matching sets, and relaxed low slung denim.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-block bg-black text-white px-8 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
              >
                Shop New Arrivals
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Bag Items List */}
            <div className="lg:col-span-8 divide-y divide-neutral-200">
              {items.map((item) => {
                const itemETB = item.price * 125 * item.quantity;
                return (
                  <div key={item.id} className="py-6 flex gap-4 sm:gap-6 items-start">
                    <div className="w-20 h-28 bg-[#f4f4f4] flex-shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400 font-semibold">
                          YH
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-h-28">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-black line-clamp-1">{item.title}</h3>
                        <p className="text-xs text-neutral-500">Qty: {item.quantity}</p>
                        <p className="text-xs font-semibold text-black pt-1">
                          Br{itemETB.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB
                        </p>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary Pane */}
            <div className="lg:col-span-4 bg-[#f9f9f9] border border-neutral-200 p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-black">
                Order Summary
              </h2>

              <div className="space-y-2.5 text-xs text-neutral-700 pt-2 border-t border-neutral-200">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-black">
                    Br{totalETB.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-black">Complimentary</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span className="font-semibold text-black">Included</span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-300 flex justify-between items-baseline font-bold text-sm text-black">
                <span>Total</span>
                <span>
                  Br{totalETB.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full bg-black text-white py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors mt-2 disabled:opacity-50"
              >
                {isCheckingOut ? "Processing..." : "Checkout Now"}
              </button>

              <button
                type="button"
                onClick={() => clear()}
                className="w-full text-center text-xs text-neutral-500 hover:text-black pt-1"
              >
                Clear Entire Bag
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
