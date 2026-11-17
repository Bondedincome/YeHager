"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Heart, X } from "./icons";
import { Product } from "../lib/products-store";
import { apiFetch } from "../lib/api";
import { formatProductPrice, toList } from "../lib/format";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import ProductCard from "./ProductCard";

const SIZE_GUIDE: [string, string, string, string][] = [
  ["XS (0-2)", "32 - 33\"", "24 - 25\"", "34 - 35\""],
  ["S (4-6)", "34 - 35\"", "26 - 27\"", "36 - 37\""],
  ["M (8-10)", "36 - 37\"", "28 - 29\"", "38 - 39\""],
  ["L (12-14)", "38 - 40\"", "30 - 32\"", "40 - 42\""],
  ["XL (16)", "41 - 43\"", "33 - 35\"", "43 - 45\""],
];

function Accordion({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 text-left"
        aria-expanded={open}
      >
        <span className="eyebrow text-xs">{title}</span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pb-5 text-sm text-neutral-700 leading-relaxed space-y-3">{children}</div>}
    </div>
  );
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    apiFetch("products")
      .then((r) => (r.ok ? r.json() : []))
      .then((payload) =>
        setRelated(toList<Product>(payload).filter((p) => String(p.id) !== String(product.id)).slice(0, 4))
      )
      .catch(() => setRelated([]));
  }, [product.id]);

  const colors = useMemo(() => (product.colors ?? []).filter((c) => c.active !== false), [product.colors]);

  const defaultColorIndex = useMemo(() => {
    const i = product.activeColorIndex;
    if (typeof i === "number" && i >= 0 && i < colors.length) return i;
    if (product.activeColorName) {
      const idx = colors.findIndex((c) => c.name.toLowerCase() === product.activeColorName?.toLowerCase());
      if (idx !== -1) return idx;
    }
    return 0;
  }, [product.activeColorIndex, product.activeColorName, colors]);

  const [colorOverride, setColorOverride] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const colorIdx = colorOverride !== null && colorOverride < colors.length ? colorOverride : defaultColorIndex;
  const currentColor = colors[colorIdx];
  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ["One Size"];
  const isFav = isInWishlist(product.id);
  const price = formatProductPrice(product);

  const gallery = useMemo(() => {
    const base = (product.galleryImages ?? []).filter(Boolean);
    const list = base.length > 0 ? base : [product.imageUrl];
    if (currentColor?.image) return [currentColor.image, ...list.filter((img) => img !== currentColor.image)];
    return list;
  }, [currentColor, product.galleryImages, product.imageUrl]);

  const handleAddToBag = () => {
    const size = sizes.length === 1 ? sizes[0] : selectedSize;
    if (!size) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addItem({
      id: product.id,
      title: product.title,
      price: Number(product.price) || 0,
      priceETB: Number(product.priceETB) || undefined,
      size,
      color: currentColor?.name,
      imageUrl: gallery[0] || product.imageUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const details = product.details;
  const hasDetails = Boolean(details?.overview || product.description || details?.measurements?.length || details?.fabric || details?.care);

  return (
    <div className="w-full pb-24 lg:pb-0">
      <div className="max-w-[1600px] mx-auto px-0 sm:px-6 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Gallery: horizontal swipe on mobile, two-up grid on desktop */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="flex sm:grid sm:grid-cols-2 gap-1 sm:gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none">
              {gallery.map((src, idx) => (
                <div key={`${src}-${idx}`} className="relative aspect-[2/3] w-[85vw] sm:w-auto shrink-0 snap-start bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${product.title}, view ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Purchase panel */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 px-4 sm:px-0 space-y-6">
            <div className="space-y-2">
              {product.isNew && <p className="eyebrow text-muted">New</p>}
              <h1 className="heading-display text-3xl sm:text-4xl">{product.title}</h1>
              {product.subtitle && <p className="text-sm text-neutral-600">{product.subtitle}</p>}
              <p className="text-base font-semibold pt-1">{price}</p>
            </div>

            {colors.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm">
                  <span className="font-bold">Colour:</span> {currentColor?.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c, idx) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setColorOverride(idx)}
                      title={c.name}
                      aria-label={`Colour ${c.name}`}
                      aria-pressed={idx === colorIdx}
                      className={`size-9 rounded-full border-2 p-0.5 transition-colors ${
                        idx === colorIdx ? "border-black" : "border-transparent hover:border-neutral-300"
                      }`}
                    >
                      <span className="block w-full h-full rounded-full border border-black/15" style={{ backgroundColor: c.hex }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 1 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    <span className="font-bold">Size:</span> {selectedSize ?? <span className="text-muted">Select a size</span>}
                  </p>
                  <button type="button" onClick={() => setShowSizeGuide(true)} className="text-xs underline underline-offset-4">
                    Size guide
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setSelectedSize(sz);
                        setSizeError(false);
                      }}
                      className={`h-11 border text-sm font-semibold transition-colors ${
                        selectedSize === sz ? "bg-black text-white border-black" : "border-neutral-300 hover:border-black"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
                {sizeError && <p className="text-xs text-red-700">Please select a size.</p>}
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={handleAddToBag} className="btn-primary flex-1 h-12">
                {added ? (
                  <>
                    <Check className="size-4" /> Added to bag
                  </>
                ) : (
                  "Add to bag"
                )}
              </button>
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
                className="w-12 h-12 flex items-center justify-center border border-black hover:bg-surface transition-colors"
              >
                <Heart className={`size-5 ${isFav ? "fill-black" : ""}`} />
              </button>
            </div>

            <div>
              {hasDetails && (
                <Accordion title="Details" defaultOpen>
                  {(details?.overview || product.description) && <p>{details?.overview || product.description}</p>}
                  {details?.measurements && details.measurements.length > 0 && (
                    <ul className="list-disc pl-4 space-y-1">
                      {details.measurements.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  )}
                  {details?.fabric && (
                    <p>
                      <span className="font-semibold text-black">Fabric:</span> {details.fabric}
                    </p>
                  )}
                  {details?.care && (
                    <p>
                      <span className="font-semibold text-black">Care:</span> {details.care}
                    </p>
                  )}
                </Accordion>
              )}
              <Accordion title="Shipping & returns">
                <p>Free standard delivery within Ethiopia on orders over Br15,000. International express shipping is calculated at checkout.</p>
                <p>Returns accepted within 30 days of delivery on unworn items with tags attached.</p>
              </Accordion>
              <div className="border-t border-line" />
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20 px-4 sm:px-0">
            <h2 className="heading-display text-3xl sm:text-4xl mb-8">You may also like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Size guide */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowSizeGuide(false)}>
          <div className="bg-white max-w-lg w-full p-6 sm:p-8 space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="heading-display text-2xl">Size guide</h3>
              <button type="button" onClick={() => setShowSizeGuide(false)} className="w-10 h-10 flex items-center justify-center -mr-2" aria-label="Close size guide">
                <X className="size-5" />
              </button>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black">
                  <th className="py-2 pr-3">Size</th>
                  <th className="py-2 pr-3">Bust</th>
                  <th className="py-2 pr-3">Waist</th>
                  <th className="py-2">Hips</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-neutral-700">
                {SIZE_GUIDE.map((row) => (
                  <tr key={row[0]}>
                    <td className="py-2.5 pr-3 font-semibold text-black">{row[0]}</td>
                    <td className="py-2.5 pr-3">{row[1]}</td>
                    <td className="py-2.5 pr-3">{row[2]}</td>
                    <td className="py-2.5">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-muted">Body measurements in inches. Between sizes? We recommend sizing up for a relaxed fit.</p>
          </div>
        </div>
      )}

      {/* Mobile sticky bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-line p-3 z-30 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase truncate">{product.title}</p>
          <p className="text-xs text-neutral-600">{price}</p>
        </div>
        <button type="button" onClick={handleAddToBag} className="btn-primary px-5 py-3">
          {added ? (
            <>
              <Check className="size-4" /> Added
            </>
          ) : (
            "Add to bag"
          )}
        </button>
      </div>
    </div>
  );
}
