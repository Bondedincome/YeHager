/** Types and helpers for the profit & loss report (GET /analytics/profit). */

export type ProductRow = {
  productId: string;
  title: string;
  category: string;
  units: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number | null;
  avgPrice: number;
  avgCost: number | null;
  unitsMissingCost: number;
};

export type DayRow = { date: string; orders: number; units: number; revenue: number; cost: number; profit: number };

export type ProfitReport = {
  summary: {
    orders: number;
    units: number;
    revenue: number;
    cost: number;
    grossProfit: number;
    margin: number | null;
    shipping: number | null;
    discounts: number | null;
    netProfit: number;
    unitsMissingCost: number;
  };
  products: ProductRow[];
  daily: DayRow[];
  generatedAt: string;
};

export type PeriodKey = "7d" | "30d" | "90d" | "month" | "lastMonth" | "year" | "all" | "custom";

export const PERIODS: { value: PeriodKey; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "month", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom dates" },
];

export const ORDER_STATUSES = [
  { value: "", label: "All completed orders" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Preparing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

/** yyyy-mm-dd in the viewer's local time. */
export function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromDateInput(value: string): Date | null {
  const [y, m, d] = value.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

/** Local start/end of the chosen period. `null` means open-ended. */
export function periodRange(
  period: PeriodKey,
  custom: { from: string; to: string },
  now = new Date()
): { from: Date | null; to: Date | null } {
  const today = startOfDay(now);
  const daysBack = (n: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - (n - 1));
  switch (period) {
    case "7d":
      return { from: daysBack(7), to: endOfDay(now) };
    case "30d":
      return { from: daysBack(30), to: endOfDay(now) };
    case "90d":
      return { from: daysBack(90), to: endOfDay(now) };
    case "month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) };
    case "lastMonth":
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case "year":
      return { from: new Date(now.getFullYear(), 0, 1), to: endOfDay(now) };
    case "all":
      return { from: null, to: null };
    case "custom": {
      const from = fromDateInput(custom.from);
      const to = fromDateInput(custom.to);
      return { from, to: to ? endOfDay(to) : null };
    }
  }
}

/** Fill gaps so the chart shows quiet days as zero instead of skipping them. */
export function fillDays(daily: DayRow[], from: Date | null, to: Date | null): DayRow[] {
  if (!from || !to) return daily;
  const spanDays = Math.round((startOfDay(to).getTime() - from.getTime()) / 86_400_000) + 1;
  if (spanDays > 400) return daily;
  const byDate = new Map(daily.map((d) => [d.date, d]));
  const out: DayRow[] = [];
  for (let i = 0; i < spanDays; i++) {
    const date = toDateInput(new Date(from.getFullYear(), from.getMonth(), from.getDate() + i));
    out.push(byDate.get(date) ?? { date, orders: 0, units: 0, revenue: 0, cost: 0, profit: 0 });
  }
  return out;
}

export type Currency = "USD" | "ETB";

export function makeMoney(currency: Currency, rate: number) {
  const factor = currency === "ETB" ? rate : 1;
  const formatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const convert = (usd: number) => usd * factor;
  const format = (usd: number) => {
    const value = convert(usd);
    const sign = value < 0 ? "-" : "";
    const abs = formatter.format(Math.abs(value));
    return currency === "ETB" ? `${sign}Br${abs}` : `${sign}$${abs}`;
  };
  return { convert, format };
}

export const formatPercent = (ratio: number | null) => (ratio === null ? "—" : `${(ratio * 100).toFixed(1)}%`);

/* ---------- CSV ---------- */

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  // Guard against spreadsheet formula injection from product names.
  const safe = /^[=+\-@\t\r]/.test(text) && !/^-?\d/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const csvLine = (cells: unknown[]) => cells.map(csvCell).join(",");

export function buildCsv(args: {
  report: ProfitReport;
  currency: Currency;
  rate: number;
  filters: { period: string; from: Date | null; to: Date | null; category: string; product: string; status: string };
  days: DayRow[];
}): string {
  const { report, currency, rate, filters, days } = args;
  const factor = currency === "ETB" ? rate : 1;
  const m = (usd: number | null) => (usd === null ? "" : (usd * factor).toFixed(2));
  const pct = (r: number | null) => (r === null ? "" : (r * 100).toFixed(1));
  const s = report.summary;

  const lines: string[] = [
    csvLine(["YeHagere profit & loss report"]),
    csvLine(["Generated", new Date(report.generatedAt).toLocaleString()]),
    csvLine(["Period", filters.period]),
    csvLine(["From", filters.from ? toDateInput(filters.from) : "Beginning"]),
    csvLine(["To", filters.to ? toDateInput(filters.to) : "Today"]),
    csvLine(["Category", filters.category]),
    csvLine(["Product", filters.product]),
    csvLine(["Order status", filters.status]),
    csvLine(["Currency", currency === "ETB" ? `ETB (at ${rate} per USD)` : "USD"]),
    "",
    csvLine(["Summary", `Amount (${currency})`]),
    csvLine(["Orders", s.orders]),
    csvLine(["Units sold", s.units]),
    csvLine(["Revenue", m(s.revenue)]),
    csvLine(["Cost of goods", m(s.cost)]),
    csvLine(["Gross profit", m(s.grossProfit)]),
    csvLine(["Gross margin %", pct(s.margin)]),
  ];
  if (s.shipping !== null) lines.push(csvLine(["Shipping charged", m(s.shipping)]));
  if (s.discounts !== null) lines.push(csvLine(["Discounts", m(s.discounts)]));
  lines.push(csvLine(["Net profit", m(s.netProfit)]));
  if (s.unitsMissingCost > 0) {
    lines.push(csvLine(["Units with no cost entered (counted as 0)", s.unitsMissingCost]));
  }

  lines.push(
    "",
    csvLine([
      "Product",
      "Category",
      "Units sold",
      `Revenue (${currency})`,
      `Cost (${currency})`,
      `Profit (${currency})`,
      "Margin %",
      `Average price (${currency})`,
      `Unit cost (${currency})`,
      "Units with no cost",
    ]),
    ...report.products.map((p) =>
      csvLine([
        p.title,
        p.category,
        p.units,
        m(p.revenue),
        m(p.cost),
        m(p.profit),
        pct(p.margin),
        m(p.avgPrice),
        m(p.avgCost),
        p.unitsMissingCost,
      ])
    ),
    "",
    csvLine(["Date", "Orders", "Units", `Revenue (${currency})`, `Cost (${currency})`, `Profit (${currency})`]),
    ...days.map((d) => csvLine([d.date, d.orders, d.units, m(d.revenue), m(d.cost), m(d.profit)]))
  );

  return lines.join("\r\n");
}

export function downloadText(filename: string, text: string) {
  // BOM so Excel opens the file as UTF-8 (Ethiopic names, the Br sign, etc.).
  const blob = new Blob(["﻿", text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
