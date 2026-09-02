"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useWishlist } from "../components/WishlistProvider";
import { getAllProducts } from "../lib/products-store";
import MicroProductCard from "../components/MicroProductCard";

export default function WishlistPage() {
  const { wishlistIds, toggleWishlist } = useWishlist();
  const allProducts = getAllProducts();

  const savedProducts = allProducts.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="min-h-screen bg-white text-black py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
              Wishlist
            </h1>
            <p className="text-xs text-neutral-500">
              {wishlistIds.length} {wishlistIds.length === 1 ? "item" : "items"} saved
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-black hover:opacity-75"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Store
          </Link>
        </div>

        {savedProducts.length === 0 ? (
          <div className="py-24 text-center space-y-4 max-w-md mx-auto">
            <p className="text-lg font-bold text-black">Your wishlist is empty</p>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Tap the heart icon on any garment to save your favorites for later.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-block bg-black text-white! px-8 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800! transition-colors"
              >
                Explore Collection
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {savedProducts.map((product) => (
              <div key={product.id} className="relative group">
                <MicroProductCard product={product} />
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className="mt-2 text-xs text-neutral-500 hover:text-black flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove from wishlist
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
