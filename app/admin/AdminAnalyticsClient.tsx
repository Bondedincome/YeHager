"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowRight, Check } from "../components/icons";
import { useAuth } from "../components/AuthProvider";
import type { CustomerOrder } from "../lib/auth-store";
import type { Product } from "../lib/products-store";
import { apiClient, apiFetch } from "../lib/api";
import { toList, toProduct } from "../lib/format";
import { getStoreSettings } from "../lib/settings-store";

const DAYS = 30;

type ProfitSummary = { summary: { grossProfit: number; margin: number | null; unitsMissingCost: number } };

const usd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Paid (or manually entered) and not cancelled. Unpaid Chapa checkouts don't count as sales. */
function isSale(order: CustomerOrder) {
  const payment = String((order as { paymentStatus?: string }).paymentStatus ?? "PAID").toUpperCase();
  return order.status !== "cancelled" && payment === "PAID";
}

const STATUS_OPTIONS: { value: CustomerOrder["status"]; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function Stat({ label, value, note, href }: { label: string; value: string; note?: string; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-neutral-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-neutral-500">{note}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block bg-white border border-neutral-200 rounded-lg p-5 hover:border-black transition-colors">
      {body}
    </Link>
  ) : (
    <div className="bg-white border border-neutral-200 rounded-lg p-5">{body}</div>
  );
}

export default function AdminAnalyticsClient() {
  const { orders, usersList, updateOrderStatus } = useAuth();
  const settings = useMemo(() => getStoreSettings(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [profit, setProfit] = useState<ProfitSummary["summary"] | null>(null);
  const [restocking, setRestocking] = useState<string | null>(null);

  // One stable "now" per visit keeps the 30-day window consistent across renders.
  const [since] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - (DAYS - 1));
  });

  useEffect(() => {
    apiFetch("products")
      .then((r) => (r.ok ? r.json() : []))
      .then((payload) => setProducts(toList<Product>(payload).map(toProduct)))
      .catch(() => setProducts([]));

    apiClient<ProfitSummary>("analytics/profit", {
      cache: "no-store",
      params: { from: since.toISOString(), tzOffset: new Date().getTimezoneOffset() },
    }).then((result) => setProfit(result.error === undefined ? result.data.summary : null));
  }, [since]);

  const recentSales = useMemo(
    () => orders.filter((o) => isSale(o) && new Date(o.createdAt) >= since),
    [orders, since]
  );

  const revenue = recentSales.reduce((sum, o) => sum + (Number(o.totalUSD) || 0), 0);
  const avgOrder = recentSales.length ? revenue / recentSales.length : 0;
  const customers = usersList.filter((u) => u.role !== "admin").length;
  const toShip = orders.filter((o) => o.status === "confirmed" || o.status === "preparing");

  const chart = useMemo(() => {
    const byDay = new Map<string, number>();
    recentSales.forEach((o) => {
      const key = dayKey(new Date(o.createdAt));
      byDay.set(key, (byDay.get(key) ?? 0) + (Number(o.totalUSD) || 0));
    });
    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(since.getFullYear(), since.getMonth(), since.getDate() + i);
      const key = dayKey(d);
      return { date: key, revenue: Math.round((byDay.get(key) ?? 0) * 100) / 100 };
    });
  }, [recentSales, since]);

  const threshold = settings.lowStockThreshold || 5;
  const lowStock = useMemo(
    () => products.filter((p) => (p.stock ?? 0) <= threshold).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0)),
    [products, threshold]
  );

  const restock = async (product: Product) => {
    const next = (product.stock ?? 0) + 10;
    setRestocking(String(product.id));
    try {
      const response = await apiFetch(`products/${product.id}`, { method: "PUT", body: JSON.stringify({ stock: next }) });
      if (response.ok) setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, stock: next } : p)));
    } finally {
      setRestocking(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-neutral-600 mt-1">The last {DAYS} days at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Sales"
          value={usd(revenue)}
          note={`≈ Br${Math.round(revenue * settings.exchangeRateUSDToETB).toLocaleString()}`}
        />
        <Stat
          label="Gross profit"
          value={profit ? usd(profit.grossProfit) : "—"}
          note={
            profit
              ? profit.unitsMissingCost > 0
                ? "Some items have no cost yet"
                : profit.margin === null
                ? "No sales yet"
                : `${(profit.margin * 100).toFixed(1)}% margin`
              : "Open the report"
          }
          href="/admin/analytics"
        />
        <Stat label="Orders" value={String(recentSales.length)} note={`Average ${usd(avgOrder)}`} href="/admin/orders" />
        <Stat label="Customers" value={String(customers)} note="Registered accounts" href="/admin/users" />
      </div>

      <section className="bg-white border border-neutral-200 rounded-lg">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Sales by day</h2>
          <Link href="/admin/analytics" className="text-sm flex items-center gap-1 hover:underline">
            Profit &amp; loss <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="h-64 p-4">
          {recentSales.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-neutral-500">
              No sales in the last {DAYS} days.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#111" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ececec" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#737373" }}
                  stroke="#e5e5e5"
                  minTickGap={16}
                  tickFormatter={(d: string) =>
                    new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  }
                />
                <YAxis tick={{ fontSize: 11, fill: "#737373" }} stroke="#e5e5e5" width={64} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip
                  formatter={(v) => [usd(Number(v)), "Sales"]}
                  labelFormatter={(d) => new Date(`${String(d)}T00:00:00`).toLocaleDateString()}
                  contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #e5e5e5" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#111" strokeWidth={2} fill="url(#salesFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* To ship */}
        <section className="bg-white border border-neutral-200 rounded-lg">
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-base font-semibold">To ship ({toShip.length})</h2>
            <Link href="/admin/orders" className="text-sm flex items-center gap-1 hover:underline">
              All orders <ArrowRight className="size-4" />
            </Link>
          </div>
          {toShip.length === 0 ? (
            <p className="p-5 text-sm text-neutral-500 flex items-center gap-2">
              <Check className="size-4 text-emerald-600" /> Nothing waiting to be shipped.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {toShip.slice(0, 6).map((o) => (
                <li key={o.id} className="px-5 py-3 flex items-center justify-between gap-3 text-sm">
                  <Link href={`/admin/orders?highlight=${o.orderNumber}`} className="min-w-0 hover:underline">
                    <span className="font-medium">#{o.orderNumber}</span>
                    <span className="block text-xs text-neutral-500 truncate">
                      {o.customerName || o.customerEmail} · {new Date(o.createdAt).toLocaleDateString()}
                    </span>
                  </Link>
                  <span className="text-xs px-2 py-1 rounded bg-neutral-100 capitalize shrink-0">{o.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Low stock */}
        <section className="bg-white border border-neutral-200 rounded-lg">
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-base font-semibold">Low stock ({lowStock.length})</h2>
            <Link href="/admin/products" className="text-sm flex items-center gap-1 hover:underline">
              Products <ArrowRight className="size-4" />
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="p-5 text-sm text-neutral-500 flex items-center gap-2">
              <Check className="size-4 text-emerald-600" />
              {products.length === 0 ? "No products yet." : `Every product has more than ${threshold} in stock.`}
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="px-5 py-3 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium block truncate">{p.title || "Untitled product"}</span>
                    <span className={`text-xs ${(p.stock ?? 0) === 0 ? "text-red-700" : "text-amber-700"}`}>
                      {(p.stock ?? 0) === 0 ? "Out of stock" : `${p.stock} left`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => restock(p)}
                    disabled={restocking === String(p.id)}
                    className="h-8 px-3 rounded-md border border-neutral-300 text-xs hover:border-black disabled:opacity-50 shrink-0"
                  >
                    +10 stock
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent orders */}
      <section className="bg-white border border-neutral-200 rounded-lg">
        <div className="px-5 py-4 border-b border-neutral-200">
          <h2 className="text-base font-semibold">Recent orders</h2>
        </div>
        {orders.length === 0 ? (
          <p className="p-5 text-sm text-neutral-500 flex items-center gap-2">
            <AlertTriangle className="size-4 text-neutral-400" /> No orders yet. They&apos;ll appear here as customers check out.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Customer</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders?highlight=${o.orderNumber}`} className="font-medium hover:underline">
                        #{o.orderNumber}
                      </Link>
                      <span className="block text-xs text-neutral-500">{new Date(o.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="block">{o.customerName || "—"}</span>
                      <span className="block text-xs text-neutral-500">{o.customerEmail}</span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{usd(Number(o.totalUSD) || 0)}</td>
                    <td className="px-5 py-3">
                      <select
                        aria-label={`Status of order ${o.orderNumber}`}
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value as CustomerOrder["status"])}
                        className="h-8 px-2 rounded-md border border-neutral-300 bg-white text-xs"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
