"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Check } from "lucide-react";
import { Product } from "../lib/products-store";
import { useCart } from "./CartProvider";

interface FallLookbookCardProps {
  product: Product;
}

export default function FallLookbookCard({ product }: FallLookbookCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleBagClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group relative aspect-[3/4] w-full bg-[#f4f4f4] overflow-hidden">
      <Link href={`/products/${product.id}`} className="block w-full h-full" aria-label={product.title}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </Link>

      {/* Floating Info & Bag Button Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 bg-gradient-to-t from-black/75 via-black/30 to-transparent flex items-end justify-between text-white pointer-events-none transition-opacity">
        <div className="space-y-0.5 max-w-[70%] pointer-events-auto">
          <Link
            href={`/products/${product.id}`}
            className="block text-[11px] sm:text-xs font-bold leading-tight truncate hover:underline text-white drop-shadow-xs"
          >
            {product.title}
          </Link>
          <p className="text-[10px] sm:text-[11px] font-semibold text-neutral-200">
            ${product.price} USD
          </p>
        </div>

        {/* Shopping Bag Button (Min 40-44px touch area) */}
        <button
          type="button"
          onClick={handleBagClick}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-white text-black hover:bg-neutral-100 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-md pointer-events-auto flex-shrink-0"
          aria-label={`Add ${product.title} to bag`}
        >
          {added ? (
            <Check className="w-4 h-4 text-black stroke-[2.5]" />
          ) : (
            <ShoppingBag className="w-4 h-4 text-black stroke-[1.75]" />
          )}
        </button>
      </div>
    </div>
  );
}
