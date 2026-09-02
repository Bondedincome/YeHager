"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "../lib/products-store";
import { useWishlist } from "./WishlistProvider";
import { useCart } from "./CartProvider";

interface MicroProductCardProps {
  product: Product;
}

export default function MicroProductCard({ product }: MicroProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showQuickShop, setShowQuickShop] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addedNotice, setAddedNotice] = useState(false);

  const isFav = isInWishlist(product.id);
  const images = product.galleryImages && product.galleryImages.length > 0
    ? product.galleryImages
    : [product.imageUrl];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleQuickAdd = (size: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize(size);
    addItem({
      id: product.id,
      title: `${product.title} (${size})`,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      setShowQuickShop(false);
    }, 1200);
  };

  return (
    <div className="group relative flex flex-col">
      {/* Image Container with 3:4 aspect ratio */}
      <div className="relative aspect-[3/4] w-full bg-[#f4f4f4] overflow-hidden">
        <Link href={`/products/${product.id}`} className="block w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[currentImageIndex] || product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Wishlist Button in Top Right */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/70 hover:bg-white text-black transition-colors z-10"
          aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`w-4 h-4 ${isFav ? "fill-black text-black" : "text-black stroke-[1.75]"}`}
          />
        </button>

        {/* Carousel Arrow Buttons (Shown on Hover or Tap) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-neutral-800 hover:text-black bg-white/60 hover:bg-white rounded-full transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2]" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-neutral-800 hover:text-black bg-white/60 hover:bg-white rounded-full transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4 stroke-[2]" />
            </button>
          </>
        )}

        {/* Quick Shop Button (Slide-up Bar on hover or active) */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          {!showQuickShop ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowQuickShop(true);
              }}
              className="w-full bg-white/95 backdrop-blur-sm text-black text-xs font-semibold py-2.5 text-center uppercase tracking-wider hover:bg-white transition-colors border-t border-neutral-200"
            >
              Quick Shop
            </button>
          ) : (
            <div className="bg-white/95 backdrop-blur-md p-2 border-t border-neutral-200 animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold text-neutral-700">
                  {addedNotice ? "✓ Added to Bag" : "Select Size"}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowQuickShop(false);
                  }}
                  className="text-[10px] text-neutral-500 hover:text-black"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {(product.sizes || ["XS", "S", "M", "L"]).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={(e) => handleQuickAdd(sz, e)}
                    className={`text-[10px] px-2 py-1 border transition-colors ${
                      selectedSize === sz
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-neutral-300 hover:border-black"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info & Swatches Area Below Image */}
      <div className="pt-2.5 pb-1 space-y-1">
        {/* Color Swatches */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1.5">
            {product.colors.map((color, idx) => (
              <button
                key={color.name}
                type="button"
                onClick={() => setSelectedColorIndex(idx)}
                title={color.name}
                className={`w-2.5 h-2.5 rounded-none transition-all ${
                  selectedColorIndex === idx
                    ? "ring-1 ring-black ring-offset-1 scale-110"
                    : "opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: color.hex }}
                aria-label={`Color: ${color.name}`}
              />
            ))}
          </div>
        )}

        {/* Tag (e.g. New) */}
        {product.isNew && (
          <p className="text-xs text-[#2563eb] font-normal tracking-tight">New</p>
        )}

        {/* Product Title */}
        <Link href={`/products/${product.id}`} className="block">
          <h3 className="text-xs font-normal text-black line-clamp-1 hover:underline">
            {product.title}
          </h3>
        </Link>

        {/* Price in ETB */}
        <p className="text-xs font-normal text-black">
          {product.formattedPriceETB || `Br${product.priceETB.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB`}
        </p>
      </div>
    </div>
  );
}
