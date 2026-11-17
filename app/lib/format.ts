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

/**
 * Postgres decimal columns arrive as strings ("120.00"). Convert a product's
 * price, ETB price and stock to real numbers once, when it comes from the API.
 */
export function toProduct<T extends { price?: unknown; priceETB?: unknown; stock?: unknown; costPrice?: unknown }>(
  raw: T
): T & {
  price: number;
  priceETB: number;
  stock?: number;
  costPrice?: number | null;
} {
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const optional = (v: unknown) => (v === undefined || v === null || v === "" ? null : num(v));
  return {
    ...raw,
    price: num(raw.price),
    priceETB: num(raw.priceETB),
    stock: raw.stock === undefined || raw.stock === null ? undefined : num(raw.stock),
    // Only present for signed-in admins; customers never receive it.
    ...("costPrice" in raw ? { costPrice: optional(raw.costPrice) } : {}),
  };
}

/** Profit margin as a ratio (0.4 = 40%), or null when it can't be worked out. */
export function marginOf(price: number, cost: number | null | undefined): number | null {
  if (cost === null || cost === undefined || !(price > 0)) return null;
  return (price - cost) / price;
}

/** Extract an array from either `[...]` or `{ data: [...] }` API payloads. */
export function toList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const data = (payload as { data?: unknown } | null)?.data;
  return Array.isArray(data) ? (data as T[]) : [];
}

/** Human-readable payment method for an order. */
export function paymentLabel(method: string | undefined, last4?: string): string {
  switch ((method || "").toLowerCase()) {
    case "chapa":
      return "Chapa";
    case "manual_boutique":
      return "In store";
    case "cash_on_delivery":
      return "Cash on delivery";
    case "stripe":
    case "card":
      return last4 ? `Card ending ${last4}` : "Card";
    default:
      return method ? method.replace(/_/g, " ") : "—";
  }
}
