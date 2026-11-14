"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Heart, Plus, X } from "./icons";
import { Product } from "../lib/products-store";
import { formatProductPrice } from "../lib/format";
import { useWishlist } from "./WishlistProvider";
import { useCart } from "./CartProvider";

/**
 * The one product card used across the storefront (home, shop, wishlist,
 * related products). 2:3 image, second image on hover, quick add by size,
 * colour swatches under the name.
 */
export default function ProductCard({ product }: { product: Product }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();

  const colors = useMemo(
    () => (product.colors ?? []).filter((c) => c.active !== false),
    [product.colors]
  );

  const defaultColorIdx = useMemo(() => {
    const i = product.activeColorIndex;
    if (typeof i === "number" && i >= 0 && i < colors.length) return i;
    if (product.activeColorName) {
      const idx = colors.findIndex((c) => c.name.toLowerCase() === product.activeColorName?.toLowerCase());
      if (idx !== -1) return idx;
    }
    return 0;
  }, [product.activeColorIndex, product.activeColorName, colors]);

  const [colorOverride, setColorOverride] = useState<number | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const colorIdx = colorOverride !== null && colorOverride < colors.length ? colorOverride : defaultColorIdx;
  const currentColor = colors[colorIdx];

  const images = useMemo(() => {
    const gallery = product.galleryImages?.filter(Boolean) ?? [];
    const base = gallery.length > 0 ? gallery : [product.imageUrl];
    if (currentColor?.image) return [currentColor.image, ...base.filter((img) => img !== currentColor.image)];
    return base;
  }, [currentColor, product.galleryImages, product.imageUrl]);

  const primary = images[0] || product.imageUrl;
  const secondary = images[1];
  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ["One Size"];
  const isFav = isInWishlist(product.id);
  const href = `/products/${product.id}`;

  const handleAdd = (size: string) => {
    const colorLabel = currentColor ? `, ${currentColor.name}` : "";
    addItem({
      id: product.id,
      title: `${product.title} (${size}${colorLabel})`,
      price: product.price,
      imageUrl: primary,
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setQuickAddOpen(false);
    }, 1200);
  };

  return (
    <div className="group flex flex-col">
      <div className="relative aspect-[2/3] w-full bg-surface overflow-hidden">
        <Link href={href} className="block w-full h-full" aria-label={product.title}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primary}
            alt={product.title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              secondary ? "group-hover:opacity-0" : ""
            }`}
          />
          {secondary && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={secondary}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        {(product.isNew || product.tag) && (
          <span className="absolute top-2 left-2 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
            {product.tag || "New"}
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          className="absolute top-1 right-1 w-10 h-10 flex items-center justify-center text-black"
          aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`size-5 ${isFav ? "fill-black" : ""}`} />
        </button>

        {/* Quick add */}
        <div className="absolute inset-x-2 bottom-2">
          {quickAddOpen ? (
            <div className="bg-white p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="eyebrow">{added ? "Added to bag" : "Select a size"}</span>
                <button
                  type="button"
                  onClick={() => setQuickAddOpen(false)}
                  className="text-neutral-500 hover:text-black"
                  aria-label="Close quick add"
                >
                  {added ? <Check className="size-4 text-black" /> : <X className="size-4" />}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleAdd(sz)}
                    disabled={added}
                    className="min-w-9 h-9 px-2 border border-neutral-300 text-xs font-semibold hover:border-black hover:bg-black hover:text-white transition-colors"
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="w-full bg-white py-3 eyebrow flex items-center justify-center gap-1.5 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 hover:bg-black hover:text-white"
            >
              <Plus className="size-4" />
              Quick add
            </button>
          )}
        </div>
      </div>

      <div className="pt-3 space-y-1">
        <Link href={href} className="block">
          <h3 className="text-[13px] font-bold uppercase tracking-wide leading-snug line-clamp-2 hover:underline underline-offset-2">
            {product.title}
          </h3>
        </Link>
        <p className="text-[13px] text-neutral-700">{formatProductPrice(product)}</p>

        {colors.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1.5">
            {colors.slice(0, 6).map((color, idx) => (
              <button
                key={color.name}
                type="button"
                onClick={() => setColorOverride(idx)}
                onMouseEnter={() => setColorOverride(idx)}
                title={color.name}
                aria-label={`Colour: ${color.name}`}
                className={`size-4 rounded-full border transition-shadow ${
                  idx === colorIdx ? "ring-1 ring-black ring-offset-2 border-black/20" : "border-black/20"
                }`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {colors.length > 6 && <span className="text-[11px] text-neutral-500">+{colors.length - 6}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
