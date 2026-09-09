"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { getAllProducts } from "../lib/products-store";

type Product = {
  id: number;
  title?: string;
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  stock?: number;
};

type ApiResponse = Product[] | { data?: Product[] };

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
    const endpoint = base ? `${base}/products` : "/api/products";
    const controller = new AbortController();

    fetch(endpoint, { signal: controller.signal })
      .then(async (response) => {
        const contentType = response.headers.get("content-type") ?? "";
        if (!response.ok) {
          throw new Error(`Product request failed (${response.status})`);
        }
        if (!contentType.includes("application/json")) {
          throw new Error("Product API returned a non-JSON response.");
        }
        return response.json() as Promise<ApiResponse>;
      })
      .then((response: ApiResponse) => {
        const items = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : null;
        if (!items) {
          throw new TypeError("Product API returned an invalid response.");
        }
        setProducts(items);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        const local = getAllProducts();
        if (local && local.length > 0) {
          setProducts(local as Product[]);
        } else {
          setError(requestError instanceof Error ? requestError.message : "Unable to load products.");
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="w-full max-w-full p-4 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Products</h2>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
            <Link href={`/products/${p.id}`} className="block">
              <div className="h-48 w-full overflow-hidden rounded-2xl bg-zinc-100 mb-4 flex items-center justify-center">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name ?? p.title ?? "Product"} className="max-h-40 w-auto object-contain" />
                ) : (
                  <div className="text-zinc-400">No image</div>
                )}
              </div>
            </Link>
            <div className="flex flex-1 flex-col gap-3">
              <div>
                <h3 className="font-medium text-lg">{p.name ?? p.title ?? "Unnamed product"}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{p.description}</p>
              </div>
              <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-lg font-semibold">{p.price === undefined ? "Price unavailable" : `$${p.price.toFixed(2)}`}</div>
                <button
                  type="button"
                  className="w-full rounded-full bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 sm:w-auto"
                  onClick={() => {
                    if (p.price === undefined) return;
                    addItem({
                      id: p.id,
                      title: p.name ?? p.title ?? "Unnamed product",
                      price: p.price,
                      imageUrl: p.imageUrl,
                    });
                  }}
                >
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
