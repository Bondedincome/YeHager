/**
 * Pure profit & loss maths, kept separate from the database so it is easy to test.
 * All money is in USD (the currency orders are charged in).
 */

export type ReportOrder = {
  createdAt: Date;
  shippingFee: number | string | null;
  discount: number | string | null;
  itemsData: Array<{
    id?: number | string;
    title?: string;
    price?: number | string;
    quantity?: number | string;
    cost?: number | string | null;
  }> | null;
};

export type ReportProduct = {
  id: string;
  title: string;
  categoryName: string | null;
  costPrice: number | string | null;
};

export type ReportFilters = {
  category?: string;
  productId?: string;
  /** Minutes, as JS Date#getTimezoneOffset returns (UTC+3 → -180). */
  tzOffset?: number;
};

export type ProductRow = {
  productId: string;
  title: string;
  category: string;
  units: number;
  revenue: number;
  cost: number;
  profit: number;
  /** profit / revenue, or null when there was no revenue. */
  margin: number | null;
  avgPrice: number;
  avgCost: number | null;
  /** Units sold for which no cost was recorded (their cost counts as 0). */
  unitsMissingCost: number;
};

export type DayRow = {
  date: string;
  orders: number;
  units: number;
  revenue: number;
  cost: number;
  profit: number;
};

export type ProfitReport = {
  summary: {
    orders: number;
    units: number;
    revenue: number;
    cost: number;
    grossProfit: number;
    margin: number | null;
    /** Order-level amounts only make sense for the whole shop, so they are null when filtering by product/category. */
    shipping: number | null;
    discounts: number | null;
    netProfit: number;
    unitsMissingCost: number;
  };
  products: ProductRow[];
  daily: DayRow[];
};

const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const money = (value: number) => Math.round(value * 100) / 100;

const ratio = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 10000) / 10000 : null;

function localDay(date: Date, tzOffset = 0): string {
  return new Date(date.getTime() - tzOffset * 60_000)
    .toISOString()
    .slice(0, 10);
}

export function buildProfitReport(
  orders: ReportOrder[],
  products: ReportProduct[],
  filters: ReportFilters = {},
): ProfitReport {
  const productById = new Map(products.map((p) => [p.id, p]));
  const category = filters.category?.trim().toLowerCase();
  const itemFiltered = Boolean(category || filters.productId);

  const rows = new Map<string, ProductRow>();
  const days = new Map<string, DayRow>();
  let orderCount = 0;
  let shipping = 0;
  let discounts = 0;

  for (const order of orders) {
    let orderCounted = false;
    const day = localDay(new Date(order.createdAt), filters.tzOffset);

    for (const item of order.itemsData ?? []) {
      const id =
        item.id === undefined || item.id === null ? '' : String(item.id);
      const product = productById.get(id);
      const itemCategory = (product?.categoryName ?? '').toLowerCase();

      if (filters.productId && id !== filters.productId) continue;
      if (category && itemCategory !== category) continue;

      const units = num(item.quantity);
      if (units <= 0) continue;

      const price = num(item.price);
      // Prefer the cost recorded on the order; fall back to the product's current cost.
      const recorded = item.cost ?? product?.costPrice;
      const hasCost =
        recorded !== null && recorded !== undefined && recorded !== '';
      const unitCost = hasCost ? num(recorded) : 0;

      const key = id || `title:${item.title ?? 'Unknown item'}`;
      const row =
        rows.get(key) ??
        ({
          productId: id,
          title: product?.title || item.title || 'Unknown item',
          category: product?.categoryName ?? '',
          units: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          margin: null,
          avgPrice: 0,
          avgCost: null,
          unitsMissingCost: 0,
        } satisfies ProductRow);

      row.units += units;
      row.revenue += price * units;
      row.cost += unitCost * units;
      if (!hasCost) row.unitsMissingCost += units;
      rows.set(key, row);

      const dayRow = days.get(day) ?? {
        date: day,
        orders: 0,
        units: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      };
      dayRow.units += units;
      dayRow.revenue += price * units;
      dayRow.cost += unitCost * units;
      if (!orderCounted) dayRow.orders += 1;
      days.set(day, dayRow);

      orderCounted = true;
    }

    if (orderCounted) {
      orderCount += 1;
      shipping += num(order.shippingFee);
      discounts += num(order.discount);
    }
  }

  const productRows = [...rows.values()]
    .map((row) => {
      const costedUnits = row.units - row.unitsMissingCost;
      return {
        ...row,
        revenue: money(row.revenue),
        cost: money(row.cost),
        profit: money(row.revenue - row.cost),
        margin: ratio(row.revenue - row.cost, row.revenue),
        avgPrice: money(row.units ? row.revenue / row.units : 0),
        avgCost: costedUnits > 0 ? money(row.cost / costedUnits) : null,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const daily = [...days.values()]
    .map((d) => ({
      ...d,
      revenue: money(d.revenue),
      cost: money(d.cost),
      profit: money(d.revenue - d.cost),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const revenue = productRows.reduce((s, r) => s + r.revenue, 0);
  const cost = productRows.reduce((s, r) => s + r.cost, 0);
  const grossProfit = revenue - cost;

  return {
    summary: {
      orders: orderCount,
      units: productRows.reduce((s, r) => s + r.units, 0),
      revenue: money(revenue),
      cost: money(cost),
      grossProfit: money(grossProfit),
      margin: ratio(grossProfit, revenue),
      shipping: itemFiltered ? null : money(shipping),
      discounts: itemFiltered ? null : money(discounts),
      netProfit: money(
        itemFiltered ? grossProfit : grossProfit + shipping - discounts,
      ),
      unitsMissingCost: productRows.reduce((s, r) => s + r.unitsMissingCost, 0),
    },
    products: productRows,
    daily,
  };
}
