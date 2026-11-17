"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { AlertTriangle, ImageIcon, Plus, X } from "../../components/icons";
import ProductColorManager from "../../components/ProductColorManager";
import { apiFetch } from "../../lib/api";
import { marginOf, toProduct } from "../../lib/format";
import type { Category } from "../../lib/categories-store";
import type { Product, ProductColor } from "../../lib/products-store";

const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "XXL", "One size"];

const inputClass =
  "w-full h-10 px-3 rounded-md border border-neutral-300 bg-white text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black aria-[invalid=true]:border-red-500";

type Errors = Partial<Record<"title" | "priceETB" | "stock" | "imageUrl" | "cost", string>>;

function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label} {required && <span className="text-red-600" aria-hidden>*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-700">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-neutral-500">{hint}</p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">{title}</legend>
      {children}
    </fieldset>
  );
}

const isUrl = (value: string) => /^https?:\/\/\S+$/i.test(value);

export default function NewProductForm({
  categories,
  rate,
  category,
  onCategoryChange,
  onRequestNewCategory,
  onCancel,
  onCreated,
}: {
  categories: Category[];
  /** ETB per USD, from store settings. */
  rate: number;
  category: string;
  onCategoryChange: (value: string) => void;
  onRequestNewCategory: () => void;
  onCancel: () => void;
  onCreated: (product: Product) => void;
}) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [tag, setTag] = useState("New");
  const [priceETB, setPriceETB] = useState("");
  const [priceUSD, setPriceUSD] = useState("");
  const [usdEdited, setUsdEdited] = useState(false);
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [description, setDescription] = useState("");
  const [fabric, setFabric] = useState("");
  const [care, setCare] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, saving]);

  const etb = parseFloat(priceETB);
  const usd = usdEdited ? parseFloat(priceUSD) : etb > 0 ? Math.round((etb / rate) * 100) / 100 : NaN;
  const costNum = cost.trim() === "" ? null : parseFloat(cost);
  const margin = useMemo(() => (Number.isFinite(usd) ? marginOf(usd, costNum) : null), [usd, costNum]);
  const previewImage = colors[activeColorIndex]?.image || imageUrl;

  const toggleSize = (size: string) =>
    setSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));

  const addCustomSize = () => {
    const value = customSize.trim();
    if (value && !sizes.includes(value)) setSizes((prev) => [...prev, value]);
    setCustomSize("");
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!title.trim()) next.title = "Give the product a name.";
    if (!(etb > 0)) next.priceETB = "Enter the price customers pay, in birr.";
    if (stock.trim() === "" || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
      next.stock = "Enter how many you have (0 or more).";
    }
    if (imageUrl.trim() && !isUrl(imageUrl.trim())) next.imageUrl = "Use a full link starting with https://";
    if (costNum !== null && (!Number.isFinite(costNum) || costNum < 0)) next.cost = "Cost must be 0 or more.";
    return next;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const found = validate();
    setErrors(found);
    setSaveError(null);
    if (Object.keys(found).length > 0) {
      document.getElementById(id(Object.keys(found)[0]))?.focus();
      return;
    }

    const activeColor = colors[activeColorIndex] ?? colors[0];
    const mainImage = activeColor?.image || imageUrl.trim() || undefined;
    const name = title.trim();
    const payload = {
      title: name,
      name,
      subtitle: subtitle.trim() || undefined,
      category: category || undefined,
      tag: tag.trim() || undefined,
      isNew: tag.trim().toLowerCase() === "new",
      priceETB: Math.round(etb * 100) / 100,
      price: Number.isFinite(usd) && usd > 0 ? Math.round(usd * 100) / 100 : Math.round((etb / rate) * 100) / 100,
      formattedPriceETB: `Br${etb.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`,
      costPrice: costNum,
      stock: Number(stock),
      sizes,
      imageUrl: mainImage,
      galleryImages: colors.map((c) => c.image).filter((src): src is string => Boolean(src)),
      colors,
      activeColorIndex: colors.length ? activeColorIndex : 0,
      activeColorName: activeColor?.name,
      description: description.trim() || undefined,
      details: { overview: description.trim(), measurements: [], fabric: fabric.trim(), care: care.trim() },
    };

    setSaving(true);
    try {
      const response = await apiFetch("products", { method: "POST", body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(result.message) ? result.message.join(". ") : result.message;
        throw new Error(
          response.status === 401 || response.status === 403
            ? "Your admin session has expired. Sign in again, then save."
            : message || "The product couldn't be saved. Please try again."
        );
      }
      onCreated(toProduct(result.data ?? result));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The product couldn't be saved.");
    } finally {
      setSaving(false);
    }
  };

  const invalid = (key: keyof Errors) =>
    errors[key] ? { "aria-invalid": true as const, "aria-describedby": `${id(key)}-error` } : {};

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={id("heading")}
    >
      <form
        onSubmit={submit}
        noValidate
        className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[92vh] sm:rounded-lg flex flex-col shadow-xl"
      >
        <header className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-200">
          <h2 id={id("heading")} className="text-lg font-semibold">
            New product
          </h2>
          <button type="button" onClick={onCancel} className="p-1 text-neutral-500 hover:text-black" aria-label="Close">
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-7">
          {saveError && (
            <div role="alert" className="flex gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
              <AlertTriangle className="size-4 mt-0.5 shrink-0" /> {saveError}
            </div>
          )}

          <Section title="Basics">
            <Field id={id("title")} label="Name" required error={errors.title}>
              <input
                id={id("title")}
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hand-loomed wrap coat"
                autoFocus
                {...invalid("title")}
              />
            </Field>
            <Field id={id("subtitle")} label="Short line under the name" hint="Optional, e.g. 100% Ethiopian cotton">
              <input id={id("subtitle")} className={inputClass} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field id={id("category")} label="Category">
                <div className="flex gap-2">
                  <select
                    id={id("category")}
                    className={inputClass}
                    value={category}
                    onChange={(e) => onCategoryChange(e.target.value)}
                  >
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={onRequestNewCategory}
                    className="h-10 px-3 rounded-md border border-neutral-300 text-sm whitespace-nowrap hover:border-black flex items-center gap-1"
                  >
                    <Plus className="size-4" /> New
                  </button>
                </div>
              </Field>
              <Field id={id("tag")} label="Badge" hint='Shown on the photo, e.g. "New". Leave empty for none.'>
                <input id={id("tag")} className={inputClass} value={tag} onChange={(e) => setTag(e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Price & stock">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                id={id("priceETB")}
                label="Price (ETB)"
                required
                hint="What customers pay at checkout."
                error={errors.priceETB}
              >
                <input
                  id={id("priceETB")}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={priceETB}
                  onChange={(e) => setPriceETB(e.target.value)}
                  placeholder="0.00"
                  {...invalid("priceETB")}
                />
              </Field>
              <Field id={id("priceUSD")} label="Price (USD)" hint={usdEdited ? "Set by you." : `Worked out at Br${rate} per $1. You can change it.`}>
                <input
                  id={id("priceUSD")}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={usdEdited ? priceUSD : Number.isFinite(usd) ? String(usd) : ""}
                  onChange={(e) => {
                    setUsdEdited(e.target.value !== "");
                    setPriceUSD(e.target.value);
                  }}
                  placeholder="Auto"
                />
              </Field>
              <Field
                id={id("cost")}
                label="Cost per item (USD)"
                error={errors.cost}
                hint={
                  margin !== null && costNum !== null && Number.isFinite(usd)
                    ? `${usd - costNum < 0 ? "Loss" : "Profit"} $${Math.abs(usd - costNum).toFixed(2)} per item · ${(margin * 100).toFixed(0)}% margin`
                    : "Optional. Used for the Profit & loss report. Customers never see it."
                }
              >
                <input
                  id={id("cost")}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  {...invalid("cost")}
                />
              </Field>
              <Field id={id("stock")} label="In stock" required error={errors.stock}>
                <input
                  id={id("stock")}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  className={inputClass}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  {...invalid("stock")}
                />
              </Field>
            </div>
          </Section>

          <Section title="Sizes">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Sizes">
              {[...SIZE_PRESETS, ...sizes.filter((s) => !SIZE_PRESETS.includes(s))].map((size) => {
                const on = sizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleSize(size)}
                    className={`h-9 min-w-11 px-3 rounded-md border text-sm ${
                      on ? "bg-black text-white border-black" : "border-neutral-300 hover:border-black"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 max-w-xs">
              <label htmlFor={id("customSize")} className="sr-only">
                Add another size
              </label>
              <input
                id={id("customSize")}
                className={inputClass}
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSize();
                  }
                }}
                placeholder="Other size, e.g. 32"
              />
              <button type="button" onClick={addCustomSize} className="h-10 px-3 rounded-md border border-neutral-300 text-sm hover:border-black">
                Add
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              {sizes.length === 0 ? "No sizes picked: customers won't be asked to choose one." : `Customers choose from: ${sizes.join(", ")}`}
            </p>
          </Section>

          <Section title="Photos & colours">
            <div className="grid grid-cols-[88px_1fr] gap-4 items-start">
              <div className="aspect-[3/4] rounded-md bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center">
                {previewImage && isUrl(previewImage) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="size-6 text-neutral-400" />
                )}
              </div>
              <Field
                id={id("imageUrl")}
                label="Main photo link"
                hint="Paste an image link (https://…). If you add colours with their own photos, the selected colour's photo is used."
                error={errors.imageUrl}
              >
                <input
                  id={id("imageUrl")}
                  type="url"
                  className={inputClass}
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://"
                  {...invalid("imageUrl")}
                />
              </Field>
            </div>
            <ProductColorManager
              colors={colors}
              activeColorIndex={activeColorIndex}
              onChange={(next, active) => {
                setColors(next);
                setActiveColorIndex(active);
              }}
            />
          </Section>

          <Section title="Details">
            <Field id={id("description")} label="Description">
              <textarea
                id={id("description")}
                rows={3}
                className={`${inputClass} h-auto py-2`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field id={id("fabric")} label="Fabric">
                <input id={id("fabric")} className={inputClass} value={fabric} onChange={(e) => setFabric(e.target.value)} placeholder="e.g. 100% hand-spun cotton" />
              </Field>
              <Field id={id("care")} label="Care">
                <input id={id("care")} className={inputClass} value={care} onChange={(e) => setCare(e.target.value)} placeholder="e.g. Cold hand wash" />
              </Field>
            </div>
          </Section>
        </div>

        <footer className="flex items-center justify-end gap-3 px-5 sm:px-6 py-4 border-t border-neutral-200 bg-white sm:rounded-b-lg">
          <button type="button" onClick={onCancel} disabled={saving} className="h-10 px-4 rounded-md text-sm text-neutral-600 hover:text-black">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-5 rounded-md bg-black text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save product"}
          </button>
        </footer>
      </form>
    </div>
  );
}
