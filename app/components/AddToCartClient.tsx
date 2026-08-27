"use client";

import React from "react";
import { useCart } from "./CartProvider";

export default function AddToCartClient({ product }: any) {
  const { addItem } = useCart();

  return (
    <div className="mt-6">
      <button
        className="rounded bg-zinc-900 text-white px-4 py-2"
        onClick={() => addItem({ id: product.id, title: product.title, price: product.price, imageUrl: product.imageUrl })}
      >
        Add to cart
      </button>
    </div>
  );
}
