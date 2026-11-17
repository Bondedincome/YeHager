import { buildProfitReport, ReportOrder, ReportProduct } from './profit-report';

const products: ReportProduct[] = [
  { id: 'p-shirt', title: 'Shirt', categoryName: 'tops', costPrice: '40.00' },
  { id: 'p-jeans', title: 'Jeans', categoryName: 'denim', costPrice: null },
];

const order = (
  createdAt: string,
  items: ReportOrder['itemsData'],
  shippingFee = 0,
  discount = 0,
): ReportOrder => ({
  createdAt: new Date(createdAt),
  shippingFee,
  discount,
  itemsData: items,
});

describe('buildProfitReport', () => {
  it('works out revenue, cost and profit per product', () => {
    const report = buildProfitReport(
      [
        order('2026-11-01T10:00:00Z', [
          { id: 'p-shirt', price: '100.00', quantity: 2 },
        ]),
      ],
      products,
    );
    expect(report.products).toEqual([
      expect.objectContaining({
        productId: 'p-shirt',
        units: 2,
        revenue: 200,
        cost: 80,
        profit: 120,
        margin: 0.6,
        avgCost: 40,
      }),
    ]);
    expect(report.summary).toEqual(
      expect.objectContaining({
        orders: 1,
        revenue: 200,
        cost: 80,
        grossProfit: 120,
      }),
    );
  });

  it('uses the cost recorded on the order over the current product cost', () => {
    const report = buildProfitReport(
      [
        order('2026-11-01T10:00:00Z', [
          { id: 'p-shirt', price: 100, quantity: 1, cost: 55 },
        ]),
      ],
      products,
    );
    expect(report.products[0].cost).toBe(55);
  });

  it('flags units with no cost instead of guessing', () => {
    const report = buildProfitReport(
      [
        order('2026-11-01T10:00:00Z', [
          { id: 'p-jeans', price: 90, quantity: 3 },
        ]),
      ],
      products,
    );
    expect(report.products[0]).toEqual(
      expect.objectContaining({ cost: 0, unitsMissingCost: 3, avgCost: null }),
    );
    expect(report.summary.unitsMissingCost).toBe(3);
  });

  it('shows a loss when an item sells below cost', () => {
    const report = buildProfitReport(
      [
        order('2026-11-01T10:00:00Z', [
          { id: 'p-shirt', price: 30, quantity: 1 },
        ]),
      ],
      products,
    );
    expect(report.products[0].profit).toBe(-10);
    expect(report.summary.margin).toBeCloseTo(-0.3333, 4);
  });

  it('adds shipping and subtracts discounts for the whole shop only', () => {
    const orders = [
      order(
        '2026-11-01T10:00:00Z',
        [
          { id: 'p-shirt', price: 100, quantity: 1 },
          { id: 'p-jeans', price: 90, quantity: 1 },
        ],
        25,
        10,
      ),
    ];
    const all = buildProfitReport(orders, products);
    expect(all.summary).toEqual(
      expect.objectContaining({
        shipping: 25,
        discounts: 10,
        grossProfit: 150,
        netProfit: 165,
      }),
    );

    const tops = buildProfitReport(orders, products, { category: 'TOPS' });
    expect(tops.products.map((p) => p.productId)).toEqual(['p-shirt']);
    expect(tops.summary).toEqual(
      expect.objectContaining({
        revenue: 100,
        shipping: null,
        discounts: null,
        netProfit: 60,
      }),
    );
  });

  it('filters to a single product', () => {
    const report = buildProfitReport(
      [
        order('2026-11-01T10:00:00Z', [
          { id: 'p-shirt', price: 100, quantity: 1 },
          { id: 'p-jeans', price: 90, quantity: 1 },
        ]),
      ],
      products,
      { productId: 'p-jeans' },
    );
    expect(report.summary).toEqual(
      expect.objectContaining({ orders: 1, units: 1, revenue: 90 }),
    );
  });

  it('groups sales by local day using the timezone offset', () => {
    // 22:30 UTC on the 1st is 01:30 on the 2nd in Addis Ababa (UTC+3).
    const orders = [
      order('2026-11-01T22:30:00Z', [
        { id: 'p-shirt', price: 100, quantity: 1 },
      ]),
    ];
    expect(buildProfitReport(orders, products).daily[0].date).toBe(
      '2026-11-01',
    );
    expect(
      buildProfitReport(orders, products, { tzOffset: -180 }).daily[0].date,
    ).toBe('2026-11-02');
  });

  it('keeps items for products that no longer exist', () => {
    const report = buildProfitReport(
      [
        order('2026-11-01T10:00:00Z', [
          { id: 7, title: 'Old item', price: 20, quantity: 1 },
        ]),
      ],
      products,
    );
    expect(report.products[0]).toEqual(
      expect.objectContaining({ title: 'Old item', unitsMissingCost: 1 }),
    );
  });
});
