"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, ArrowDown, ArrowUp, Download, X } from "../../components/icons";
import { apiClient, apiFetch } from "../../lib/api";
import { toList, toProduct } from "../../lib/format";
import { getStoreSettings } from "../../lib/settings-store";
import type { Product } from "../../lib/products-store";
import {
  buildCsv,
  Currency,
  downloadText,
  fillDays,
  formatPercent,
  makeMoney,
  ORDER_STATUSES,
  PERIODS,
  PeriodKey,
  periodRange,
  ProductRow,
  ProfitReport,
  slugify,
  toDateInput,
} from "./report";

type SortKey = "title" | "units" | "revenue" | "cost" | "profit" | "margin";

const selectClass =
  "h-10 px-3 rounded-md border border-neutral-300 bg-white text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black";

function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5">
      <p className="text-sm text-neutral-600">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          tone === "bad" ? "text-red-700" : tone === "good" ? "text-emerald-700" : "text-black"
        }`}
      >
        {value}
      </p>
      {note && <p className="mt-1 text-xs text-neutral-500">{note}</p>}
    </div>
  );
}

function SortHeader({
  label,
  k,
  sort,
  onSort,
  align = "right",
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === k;
  return (
    <th className={`px-4 py-3 font-medium ${align === "right" ? "text-right" : "text-left"}`} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1 hover:text-black ${active ? "text-black" : ""}`}
      >
        {label}
        {active && (sort.dir === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />)}
      </button>
    </th>
  );
}

export default function ProfitLossClient() {
  const rate = useMemo(() => getStoreSettings().exchangeRateUSDToETB || 125, []);

  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [custom, setCustom] = useState(() => {
    const now = new Date();
    return { from: toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)), to: toDateInput(now) };
  });
  const [category, setCategory] = useState("");
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "revenue", dir: "desc" });

  const [products, setProducts] = useState<Product[]>([]);
  const [report, setReport] = useState<ProfitReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("products")
      .then((r) => (r.ok ? r.json() : []))
      .then((payload) => setProducts(toList<Product>(payload).map(toProduct)))
      .catch(() => setProducts([]));
  }, []);

  const range = useMemo(() => periodRange(period, custom), [period, custom]);
  const rangeKey = `${range.from?.toISOString() ?? ""}|${range.to?.toISOString() ?? ""}`;

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      const result = await apiClient<ProfitReport>("analytics/profit", {
        cache: "no-store",
        params: {
          from: range.from?.toISOString(),
          to: range.to?.toISOString(),
          category: category || undefined,
          productId: productId || undefined,
          status: status || undefined,
          tzOffset: new Date().getTimezoneOffset(),
        },
      });
      if (!active) return;
      if (result.error !== undefined) {
        setError(
          result.status === 401 || result.status === 403
            ? "Your admin session has expired. Sign in again to see the report."
            : result.error || "Couldn't load the report."
        );
        setReport(null);
      } else {
        setReport(result.data);
      }
      setLoading(false);
    };
    void run();
    return () => {
      active = false;
    };
    // rangeKey captures range changes without re-running on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey, category, productId, status]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category.toLowerCase()));
    report?.products.forEach((p) => p.category && set.add(p.category.toLowerCase()));
    return [...set].sort();
  }, [products, report]);

  const productOptions = useMemo(
    () =>
      products
        .filter((p) => !category || (p.category || "").toLowerCase() === category)
        .sort((a, b) => (a.title || "").localeCompare(b.title || "")),
    [products, category]
  );

  const selectedProduct = productId
    ? products.find((p) => String(p.id) === productId) ?? report?.products.find((p) => p.productId === productId)
    : undefined;
  const selectedName = selectedProduct ? ("title" in selectedProduct ? selectedProduct.title : "") : "";

  const money = useMemo(() => makeMoney(currency, rate), [currency, rate]);
  const days = useMemo(() => fillDays(report?.daily ?? [], range.from, range.to), [report, range.from, range.to]);

  const rows = useMemo(() => {
    const list = [...(report?.products ?? [])];
    const dir = sort.dir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sort.key === "title") return a.title.localeCompare(b.title) * dir;
      const av = a[sort.key] ?? -Infinity;
      const bv = b[sort.key] ?? -Infinity;
      return ((av as number) - (bv as number)) * dir;
    });
    return list;
  }, [report, sort]);

  const onSort = (key: SortKey) =>
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "title" ? "asc" : "desc" }));

  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? "";
  const statusLabel = ORDER_STATUSES.find((s) => s.value === status)?.label ?? "";
  const s = report?.summary;
  const itemFiltered = Boolean(category || productId);

  const download = () => {
    if (!report) return;
    const csv = buildCsv({
      report,
      currency,
      rate,
      days,
      filters: {
        period: periodLabel,
        from: range.from,
        to: range.to,
        category: category || "All categories",
        product: selectedName || "All products",
        status: statusLabel,
      },
    });
    const parts = [
      "profit-loss",
      range.from ? toDateInput(range.from) : "start",
      range.to ? toDateInput(range.to) : toDateInput(new Date()),
      category && slugify(category),
      selectedName && slugify(selectedName),
      currency.toLowerCase(),
    ].filter(Boolean);
    downloadText(`${parts.join("_")}.csv`, csv);
  };

  const pickProduct = (row: ProductRow) => {
    if (!row.productId) return;
    setProductId(row.productId === productId ? "" : row.productId);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Profit &amp; loss</h1>
          <p className="text-sm text-neutral-600 mt-1">
            What you sold, what it cost you, and what you kept. Only paid orders are counted; cancelled ones are left out.
          </p>
        </div>
        <button
          type="button"
          onClick={download}
          disabled={!report || loading}
          className="h-10 px-4 rounded-md bg-black text-white text-sm font-medium flex items-center gap-2 hover:bg-neutral-800 disabled:opacity-50 self-start"
        >
          <Download className="size-4" /> Download report (CSV)
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-wrap items-end gap-3">
        <label className="space-y-1">
          <span className="block text-xs font-medium text-neutral-600">Period</span>
          <select className={selectClass} value={period} onChange={(e) => setPeriod(e.target.value as PeriodKey)}>
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {period === "custom" && (
          <>
            <label className="space-y-1">
              <span className="block text-xs font-medium text-neutral-600">From</span>
              <input
                type="date"
                className={selectClass}
                value={custom.from}
                max={custom.to || undefined}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
              />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium text-neutral-600">To</span>
              <input
                type="date"
                className={selectClass}
                value={custom.to}
                min={custom.from || undefined}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
              />
            </label>
          </>
        )}

        <label className="space-y-1">
          <span className="block text-xs font-medium text-neutral-600">Category</span>
          <select
            className={selectClass}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setProductId("");
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 min-w-0 flex-1 sm:flex-none sm:w-56">
          <span className="block text-xs font-medium text-neutral-600">Product</span>
          <select className={`${selectClass} w-full`} value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">All products</option>
            {productOptions.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.title || "Untitled product"}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="block text-xs font-medium text-neutral-600">Orders</span>
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            {ORDER_STATUSES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-1 sm:ml-auto">
          <span className="block text-xs font-medium text-neutral-600">Show in</span>
          <div className="inline-flex rounded-md border border-neutral-300 p-0.5 bg-white">
            {(["USD", "ETB"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                aria-pressed={currency === c}
                className={`px-3 h-8 rounded text-sm ${currency === c ? "bg-black text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {currency === "ETB" && (
        <p className="text-xs text-neutral-500 -mt-3">
          Converted at Br{rate} per $1. Change the rate in{" "}
          <Link href="/admin/settings" className="underline">
            Settings
          </Link>
          .
        </p>
      )}

      {selectedName && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-black bg-white px-4 py-3 text-sm">
          <p>
            Showing one item: <strong>{selectedName}</strong>
          </p>
          <button type="button" onClick={() => setProductId("")} className="flex items-center gap-1 text-neutral-600 hover:text-black">
            <X className="size-4" /> Show all
          </button>
        </div>
      )}

      {error && (
        <div className="flex gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {s && s.unitsMissingCost > 0 && (
        <div className="flex gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <p>
            {s.unitsMissingCost} {s.unitsMissingCost === 1 ? "unit was" : "units were"} sold without a cost entered, so
            their cost counts as zero and profit looks higher than it is. Add a cost to each product on the{" "}
            <Link href="/admin/products" className="underline font-medium">
              Products page
            </Link>
            .
          </p>
        </div>
      )}

      {/* Summary */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
        <Stat label="Revenue" value={s ? money.format(s.revenue) : "—"} note={s ? `${s.units} units · ${s.orders} orders` : undefined} />
        <Stat label="Cost of goods" value={s ? money.format(s.cost) : "—"} note="What the items cost you" />
        <Stat
          label="Gross profit"
          value={s ? money.format(s.grossProfit) : "—"}
          note={s ? `Margin ${formatPercent(s.margin)}` : undefined}
          tone={s && s.grossProfit < 0 ? "bad" : s && s.grossProfit > 0 ? "good" : undefined}
        />
        <Stat
          label={itemFiltered ? "Profit per unit" : "Net profit"}
          value={s ? (itemFiltered ? (s.units ? money.format(s.grossProfit / s.units) : "—") : money.format(s.netProfit)) : "—"}
          note={
            s && !itemFiltered
              ? `Incl. ${money.format(s.shipping ?? 0)} shipping, less ${money.format(s.discounts ?? 0)} discounts`
              : "Average across units sold"
          }
          tone={s && s.netProfit < 0 ? "bad" : undefined}
        />
      </div>

      {/* Chart */}
      <section className="bg-white border border-neutral-200 rounded-lg">
        <div className="px-5 py-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">By day</h2>
          <div className="flex items-center gap-4 text-xs text-neutral-600">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-neutral-300" /> Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-emerald-600" /> Profit
            </span>
          </div>
        </div>
        <div className="h-72 p-4">
          {days.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-neutral-500">
              {loading ? "Loading…" : "No sales in this period."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={days} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ececec" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#737373" }}
                  stroke="#e5e5e5"
                  tickFormatter={(d: string) =>
                    new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  }
                  minTickGap={16}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#737373" }}
                  stroke="#e5e5e5"
                  width={72}
                  tickFormatter={(v: number) => money.format(v).replace(/\.00$/, "")}
                />
                <Tooltip
                  formatter={(value, name) => [money.format(Number(value)), name === "revenue" ? "Revenue" : "Profit"]}
                  labelFormatter={(d) => new Date(`${String(d)}T00:00:00`).toLocaleDateString()}
                  contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #e5e5e5" }}
                />
                <Bar dataKey="revenue" fill="#d4d4d4" radius={[2, 2, 0, 0]} maxBarSize={28} />
                <Line dataKey="profit" type="monotone" stroke="#047857" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* By product */}
      <section className="bg-white border border-neutral-200 rounded-lg">
        <div className="px-5 py-4 border-b border-neutral-200">
          <h2 className="text-base font-semibold">By product</h2>
          <p className="text-sm text-neutral-500">Select a product to see it on its own.</p>
        </div>

        {rows.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">{loading ? "Loading…" : "Nothing sold with these filters."}</p>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-neutral-500 border-b border-neutral-200">
                  <tr>
                    <SortHeader label="Product" k="title" sort={sort} onSort={onSort} align="left" />
                    <SortHeader label="Units" k="units" sort={sort} onSort={onSort} />
                    <SortHeader label="Revenue" k="revenue" sort={sort} onSort={onSort} />
                    <SortHeader label="Cost" k="cost" sort={sort} onSort={onSort} />
                    <SortHeader label="Profit" k="profit" sort={sort} onSort={onSort} />
                    <SortHeader label="Margin" k="margin" sort={sort} onSort={onSort} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rows.map((row) => (
                    <tr
                      key={row.productId || row.title}
                      onClick={() => pickProduct(row)}
                      className={`${row.productId ? "cursor-pointer hover:bg-neutral-50" : ""} ${
                        row.productId === productId ? "bg-neutral-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium">{row.title}</span>
                        <span className="block text-xs text-neutral-500">
                          {row.category || "No category"} · avg {money.format(row.avgPrice)}
                          {row.avgCost !== null ? ` · cost ${money.format(row.avgCost)}` : ""}
                          {row.unitsMissingCost > 0 && (
                            <span className="text-amber-700"> · {row.unitsMissingCost} without cost</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.units}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{money.format(row.revenue)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{money.format(row.cost)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums font-medium ${row.profit < 0 ? "text-red-700" : ""}`}>
                        {money.format(row.profit)}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums ${row.margin !== null && row.margin < 0 ? "text-red-700" : ""}`}>
                        {formatPercent(row.margin)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {s && rows.length > 1 && (
                  <tfoot className="border-t border-neutral-300 font-semibold">
                    <tr>
                      <td className="px-4 py-3">Total</td>
                      <td className="px-4 py-3 text-right tabular-nums">{s.units}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{money.format(s.revenue)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{money.format(s.cost)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums ${s.grossProfit < 0 ? "text-red-700" : ""}`}>
                        {money.format(s.grossProfit)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatPercent(s.margin)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Mobile */}
            <ul className="md:hidden divide-y divide-neutral-100">
              {rows.map((row) => (
                <li key={row.productId || row.title}>
                  <button
                    type="button"
                    onClick={() => pickProduct(row)}
                    disabled={!row.productId}
                    className={`w-full text-left p-4 space-y-2 ${row.productId === productId ? "bg-neutral-50" : ""}`}
                  >
                    <div className="flex justify-between gap-3">
                      <span className="font-medium">{row.title}</span>
                      <span className={`font-semibold tabular-nums ${row.profit < 0 ? "text-red-700" : ""}`}>
                        {money.format(row.profit)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-neutral-600">
                      <span>{row.units} sold</span>
                      <span>Revenue {money.format(row.revenue)}</span>
                      <span className="text-right">Margin {formatPercent(row.margin)}</span>
                    </div>
                    {row.unitsMissingCost > 0 && (
                      <p className="text-xs text-amber-700">{row.unitsMissingCost} sold without a cost</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
