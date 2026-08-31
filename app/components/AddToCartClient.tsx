"use client";

import React, { useState } from "react";
import { useCart } from "./CartProvider";

type AddToCartProps = {
  product: {
    id: number;
    title: string;
    price: number;
    imageUrl?: string;
  };
};

export default function AddToCartClient({ product }: AddToCartProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({ id: product.id, title: product.title, price: product.price, imageUrl: product.imageUrl });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="mt-6 flex items-center gap-4">
      <button
        className="rounded-full bg-[#1a1410] hover:bg-[#3d3228] text-white px-8 py-3.5 text-sm font-semibold transition shadow-sm"
        onClick={handleAdd}
      >
        {added ? "✓ Added to Bag" : "Add to Shopping Bag"}
      </button>
    </div>
  );
}
