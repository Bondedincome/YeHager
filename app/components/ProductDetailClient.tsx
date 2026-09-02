"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, ChevronDown, Check, X } from "lucide-react";
import { Product, getAllProducts } from "../lib/products-store";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const allProducts = getAllProducts();
  const relatedProducts = allProducts.filter((p) => p.id !== product.id).slice(0, 4);

  const isFav = isInWishlist(product.id);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("Select Size");
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const [isShippingExpanded, setIsShippingExpanded] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const colors = product.colors || [
    { name: "Violet", hex: "#7071e8" },
    { name: "Off White", hex: "#f3f4f6" },
    { name: "Charcoal", hex: "#27272a" },
  ];

  const sizes = product.sizes || ["XS", "S", "M", "L", "XL"];
  const currentColor = colors[selectedColorIndex] || colors[0];

  const gallery = product.galleryImages && product.galleryImages.length >= 2
    ? product.galleryImages
    : [
        product.imageUrl,
        product.galleryImages?.[0] || product.imageUrl,
      ];

  const handleAddToBag = () => {
    if (selectedSize === "Select Size") {
      setErrorNotice("Please select a size");
      setIsSizeDropdownOpen(true);
      return;
    }
    setErrorNotice(null);
    addItem({
      id: product.id,
      title: `${product.title} (${selectedSize}, ${currentColor.name})`,
      price: product.price,
      imageUrl: gallery[0] || product.imageUrl,
    });
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  return (
    <div className="w-full bg-white text-black min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          {/* LEFT: 2-Column Side-by-Side Gallery Images */}
          <div className="lg:col-span-8 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {gallery.map((imgUrl, idx) => (
                <div
                  key={idx}
                  id={`gallery-img-${idx}`}
                  className={`relative aspect-[3/4] w-full bg-[#f4f4f4] overflow-hidden ${
                    idx > 1 ? "hidden sm:block" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={`${product.title} - View ${idx + 1}`}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              ))}
            </div>

            {/* Mobile Horizontal Thumbnail Slider */}
            {gallery.length > 1 && (
              <div className="flex sm:hidden items-center gap-2 overflow-x-auto py-2 scrollbar-none">
                {gallery.map((imgUrl, idx) => (
                  <a
                    key={`thumb-${idx}`}
                    href={`#gallery-img-${idx < 2 ? idx : 0}`}
                    className="relative w-16 h-20 flex-shrink-0 bg-neutral-100 border border-neutral-300 overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Sticky Details & Purchase Pane */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            {/* Tag */}
            {product.isNew !== false && (
              <p className="text-sm font-normal text-[#2563eb]">New</p>
            )}

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
              {product.title}
            </h1>

            {/* Price */}
            <p className="text-sm font-bold text-black">
              {product.formattedPriceETB || `Br${product.priceETB.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB`}
            </p>

            {/* Color Swatch Selector */}
            <div className="space-y-2 pt-2">
              <p className="text-sm text-neutral-800 font-normal">
                {currentColor.name}
              </p>
              <div className="flex items-center gap-2">
                {colors.map((c, idx) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColorIndex(idx)}
                    aria-label={`Select color ${c.name}`}
                    className={`w-5 h-5 rounded-none transition-all ${
                      selectedColorIndex === idx
                        ? "ring-2 ring-black ring-offset-2 scale-105"
                        : "opacity-80 hover:opacity-100 ring-1 ring-neutral-300"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Size Guide Link */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSizeGuide(true)}
                className="text-xs text-black underline underline-offset-4 hover:opacity-70 transition-opacity"
              >
                Size Guide
              </button>
            </div>

            {/* Size Dropdown Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                className={`w-full flex items-center justify-between border px-4 py-3.5 text-sm transition-colors ${
                  errorNotice
                    ? "border-red-500 bg-red-50/50"
                    : "border-black bg-white hover:bg-neutral-50"
                }`}
              >
                <span className={selectedSize === "Select Size" ? "text-neutral-700" : "text-black font-medium"}>
                  {selectedSize}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSizeDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {errorNotice && (
                <p className="text-xs text-red-600 mt-1">{errorNotice}</p>
              )}

              {isSizeDropdownOpen && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-black shadow-lg py-1">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setSelectedSize(sz);
                        setIsSizeDropdownOpen(false);
                        setErrorNotice(null);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between hover:bg-neutral-100 ${
                        selectedSize === sz ? "bg-neutral-100 font-bold" : ""
                      }`}
                    >
                      <span>{sz}</span>
                      {selectedSize === sz && <Check className="w-4 h-4 text-black" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons: Add to Bag (solid black) + Wishlist (square bordered box) */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToBag}
                className="flex-1 bg-black text-white py-3.5 px-6 text-sm font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
              >
                {addedNotice ? (
                  <>
                    <Check className="w-4 h-4" />
                    Added to Bag
                  </>
                ) : (
                  "Add to Bag"
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
                className="w-12 h-12 flex items-center justify-center border border-black hover:bg-neutral-50 transition-colors"
              >
                <Heart
                  className={`w-5 h-5 ${isFav ? "fill-black text-black" : "text-black stroke-[1.75]"}`}
                />
              </button>
            </div>

            {/* Details Accordion / Section */}
            <div className="pt-6 border-t border-neutral-200 space-y-3">
              <p className="text-sm font-bold text-black">Details</p>

              <div className="text-xs text-neutral-800 leading-relaxed space-y-3 font-normal">
                <p>
                  {product.details?.overview ||
                    product.description ||
                    "The micro cable-knit polo. An easy silhouette with a classic collar, button-front placket and textured knit. Made from soft, lightweight merino wool."}
                </p>

                {isDetailsExpanded && (
                  <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                    <ul className="list-disc pl-4 space-y-1 text-neutral-800">
                      {(product.details?.measurements || [
                        '18 1/2" long from shoulder',
                        "Model is 5'9\" and wearing size XS",
                      ]).map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>

                    <div className="pt-2 space-y-1">
                      <p>
                        <span className="font-semibold">Fabric:</span>{" "}
                        {product.details?.fabric || "100% Merino Wool"}
                      </p>
                      <p>
                        <span className="font-semibold">Care:</span>{" "}
                        {product.details?.care ||
                          "Hand wash inside out in cold water. Do not bleach. Lay flat to dry. Do not iron. Dry cleanable."}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                  className="text-xs text-black underline underline-offset-4 pt-1 hover:opacity-75"
                >
                  {isDetailsExpanded ? "Less" : "More"}
                </button>
              </div>
            </div>

            {/* Shipping & Returns Accordion */}
            <div className="pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setIsShippingExpanded(!isShippingExpanded)}
                className="w-full flex items-center justify-between py-2 text-left"
              >
                <span className="text-xs font-normal text-black underline underline-offset-4 hover:opacity-75">
                  Shipping &amp; Returns
                </span>
                <ChevronDown className={`w-4 h-4 text-black transition-transform duration-200 ${isShippingExpanded ? "rotate-180" : ""}`} />
              </button>

              {isShippingExpanded && (
                <div className="pt-2 text-xs text-neutral-700 space-y-2 leading-relaxed animate-in fade-in duration-200">
                  <p>
                    Complimentary standard shipping on all domestic orders within Ethiopia over Br15,000 ETB. International DHL express shipping calculated at checkout.
                  </p>
                  <p>
                    Returns accepted within 30 days of delivery on unworn items in original packaging with tags attached.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Complete the Look / You May Also Like */}
        <div className="mt-24 pt-12 border-t border-neutral-200">
          <h2 className="text-lg font-bold tracking-tight text-black mb-6">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((rel) => (
              <Link
                key={rel.id}
                href={`/products/${rel.id}`}
                className="group block space-y-2"
              >
                <div className="aspect-[3/4] bg-[#f4f4f4] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={rel.imageUrl}
                    alt={rel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div>
                  <p className="text-xs text-black font-normal line-clamp-1 group-hover:underline">
                    {rel.title}
                  </p>
                  <p className="text-xs text-neutral-600 font-normal">
                    {rel.formattedPriceETB || `Br${rel.priceETB.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-bold text-black">Size Guide (Inches)</h3>
              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                className="p-1 text-neutral-500 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-neutral-50 font-semibold text-black">
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Bust / Chest</th>
                    <th className="py-2.5 px-3">Waist</th>
                    <th className="py-2.5 px-3">Hips</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-neutral-700">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-black">XS (0-2)</td>
                    <td className="py-2.5 px-3">32 - 33&quot;</td>
                    <td className="py-2.5 px-3">24 - 25&quot;</td>
                    <td className="py-2.5 px-3">34 - 35&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-black">S (4-6)</td>
                    <td className="py-2.5 px-3">34 - 35&quot;</td>
                    <td className="py-2.5 px-3">26 - 27&quot;</td>
                    <td className="py-2.5 px-3">36 - 37&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-black">M (8-10)</td>
                    <td className="py-2.5 px-3">36 - 37&quot;</td>
                    <td className="py-2.5 px-3">28 - 29&quot;</td>
                    <td className="py-2.5 px-3">38 - 39&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-black">L (12-14)</td>
                    <td className="py-2.5 px-3">38 - 40&quot;</td>
                    <td className="py-2.5 px-3">30 - 32&quot;</td>
                    <td className="py-2.5 px-3">40 - 42&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-black">XL (16)</td>
                    <td className="py-2.5 px-3">41 - 43&quot;</td>
                    <td className="py-2.5 px-3">33 - 35&quot;</td>
                    <td className="py-2.5 px-3">43 - 45&quot;</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-neutral-500 leading-normal">
              Measurements refer to body size, not garment dimensions. If between sizes, we recommend ordering one size up for a relaxed fit.
            </p>

            <button
              type="button"
              onClick={() => setShowSizeGuide(false)}
              className="w-full bg-black text-white py-3 text-xs font-bold uppercase tracking-wider"
            >
              Close Size Guide
            </button>
          </div>
        </div>
      )}

      {/* MOBILE STICKY ADD TO BAG BAR (Fixed at bottom for small screens) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3 px-4 z-30 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-10 h-10 object-cover bg-neutral-100 flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-black truncate">{product.title}</p>
            <p className="text-[11px] font-semibold text-neutral-600">
              ${product.price} USD
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToBag}
          className="bg-black text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 flex-shrink-0 flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          {addedNotice ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Added</span>
            </>
          ) : (
            <span>Add to Bag</span>
          )}
        </button>
      </div>
    </div>
  );
}
