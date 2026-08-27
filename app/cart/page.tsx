"use client";

import { useEffect, useState } from "react";
import { useCart } from "../components/CartProvider";

export default function CartPage() {
  const { items, removeItem, clear, count } = useCart();

  if (items.length === 0)
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-8">
        <h2 className="text-2xl font-semibold">Your cart is empty</h2>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8">
      <h2 className="text-2xl font-semibold">Your cart ({count})</h2>
      <div className="mt-4 space-y-4">
        {items.map((it) => (
          <div key={it.id} className="flex flex-col gap-4 rounded-3xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium">{it.title}</div>
              <div className="text-sm text-zinc-600">Qty: {it.quantity}</div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="font-semibold">${(it.price * it.quantity).toFixed(2)}</div>
              <button className="text-sm text-red-600" onClick={() => removeItem(it.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button className="w-full rounded bg-zinc-900 text-white px-4 py-2 sm:w-auto" onClick={() => clear()}>
          Clear cart
        </button>
      </div>
    </div>
  );
}
