"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  Film,
  ImageIcon,
  RotateCcw,
  X,
} from "../../components/icons";
import {
  useAppearance,
  normalizeCMS,
  LEGACY_CMS_STORAGE_KEY,
  HomeSectionKey,
  MediaType,
  Overlay,
  SiteCMSContent,
  SplitSection,
} from "../../components/AppearanceProvider";
import { Product } from "../../lib/products-store";
import { apiFetch } from "../../lib/api";
import { formatProductPrice, toList } from "../../lib/format";

type ApiCategory = { id: number | string; name: string; slug: string };

type SectionKey = "layout" | "announcement" | "hero" | HomeSectionKey | "footer";

const SECTION_INFO: Record<SectionKey, { label: string; hint: string }> = {
  layout: { label: "Page layout", hint: "Choose which sections show and in what order" },
  announcement: { label: "Announcement bar", hint: "Thin strip at the very top of every page" },
  hero: { label: "Hero banner", hint: "Large image or video at the top of the homepage" },
  lookbook: { label: "New in", hint: "Row of products" },
  splitSection1: { label: "Feature 1", hint: "Big image or video with 3 products" },
  splitSection2: { label: "Feature 2", hint: "Big image or video with 3 products" },
  promoBanner: { label: "Promo banner", hint: "Full-width image or video with a message and button" },
  storySection: { label: "Our story", hint: "Brand story with image and highlights" },
  footer: { label: "Footer & contact", hint: "Address, phone, email and socials" },
};

const OVERLAY_OPTIONS: { value: Overlay; label: string }[] = [
  { value: "none", label: "None" },
  { value: "subtle", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Strong" },
];

/* ---------- small form building blocks ---------- */

const inputClass =
  "w-full h-10 px-3 rounded-md border border-neutral-300 bg-white text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string | undefined; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="text" className={inputClass} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

function TextArea({ value, onChange, rows = 3 }: { value: string | undefined; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      rows={rows}
      className={`${inputClass} h-auto py-2 leading-relaxed`}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-sm font-medium"
    >
      <span className={`relative w-10 h-6 rounded-full transition-colors ${checked ? "bg-black" : "bg-neutral-300"}`}>
        <span className={`absolute top-1 size-4 rounded-full bg-white transition-all ${checked ? "left-5" : "left-1"}`} />
      </span>
      {label}
    </button>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-neutral-300 p-0.5 bg-white">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 h-8 rounded text-sm transition-colors ${value === o.value ? "bg-black text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
  hint = "Paste an image link (https://…). Wide, high-resolution photos work best.",
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-4 items-start">
      <div className="aspect-[3/4] rounded-md bg-neutral-100 overflow-hidden border border-neutral-200">
        {value ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            <ImageIcon className="size-6" />
          </div>
        )}
      </div>
      <Field label={label} hint={hint}>
        <TextInput value={value} onChange={(v) => onChange(v.trim())} placeholder="https://" />
      </Field>
    </div>
  );
}

const VIDEO_HOSTS = /(youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|instagram\.com|drive\.google\.com)/i;

function videoWarning(url: string | undefined): string | null {
  if (!url) return null;
  if (VIDEO_HOSTS.test(url)) {
    return "This looks like a page link (YouTube, Vimeo, Drive…). Those can't play as a background. Use a direct link to the video file instead.";
  }
  if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) return "The link should start with https://";
  if (!/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)) {
    return "Make sure this links straight to an .mp4 or .webm file. If the preview below stays blank, the link won't work on the site.";
  }
  return null;
}

/** Image-or-video picker. The image doubles as the video's poster and fallback. */
function MediaField({
  mediaType = "image",
  imageUrl,
  videoUrl,
  onChange,
  imageLabel = "Image link",
}: {
  mediaType?: MediaType;
  imageUrl: string;
  videoUrl?: string;
  onChange: (patch: { mediaType?: MediaType; imageUrl?: string; videoUrl?: string }) => void;
  imageLabel?: string;
}) {
  const warning = mediaType === "video" ? videoWarning(videoUrl) : null;
  return (
    <div className="space-y-5">
      <Field label="Show">
        <Segmented
          value={mediaType}
          options={[
            { value: "image", label: "Image" },
            { value: "video", label: "Video" },
          ]}
          onChange={(v) => onChange({ mediaType: v })}
        />
      </Field>

      {mediaType === "video" && (
        <div className="grid grid-cols-[96px_1fr] gap-4 items-start">
          <div className="aspect-[3/4] rounded-md bg-neutral-900 overflow-hidden border border-neutral-200 flex items-center justify-center">
            {videoUrl ? (
              <video
                key={videoUrl}
                src={videoUrl}
                poster={imageUrl || undefined}
                muted
                loop
                playsInline
                autoPlay
                className="w-full h-full object-cover"
              />
            ) : (
              <Film className="size-6 text-neutral-500" />
            )}
          </div>
          <div className="space-y-2">
            <Field
              label="Video link"
              hint="Direct link to an .mp4 or .webm file. Keep it short (5–20 s), silent and under about 10 MB so it loads fast on phones."
            >
              <TextInput value={videoUrl} onChange={(v) => onChange({ videoUrl: v.trim() })} placeholder="https://…/video.mp4" />
            </Field>
            {warning && (
              <p className="flex gap-2 text-xs text-amber-800">
                <AlertTriangle className="size-4 shrink-0" /> {warning}
              </p>
            )}
          </div>
        </div>
      )}

      <ImageField
        label={mediaType === "video" ? "Cover image" : imageLabel}
        hint={
          mediaType === "video"
            ? "Shown while the video loads, and to visitors who turn off motion or on slow connections."
            : undefined
        }
        value={imageUrl}
        onChange={(v) => onChange({ imageUrl: v })}
      />
    </div>
  );
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-neutral-200 rounded-lg">
      <div className="px-5 sm:px-6 py-4 border-b border-neutral-200">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="text-sm text-neutral-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-5 sm:p-6 space-y-5">{children}</div>
    </section>
  );
}

function ProductPicker({
  products,
  selected,
  onChange,
  max = 3,
}: {
  products: Product[];
  selected: (number | string)[];
  onChange: (ids: string[]) => void;
  max?: number;
}) {
  const [query, setQuery] = useState("");
  // Only keep ids that still exist, so deleted products don't use up a slot.
  const existing = selected.map(String).filter((id) => products.some((p) => String(p.id) === id));
  const selectedSet = new Set(existing);
  const filtered = products.filter((p) => (p.title || "").toLowerCase().includes(query.toLowerCase()));

  const toggle = (id: string) => {
    if (selectedSet.has(id)) onChange(existing.filter((x) => x !== id));
    else if (existing.length < max) onChange([...existing, id]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Products shown</span>
        <span className="text-xs text-neutral-500">
          {existing.length} of {max} selected{existing.length === 0 && " (newest products will be used)"}
        </span>
      </div>
      <input type="search" className={inputClass} placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="max-h-72 overflow-y-auto rounded-md border border-neutral-200 divide-y divide-neutral-100">
        {filtered.length === 0 && <p className="p-4 text-sm text-neutral-500">No products found.</p>}
        {filtered.map((p) => {
          const id = String(p.id);
          const isOn = selectedSet.has(id);
          const disabled = !isOn && existing.length >= max;
          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(id)}
              className={`w-full flex items-center gap-3 p-2.5 text-left transition-colors ${
                isOn ? "bg-neutral-50" : "hover:bg-neutral-50"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span
                className={`size-5 rounded border flex items-center justify-center shrink-0 ${
                  isOn ? "bg-black border-black text-white" : "border-neutral-300"
                }`}
              >
                {isOn && <Check className="size-3.5" />}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt="" className="w-9 h-12 object-cover rounded bg-neutral-100" />
              <span className="flex-1 min-w-0">
                <span className="block text-sm truncate">{p.title}</span>
                <span className="block text-xs text-neutral-500">{formatProductPrice(p)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- section editors ---------- */

function FeatureEditor({
  value,
  onChange,
  products,
}: {
  value: SplitSection;
  onChange: (v: SplitSection) => void;
  products: Product[];
}) {
  const set = <K extends keyof SplitSection>(k: K, v: SplitSection[K]) => onChange({ ...value, [k]: v });
  return (
    <>
      <Card title="Content">
        <Toggle checked={value.enabled ?? true} onChange={(v) => set("enabled", v)} label="Show on homepage" />
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Title">
            <TextInput value={value.title} onChange={(v) => set("title", v)} />
          </Field>
          <Field label="Small label above title" hint="Optional">
            <TextInput value={value.badge} onChange={(v) => set("badge", v)} />
          </Field>
        </div>
        <Field label="Description">
          <TextArea value={value.subtitle} onChange={(v) => set("subtitle", v)} rows={2} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Button text">
            <TextInput value={value.ctaText} onChange={(v) => set("ctaText", v)} />
          </Field>
          <Field label="Button link" hint="e.g. /products or /products?category=denim">
            <TextInput value={value.ctaLink} onChange={(v) => set("ctaLink", v)} />
          </Field>
        </div>
        <Field label="Image position">
          <Segmented
            value={value.reverseLayout ? "right" : "left"}
            options={[
              { value: "left", label: "Image on left" },
              { value: "right", label: "Image on right" },
            ]}
            onChange={(v) => set("reverseLayout", v === "right")}
          />
        </Field>
      </Card>
      <Card title="Image or video">
        <MediaField
          mediaType={value.mediaType}
          imageUrl={value.campaignImageUrl}
          videoUrl={value.videoUrl}
          onChange={(m) =>
            onChange({
              ...value,
              ...(m.mediaType !== undefined && { mediaType: m.mediaType }),
              ...(m.videoUrl !== undefined && { videoUrl: m.videoUrl }),
              ...(m.imageUrl !== undefined && { campaignImageUrl: m.imageUrl }),
            })
          }
        />
      </Card>
      <Card title="Products">
        <ProductPicker products={products} selected={value.featuredProductIds ?? []} onChange={(ids) => set("featuredProductIds", ids)} />
      </Card>
    </>
  );
}

/* ---------- page ---------- */

export default function AdminAppearanceClient() {
  const { cms, status, updatedAt, saveCMS, resetCMS } = useAppearance();
  const [draft, setDraft] = useState<SiteCMSContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [legacy, setLegacy] = useState<SiteCMSContent | null>(null);
  const [active, setActive] = useState<SectionKey>("hero");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  useEffect(() => {
    Promise.all([apiFetch("products"), apiFetch("categories")])
      .then(async ([pr, cr]) => {
        setProducts(pr.ok ? toList<Product>(await pr.json()) : []);
        setCategories(cr.ok ? toList<ApiCategory>(await cr.json()) : []);
      })
      .catch(() => {
        setProducts([]);
        setCategories([]);
      });
  }, []);

  // Content saved in this browser before the homepage was stored on the server.
  useEffect(() => {
    if (status !== "ready" || updatedAt) return;
    try {
      const raw = localStorage.getItem(LEGACY_CMS_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read from browser storage
      if (raw) setLegacy(normalizeCMS(JSON.parse(raw)));
    } catch {
      // ignore unreadable legacy data
    }
  }, [status, updatedAt]);

  const importLegacy = () => {
    if (!legacy) return;
    setDraft(legacy);
    setLegacy(null);
  };

  const dismissLegacy = () => {
    try {
      localStorage.removeItem(LEGACY_CMS_STORAGE_KEY);
    } catch {
      // ignore
    }
    setLegacy(null);
  };

  // `draft` is created on first edit, so it always starts from the latest saved content.
  const content = draft ?? cms;
  const dirty = useMemo(() => draft !== null && JSON.stringify(draft) !== JSON.stringify(cms), [draft, cms]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const patch = <K extends keyof SiteCMSContent>(key: K, value: SiteCMSContent[K]) =>
    setDraft((prev) => ({ ...(prev ?? cms), [key]: value }));

  const save = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveCMS(draft);
      setDraft(null);
      try {
        localStorage.removeItem(LEGACY_CMS_STORAGE_KEY);
      } catch {
        // ignore
      }
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setDraft(null);
    setSaveError(null);
  };

  const resetAll = async () => {
    if (!confirm("Reset every homepage section to the original default content for all customers? This can't be undone.")) return;
    try {
      await resetCMS();
      setDraft(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not reset. Please try again.");
    }
  };

  const isEnabled = (key: SectionKey) => {
    if (key === "announcement") return content.announcement.enabled;
    if (key === "lookbook") return content.lookbook.enabled ?? true;
    if (key === "splitSection1") return content.splitSection1.enabled ?? true;
    if (key === "splitSection2") return content.splitSection2.enabled ?? true;
    if (key === "promoBanner") return content.promoBanner.enabled;
    if (key === "storySection") return content.storySection.enabled;
    return true;
  };

  const setEnabled = (key: HomeSectionKey, enabled: boolean) => {
    if (key === "lookbook") patch("lookbook", { ...content.lookbook, enabled });
    if (key === "splitSection1") patch("splitSection1", { ...content.splitSection1, enabled });
    if (key === "splitSection2") patch("splitSection2", { ...content.splitSection2, enabled });
    if (key === "promoBanner") patch("promoBanner", { ...content.promoBanner, enabled });
    if (key === "storySection") patch("storySection", { ...content.storySection, enabled });
  };

  const move = (index: number, delta: -1 | 1) => {
    const order = [...content.sectionOrder];
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    patch("sectionOrder", order);
  };

  // Sidebar follows the real page order.
  const navKeys: SectionKey[] = ["layout", "announcement", "hero", ...content.sectionOrder, "footer"];

  const hero = content.hero;
  const a = content.announcement;
  const lb = content.lookbook;
  const pb = content.promoBanner;
  const st = content.storySection;
  const ft = content.footer;
  const current = { key: active, ...SECTION_INFO[active] };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Homepage</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Edit what customers see on the homepage. Sections are listed in the order they appear.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="h-9 px-3 rounded-md border border-neutral-300 bg-white text-sm flex items-center gap-1.5 hover:border-black self-start"
        >
          View homepage <ArrowUpRight className="size-4" />
        </Link>
      </div>

      <p className="text-xs text-neutral-500 -mt-3">
        {status === "loading"
          ? "Loading saved content…"
          : status === "error"
          ? null
          : updatedAt
          ? `Last saved ${new Date(updatedAt).toLocaleString()}`
          : "Showing the default content. Nothing has been saved yet."}
      </p>

      {status === "error" && (
        <div className="flex gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="size-4 mt-0.5" />
          <p>Couldn&apos;t load the saved homepage from the server. Check that the backend is running before editing.</p>
        </div>
      )}

      {legacy && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm">
          <p className="flex-1">
            We found homepage edits saved in this browser from before content was stored online. Load them so you can
            review and save them for everyone?
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={dismissLegacy} className="h-9 px-3 rounded-md border border-neutral-300 hover:border-black">
              Ignore
            </button>
            <button type="button" onClick={importLegacy} className="h-9 px-3 rounded-md bg-black text-white hover:bg-neutral-800">
              Load them
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[240px_1fr] gap-6 items-start">
        {/* Section list */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-none lg:sticky lg:top-24 -mx-4 px-4 lg:mx-0 lg:px-0">
          {navKeys.map((key) => {
            const on = isEnabled(key);
            const isLayout = key === "layout";
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                aria-current={active === key ? "page" : undefined}
                className={`shrink-0 lg:w-full flex items-center gap-3 px-3 h-11 rounded-md text-sm text-left transition-colors ${
                  active === key ? "bg-black text-white" : "bg-white lg:bg-transparent border lg:border-0 border-neutral-200 hover:bg-neutral-100"
                } ${isLayout ? "lg:mb-2" : ""}`}
              >
                <span className="flex-1 whitespace-nowrap">{SECTION_INFO[key].label}</span>
                {!isLayout && (
                  <span
                    className={`size-2 rounded-full ${on ? "bg-emerald-500" : "bg-neutral-300"}`}
                    title={on ? "Visible" : "Hidden"}
                  />
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={resetAll}
            className="hidden lg:flex items-center gap-2 px-3 h-10 mt-4 text-sm text-neutral-500 hover:text-red-700"
          >
            <RotateCcw className="size-4" /> Reset all to default
          </button>
        </nav>

        {/* Editor */}
        <div className="space-y-5 min-w-0">
          <div>
            <h2 className="text-lg font-semibold">{current.label}</h2>
            <p className="text-sm text-neutral-500">{current.hint}</p>
          </div>

          {active === "layout" && (
            <Card
              title="Sections under the hero"
              description="The announcement bar and hero always come first, and the footer always comes last."
            >
              <ol className="divide-y divide-neutral-100 -my-2">
                {content.sectionOrder.map((key, i) => {
                  const on = isEnabled(key);
                  return (
                    <li key={key} className="flex items-center gap-3 py-2.5">
                      <span className="w-5 text-xs text-neutral-400 tabular-nums">{i + 1}</span>
                      <button
                        type="button"
                        onClick={() => setActive(key)}
                        className={`flex-1 text-left text-sm hover:underline ${on ? "" : "text-neutral-400"}`}
                      >
                        {SECTION_INFO[key].label}
                        <span className="block text-xs text-neutral-500 no-underline">{SECTION_INFO[key].hint}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEnabled(key, !on)}
                        className="h-8 px-2.5 rounded-md border border-neutral-300 text-xs flex items-center gap-1.5 hover:border-black"
                        aria-pressed={on}
                      >
                        {on ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                        {on ? "Shown" : "Hidden"}
                      </button>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => move(i, -1)}
                          disabled={i === 0}
                          aria-label={`Move ${SECTION_INFO[key].label} up`}
                          className="size-8 rounded-md border border-neutral-300 flex items-center justify-center hover:border-black disabled:opacity-30 disabled:hover:border-neutral-300"
                        >
                          <ArrowUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(i, 1)}
                          disabled={i === content.sectionOrder.length - 1}
                          aria-label={`Move ${SECTION_INFO[key].label} down`}
                          className="size-8 rounded-md border border-neutral-300 flex items-center justify-center hover:border-black disabled:opacity-30 disabled:hover:border-neutral-300"
                        >
                          <ArrowDown className="size-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Card>
          )}

          {active === "promoBanner" && (
            <>
              <Card title="Content">
                <Toggle checked={pb.enabled} onChange={(v) => patch("promoBanner", { ...pb, enabled: v })} label="Show on homepage" />
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Headline">
                    <TextInput value={pb.headline} onChange={(v) => patch("promoBanner", { ...pb, headline: v })} />
                  </Field>
                  <Field label="Small label above headline" hint="Optional">
                    <TextInput value={pb.badge} onChange={(v) => patch("promoBanner", { ...pb, badge: v })} />
                  </Field>
                </div>
                <Field label="Text" hint="Optional">
                  <TextArea value={pb.text} onChange={(v) => patch("promoBanner", { ...pb, text: v })} rows={2} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Button text" hint="Leave empty to hide the button">
                    <TextInput value={pb.ctaText} onChange={(v) => patch("promoBanner", { ...pb, ctaText: v })} />
                  </Field>
                  <Field label="Button link">
                    <TextInput value={pb.ctaLink} onChange={(v) => patch("promoBanner", { ...pb, ctaLink: v })} />
                  </Field>
                </div>
              </Card>
              <Card title="Image or video">
                <MediaField
                  mediaType={pb.mediaType}
                  imageUrl={pb.imageUrl}
                  videoUrl={pb.videoUrl}
                  onChange={(m) => patch("promoBanner", { ...pb, ...m })}
                />
              </Card>
              <Card title="Layout">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Text position">
                    <Segmented
                      value={pb.alignment}
                      options={[
                        { value: "left", label: "Left" },
                        { value: "center", label: "Center" },
                        { value: "right", label: "Right" },
                      ]}
                      onChange={(v) => patch("promoBanner", { ...pb, alignment: v })}
                    />
                  </Field>
                  <Field label="Height">
                    <Segmented
                      value={pb.height}
                      options={[
                        { value: "short", label: "Short" },
                        { value: "medium", label: "Medium" },
                        { value: "tall", label: "Tall" },
                      ]}
                      onChange={(v) => patch("promoBanner", { ...pb, height: v })}
                    />
                  </Field>
                  <Field label="Text colour">
                    <Segmented
                      value={pb.textColor}
                      options={[
                        { value: "light", label: "White" },
                        { value: "dark", label: "Black" },
                      ]}
                      onChange={(v) => patch("promoBanner", { ...pb, textColor: v })}
                    />
                  </Field>
                  <Field label={pb.textColor === "dark" ? "Lighten background" : "Darken background"} hint="Helps text stand out">
                    <Segmented
                      value={pb.overlayOpacity}
                      options={OVERLAY_OPTIONS}
                      onChange={(v) => patch("promoBanner", { ...pb, overlayOpacity: v })}
                    />
                  </Field>
                </div>
              </Card>
            </>
          )}

          {active === "announcement" && (
            <Card title="Content">
              <Toggle checked={a.enabled} onChange={(v) => patch("announcement", { ...a, enabled: v })} label="Show announcement bar" />
              <Field label="Message">
                <TextInput value={a.text} onChange={(v) => patch("announcement", { ...a, text: v })} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Link text" hint="Optional">
                  <TextInput value={a.linkText} onChange={(v) => patch("announcement", { ...a, linkText: v })} />
                </Field>
                <Field label="Link goes to">
                  <TextInput value={a.linkUrl} onChange={(v) => patch("announcement", { ...a, linkUrl: v })} />
                </Field>
              </div>
              <Field label="Background colour">
                <div className="flex gap-2">
                  {(
                    [
                      ["black", "#000000"],
                      ["emerald", "#0f3d2e"],
                      ["burgundy", "#4a1020"],
                      ["ochre", "#6b4a12"],
                      ["navy", "#0b172a"],
                    ] as const
                  ).map(([name, hex]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => patch("announcement", { ...a, themeColor: name })}
                      title={name}
                      aria-label={`${name} background`}
                      className={`size-9 rounded-full border-2 p-0.5 ${(a.themeColor || "black") === name ? "border-black" : "border-transparent"}`}
                    >
                      <span className="block w-full h-full rounded-full" style={{ backgroundColor: hex }} />
                    </button>
                  ))}
                </div>
              </Field>
              <div className="rounded-md overflow-hidden border border-neutral-200">
                <p className="px-3 py-1.5 text-xs text-neutral-500 bg-neutral-50 border-b border-neutral-200">Preview</p>
                <div
                  className="text-white text-xs font-semibold uppercase tracking-wider text-center px-4 py-2.5"
                  style={{
                    backgroundColor:
                      { black: "#000", emerald: "#0f3d2e", burgundy: "#4a1020", ochre: "#6b4a12", navy: "#0b172a" }[a.themeColor || "black"],
                  }}
                >
                  {a.text || "Your message"} {a.linkText && <span className="underline ml-2">{a.linkText}</span>}
                </div>
              </div>
            </Card>
          )}

          {active === "hero" && (
            <>
              <Card title="Text">
                <Field label="Headline">
                  <TextInput value={hero.headline} onChange={(v) => patch("hero", { ...hero, headline: v })} />
                </Field>
                <Field label="Small label above headline" hint="Optional, e.g. New season">
                  <TextInput value={hero.badge} onChange={(v) => patch("hero", { ...hero, badge: v })} />
                </Field>
                <Field label="Text under headline">
                  <TextArea value={hero.subheadline} onChange={(v) => patch("hero", { ...hero, subheadline: v })} rows={2} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Button text">
                    <TextInput value={hero.ctaText} onChange={(v) => patch("hero", { ...hero, ctaText: v })} />
                  </Field>
                  <Field label="Button link">
                    <TextInput value={hero.ctaLink} onChange={(v) => patch("hero", { ...hero, ctaLink: v })} />
                  </Field>
                  <Field label="Second button text" hint="Optional, leave empty to hide">
                    <TextInput value={hero.secondaryCtaText} onChange={(v) => patch("hero", { ...hero, secondaryCtaText: v })} />
                  </Field>
                  <Field label="Second button link">
                    <TextInput value={hero.secondaryCtaLink} onChange={(v) => patch("hero", { ...hero, secondaryCtaLink: v })} />
                  </Field>
                </div>
              </Card>
              <Card title="Image or video">
                <MediaField
                  mediaType={hero.mediaType}
                  imageUrl={hero.imageUrl}
                  videoUrl={hero.videoUrl}
                  onChange={(m) => patch("hero", { ...hero, ...m })}
                />
                {(hero.mediaType ?? "image") === "image" && (
                  <ImageField
                    label="Phone image"
                    hint="Optional. A tall (portrait) photo for phones. Leave empty to use the main image."
                    value={hero.mobileImageUrl}
                    onChange={(v) => patch("hero", { ...hero, mobileImageUrl: v })}
                  />
                )}
              </Card>
              <Card title="Layout">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Text across">
                    <Segmented
                      value={hero.alignment || "left"}
                      options={[
                        { value: "left", label: "Left" },
                        { value: "center", label: "Center" },
                        { value: "right", label: "Right" },
                      ]}
                      onChange={(v) => patch("hero", { ...hero, alignment: v })}
                    />
                  </Field>
                  <Field label="Text up / down">
                    <Segmented
                      value={hero.verticalPosition || "bottom"}
                      options={[
                        { value: "top", label: "Top" },
                        { value: "center", label: "Middle" },
                        { value: "bottom", label: "Bottom" },
                      ]}
                      onChange={(v) => patch("hero", { ...hero, verticalPosition: v })}
                    />
                  </Field>
                  <Field label="Height">
                    <Segmented
                      value={hero.height || "large"}
                      options={[
                        { value: "medium", label: "Medium" },
                        { value: "large", label: "Large" },
                        { value: "full", label: "Full screen" },
                      ]}
                      onChange={(v) => patch("hero", { ...hero, height: v })}
                    />
                  </Field>
                  <Field label="Text colour">
                    <Segmented
                      value={hero.textColor || "light"}
                      options={[
                        { value: "light", label: "White" },
                        { value: "dark", label: "Black" },
                      ]}
                      onChange={(v) => patch("hero", { ...hero, textColor: v })}
                    />
                  </Field>
                  <Field
                    label={hero.textColor === "dark" ? "Lighten background" : "Darken background"}
                    hint="Helps text stand out from busy photos"
                  >
                    <Segmented
                      value={hero.overlayOpacity || "medium"}
                      options={OVERLAY_OPTIONS}
                      onChange={(v) => patch("hero", { ...hero, overlayOpacity: v })}
                    />
                  </Field>
                </div>
              </Card>
            </>
          )}

          {active === "lookbook" && (
            <Card title="Content">
              <Toggle checked={lb.enabled ?? true} onChange={(v) => patch("lookbook", { ...lb, enabled: v })} label="Show on homepage" />
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Title">
                  <TextInput value={lb.title} onChange={(v) => patch("lookbook", { ...lb, title: v })} />
                </Field>
                <Field label="Small label above title" hint="Optional">
                  <TextInput value={lb.badge} onChange={(v) => patch("lookbook", { ...lb, badge: v })} />
                </Field>
              </div>
              <Field label="Description">
                <TextArea value={lb.subtitle} onChange={(v) => patch("lookbook", { ...lb, subtitle: v })} rows={2} />
              </Field>
              <div className="grid sm:grid-cols-3 gap-5">
                <Field label="Show products from">
                  <select
                    className={inputClass}
                    value={lb.categoryFilter || "all"}
                    onChange={(e) => patch("lookbook", { ...lb, categoryFilter: e.target.value })}
                  >
                    <option value="all">All categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug.toLowerCase()}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="How many products">
                  <select
                    className={inputClass}
                    value={lb.itemLimit || 4}
                    onChange={(e) => patch("lookbook", { ...lb, itemLimit: Number(e.target.value) })}
                  >
                    {[4, 8, 12].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Link text" hint="Links to the shop page">
                  <TextInput value={lb.viewAllLinkText} onChange={(v) => patch("lookbook", { ...lb, viewAllLinkText: v })} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Products per row" hint="On large screens. Phones always show 2.">
                  <Segmented
                    value={String(lb.columns || 4) as "2" | "3" | "4"}
                    options={[
                      { value: "2", label: "2" },
                      { value: "3", label: "3" },
                      { value: "4", label: "4" },
                    ]}
                    onChange={(v) => patch("lookbook", { ...lb, columns: Number(v) as 2 | 3 | 4 })}
                  />
                </Field>
                <Field label="Order">
                  <select
                    className={inputClass}
                    value={lb.sort || "newest"}
                    onChange={(e) => patch("lookbook", { ...lb, sort: e.target.value as "newest" | "price-asc" | "price-desc" })}
                  >
                    <option value="newest">Newest first</option>
                    <option value="price-asc">Price, low to high</option>
                    <option value="price-desc">Price, high to low</option>
                  </select>
                </Field>
              </div>
            </Card>
          )}

          {active === "splitSection1" && (
            <FeatureEditor value={content.splitSection1} onChange={(v) => patch("splitSection1", v)} products={products} />
          )}
          {active === "splitSection2" && (
            <FeatureEditor value={content.splitSection2} onChange={(v) => patch("splitSection2", v)} products={products} />
          )}

          {active === "storySection" && (
            <>
              <Card title="Content">
                <Toggle checked={st.enabled} onChange={(v) => patch("storySection", { ...st, enabled: v })} label="Show on homepage" />
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Title">
                    <TextInput value={st.title} onChange={(v) => patch("storySection", { ...st, title: v })} />
                  </Field>
                  <Field label="Small label above title" hint="Optional">
                    <TextInput value={st.badge} onChange={(v) => patch("storySection", { ...st, badge: v })} />
                  </Field>
                </div>
                <Field label="First paragraph">
                  <TextArea value={st.paragraph1} onChange={(v) => patch("storySection", { ...st, paragraph1: v })} />
                </Field>
                <Field label="Second paragraph" hint="Optional">
                  <TextArea value={st.paragraph2} onChange={(v) => patch("storySection", { ...st, paragraph2: v })} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Quote" hint="Optional">
                    <TextInput value={st.quote} onChange={(v) => patch("storySection", { ...st, quote: v })} />
                  </Field>
                  <Field label="Quote by">
                    <TextInput value={st.quoteAuthor} onChange={(v) => patch("storySection", { ...st, quoteAuthor: v })} />
                  </Field>
                </div>
              </Card>
              <Card title="Image & button">
                <ImageField label="Image link" value={st.imageUrl} onChange={(v) => patch("storySection", { ...st, imageUrl: v })} />
                <Field label="Image position">
                  <Segmented
                    value={st.imageSide || "left"}
                    options={[
                      { value: "left", label: "Image on left" },
                      { value: "right", label: "Image on right" },
                    ]}
                    onChange={(v) => patch("storySection", { ...st, imageSide: v })}
                  />
                </Field>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Button text" hint="Leave empty to hide the button">
                    <TextInput value={st.ctaText} onChange={(v) => patch("storySection", { ...st, ctaText: v })} />
                  </Field>
                  <Field label="Button link">
                    <TextInput value={st.ctaLink} onChange={(v) => patch("storySection", { ...st, ctaLink: v })} />
                  </Field>
                </div>
              </Card>
              <Card title="Highlights" description="Three short facts shown under the text. Leave a value empty to hide it.">
                {([1, 2, 3] as const).map((n) => (
                  <div key={n} className="grid grid-cols-[120px_1fr] gap-3">
                    <Field label={`Value ${n}`}>
                      <TextInput
                        value={st[`stat${n}Value`]}
                        onChange={(v) => patch("storySection", { ...st, [`stat${n}Value`]: v })}
                      />
                    </Field>
                    <Field label="Label">
                      <TextInput
                        value={st[`stat${n}Label`]}
                        onChange={(v) => patch("storySection", { ...st, [`stat${n}Label`]: v })}
                      />
                    </Field>
                  </div>
                ))}
              </Card>
            </>
          )}

          {active === "footer" && (
            <>
              <Card title="Contact details">
                <Field label="Address">
                  <TextInput value={ft.boutiqueAddress} onChange={(v) => patch("footer", { ...ft, boutiqueAddress: v })} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Phone">
                    <TextInput value={ft.conciergePhone} onChange={(v) => patch("footer", { ...ft, conciergePhone: v })} />
                  </Field>
                  <Field label="Email">
                    <TextInput value={ft.conciergeEmail} onChange={(v) => patch("footer", { ...ft, conciergeEmail: v })} />
                  </Field>
                </div>
                <Field label="Opening hours">
                  <TextInput value={ft.openingHours} onChange={(v) => patch("footer", { ...ft, openingHours: v })} />
                </Field>
                <Field label="Line next to the copyright" hint="e.g. Handmade in Ethiopia">
                  <TextInput value={content.footerNotice} onChange={(v) => patch("footerNotice", v)} />
                </Field>
              </Card>
              <Card title="Social links" description="Leave a link empty to hide that icon.">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Instagram">
                    <TextInput value={ft.instagramUrl} onChange={(v) => patch("footer", { ...ft, instagramUrl: v })} />
                  </Field>
                  <Field label="TikTok">
                    <TextInput value={ft.tiktokUrl} onChange={(v) => patch("footer", { ...ft, tiktokUrl: v })} />
                  </Field>
                  <Field label="Facebook">
                    <TextInput value={ft.facebookUrl} onChange={(v) => patch("footer", { ...ft, facebookUrl: v })} />
                  </Field>
                  <Field label="Telegram">
                    <TextInput value={ft.telegramUrl} onChange={(v) => patch("footer", { ...ft, telegramUrl: v })} />
                  </Field>
                </div>
              </Card>
            </>
          )}

          <button
            type="button"
            onClick={resetAll}
            className="lg:hidden flex items-center gap-2 h-10 text-sm text-neutral-500 hover:text-red-700"
          >
            <RotateCcw className="size-4" /> Reset all to default
          </button>
        </div>
      </div>

      {/* Save bar */}
      {(dirty || savedAt || saveError) && (
        <div className="sticky bottom-4 z-30 rounded-lg bg-white border border-neutral-200 shadow-lg">
          <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            {dirty ? (
              <>
                <p className={`text-sm font-medium ${saveError ? "text-red-700" : ""}`}>
                  {saveError ?? "You have unsaved changes"}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={discard}
                    className="h-9 px-3 rounded-md border border-neutral-300 text-sm flex items-center gap-1.5 hover:border-black"
                  >
                    <X className="size-4" /> Discard
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="h-9 px-4 rounded-md bg-black text-white text-sm font-medium flex items-center gap-1.5 hover:bg-neutral-800 disabled:opacity-60"
                  >
                    <Check className="size-4" /> {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </>
            ) : saveError ? (
              <p className="text-sm font-medium text-red-700">{saveError}</p>
            ) : (
              <p className="text-sm font-medium flex items-center gap-2">
                <Check className="size-4 text-emerald-600" /> Saved. Customers will see it on their next page load.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
