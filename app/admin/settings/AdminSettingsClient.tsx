"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Truck,
  ShieldCheck,
  Tag,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Phone,
  Mail,
  MapPin,
  Clock,
  Database,
  Cloud,
  Server,
  RefreshCw,
} from "lucide-react";
import {
  StoreSettings,
  PromoCode,
  getStoreSettings,
  saveStoreSettings,
  DEFAULT_STORE_SETTINGS,
  validatePromoCode,
} from "../../lib/settings-store";

export default function AdminSettingsClient() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [activeTab, setActiveTab] = useState<"financial" | "shipping" | "promos" | "inventory" | "contact" | "cloud">("promos");
  const [savedToast, setSavedToast] = useState(false);

  // PostgreSQL & NestJS Database Status State
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{
    engine: string;
    backendConnected: boolean;
    postgresUsersCount: number;
    postgresOrdersCount: number;
    postgresProductsCount: number;
    isSeeded: boolean;
  } | null>(null);

  // New Promo Code Form State
  const [isAddPromoOpen, setIsAddPromoOpen] = useState(false);
  const [promoForm, setPromoForm] = useState<{
    code: string;
    discountType: "percentage" | "fixed_usd" | "fixed_etb";
    value: string;
    minSpendUSD: string;
    expiresAt: string;
    description: string;
  }>({
    code: "",
    discountType: "percentage",
    value: "15",
    minSpendUSD: "100",
    expiresAt: "2026-12-31",
    description: "",
  });

  // Simulator Sandbox State
  const [testCode, setTestCode] = useState("WELCOME10");
  const [testAmount, setTestAmount] = useState("250");
  const [simResult, setSimResult] = useState<ReturnType<typeof validatePromoCode> | null>(null);

  useEffect(() => {
    const handleStorage = () => {
      setSettings(getStoreSettings());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const fetchDbStatus = () => {
    fetch("/api/migrate")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.status) {
          setDbStatus(data.status);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    let active = true;
    if (activeTab === "cloud") {
      fetch("/api/migrate")
        .then((res) => res.json())
        .then((data) => {
          if (active && data.success && data.status) {
            setDbStatus(data.status);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [activeTab]);

  const handleTriggerMigration = async () => {
    setMigrationLoading(true);
    setMigrationMessage(null);
    try {
      const res = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedDefaults: true }),
      });
      const data = await res.json();
      if (data.success) {
        setMigrationMessage(`PostgreSQL synchronization verified: ${data.summary?.migratedProducts ?? 0} products and ${data.summary?.migratedUsers ?? 0} user accounts active.`);
        fetchDbStatus();
      } else {
        setMigrationMessage(data.error || "Database synchronization check failed.");
      }
    } catch {
      setMigrationMessage("Network error while connecting to database status endpoint.");
    } finally {
      setMigrationLoading(false);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveStoreSettings(settings);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleResetDefaults = () => {
    if (confirm("Reset all store rules, shipping thresholds, and settings back to factory defaults?")) {
      setSettings(DEFAULT_STORE_SETTINGS);
      saveStoreSettings(DEFAULT_STORE_SETTINGS);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
    }
  };

  // Promo Code Operations
  const handleTogglePromo = (id: string) => {
    const updatedPromos = settings.promoCodes.map((p) =>
      p.id === id ? { ...p, active: !p.active } : p
    );
    const updated = { ...settings, promoCodes: updatedPromos };
    setSettings(updated);
    saveStoreSettings(updated);
  };

  const handleDeletePromo = (id: string) => {
    if (!confirm("Are you sure you want to remove this promo code?")) return;
    const updatedPromos = settings.promoCodes.filter((p) => p.id !== id);
    const updated = { ...settings, promoCodes: updatedPromos };
    setSettings(updated);
    saveStoreSettings(updated);
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoForm.code.trim().toUpperCase();
    if (!cleanCode) return;

    const newPromo: PromoCode = {
      id: `promo_${Date.now()}`,
      code: cleanCode,
      discountType: promoForm.discountType,
      value: parseFloat(promoForm.value) || 10,
      minSpendUSD: parseFloat(promoForm.minSpendUSD) || 0,
      active: true,
      usageCount: 0,
      expiresAt: promoForm.expiresAt || "2026-12-31",
      description: promoForm.description.trim() || `${cleanCode} Atelier Privilege`,
    };

    const updated = {
      ...settings,
      promoCodes: [newPromo, ...settings.promoCodes],
    };
    setSettings(updated);
    saveStoreSettings(updated);
    setIsAddPromoOpen(false);
    setPromoForm({
      code: "",
      discountType: "percentage",
      value: "15",
      minSpendUSD: "100",
      expiresAt: "2026-12-31",
      description: "",
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleRunSimulator = () => {
    const amount = parseFloat(testAmount) || 0;
    const result = validatePromoCode(testCode, amount);
    setSimResult(result);
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] py-8 px-4 sm:px-8 space-y-8 max-w-[1520px] mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-neutral-500">
              Operations &amp; Governance
            </span>
            <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black text-white">
              Global Rules
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black">
            Atelier Settings &amp; Promotions Engine
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Configure currency exchange ratios, free shipping thresholds, logistics partners, boutique hours, and promotional discount codes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black border border-neutral-300 hover:bg-neutral-100 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            className="px-6 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
          >
            {savedToast ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Saved Successfully</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-neutral-200 overflow-x-auto gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none pb-px">
        <button
          onClick={() => setActiveTab("promos")}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap min-h-[44px] ${
            activeTab === "promos"
              ? "border-black text-black bg-white"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Promotions &amp; Coupons ({settings.promoCodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("financial")}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap min-h-[44px] ${
            activeTab === "financial"
              ? "border-black text-black bg-white"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Currency &amp; Exchange (1 USD = Br {settings.exchangeRateUSDToETB})</span>
        </button>

        <button
          onClick={() => setActiveTab("shipping")}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap min-h-[44px] ${
            activeTab === "shipping"
              ? "border-black text-black bg-white"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Shipping &amp; Logistics</span>
        </button>

        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap min-h-[44px] ${
            activeTab === "inventory"
              ? "border-black text-black bg-white"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Inventory &amp; Low-Stock Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab("contact")}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap min-h-[44px] ${
            activeTab === "contact"
              ? "border-black text-black bg-white"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Boutique &amp; Concierge Info</span>
        </button>

        <button
          onClick={() => setActiveTab("cloud")}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap min-h-[44px] ${
            activeTab === "cloud"
              ? "border-black text-black bg-white"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>PostgreSQL &amp; NestJS Sync</span>
        </button>
      </div>

      {/* TAB 1: PROMOTIONS & DISCOUNT CODES */}
      {activeTab === "promos" && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-neutral-200">
            <div>
              <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                Active Atelier Discount Codes
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Customers can enter these codes at checkout to receive instant deductions in USD and Ethiopian Birr.
              </p>
            </div>
            <button
              onClick={() => setIsAddPromoOpen(true)}
              className="px-4 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-neutral-800 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Promo Code</span>
            </button>
          </div>

          {/* Promo Table (Desktop) & Cards (Mobile) */}
          <div className="bg-white border border-neutral-200 overflow-hidden shadow-2xs">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f2f2f2] border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Coupon Code</th>
                    <th className="py-3 px-4">Discount Value</th>
                    <th className="py-3 px-4">Min. Spend</th>
                    <th className="py-3 px-4">Expires</th>
                    <th className="py-3 px-4">Redemptions</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {settings.promoCodes.map((promo) => (
                    <tr key={promo.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm tracking-wider px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-black">
                            {promo.code}
                          </span>
                          <span className="text-[11px] text-neutral-500 hidden sm:inline">
                            {promo.description}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-black">
                        {promo.discountType === "percentage" && `${promo.value}% OFF`}
                        {promo.discountType === "fixed_usd" && `$${promo.value} USD OFF`}
                        {promo.discountType === "fixed_etb" && `Br ${promo.value.toLocaleString()} ETB OFF`}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600">
                        {promo.minSpendUSD > 0 ? (
                          <span>${promo.minSpendUSD} USD (Br {(promo.minSpendUSD * settings.exchangeRateUSDToETB).toLocaleString()} ETB)</span>
                        ) : (
                          <span className="text-neutral-400">No minimum</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 font-mono">
                        {promo.expiresAt || "Perpetual"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-black">
                        {promo.usageCount} uses
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleTogglePromo(promo.id)}
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-xs transition-colors ${
                            promo.active
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                              : "bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200"
                          }`}
                        >
                          {promo.active ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeletePromo(promo.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors"
                          title="Delete promo code"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-neutral-200">
              {settings.promoCodes.map((promo) => (
                <div key={promo.id} className="p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm tracking-wider px-2.5 py-1 bg-neutral-100 border border-neutral-300 text-black">
                          {promo.code}
                        </span>
                        <button
                          onClick={() => handleTogglePromo(promo.id)}
                          className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-xs transition-colors ${
                            promo.active
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-neutral-100 text-neutral-600 border-neutral-300"
                          }`}
                        >
                          {promo.active ? "Active" : "Disabled"}
                        </button>
                      </div>
                      {promo.description && (
                        <p className="text-xs text-neutral-500 mt-1">
                          {promo.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeletePromo(promo.id)}
                      className="p-2 text-neutral-400 hover:text-rose-600 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Delete promo code"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-50 p-2.5 border border-neutral-100">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-neutral-400">Discount</span>
                      <span className="font-bold text-black">
                        {promo.discountType === "percentage" && `${promo.value}% OFF`}
                        {promo.discountType === "fixed_usd" && `$${promo.value} USD OFF`}
                        {promo.discountType === "fixed_etb" && `Br ${promo.value.toLocaleString()} ETB OFF`}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-neutral-400">Min. Spend</span>
                      <span className="text-neutral-700">
                        {promo.minSpendUSD > 0 ? `$${promo.minSpendUSD} USD` : "None"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-neutral-400">Redemptions</span>
                      <span className="font-semibold text-black">{promo.usageCount} uses</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-neutral-400">Expires</span>
                      <span className="text-neutral-600 font-mono text-[11px]">{promo.expiresAt || "Perpetual"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sandbox Validator Simulator */}
          <div className="bg-white border border-neutral-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-black">
                Promo Code Testing Sandbox
              </h3>
            </div>
            <p className="text-xs text-neutral-500">
              Verify your promo logic before announcing to clients. Calculate live discount deductions on a test order.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Promo Code
                </label>
                <input
                  type="text"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10"
                  className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-xs font-mono font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Sample Order Total ($ USD)
                </label>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleRunSimulator}
                  className="w-full py-2 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
                >
                  Test Deduction
                </button>
              </div>
            </div>

            {simResult && (
              <div
                className={`p-4 border text-xs ${
                  simResult.valid
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : "bg-rose-50 border-rose-300 text-rose-900"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>{simResult.message}</span>
                  {simResult.valid && (
                    <span className="text-sm font-extrabold">
                      -${simResult.discountUSD} USD / -Br {simResult.discountETB.toLocaleString()} ETB
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FINANCIAL & EXCHANGE RATE */}
      {activeTab === "financial" && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-neutral-200 space-y-6">
            <div>
              <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Currency Ratios &amp; Tax Governance
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                YeHageré operates primarily in Ethiopian Birr (ETB) and US Dollars (USD). Set the official atelier exchange conversion rate.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-neutral-100">
              {/* USD to ETB Ratio */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  USD to ETB Conversion Rate
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-500">$1 USD =</span>
                  <input
                    type="number"
                    step="0.5"
                    value={settings.exchangeRateUSDToETB}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        exchangeRateUSDToETB: parseFloat(e.target.value) || 125,
                      })
                    }
                    className="w-32 px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-sm font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <span className="text-xs font-bold text-neutral-700">ETB</span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Example: A $210 garment converts to Br {(210 * settings.exchangeRateUSDToETB).toLocaleString()} ETB.
                </p>
              </div>

              {/* Primary Display Currency */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  Storefront Primary Currency
                </label>
                <select
                  value={settings.primaryCurrency}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      primaryCurrency: e.target.value as "ETB" | "USD",
                    })
                  }
                  className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="ETB">Ethiopian Birr (Br / ETB) - Default for Addis Ababa</option>
                  <option value="USD">United States Dollar ($ / USD) - International</option>
                </select>
                <p className="text-[11px] text-neutral-500">
                  Controls default price presentation throughout lookbooks and catalog.
                </p>
              </div>

              {/* Value Added Tax */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  VAT / Sales Tax Rate (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.taxRatePercent}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        taxRatePercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-sm font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <span className="text-xs font-bold text-neutral-700">% VAT</span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Standard 15% Ethiopian VAT included in catalog retail pricing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SHIPPING & LOGISTICS */}
      {activeTab === "shipping" && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-neutral-200 space-y-6">
            <div>
              <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                Shipping Rules &amp; Free Delivery Thresholds
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Manage complimentary shipping qualifications for domestic orders and global DHL Express shipments.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-100">
              {/* Free shipping USD */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  Free Shipping Minimum ($ USD)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-500">$</span>
                  <input
                    type="number"
                    value={settings.freeShippingThresholdUSD}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setSettings({
                        ...settings,
                        freeShippingThresholdUSD: val,
                        freeShippingThresholdETB: val * settings.exchangeRateUSDToETB,
                      });
                    }}
                    className="w-32 px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-sm font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <span className="text-xs text-neutral-500">
                    ≈ Br {settings.freeShippingThresholdETB.toLocaleString()} ETB
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Orders exceeding this amount receive complimentary door-to-door courier dispatch.
                </p>
              </div>

              {/* Default Carrier */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  Default Courier / Logistics Partner
                </label>
                <select
                  value={settings.defaultCarrier}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultCarrier: e.target.value as StoreSettings["defaultCarrier"],
                    })
                  }
                  className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="DHL Express">DHL Express Worldwide (Air Freight)</option>
                  <option value="FedEx">FedEx International Priority</option>
                  <option value="Atelier Courier">YeHageré In-House Addis Courier</option>
                  <option value="Ethiopian Post">Ethiopian Postal Service (EMS)</option>
                </select>
              </div>

              {/* Domestic Shipping Fee */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  Domestic Courier Flat Rate (Addis Ababa / Regional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.domesticShippingETB}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        domesticShippingETB: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-32 px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-sm font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <span className="text-xs font-bold text-neutral-700">ETB</span>
                </div>
              </div>

              {/* International Shipping Fee */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  International DHL Flat Rate ($ USD)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-500">$</span>
                  <input
                    type="number"
                    value={settings.internationalShippingUSD}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        internationalShippingUSD: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-32 px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-sm font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <span className="text-xs font-bold text-neutral-700">USD</span>
                </div>
              </div>

              {/* Dispatch Lead Time */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  Fulfillment &amp; Dispatch Turnaround Time
                </label>
                <input
                  type="text"
                  value={settings.dispatchLeadTime}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      dispatchLeadTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INVENTORY & LOW STOCK RULES */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-neutral-200 space-y-6">
            <div>
              <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                Inventory Policies &amp; Stock Alarms
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Configure threshold alerts for handcrafted pieces and control backorder behavior.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-100">
              {/* Low stock threshold */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  Low-Stock Warning Threshold (units)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.lowStockThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        lowStockThreshold: parseInt(e.target.value) || 5,
                      })
                    }
                    className="w-28 px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-sm font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <span className="text-xs text-neutral-600">units per SKU</span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Products with stock lower than this quantity are flagged with warning badges in the catalog table.
                </p>
              </div>

              {/* Allow backorders */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  Out-of-Stock Purchasing (Backorders)
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="allowBackorders"
                    checked={settings.allowBackorders}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        allowBackorders: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-black border-neutral-300 rounded focus:ring-black"
                  />
                  <label htmlFor="allowBackorders" className="text-xs font-semibold text-neutral-800 cursor-pointer">
                    Allow patrons to backorder made-to-measure pieces when inventory hits 0
                  </label>
                </div>
              </div>

              {/* Order Auto Confirm */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="autoConfirm"
                    checked={settings.orderAutoConfirm}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        orderAutoConfirm: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-black border-neutral-300 rounded focus:ring-black"
                  />
                  <label htmlFor="autoConfirm" className="text-xs font-semibold text-neutral-800 cursor-pointer">
                    Automatically confirm and transition web checkout orders into &quot;preparing&quot; status
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BOUTIQUE & CONCIERGE INFO */}
      {activeTab === "contact" && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-neutral-200 space-y-6">
            <div>
              <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                Atelier Showroom &amp; Concierge Contacts
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Official contact details displayed on customer order receipts, packing slips, and footer pages.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-100">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
                  Support &amp; Concierge Email
                </label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      supportEmail: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-500" />
                  Boutique Telephone / Mobile
                </label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      supportPhone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                  Flagship Boutique Physical Address
                </label>
                <input
                  type="text"
                  value={settings.atelierAddress}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      atelierAddress: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  Boutique Operating Hours
                </label>
                <input
                  type="text"
                  value={settings.boutiqueHours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      boutiqueHours: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  VIP Concierge Handle (Telegram/WhatsApp)
                </label>
                <input
                  type="text"
                  value={settings.conciergeContact}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      conciergeContact: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: POSTGRESQL & NESTJS DATABASE */}
      {activeTab === "cloud" && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-neutral-200">
            <div>
              <h2 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>PostgreSQL &amp; NestJS Database Architecture</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Decoupled backend powered by NestJS, TypeORM, and PostgreSQL — ready for deployment on cPanel with pgMyAdmin.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={fetchDbStatus}
                className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check Status</span>
              </button>
              <button
                type="button"
                disabled={migrationLoading}
                onClick={handleTriggerMigration}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span>{migrationLoading ? "Verifying..." : "Verify PostgreSQL Status"}</span>
              </button>
            </div>
          </div>

          {migrationMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
              <span>{migrationMessage}</span>
              <button
                type="button"
                onClick={() => setMigrationMessage(null)}
                className="text-emerald-600 hover:text-emerald-900 font-bold ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 border border-neutral-200 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">
                Database Engine
              </span>
              <div className="text-sm font-extrabold text-black flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                {dbStatus ? dbStatus.engine : "PostgreSQL (cPanel pgMyAdmin)"}
              </div>
              <p className="text-[10px] text-neutral-500 truncate font-mono">
                TypeORM / PostgreSQL 14+
              </p>
            </div>

            <div className="bg-white p-5 border border-neutral-200 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">
                PostgreSQL User Accounts
              </span>
              <div className="text-2xl font-black text-black">
                {dbStatus ? dbStatus.postgresUsersCount : "..."}
              </div>
              <p className="text-[10px] text-neutral-500">
                Encrypted patron &amp; admin profiles
              </p>
            </div>

            <div className="bg-white p-5 border border-neutral-200 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">
                PostgreSQL Patron Orders
              </span>
              <div className="text-2xl font-black text-black">
                {dbStatus ? dbStatus.postgresOrdersCount : "..."}
              </div>
              <p className="text-[10px] text-neutral-500">
                Stripe &amp; Telebirr live transactions
              </p>
            </div>

            <div className="bg-white p-5 border border-neutral-200 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">
                Catalog Products
              </span>
              <div className="text-2xl font-black text-black">
                {dbStatus ? dbStatus.postgresProductsCount : "..."}
              </div>
              <p className="text-[10px] text-neutral-500">
                Active luxury catalog items
              </p>
            </div>
          </div>

          {/* Architecture Details */}
          <div className="bg-white p-6 border border-neutral-200 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Decoupled Production Architecture (NextJS + NestJS on cPanel)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[#fafafa] border border-neutral-200 space-y-2">
                <div className="font-bold text-black flex items-center gap-2">
                  <Server className="w-4 h-4 text-neutral-700" />
                  <span>NestJS REST API</span>
                </div>
                <p className="text-neutral-600 text-[11px] leading-relaxed">
                  Decoupled backend in /backend built with NestJS, Fastify/Express, Passport JWT authentication, Class-Validator, and Swagger documentation at /api/docs.
                </p>
              </div>

              <div className="p-4 bg-[#fafafa] border border-neutral-200 space-y-2">
                <div className="font-bold text-black flex items-center gap-2">
                  <Database className="w-4 h-4 text-neutral-700" />
                  <span>PostgreSQL &amp; TypeORM</span>
                </div>
                <p className="text-neutral-600 text-[11px] leading-relaxed">
                  PostgreSQL database managed in cPanel via pgMyAdmin / phpPgAdmin. Data is modeled with TypeORM entities, relations, indices, and auto-migrations.
                </p>
              </div>

              <div className="p-4 bg-[#fafafa] border border-neutral-200 space-y-2">
                <div className="font-bold text-black flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-700" />
                  <span>cPanel Deployment Ready</span>
                </div>
                <p className="text-neutral-600 text-[11px] leading-relaxed">
                  Easily deployed using cPanel &quot;Setup Node.js App&quot; (Phusion Passenger) for both the frontend (Next.js) and backend (NestJS dist/main.js).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PROMO CODE MODAL */}
      {isAddPromoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white max-w-lg w-full p-4 sm:p-6 border border-neutral-300 shadow-xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                Create New Promotional Coupon
              </h3>
              <button
                onClick={() => setIsAddPromoOpen(false)}
                className="text-neutral-400 hover:text-black text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Coupon Code (e.g. FLASH25)
                </label>
                <input
                  type="text"
                  required
                  value={promoForm.code}
                  onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  placeholder="CODE"
                  className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-xs font-mono font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Discount Type
                  </label>
                  <select
                    value={promoForm.discountType}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        discountType: e.target.value as PromoCode["discountType"],
                      })
                    }
                    className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="percentage">Percentage (% Off)</option>
                    <option value="fixed_usd">Fixed USD ($ Off)</option>
                    <option value="fixed_etb">Fixed ETB (Br Off)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Value Amount
                  </label>
                  <input
                    type="number"
                    required
                    value={promoForm.value}
                    onChange={(e) => setPromoForm({ ...promoForm, value: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Min. Spend ($ USD)
                  </label>
                  <input
                    type="number"
                    value={promoForm.minSpendUSD}
                    onChange={(e) => setPromoForm({ ...promoForm, minSpendUSD: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={promoForm.expiresAt}
                    onChange={(e) => setPromoForm({ ...promoForm, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Description / Patron Note
                </label>
                <input
                  type="text"
                  value={promoForm.description}
                  onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  placeholder="e.g. 15% off seasonal lookbook"
                  className="w-full px-3 py-2 bg-[#f4f4f4] border border-neutral-300 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsAddPromoOpen(false)}
                  className="px-4 py-2.5 border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 text-center shadow-2xs"
                >
                  Save &amp; Activate Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
