"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Lock, Trash2, Truck, User } from "../components/icons";
import { useCart, CartItem } from "../components/CartProvider";
import { useAuth } from "../components/AuthProvider";
import { apiFetch } from "../lib/api";

/* Must match the API (orders.service.ts) so the total here equals what Chapa charges. */
const ETB_PER_USD = 125;
const FREE_SHIPPING_OVER_USD = 200;
const SHIPPING_USD = 25;

const birr = (n: number) =>
  `Br${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const lineETB = (item: CartItem) => (item.priceETB ?? item.price * ETB_PER_USD) * item.quantity;

type CheckoutStatus = { paid: boolean; status: "paid" | "pending" | "failed"; orderNumber: string; totalETB: number };

const inputClass =
  "w-full h-11 px-3.5 border border-neutral-300 bg-white text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black";

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-neutral-700">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

export default function CartPage() {
  const { items, removeItem, clear, count, syncError } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [confirmed, setConfirmed] = useState<{ orderNumber: string; totalETB: number } | null>(null);
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [step, setStep] = useState<"bag" | "details">("bag");

  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [street, setStreet] = useState(user?.shippingAddress?.street || "");
  const [city, setCity] = useState(user?.shippingAddress?.city || "Addis Ababa");
  const [postalCode, setPostalCode] = useState(user?.shippingAddress?.zip || "");
  const [country] = useState(user?.shippingAddress?.country || "Ethiopia");

  const clearRef = useRef(clear);
  useEffect(() => {
    clearRef.current = clear;
  }, [clear]);

  /** Asks the API (which asks Chapa) whether this payment went through. Retries while pending. */
  const checkPayment = useCallback(async (txRef: string, attempts = 5) => {
    setChecking(true);
    setCheckoutError(null);
    try {
      for (let i = 0; i < attempts; i++) {
        const response = await apiFetch(`orders/checkout/${encodeURIComponent(txRef)}`, { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || "We couldn't check your payment. Please try again.");
        const data: CheckoutStatus = payload.data ?? payload;
        if (data.paid) {
          setConfirmed({ orderNumber: data.orderNumber, totalETB: Number(data.totalETB) });
          setPendingRef(null);
          clearRef.current();
          window.history.replaceState({}, "", "/cart");
          return;
        }
        if (data.status === "failed") {
          setPendingRef(null);
          setStep("details");
          setCheckoutError("The payment didn't go through and you weren't charged. You can try again.");
          window.history.replaceState({}, "", "/cart");
          return;
        }
        if (i < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 2500));
      }
      setPendingRef(txRef);
    } catch (error) {
      setPendingRef(txRef);
      setCheckoutError(error instanceof Error ? error.message : "We couldn't check your payment.");
    } finally {
      setChecking(false);
    }
  }, []);

  // Chapa sends customers back to /cart?checkout=return&tx_ref=…
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const txRef = query.get("tx_ref") || query.get("trx_ref");
    if (query.get("checkout") !== "return" || !txRef) return;
    queueMicrotask(() => void checkPayment(txRef));
  }, [checkPayment]);

  const subtotalUSD = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotalETB = items.reduce((sum, item) => sum + lineETB(item), 0);
  const shippingETB = subtotalUSD > FREE_SHIPPING_OVER_USD ? 0 : SHIPPING_USD * ETB_PER_USD;
  const totalETB = subtotalETB + shippingETB;

  const startPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCheckingOut) return;
    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      const response = await apiFetch("orders/checkout", {
        method: "POST",
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim() || undefined,
          items: items.map((item) => ({
            productId: String(item.id),
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
          shippingAddress: { street: street.trim(), city: city.trim(), postalCode: postalCode.trim(), country },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      const data = payload.data ?? payload;
      if (!response.ok) throw new Error(payload.message || "We couldn't start the payment. Please try again.");
      if (!data.checkoutUrl) throw new Error("The payment page didn't open. Please try again.");
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "We couldn't start the payment.");
      setIsCheckingOut(false);
    }
  };

  /* ---------- confirmation / waiting states ---------- */

  if (confirmed) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="size-14 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
          <Check className="size-7" />
        </div>
        <h1 className="heading-display text-3xl">Thank you!</h1>
        <p className="text-sm text-neutral-700">
          Your payment of <strong>{birr(confirmed.totalETB)}</strong> was received. Your order number is{" "}
          <strong className="font-mono">#{confirmed.orderNumber}</strong>. Chapa has emailed you a receipt.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {isAuthenticated && (
            <Link href="/orders" className="btn-primary">
              View my orders
            </Link>
          )}
          <Link href="/products" className="btn-outline">
            Keep shopping
          </Link>
        </div>
      </div>
    );
  }

  if (checking || pendingRef) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5" aria-live="polite">
        <h1 className="heading-display text-3xl">{checking ? "Checking your payment…" : "Payment still processing"}</h1>
        <p className="text-sm text-neutral-700">
          {checking
            ? "This usually takes a few seconds."
            : "Chapa hasn't confirmed your payment yet. This can take a minute for mobile money. Don't pay again. Check again in a moment."}
        </p>
        {checkoutError && <p className="text-sm text-red-700">{checkoutError}</p>}
        {!checking && pendingRef && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" className="btn-primary" onClick={() => void checkPayment(pendingRef, 3)}>
              Check again
            </button>
            <Link href="/contact" className="btn-outline">
              Contact us
            </Link>
          </div>
        )}
      </div>
    );
  }

  /* ---------- bag and details ---------- */

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      <div className="flex items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="heading-display text-3xl sm:text-4xl">{step === "details" ? "Checkout" : "Your bag"}</h1>
          <p className="text-sm text-neutral-600 mt-1">
            {step === "details"
              ? "Enter your delivery details, then pay securely with Chapa."
              : `${count} ${count === 1 ? "item" : "items"}`}
          </p>
        </div>
        {step === "details" ? (
          <button type="button" onClick={() => setStep("bag")} className="text-sm flex items-center gap-1.5 hover:underline">
            <ArrowLeft className="size-4" /> Back to bag
          </button>
        ) : (
          <Link href="/products" className="text-sm flex items-center gap-1.5 hover:underline">
            <ArrowLeft className="size-4" /> Keep shopping
          </Link>
        )}
      </div>

      {syncError && (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {syncError}
        </p>
      )}
      {checkoutError && (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {checkoutError}
        </p>
      )}

      {items.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <p className="text-lg font-semibold">Your bag is empty</p>
          <Link href="/products" className="btn-primary">
            Shop new in
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            {step === "bag" ? (
              <ul className="divide-y divide-line border-y border-line">
                {items.map((item) => (
                  <li key={`${item.id}:${item.size ?? ""}:${item.color ?? ""}`} className="py-5 flex gap-4">
                    <div className="w-20 h-28 bg-surface shrink-0 overflow-hidden">
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between gap-3">
                        <div>
                          <h2 className="text-sm font-semibold">{item.title}</h2>
                          <p className="text-xs text-neutral-600 mt-1">
                            {[item.size && `Size ${item.size}`, item.color, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-neutral-500 hover:text-black"
                          aria-label={`Remove ${item.title}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-right">{birr(lineETB(item))}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <form id="checkout-form" onSubmit={startPayment} className="space-y-6">
                {!isAuthenticated && (
                  <div className="flex items-center justify-between gap-3 border border-line px-4 py-3 text-sm">
                    <span className="flex items-center gap-2">
                      <User className="size-4" /> Have an account? Sign in to keep this order in your history.
                    </span>
                    <Link href="/login?next=/cart" className="underline whitespace-nowrap">
                      Sign in
                    </Link>
                  </div>
                )}

                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold mb-3">Contact</legend>
                  <Field id="customer-name" label="Full name">
                    <input id="customer-name" className={inputClass} required autoComplete="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field id="customer-email" label="Email" hint="Your receipt is sent here.">
                      <input id="customer-email" type="email" className={inputClass} required autoComplete="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                    </Field>
                    <Field id="customer-phone" label="Phone (optional)" hint="Ethiopian mobile, e.g. 0911234567">
                      <input
                        id="customer-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        className={inputClass}
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </Field>
                  </div>
                </fieldset>

                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Truck className="size-4" /> Delivery address
                  </legend>
                  <Field id="street-address" label="Street address">
                    <input id="street-address" className={inputClass} required autoComplete="street-address" value={street} onChange={(e) => setStreet(e.target.value)} />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field id="city" label="City">
                      <input id="city" className={inputClass} required autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
                    </Field>
                    <Field id="postal-code" label="Postal code (optional)">
                      <input id="postal-code" className={inputClass} autoComplete="postal-code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                    </Field>
                  </div>
                </fieldset>
              </form>
            )}
          </div>

          <aside className="lg:col-span-5 bg-surface p-6 space-y-5 lg:sticky lg:top-28">
            <h2 className="text-sm font-semibold">Order summary</h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-600">Subtotal</dt>
                <dd>{birr(subtotalETB)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-600">Delivery</dt>
                <dd>{shippingETB === 0 ? "Free" : birr(shippingETB)}</dd>
              </div>
              <div className="flex justify-between pt-3 border-t border-neutral-300 text-base font-semibold">
                <dt>Total</dt>
                <dd>{birr(totalETB)}</dd>
              </div>
            </dl>

            {step === "bag" ? (
              <button type="button" onClick={() => setStep("details")} className="btn-primary w-full justify-center">
                Checkout
              </button>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                disabled={isCheckingOut}
                className="btn-primary w-full justify-center gap-2 disabled:opacity-60"
              >
                <Lock className="size-4" />
                {isCheckingOut ? "Opening Chapa…" : `Pay ${birr(totalETB)}`}
              </button>
            )}

            <p className="text-xs text-neutral-600 leading-relaxed">
              You&apos;ll pay on Chapa&apos;s secure page with telebirr, CBE Birr, M-Pesa, bank transfer or card. We never
              see your card or PIN.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
