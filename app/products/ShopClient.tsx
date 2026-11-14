"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "../components/icons";
import ProductCard from "../components/ProductCard";
import { Product } from "../lib/products-store";
import { apiFetch } from "../lib/api";
import { productCategory, toList } from "../lib/format";

type ApiCategory = { id: number | string; name: string; slug: string };
type SortKey = "featured" | "newest" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortKey, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

export default function ShopClient({ initialCategory }: { initialCategory: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState<SortKey>("featured");

  useEffect(() => {
    Promise.all([apiFetch("products"), apiFetch("categories")])
      .then(async ([pr, cr]) => {
        if (!pr.ok) throw new Error(`Could not load products (${pr.status})`);
        setProducts(toList<Product>(await pr.json()));
        setCategories(cr.ok ? toList<ApiCategory>(await cr.json()) : []);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load products"))
      .finally(() => setLoading(false));
  }, []);

  const selectCategory = (slug: string) => {
    setCategory(slug);
    const url = slug === "all" ? "/products" : `/products?category=${encodeURIComponent(slug)}`;
    window.history.replaceState(null, "", url);
  };

  const visible = useMemo(() => {
    const list =
      category === "all"
        ? products
        : products.filter((p) => {
            const key = productCategory(p);
            const match = categories.find((c) => c.slug.toLowerCase() === category);
            return key === category || (match && key === match.name.toLowerCase());
          });

    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-desc") sorted.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "newest") sorted.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
    return sorted;
  }, [products, categories, category, sort]);

  const activeName =
    category === "all" ? "Shop All" : categories.find((c) => c.slug.toLowerCase() === category)?.name ?? category;

  const chip = (active: boolean) =>
    `px-4 h-9 border text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
      active ? "bg-black text-white border-black" : "bg-white text-black border-neutral-300 hover:border-black"
    }`;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-20">
      <h1 className="heading-display text-4xl sm:text-6xl">{activeName}</h1>
      {!loading && <p className="text-sm text-muted mt-2">{visible.length} {visible.length === 1 ? "item" : "items"}</p>}

      <div className="sticky top-16 z-20 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mt-6 border-b border-line flex items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          <button type="button" onClick={() => selectCategory("all")} className={chip(category === "all")}>
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectCategory(c.slug.toLowerCase())}
              className={chip(category === c.slug.toLowerCase())}
            >
              {c.name}
            </button>
          ))}
        </div>

        <label className="relative flex items-center shrink-0">
          <span className="sr-only">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="appearance-none h-9 pl-3 pr-8 border border-neutral-300 bg-white text-xs font-bold uppercase tracking-wider cursor-pointer hover:border-black"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
          <ChevronDown className="size-4 absolute right-2 pointer-events-none" />
        </label>
      </div>

      {error && <p className="mt-8 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-10 mt-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-surface animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 && !error ? (
        <p className="mt-16 text-center text-sm text-muted">No products in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-10 mt-8">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
