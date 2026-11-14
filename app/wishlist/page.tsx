"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "../components/icons";
import { useWishlist } from "../components/WishlistProvider";
import { Product } from "../lib/products-store";
import ProductCard from "../components/ProductCard";
import { apiFetch } from "../lib/api";

export default function WishlistPage() {
  const { wishlistIds, toggleWishlist, syncError } = useWishlist();
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    apiFetch("products")
      .then((response) => response.ok ? response.json() : [])
      .then((payload) => {
        const items = Array.isArray(payload) ? payload : payload?.data;
        setAllProducts(Array.isArray(items) ? items : []);
      })
      .catch(() => setAllProducts([]));
  }, []);

  const savedProducts = allProducts.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-20">
      <div className="space-y-8">
        <div className="flex items-end justify-between border-b border-line pb-6">
          <div className="space-y-2">
            <h1 className="heading-display text-4xl sm:text-6xl">Wishlist</h1>
            <p className="text-sm text-muted">
              {wishlistIds.length} {wishlistIds.length === 1 ? "item" : "items"} saved
            </p>
          </div>

          <Link href="/products" className="link-underline">
            Continue shopping
          </Link>
        </div>

        {syncError && <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{syncError}</p>}

        {savedProducts.length === 0 ? (
          <div className="py-24 text-center space-y-4 max-w-md mx-auto">
            <p className="heading-display text-2xl">Your wishlist is empty</p>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Tap the heart on any product to save it for later.
            </p>
            <div className="pt-2">
              <Link href="/products" className="btn-primary">
                Shop all
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-10">
            {savedProducts.map((product) => (
              <div key={product.id} className="relative group">
                <ProductCard product={product} />
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className="mt-3 text-xs text-neutral-500 hover:text-black flex items-center gap-1.5"
                >
                  <Trash2 className="size-4" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
