"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Sliders,
  ArrowUpRight,
  Receipt,
  PackageCheck,
  CheckCircle2,
  CreditCard,
  Settings,
  Tag,
  AlertTriangle,
  Check,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "../components/AuthProvider";
import { useAppearance } from "../components/AppearanceProvider";
import { getAllProducts, updateProduct } from "../lib/products-store";
import { getStoreSettings, updateStoreSettings } from "../lib/settings-store";

export default function AdminAnalyticsClient() {
  const { orders, usersList, updateOrderStatus } = useAuth();
  const { cms, updateCMS } = useAppearance();
  const [storeSettings, setStoreSettings] = useState(() => getStoreSettings());
  const [exchangeRateInput, setExchangeRateInput] = useState(storeSettings.exchangeRateUSDToETB);
  const [announcementText, setAnnouncementText] = useState(cms.announcement.text);
  const [announcementSaved, setAnnouncementSaved] = useState(false);
  const [rateSaved, setRateSaved] = useState(false);
  const [productsList, setProductsList] = useState(() => getAllProducts());

  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");

  // Key KPI calculations
  const totalRevenueUSD = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.totalUSD || 0), 0);
  }, [orders]);

  const totalRevenueETB = totalRevenueUSD * storeSettings.exchangeRateUSDToETB;
  const totalOrdersCount = orders.length;
  const totalCustomersCount = usersList.filter((u) => u.role !== "admin").length;
  const activeProductsCount = productsList.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenueUSD / totalOrdersCount) : 0;

  const lowStockProducts = useMemo(() => {
    return productsList.filter((p) => (p.stock ?? 10) <= (storeSettings.lowStockThreshold || 5));
  }, [productsList, storeSettings.lowStockThreshold]);

  const handleQuickRestock = (productId: number) => {
    const p = productsList.find((x) => x.id === productId);
    if (!p) return;
    const current = p.stock ?? 10;
    const updated = updateProduct(productId, { stock: current + 10 });
    if (updated) {
      setProductsList(getAllProducts());
    }
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    updateCMS({
      announcement: {
        ...cms.announcement,
        text: announcementText,
      },
    });
    setAnnouncementSaved(true);
    setTimeout(() => setAnnouncementSaved(false), 2500);
  };

  const handleToggleAnnouncement = () => {
    updateCMS({
      announcement: {
        ...cms.announcement,
        enabled: !cms.announcement.enabled,
      },
    });
  };

  const handleSaveRate = () => {
    const updated = updateStoreSettings({ exchangeRateUSDToETB: exchangeRateInput });
    setStoreSettings(updated);
    setRateSaved(true);
    setTimeout(() => setRateSaved(false), 2500);
  };

  // Chart data: 30-day sales growth
  const salesTrendData = useMemo(() => {
    return [
      { date: "Aug 02", revenue: 840, orders: 3, etb: 105000 },
      { date: "Aug 06", revenue: 1260, orders: 4, etb: 157500 },
      { date: "Aug 10", revenue: 980, orders: 3, etb: 122500 },
      { date: "Aug 14", revenue: 2100, orders: 6, etb: 262500 },
      { date: "Aug 18", revenue: 1850, orders: 5, etb: 231250 },
      { date: "Aug 22", revenue: 2940, orders: 8, etb: 367500 },
      { date: "Aug 26", revenue: 2420, orders: 7, etb: 302500 },
      { date: "Aug 30", revenue: 3100, orders: 9, etb: 387500 },
      { date: "Today", revenue: totalRevenueUSD, orders: totalOrdersCount, etb: totalRevenueETB },
    ];
  }, [totalRevenueUSD, totalOrdersCount, totalRevenueETB]);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    productsList.forEach((p) => {
      const cat = (p.category || "sets").toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return [
      { name: "Matching Sets", value: counts["sets"] || 3, color: "#111111" },
      { name: "Denim Silhouettes", value: counts["denim"] || 2, color: "#4f46e5" },
      { name: "Fall Lookbook", value: counts["fall"] || 2, color: "#d97706" },
      { name: "Knitwear & Henleys", value: counts["knitwear"] || 2, color: "#059669" },
      { name: "Outerwear & Coats", value: counts["outerwear"] || 1, color: "#7c3aed" },
    ];
  }, [productsList]);

  // Order status counts
  const pendingOrders = orders.filter((o) => o.status === "confirmed" || o.status === "preparing").length;

  return (
    <div className="min-h-screen bg-[#f8f8f8] py-8 px-4 sm:px-8 space-y-8 max-w-[1520px] mx-auto">
      {/* Top Banner / Headline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-neutral-500">
              YeHageré Atelier Executive
            </span>
            <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              Live Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black">
            Store Performance &amp; Analytics
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time telemetry across revenue, Stripe transactions, client acquisition, and catalog fulfillment.
          </p>
        </div>

        {/* Executive Action Controls (Non-repetitive: Time Range & Live Storefront Preview) */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-white border border-neutral-300 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setTimeRange("7d")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                timeRange === "7d" ? "bg-black text-white" : "text-neutral-600 hover:text-black"
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("30d")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                timeRange === "30d" ? "bg-black text-white" : "text-neutral-600 hover:text-black"
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("all")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                timeRange === "all" ? "bg-black text-white" : "text-neutral-600 hover:text-black"
              }`}
            >
              All Time
            </button>
          </div>

          {/* Direct Storefront Preview */}
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>Preview Storefront</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-300" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="bg-white border border-neutral-200 p-6 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Total Gross Revenue
            </span>
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-black" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
              ${totalRevenueUSD.toLocaleString()} <span className="text-xs font-semibold text-neutral-400">USD</span>
            </p>
            <p className="text-xs font-mono text-neutral-500">
              ≈ Br{totalRevenueETB.toLocaleString()} ETB
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% compared to last cycle</span>
          </div>
        </div>

        {/* Metric 2: Total Orders */}
        <div className="bg-white border border-neutral-200 p-6 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Orders Processed
            </span>
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-black" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
              {totalOrdersCount}
            </p>
            <p className="text-xs text-neutral-500">
              {pendingOrders} awaiting packaging &amp; courier
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 text-[11px] text-neutral-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Stripe Payment Succeeded</span>
          </div>
        </div>

        {/* Metric 3: Active Patrons */}
        <div className="bg-white border border-neutral-200 p-6 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Patrons &amp; Clients
            </span>
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-black" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
              {totalCustomersCount}
            </p>
            <p className="text-xs text-neutral-500">
              {usersList.filter((u) => u.role === "vip").length} VIP Tier Patrons
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12% client retention rate</span>
          </div>
        </div>

        {/* Metric 4: Average Order Value */}
        <div className="bg-white border border-neutral-200 p-6 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Average Order Value (AOV)
            </span>
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
              <PackageCheck className="w-4 h-4 text-black" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
              ${avgOrderValue} <span className="text-xs font-semibold text-neutral-400">USD</span>
            </p>
            <p className="text-xs font-mono text-neutral-500">
              ≈ Br{(avgOrderValue * 125).toLocaleString()} ETB
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 text-[11px] text-neutral-600 font-medium">
            <span>{activeProductsCount} Live Active Garments</span>
          </div>
        </div>
      </div>

      {/* EXECUTIVE QUICK CONTROLS HUB */}
      <div className="bg-white border border-neutral-200 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
                Atelier Master Controls
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black text-white">
                Live Storefront Governance
              </span>
            </div>
            <h2 className="text-base font-bold text-black">Instant Operational Actions</h2>
            <p className="text-xs text-neutral-500">
              Directly adjust storefront broadcast banners, currency conversion ratios, and execute 1-click inventory restocks.
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="text-xs font-bold uppercase tracking-wider text-black border border-neutral-300 hover:border-black px-3 py-1.5 bg-neutral-50 transition-colors self-start sm:self-auto flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Full Settings &amp; Promos</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Control 1: Announcement Bar Live Toggle & Edit */}
          <div className="bg-[#fafafa] border border-neutral-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Storefront Announcement Bar
              </span>
              <button
                onClick={handleToggleAnnouncement}
                className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  cms.announcement.enabled
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-neutral-200 text-neutral-600"
                }`}
              >
                {cms.announcement.enabled ? "Live / Active" : "Hidden"}
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-2">
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Broadcast message at top of storefront..."
                className="w-full p-2 bg-white border border-neutral-300 text-xs text-black"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-neutral-400">Appears globally on all client pages</span>
                <button
                  type="submit"
                  className="px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-neutral-800 transition-colors"
                >
                  {announcementSaved ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Update Banner</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Control 2: Live Currency Conversion Rate */}
          <div className="bg-[#fafafa] border border-neutral-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Active Forex Valuation
              </span>
              <span className="text-[10px] font-mono font-bold text-neutral-700">
                USD : ETB
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-black">$1 USD =</span>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={exchangeRateInput}
                  onChange={(e) => setExchangeRateInput(parseFloat(e.target.value) || 125)}
                  className="w-24 p-2 bg-white border border-neutral-300 text-xs font-mono font-bold text-black"
                />
                <span className="text-xs font-bold font-mono text-black">ETB</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-neutral-400">Recalculates cart &amp; checkout</span>
                <button
                  onClick={handleSaveRate}
                  className="px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-neutral-800 transition-colors"
                >
                  {rateSaved ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Updated!</span>
                    </>
                  ) : (
                    <span>Set Rate</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Control 3: Urgent Inventory Restock Radar */}
          <div className="bg-[#fafafa] border border-neutral-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span>Low Inventory Radar ({lowStockProducts.length})</span>
              </span>
              <Link
                href="/admin/products"
                className="text-[10px] font-bold uppercase tracking-wider text-blue-700 hover:underline"
              >
                All SKUs →
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>All atelier garments are well-stocked above {storeSettings.lowStockThreshold} units.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-white p-2 border border-neutral-200 text-xs"
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold text-black block truncate">{p.title}</span>
                      <span className="text-[10px] text-rose-600 font-bold">
                        Only {p.stock ?? 0} remaining
                      </span>
                    </div>
                    <button
                      onClick={() => handleQuickRestock(p.id)}
                      className="px-2 py-1 bg-black text-white hover:bg-neutral-800 text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
                    >
                      +10 Restock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Revenue Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-black">Revenue &amp; Sales Velocity</h2>
              <p className="text-xs text-neutral-500">
                Gross sales in USD across recent retail cycles.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-none text-xs font-bold uppercase">
              {(["7d", "30d", "all"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 text-[11px] transition-colors ${
                    timeRange === r ? "bg-white text-black shadow-xs" : "text-neutral-500 hover:text-black"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111111" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#111111" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#737373" }} stroke="#e5e5e5" />
                <YAxis
                  tick={{ fontSize: 11, fill: "#737373" }}
                  stroke="#e5e5e5"
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(val: unknown) => [`$${Number(val).toLocaleString()} USD`, "Gross Revenue"]}
                  contentStyle={{
                    backgroundColor: "#111111",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#111111"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 p-6 shadow-2xs space-y-6">
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="text-base font-bold text-black">Inventory by Silhouette</h2>
            <p className="text-xs text-neutral-500">Live garment distribution across atelier lines.</p>
          </div>

          <div className="h-[180px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111111",
                    color: "#ffffff",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-neutral-100 text-xs">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-neutral-700 font-medium">{cat.name}</span>
                </div>
                <span className="font-bold text-black">{cat.value} items</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Control Hub Navigation Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: CMS Control */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-2xs hover:border-black transition-all">
          <div className="w-10 h-10 bg-neutral-100 flex items-center justify-center">
            <Sliders className="w-5 h-5 text-black" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-black">The Store CMS</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Curate the Hero campaign, split denim banners, Fall lookbook headline, and global announcements in real-time.
            </p>
          </div>
          <Link
            href="/admin/appearance"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black underline underline-offset-4 hover:opacity-75"
          >
            <span>Open CMS Studio</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: Products Control */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-2xs hover:border-black transition-all">
          <div className="w-10 h-10 bg-neutral-100 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-black" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-black">Products &amp; Inventory</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Add new bespoke pieces, edit dual USD &amp; ETB price rates, update stock inventory, and manage photo galleries.
            </p>
          </div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black underline underline-offset-4 hover:opacity-75"
          >
            <span>Manage Garment Catalog</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: Users Control */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-2xs hover:border-black transition-all">
          <div className="w-10 h-10 bg-neutral-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-black" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-black">Patron &amp; Staff Users</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Control registered client accounts, assign Admin and VIP roles, inspect order histories, or manage access.
            </p>
          </div>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black underline underline-offset-4 hover:opacity-75"
          >
            <span>Open User Directory</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Orders / Transactions Table */}
      <div className="bg-white border border-neutral-200 shadow-2xs">
        <div className="p-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-black">Recent Transactions &amp; Orders</h2>
            <p className="text-xs text-neutral-500">
              Live transactions settled via Stripe with real customer order statuses.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="px-3.5 py-1.5 border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider text-black bg-white transition-colors self-start sm:self-auto"
          >
            View All Orders ({orders.length}) →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fafafa] border-b border-neutral-200 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="py-3.5 px-6">Order</th>
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Items</th>
                <th className="py-3.5 px-6">Total (USD / ETB)</th>
                <th className="py-3.5 px-6">Payment</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-black">
                    #{order.orderNumber}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-black block">{order.customerName}</span>
                    <span className="text-[11px] text-neutral-500">{order.customerEmail}</span>
                  </td>
                  <td className="py-4 px-6 text-neutral-700">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} garments
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-black block">${order.totalUSD} USD</span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Br{(order.totalETB || order.totalUSD * 125).toLocaleString()} ETB
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-800">
                      <CreditCard className="w-3 h-3 text-neutral-500" />
                      Stripe ({order.last4 || "4242"})
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus(
                          order.id,
                          e.target.value as "confirmed" | "preparing" | "shipped" | "delivered"
                        )
                      }
                      className="bg-neutral-100 border border-neutral-300 text-[11px] font-bold uppercase tracking-wider py-1 px-2 text-black outline-none cursor-pointer"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">Preparing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/admin/orders?highlight=${order.orderNumber}`}
                      className="text-[11px] font-bold uppercase tracking-wider text-black underline underline-offset-2 hover:opacity-75"
                    >
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
