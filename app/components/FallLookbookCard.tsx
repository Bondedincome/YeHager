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
      <Link href={`/products/${product.id}`} className="block w-full h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </Link>

      {/* Shopping Bag Button at Bottom Right */}
      <button
        type="button"
        onClick={handleBagClick}
        className="absolute bottom-3 right-3 p-2 text-black hover:text-neutral-600 transition-colors z-10"
        aria-label={`Add ${product.title} to bag`}
      >
        {added ? (
          <Check className="w-5 h-5 text-black stroke-[2]" />
        ) : (
          <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
        )}
      </button>
    </div>
  );
}
