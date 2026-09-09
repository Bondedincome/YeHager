"use client";

export type PromoCode = {
  id: string;
  code: string;
  discountType: "percentage" | "fixed_usd" | "fixed_etb";
  value: number; // e.g. 15 for 15% or 2500 for fixed Br 2,500 ETB or 25 for $25
  minSpendUSD: number;
  active: boolean;
  usageCount: number;
  expiresAt: string; // ISO date string e.g. "2026-12-31"
  description: string;
};

export type StoreSettings = {
  // Financial & Currencies
  exchangeRateUSDToETB: number;
  primaryCurrency: "ETB" | "USD";
  taxRatePercent: number; // e.g. 15 for VAT

  // Shipping & Logistics
  freeShippingThresholdUSD: number;
  freeShippingThresholdETB: number;
  domesticShippingUSD: number;
  domesticShippingETB: number;
  internationalShippingUSD: number;
  internationalShippingETB: number;
  defaultCarrier: "DHL Express" | "FedEx" | "Ethiopian Post" | "Atelier Courier";
  dispatchLeadTime: string; // e.g. "2-3 business days"

  // Inventory & Alerts
  lowStockThreshold: number;
  allowBackorders: boolean;
  orderAutoConfirm: boolean;

  // Atelier Contact & Showroom
  supportEmail: string;
  supportPhone: string;
  atelierAddress: string;
  boutiqueHours: string;
  conciergeContact: string; // WhatsApp or Telegram handle

  // Promo Engine
  promoCodes: PromoCode[];
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  exchangeRateUSDToETB: 125,
  primaryCurrency: "ETB",
  taxRatePercent: 15,

  freeShippingThresholdUSD: 200,
  freeShippingThresholdETB: 25000,
  domesticShippingUSD: 5,
  domesticShippingETB: 600,
  internationalShippingUSD: 35,
  internationalShippingETB: 4375,
  defaultCarrier: "DHL Express",
  dispatchLeadTime: "1-2 business days",

  lowStockThreshold: 15,
  allowBackorders: false,
  orderAutoConfirm: true,

  supportEmail: "concierge@yehagere.com",
  supportPhone: "+251 91 123 4567",
  atelierAddress: "Bole Medhanialem St., Suite 400, Addis Ababa, Ethiopia",
  boutiqueHours: "Monday - Saturday: 9:00 AM - 7:00 PM EAT",
  conciergeContact: "@yehagere_atelier",

  promoCodes: [
    {
      id: "promo_1",
      code: "WELCOME10",
      discountType: "percentage",
      value: 10,
      minSpendUSD: 100,
      active: true,
      usageCount: 42,
      expiresAt: "2026-12-31",
      description: "10% off for first-time atelier patrons",
    },
    {
      id: "promo_2",
      code: "HELLOFALL",
      discountType: "percentage",
      value: 15,
      minSpendUSD: 150,
      active: true,
      usageCount: 29,
      expiresAt: "2026-11-30",
      description: "15% off Autumn Lookbook editorial pieces",
    },
    {
      id: "promo_3",
      code: "VIPATELIER",
      discountType: "percentage",
      value: 20,
      minSpendUSD: 200,
      active: true,
      usageCount: 64,
      expiresAt: "2027-01-01",
      description: "Exclusive 20% privilege for VIP patrons",
    },
    {
      id: "promo_4",
      code: "ADDIS2500",
      discountType: "fixed_etb",
      value: 2500,
      minSpendUSD: 160,
      active: true,
      usageCount: 18,
      expiresAt: "2026-12-31",
      description: "Br 2,500 ETB savings on orders above Br 20,000",
    },
  ],
};

const SETTINGS_KEY = "yehagere_store_settings_v2";
const SETTINGS_EVENT = "yehagere_settings:updated";

export function getStoreSettings(): StoreSettings {
  if (typeof window === "undefined") return DEFAULT_STORE_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_STORE_SETTINGS));
      return DEFAULT_STORE_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STORE_SETTINGS,
      ...parsed,
      promoCodes: Array.isArray(parsed.promoCodes) && parsed.promoCodes.length > 0
        ? parsed.promoCodes
        : DEFAULT_STORE_SETTINGS.promoCodes,
    };
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export function saveStoreSettings(settings: StoreSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: settings }));
  } catch (e) {
    console.error("Failed to save store settings", e);
  }
}

export function updateStoreSettings(updates: Partial<StoreSettings>): StoreSettings {
  const current = getStoreSettings();
  const next: StoreSettings = {
    ...current,
    ...updates,
  };
  saveStoreSettings(next);
  return next;
}

export function validatePromoCode(
  rawCode: string,
  subtotalUSD: number
): {
  valid: boolean;
  discountUSD: number;
  discountETB: number;
  message: string;
  promo?: PromoCode;
} {
  const settings = getStoreSettings();
  const cleanCode = rawCode.trim().toUpperCase();

  const promo = settings.promoCodes.find(
    (p) => p.code.toUpperCase() === cleanCode
  );

  if (!promo) {
    return {
      valid: false,
      discountUSD: 0,
      discountETB: 0,
      message: `Promo code "${cleanCode}" was not recognized.`,
    };
  }

  if (!promo.active) {
    return {
      valid: false,
      discountUSD: 0,
      discountETB: 0,
      message: `Code "${promo.code}" is currently deactivated.`,
    };
  }

  if (promo.expiresAt) {
    const expiry = new Date(promo.expiresAt).getTime();
    if (!isNaN(expiry) && expiry < Date.now()) {
      return {
        valid: false,
        discountUSD: 0,
        discountETB: 0,
        message: `Code "${promo.code}" has expired.`,
      };
    }
  }

  if (promo.minSpendUSD && subtotalUSD < promo.minSpendUSD) {
    const minETB = promo.minSpendUSD * settings.exchangeRateUSDToETB;
    return {
      valid: false,
      discountUSD: 0,
      discountETB: 0,
      message: `Minimum order of $${promo.minSpendUSD} (Br ${minETB.toLocaleString()} ETB) required for this code.`,
    };
  }

  let discountUSD = 0;
  let discountETB = 0;

  if (promo.discountType === "percentage") {
    discountUSD = Math.round((subtotalUSD * (promo.value / 100)) * 100) / 100;
    discountETB = Math.round(discountUSD * settings.exchangeRateUSDToETB);
  } else if (promo.discountType === "fixed_usd") {
    discountUSD = Math.min(subtotalUSD, promo.value);
    discountETB = Math.round(discountUSD * settings.exchangeRateUSDToETB);
  } else if (promo.discountType === "fixed_etb") {
    discountETB = Math.min(subtotalUSD * settings.exchangeRateUSDToETB, promo.value);
    discountUSD = Math.round((discountETB / settings.exchangeRateUSDToETB) * 100) / 100;
  }

  return {
    valid: true,
    discountUSD,
    discountETB,
    message: `Promo code "${promo.code}" applied: ${promo.description}`,
    promo,
  };
}
