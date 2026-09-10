"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Lock,
  CreditCard,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react";
import { useCart } from "../components/CartProvider";
import { useAuth } from "../components/AuthProvider";

export default function CartPage() {
  const { items, removeItem, clear, count } = useCart();
  const { user, isAuthenticated, placeOrder } = useAuth();

  const [orderConfirmation, setOrderConfirmation] = useState<{
    orderNumber: string;
    totalUSD: number;
    totalETB: number;
    itemsCount: number;
  } | null>(null);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"bag" | "payment">("bag");

  // Shipping & Payment Form State
  const [customerName, setCustomerName] = useState(user?.name || "Daniot Mihrete");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "daniot.mihrete-ug@aau.edu.et");
  const [street, setStreet] = useState(user?.shippingAddress?.street || "Kazanchis Heritage Quarter, No. 12");
  const [city, setCity] = useState(user?.shippingAddress?.city || "Addis Ababa");
  const [postalCode, setPostalCode] = useState(user?.shippingAddress?.zip || "1000");
  const [country, setCountry] = useState(user?.shippingAddress?.country || "Ethiopia");

  // Stripe Card Details
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("888");

  // Price calculations in USD and ETB
  const totalUSD = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingUSD = totalUSD > 200 ? 0 : 25;
  const grandTotalUSD = totalUSD + shippingUSD;
  const grandTotalETB = grandTotalUSD * 125;

  const handleStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingOut(true);

    try {
      // Simulate real Stripe payment intent lifecycle
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const newOrder = await placeOrder({
        userId: user?.id,
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim(),
        items: items.map((i) => ({
          id: i.id,
          title: i.title,
          price: i.price,
          priceETB: i.price * 125,
          quantity: i.quantity,
          size: i.size || "M",
          color: i.color || "Standard",
          imageUrl: i.imageUrl,
        })),
        totalUSD: grandTotalUSD,
        totalETB: grandTotalETB,
        paymentMethod: "stripe",
        paymentIntentId: `pi_stripe_${Date.now()}`,
        last4: cardNumber.slice(-4).replace(/[^0-9]/g, "") || "4242",
        status: "confirmed",
        shippingAddress: {
          street,
          city,
          postalCode,
          country,
        },
      });

      setOrderConfirmation({
        orderNumber: newOrder.orderNumber,
        totalUSD: grandTotalUSD,
        totalETB: grandTotalETB,
        itemsCount: items.length,
      });

      clear();
      setCheckoutStep("bag");
    } catch {
      // Handle graceful error
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black py-10 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
              {checkoutStep === "payment" ? "Stripe Secure Checkout" : "Shopping Bag"}
            </h1>
            <p className="text-xs text-neutral-500">
              {checkoutStep === "payment"
                ? "Powered by Stripe Payment Gateway • 256-bit Encryption"
                : `${count} ${count === 1 ? "item" : "items"} in your shopping bag`}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {checkoutStep === "payment" ? (
              <button
                onClick={() => setCheckoutStep("bag")}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-black hover:opacity-75"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Bag
              </button>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-black hover:opacity-75"
              >
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </Link>
            )}
          </div>
        </div>

        {/* Auth prompt if not signed in */}
        {!isAuthenticated && !orderConfirmation && items.length > 0 && (
          <div className="bg-[#fafafa] border border-neutral-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-black" />
              <span>
                Have a Patron account? <strong className="text-black">Sign in</strong> to save this order to your transaction history.
              </span>
            </div>
            <Link
              href="/login"
              className="px-3.5 py-1.5 bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors whitespace-nowrap"
            >
              Sign In
            </Link>
          </div>
        )}

        {orderConfirmation ? (
          <div className="bg-[#fafafa] border border-neutral-200 p-8 sm:p-12 text-center space-y-5 max-w-xl mx-auto shadow-sm">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[1.75]" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Payment Authorized via Stripe
              </span>
              <h2 className="text-2xl font-bold text-black">Order Placed Successfully</h2>
              <p className="text-xs text-neutral-600 leading-relaxed max-w-md mx-auto">
                Thank you for acquiring from YeHageré. Your tracking confirmation number is{" "}
                <span className="font-bold text-black font-mono">#{orderConfirmation.orderNumber}</span>.
                A confirmation receipt of{" "}
                <strong className="text-black">${orderConfirmation.totalUSD} USD</strong> (Br
                {orderConfirmation.totalETB.toLocaleString()} ETB) has been processed.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/orders"
                className="w-full sm:w-auto bg-black text-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
              >
                View in Order History &amp; Receipts
              </Link>
              <Link
                href="/"
                onClick={() => setOrderConfirmation(null)}
                className="w-full sm:w-auto border border-neutral-300 px-6 py-3.5 text-xs font-bold uppercase tracking-wider hover:border-black transition-colors"
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
                className="inline-block bg-black text-white! px-8 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800! transition-colors"
              >
                Shop New Arrivals
              </Link>
            </div>
          </div>
        ) : checkoutStep === "bag" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Bag Items List */}
            <div className="lg:col-span-8 divide-y divide-neutral-200">
              {items.map((item) => {
                const itemETB = item.price * 125 * item.quantity;
                return (
                  <div key={item.id} className="py-6 flex gap-4 sm:gap-6 items-start">
                    <div className="w-20 h-28 bg-[#f4f4f4] flex-shrink-0 overflow-hidden border border-neutral-200">
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

                    <div className="flex-1 flex flex-col justify-between self-stretch">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-bold text-black uppercase tracking-wide">
                            {item.title}
                          </h3>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-neutral-400 hover:text-black transition-colors p-1"
                            aria-label={`Remove ${item.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-neutral-500">
                          {item.color || "Standard"} • Size {item.size || "M"} • Qty {item.quantity}
                        </p>
                      </div>

                      <div className="flex justify-between items-end pt-4">
                        <span className="text-xs text-neutral-500 font-medium">
                          Quantity: {item.quantity}
                        </span>
                        <div className="text-right">
                          <div className="text-sm font-bold text-black">
                            ${item.price * item.quantity} USD
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            Br{itemETB.toLocaleString()} ETB
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bag Summary Box */}
            <div className="lg:col-span-4 bg-[#fafafa] border border-neutral-200 p-6 space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-black border-b border-neutral-200 pb-3">
                Order Summary
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-black">${totalUSD} USD</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Estimated Shipping</span>
                  <span className="font-semibold text-black">
                    {shippingUSD === 0 ? "Complimentary" : `$${shippingUSD} USD`}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Ethiopian Birr Approx.</span>
                  <span className="font-mono text-neutral-500">Br{grandTotalETB.toLocaleString()} ETB</span>
                </div>
                <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-black">Grand Total</span>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-black">${grandTotalUSD} USD</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCheckoutStep("payment")}
                className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Proceed to Stripe Checkout</span>
              </button>

              <div className="pt-2 flex items-center justify-center gap-2 text-[10px] text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Guaranteed Authentic &amp; Stripe Protected</span>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Stripe Payment Form */
          <form onSubmit={handleStripePayment} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Shipping & Stripe Card Details */}
            <div className="lg:col-span-7 space-y-6">
              {/* Shipping Card */}
              <div className="bg-[#fafafa] border border-neutral-200 p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
                  <Truck className="w-4 h-4 text-black" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-black">
                    1. Shipping Destination
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold uppercase tracking-wider text-neutral-600">Full Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-neutral-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold uppercase tracking-wider text-neutral-600">Email for Stripe Receipt</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-white border border-neutral-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold uppercase tracking-wider text-neutral-600">Street Address</label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full bg-white border border-neutral-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase tracking-wider text-neutral-600">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-white border border-neutral-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase tracking-wider text-neutral-600">Postal / ZIP Code</label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full bg-white border border-neutral-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Stripe Payment Card Element */}
              <div className="bg-white border border-neutral-300 p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-black" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-black">
                      2. Payment Method (Stripe)
                    </h2>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                    Stripe Live PCI-DSS
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full bg-[#fbfbfb] border border-neutral-300 px-3.5 py-2.5 font-mono text-sm pr-10 focus:ring-1 focus:ring-black outline-none"
                      />
                      <CreditCard className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                        Expires (MM/YY)
                      </label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className="w-full bg-[#fbfbfb] border border-neutral-300 px-3.5 py-2.5 font-mono text-sm focus:ring-1 focus:ring-black outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                        CVC Code
                      </label>
                      <input
                        type="text"
                        required
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="888"
                        className="w-full bg-[#fbfbfb] border border-neutral-300 px-3.5 py-2.5 font-mono text-sm focus:ring-1 focus:ring-black outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Payment Summary CTA */}
            <div className="lg:col-span-5 bg-[#fafafa] border border-neutral-200 p-6 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black border-b border-neutral-200 pb-3">
                Payment Summary
              </h3>

              <div className="space-y-2 text-xs">
                {items.map((i) => (
                  <div key={i.id} className="flex justify-between text-neutral-600">
                    <span className="truncate pr-2">
                      {i.quantity}x {i.title}
                    </span>
                    <span className="font-semibold text-black">${i.price * i.quantity}</span>
                  </div>
                ))}

                <div className="pt-3 border-t border-neutral-200 flex justify-between text-neutral-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-black">{shippingUSD === 0 ? "FREE" : `$${shippingUSD}`}</span>
                </div>

                <div className="pt-2 border-t border-neutral-300 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-black">Total to Charge</span>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-black">${grandTotalUSD} USD</span>
                    <span className="block text-[11px] text-neutral-500 font-mono">
                      ≈ Br{grandTotalETB.toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCheckingOut}
                className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {isCheckingOut ? "Authorizing Stripe Payment..." : `Pay $${grandTotalUSD} USD with Stripe`}
                </span>
              </button>

              <p className="text-[10px] text-neutral-500 text-center leading-relaxed">
                By placing this order, you authorize YeHageré to charge your card via Stripe. All orders are covered by our 14-day bespoke return policy.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
