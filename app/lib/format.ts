/** Shared helpers so every page shows prices and categories the same way. */
type Priced = {
  price?: number | string;
  priceETB?: number | string | null;
  formattedPriceETB?: string | null;
};

export function formatETB(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  return `Br${(Number.isFinite(amount) ? amount : 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
}

export function formatProductPrice(product: Priced): string {
  if (product.formattedPriceETB) return product.formattedPriceETB;
  if (product.priceETB !== undefined && product.priceETB !== null) return formatETB(product.priceETB);
  return `$${Number(product.price ?? 0).toFixed(2)} USD`;
}

/**
 * The backend returns `category` as a relation object ({ id, name, slug })
 * and `categoryName` as plain text. Normalise both to a lowercase key.
 */
export function productCategory(product: { category?: unknown; categoryName?: string | null }): string {
  if (product.categoryName) return product.categoryName.toLowerCase();
  const c = product.category as { slug?: string; name?: string } | string | undefined | null;
  if (!c) return "";
  if (typeof c === "string") return c.toLowerCase();
  return (c.slug || c.name || "").toLowerCase();
}

/** Extract an array from either `[...]` or `{ data: [...] }` API payloads. */
export function toList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const data = (payload as { data?: unknown } | null)?.data;
  return Array.isArray(data) ? (data as T[]) : [];
}
