"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  LayoutTemplate,
  ShoppingBag,
  Sliders,
  Image as ImageIcon,
  Check,
  RotateCcw,
  ArrowUpRight,
  BellRing,
  Layers,
  Eye,
  BookOpen,
  Palette,
  Phone,
  Clock,
  Wand2,
} from "lucide-react";
import {
  useAppearance,
  DEFAULT_CMS_CONTENT,
  SiteCMSContent,
  HeroBanner,
  LookbookSection,
  SplitSection,
  AnnouncementBar,
  StorySection,
  FooterCMS,
} from "../../components/AppearanceProvider";
import { getAllProducts, Product } from "../../lib/products-store";

export default function AdminAppearanceClient() {
  const { cms, updateCMS, resetCMS } = useAppearance();
  const [activeTab, setActiveTab] = useState<
    "hero" | "lookbook" | "splits" | "story" | "announcement" | "footer" | "presets"
  >("hero");
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  // Local form drafts initialized from CMS snapshot
  const [heroForm, setHeroForm] = useState<HeroBanner>(() => ({
    ...DEFAULT_CMS_CONTENT.hero,
    ...cms.hero,
  }));
  const [lookbookForm, setLookbookForm] = useState<LookbookSection>(() => ({
    ...DEFAULT_CMS_CONTENT.lookbook,
    ...cms.lookbook,
  }));
  const [split1Form, setSplit1Form] = useState<SplitSection>(() => ({
    ...DEFAULT_CMS_CONTENT.splitSection1,
    ...cms.splitSection1,
  }));
  const [split2Form, setSplit2Form] = useState<SplitSection>(() => ({
    ...DEFAULT_CMS_CONTENT.splitSection2,
    ...cms.splitSection2,
  }));
  const [storyForm, setStoryForm] = useState<StorySection>(() => ({
    ...DEFAULT_CMS_CONTENT.storySection,
    ...(cms.storySection || {}),
  }));
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementBar>(() => ({
    ...DEFAULT_CMS_CONTENT.announcement,
    ...cms.announcement,
  }));
  const [footerForm, setFooterForm] = useState<FooterCMS>(() => ({
    ...DEFAULT_CMS_CONTENT.footer,
    ...(cms.footer || {}),
  }));
  const [footerNotice, setFooterNotice] = useState<string>(
    cms.footerNotice || DEFAULT_CMS_CONTENT.footerNotice
  );

  const products = getAllProducts();

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: SiteCMSContent = {
      hero: heroForm,
      lookbook: lookbookForm,
      splitSection1: split1Form,
      splitSection2: split2Form,
      storySection: storyForm,
      announcement: announcementForm,
      footerNotice: footerNotice,
      footer: {
        ...footerForm,
        notice: footerNotice,
      },
    };
    updateCMS(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  const handleResetDefaults = () => {
    if (confirm("Reset all CMS homepage content back to default atelier editorial settings?")) {
      resetCMS();
      setHeroForm(DEFAULT_CMS_CONTENT.hero);
      setLookbookForm(DEFAULT_CMS_CONTENT.lookbook);
      setSplit1Form(DEFAULT_CMS_CONTENT.splitSection1);
      setSplit2Form(DEFAULT_CMS_CONTENT.splitSection2);
      setStoryForm(DEFAULT_CMS_CONTENT.storySection);
      setAnnouncementForm(DEFAULT_CMS_CONTENT.announcement);
      setFooterForm(DEFAULT_CMS_CONTENT.footer);
      setFooterNotice(DEFAULT_CMS_CONTENT.footerNotice);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  // 1-Click Editorial Presets
  const applyPreset = (presetKey: "minimal" | "heritage" | "outerwear" | "summer") => {
    if (presetKey === "minimal") {
      setHeroForm({
        imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1800&auto=format&fit=crop&q=80",
        headline: "MATCHING SETS",
        subheadline: "The sets you'll live in—your most effortless outfits start here",
        ctaText: "Shop Now",
        ctaLink: "/products/3",
        badge: "AUTUMN / WINTER '26 ATELIER CAPSULE",
        secondaryCtaText: "Explore Lookbook",
        secondaryCtaLink: "#fall-lookbook",
        alignment: "left",
        overlayOpacity: "medium",
      });
      setAnnouncementForm({
        enabled: true,
        text: "Complimentary worldwide express shipping on orders over Br 25,000 ETB",
        linkText: "Discover New In",
        linkUrl: "/products/1",
        themeColor: "black",
        tickerMode: false,
      });
      setLookbookForm({
        title: "Hello, Fall",
        subtitle: "Check every box: layers, denim, done. The layers that set the tone for fall.",
        categoryFilter: "all",
        badge: "SEASONAL EDIT",
        viewAllLinkText: "View Full Lookbook",
        itemLimit: 4,
      });
    } else if (presetKey === "heritage") {
      setHeroForm({
        imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&auto=format&fit=crop&q=80",
        headline: "ANCESTRAL TIBEB & SILK",
        subheadline: "Hand-spun Ethiopian cotton intercut with modern architectural silhouettes and gilded border weaves.",
        ctaText: "Discover Atelier Heritage",
        ctaLink: "/products/1",
        badge: "MESKEL EDITORIAL CAPSULE",
        secondaryCtaText: "Read Provenance",
        secondaryCtaLink: "#fall-lookbook",
        alignment: "center",
        overlayOpacity: "heavy",
      });
      setAnnouncementForm({
        enabled: true,
        text: "Special Addis Ababa Pop-Up • Private Appointments Available via Atelier Concierge",
        linkText: "Book Appointment",
        linkUrl: "/contact",
        themeColor: "ochre",
        tickerMode: false,
      });
      setLookbookForm({
        title: "Loomed in Addis Ababa",
        subtitle: "Crafted exclusively by generational weavers from Gamo and Chencha cooperatives.",
        categoryFilter: "sets",
        badge: "CULTURAL LUXURY",
        viewAllLinkText: "View Artisan Editions",
        itemLimit: 4,
      });
    } else if (presetKey === "outerwear") {
      setHeroForm({
        imageUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?w=1800&auto=format&fit=crop&q=80",
        headline: "HEAVYWEIGHT OUTERWEAR",
        subheadline: "Architectural trench coats, double-face wools, and tailored trench capes designed for crisp evenings.",
        ctaText: "Shop Outerwear Capsule",
        ctaLink: "/products/4",
        badge: "WINTER SOLSTICE '26",
        secondaryCtaText: "Browse Collection",
        secondaryCtaLink: "#fall-lookbook",
        alignment: "left",
        overlayOpacity: "medium",
      });
      setAnnouncementForm({
        enabled: true,
        text: "New Outerwear Drop: Limited 50-piece numbered edition now live",
        linkText: "Shop Trench",
        linkUrl: "/products/4",
        themeColor: "emerald",
        tickerMode: false,
      });
      setLookbookForm({
        title: "Winter Tailoring",
        subtitle: "Sharp lines, structured shoulders, and heirloom wool weights.",
        categoryFilter: "outerwear",
        badge: "TECHNICAL TAILORING",
        viewAllLinkText: "Explore Coats",
        itemLimit: 4,
      });
    } else if (presetKey === "summer") {
      setHeroForm({
        imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1800&auto=format&fit=crop&q=80",
        headline: "PURE ORGANIC COTTON",
        subheadline: "Featherweight gauzes, airy tunics, and relaxed separates crafted for effortless sunlit days.",
        ctaText: "Shop Resort Edit",
        ctaLink: "/products/2",
        badge: "HIGH SUMMER COLLECTION",
        secondaryCtaText: "View Lookbook",
        secondaryCtaLink: "#fall-lookbook",
        alignment: "right",
        overlayOpacity: "subtle",
      });
      setAnnouncementForm({
        enabled: true,
        text: "Complimentary monogramming and custom tailoring on all silk pieces this week",
        linkText: "Personalize",
        linkUrl: "/products/3",
        themeColor: "burgundy",
        tickerMode: false,
      });
      setLookbookForm({
        title: "Sunlit Silhouettes",
        subtitle: "Lightweight natural dyes and organic cottons loomed with breathing weave structures.",
        categoryFilter: "denim",
        badge: "SLOW FASHION",
        viewAllLinkText: "View Summer Edit",
        itemLimit: 4,
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-black pb-24">
      {/* Main Container */}
      <div className="max-w-[1520px] mx-auto px-4 sm:px-8 pt-8">
        {/* Title & Actions Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-neutral-500">
                Atelier Visual Commerce
              </span>
              <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black text-white">
                Live Store CMS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black">
              Storefront &amp; Editorial CMS
            </h1>
            <p className="text-xs text-neutral-600 mt-1 max-w-2xl">
              Take complete, granular control over your brand typography, hero campaigns, seasonal lookbooks,
              dual split editorial features, artisan heritage narratives, and customer concierge details.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/"
              target="_blank"
              className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-black bg-white border border-neutral-300 hover:border-black transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-neutral-600" />
              <span>Preview Live</span>
              <ArrowUpRight className="w-3 h-3 text-neutral-400" />
            </Link>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black border border-neutral-300 hover:bg-neutral-100 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              Publish Changes
            </button>
          </div>
        </div>

        {/* Save Banner Toast */}
        {saved && (
          <div className="mt-4 p-4 bg-black text-white text-xs font-medium uppercase tracking-wider flex items-center justify-between border-l-4 border-emerald-400 shadow-sm">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Storefront CMS content successfully published! Changes are active immediately across all devices.
            </span>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-neutral-100 text-[11px] font-bold uppercase tracking-wider transition-colors shadow-2xs"
            >
              <span>Inspect Live</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-black" />
            </Link>
          </div>
        )}

        {/* CMS Editor Workspace */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-3 flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab("hero")}
              className={`flex-shrink-0 lg:flex-shrink w-auto lg:w-full text-left px-3.5 sm:px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between gap-3 transition-colors whitespace-nowrap ${
                activeTab === "hero"
                  ? "bg-black text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black border border-neutral-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                1. Hero Campaign
              </span>
              <span className="text-[10px] opacity-70 hidden sm:inline">Banner</span>
            </button>

            <button
              onClick={() => setActiveTab("lookbook")}
              className={`flex-shrink-0 lg:flex-shrink w-auto lg:w-full text-left px-3.5 sm:px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between gap-3 transition-colors whitespace-nowrap ${
                activeTab === "lookbook"
                  ? "bg-black text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black border border-neutral-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4" />
                2. Lookbook Grid
              </span>
              <span className="text-[10px] opacity-70 hidden sm:inline">Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab("splits")}
              className={`flex-shrink-0 lg:flex-shrink w-auto lg:w-full text-left px-3.5 sm:px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between gap-3 transition-colors whitespace-nowrap ${
                activeTab === "splits"
                  ? "bg-black text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black border border-neutral-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                3. Split Campaigns
              </span>
              <span className="text-[10px] opacity-70 hidden sm:inline">Dual</span>
            </button>

            <button
              onClick={() => setActiveTab("story")}
              className={`flex-shrink-0 lg:flex-shrink w-auto lg:w-full text-left px-3.5 sm:px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between gap-3 transition-colors whitespace-nowrap ${
                activeTab === "story"
                  ? "bg-black text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black border border-neutral-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                4. Atelier Story &amp; Provenance
              </span>
              <span className="text-[10px] opacity-70 hidden sm:inline">Heritage</span>
            </button>

            <button
              onClick={() => setActiveTab("announcement")}
              className={`flex-shrink-0 lg:flex-shrink w-auto lg:w-full text-left px-3.5 sm:px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between gap-3 transition-colors whitespace-nowrap ${
                activeTab === "announcement"
                  ? "bg-black text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black border border-neutral-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <BellRing className="w-4 h-4" />
                5. Announcement Bar
              </span>
              <span className="text-[10px] opacity-70 hidden sm:inline">Header</span>
            </button>

            <button
              onClick={() => setActiveTab("footer")}
              className={`flex-shrink-0 lg:flex-shrink w-auto lg:w-full text-left px-3.5 sm:px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between gap-3 transition-colors whitespace-nowrap ${
                activeTab === "footer"
                  ? "bg-black text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black border border-neutral-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                6. Concierge &amp; Footer
              </span>
              <span className="text-[10px] opacity-70 hidden sm:inline">Boutique</span>
            </button>

            <button
              onClick={() => setActiveTab("presets")}
              className={`flex-shrink-0 lg:flex-shrink w-auto lg:w-full text-left px-3.5 sm:px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between gap-3 transition-colors whitespace-nowrap ${
                activeTab === "presets"
                  ? "bg-black text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black border border-neutral-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-emerald-500" />
                7. Curated Presets
              </span>
              <span className="text-[10px] opacity-70 hidden sm:inline">1-Click</span>
            </button>
          </div>

          {/* Right Main Form Content */}
          <div className="lg:col-span-9 bg-white border border-neutral-200 p-6 sm:p-8 shadow-2xs">
            {/* TAB 1: HERO */}
            {activeTab === "hero" && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-black uppercase tracking-tight">
                      Main Hero Editorial Campaign
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Configure typography, alignment, capsule badges, and editorial imagery for the primary storefront hero.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Capsule Badge / Kicker (Optional)
                    </label>
                    <input
                      type="text"
                      value={heroForm.badge || ""}
                      onChange={(e) => setHeroForm({ ...heroForm, badge: e.target.value })}
                      placeholder="e.g. AUTUMN / WINTER '26 ATELIER CAPSULE"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Text Layout Alignment
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["left", "center", "right"] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => setHeroForm({ ...heroForm, alignment: align })}
                          className={`py-2.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                            (heroForm.alignment || "left") === align
                              ? "bg-black text-white border-black"
                              : "bg-white text-neutral-700 border-neutral-300 hover:border-black"
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Campaign Headline
                    </label>
                    <input
                      type="text"
                      value={heroForm.headline}
                      onChange={(e) => setHeroForm({ ...heroForm, headline: e.target.value })}
                      placeholder="e.g. MATCHING SETS"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Sub-Headline / Narrative Copy
                    </label>
                    <textarea
                      rows={2}
                      value={heroForm.subheadline}
                      onChange={(e) => setHeroForm({ ...heroForm, subheadline: e.target.value })}
                      placeholder="e.g. The sets you'll live in—your most effortless outfits start here"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Primary CTA Label
                    </label>
                    <input
                      type="text"
                      value={heroForm.ctaText}
                      onChange={(e) => setHeroForm({ ...heroForm, ctaText: e.target.value })}
                      placeholder="e.g. Shop Now"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Primary CTA Destination URL
                    </label>
                    <input
                      type="text"
                      value={heroForm.ctaLink}
                      onChange={(e) => setHeroForm({ ...heroForm, ctaLink: e.target.value })}
                      placeholder="e.g. /products/3"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Secondary CTA Label (Optional)
                    </label>
                    <input
                      type="text"
                      value={heroForm.secondaryCtaText || ""}
                      onChange={(e) => setHeroForm({ ...heroForm, secondaryCtaText: e.target.value })}
                      placeholder="e.g. Explore Lookbook"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Secondary CTA Destination
                    </label>
                    <input
                      type="text"
                      value={heroForm.secondaryCtaLink || ""}
                      onChange={(e) => setHeroForm({ ...heroForm, secondaryCtaLink: e.target.value })}
                      placeholder="e.g. #fall-lookbook"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Hero Background Image URL
                      </label>
                      <span className="text-[11px] text-neutral-400">High-res editorial portrait/landscape</span>
                    </div>
                    <input
                      type="url"
                      value={heroForm.imageUrl}
                      onChange={(e) => setHeroForm({ ...heroForm, imageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Contrast Overlay Gradient
                    </label>
                    <select
                      value={heroForm.overlayOpacity || "medium"}
                      onChange={(e) =>
                        setHeroForm({
                          ...heroForm,
                          overlayOpacity: e.target.value as "subtle" | "medium" | "heavy",
                        })
                      }
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      <option value="subtle">Subtle (Allows photo details to shine)</option>
                      <option value="medium">Balanced / Medium (Optimal contrast &amp; legibility)</option>
                      <option value="heavy">Heavy Dark Vignette (High contrast editorial)</option>
                    </select>
                  </div>
                </div>

                {/* Hero Preview Box */}
                <div className="mt-6 pt-6 border-t border-neutral-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                    Live Hero Preview
                  </span>
                  <div className="relative aspect-[21/9] w-full bg-neutral-200 overflow-hidden shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroForm.imageUrl}
                      alt="Hero Preview"
                      className="w-full h-full object-cover object-top"
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-t ${
                        heroForm.overlayOpacity === "subtle"
                          ? "from-black/55 via-black/20 to-transparent"
                          : heroForm.overlayOpacity === "heavy"
                          ? "from-black/95 via-black/60 to-black/25"
                          : "from-black/80 via-black/35 to-transparent"
                      } flex items-end p-6 text-white`}
                    >
                      <div
                        className={`max-w-md ${
                          heroForm.alignment === "center"
                            ? "mx-auto text-center"
                            : heroForm.alignment === "right"
                            ? "ml-auto text-right"
                            : "text-left"
                        }`}
                      >
                        {heroForm.badge && (
                          <span className="text-[9px] font-extrabold uppercase tracking-[0.25em] bg-white/20 px-2 py-0.5 inline-block mb-1.5">
                            {heroForm.badge}
                          </span>
                        )}
                        <div className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight leading-tight">
                          {heroForm.headline || "CAMPAIGN HEADLINE"}
                        </div>
                        <p className="text-xs text-neutral-200 mt-1 line-clamp-2">
                          {heroForm.subheadline}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs font-bold underline underline-offset-4 text-white">
                            {heroForm.ctaText} &rarr;
                          </span>
                          {heroForm.secondaryCtaText && (
                            <span className="text-xs text-neutral-300">
                              {heroForm.secondaryCtaText}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LOOKBOOK */}
            {activeTab === "lookbook" && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h3 className="text-lg font-bold text-black uppercase tracking-tight">
                    Lookbook Grid &amp; Catalog Section
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Filter which collection products appear in the 4-column lookbook, adjust titles, and set badge tags.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Section Badge / Kicker
                    </label>
                    <input
                      type="text"
                      value={lookbookForm.badge || ""}
                      onChange={(e) => setLookbookForm({ ...lookbookForm, badge: e.target.value })}
                      placeholder="e.g. SEASONAL EDIT"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Collection Category Filter
                    </label>
                    <select
                      value={lookbookForm.categoryFilter || "all"}
                      onChange={(e) =>
                        setLookbookForm({
                          ...lookbookForm,
                          categoryFilter: e.target.value as "all" | "sets" | "fall" | "knitwear" | "denim" | "outerwear",
                        })
                      }
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      <option value="all">All Products (Full Collection)</option>
                      <option value="sets">Matching Sets</option>
                      <option value="fall">Fall &amp; Autumn Capsule</option>
                      <option value="knitwear">Artisan Knitwear</option>
                      <option value="denim">Selvedge Denim</option>
                      <option value="outerwear">Outerwear &amp; Tailored Coats</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={lookbookForm.title}
                      onChange={(e) => setLookbookForm({ ...lookbookForm, title: e.target.value })}
                      placeholder="e.g. Hello, Fall"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Section Subtitle / Editorial Copy
                    </label>
                    <textarea
                      rows={2}
                      value={lookbookForm.subtitle}
                      onChange={(e) => setLookbookForm({ ...lookbookForm, subtitle: e.target.value })}
                      placeholder="Check every box: layers, denim, done..."
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Grid Item Limit
                    </label>
                    <select
                      value={lookbookForm.itemLimit || 4}
                      onChange={(e) =>
                        setLookbookForm({
                          ...lookbookForm,
                          itemLimit: Number(e.target.value),
                        })
                      }
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      <option value={4}>4 Products (Single Row on Desktop)</option>
                      <option value={8}>8 Products (Double Row Grid)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      &apos;View All&apos; Link Label
                    </label>
                    <input
                      type="text"
                      value={lookbookForm.viewAllLinkText || ""}
                      onChange={(e) => setLookbookForm({ ...lookbookForm, viewAllLinkText: e.target.value })}
                      placeholder="e.g. View Full Lookbook"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SPLIT SECTIONS */}
            {activeTab === "splits" && (
              <div className="space-y-8">
                <div className="border-b border-neutral-100 pb-4">
                  <h3 className="text-lg font-bold text-black uppercase tracking-tight">
                    Dual Split Editorial Campaigns
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Customize the two high-impact split features. Select which 3 catalog products to showcase, adjust photography, and toggle layout reversal.
                  </p>
                </div>

                {/* Section 1 */}
                <div className="p-5 border border-neutral-200 bg-[#fbfbfb] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2.5 py-1">
                      Split Campaign 1 (Default: Left Text, Right Photo)
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase text-black">
                      <input
                        type="checkbox"
                        checked={split1Form.enabled ?? true}
                        onChange={(e) => setSplit1Form({ ...split1Form, enabled: e.target.checked })}
                        className="w-4 h-4 accent-black"
                      />
                      Active on Storefront
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Badge / Kicker
                      </label>
                      <input
                        type="text"
                        value={split1Form.badge || ""}
                        onChange={(e) => setSplit1Form({ ...split1Form, badge: e.target.value })}
                        placeholder="e.g. SIGNATURE SILHOUETTES"
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Layout Orientation
                      </label>
                      <select
                        value={split1Form.reverseLayout ? "reverse" : "standard"}
                        onChange={(e) =>
                          setSplit1Form({
                            ...split1Form,
                            reverseLayout: e.target.value === "reverse",
                          })
                        }
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      >
                        <option value="standard">Text Left / Photo Right</option>
                        <option value="reverse">Photo Left / Text Right</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Campaign Title
                      </label>
                      <input
                        type="text"
                        value={split1Form.title}
                        onChange={(e) => setSplit1Form({ ...split1Form, title: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Subtitle Copy
                      </label>
                      <input
                        type="text"
                        value={split1Form.subtitle}
                        onChange={(e) => setSplit1Form({ ...split1Form, subtitle: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        CTA Link Label
                      </label>
                      <input
                        type="text"
                        value={split1Form.ctaText}
                        onChange={(e) => setSplit1Form({ ...split1Form, ctaText: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        CTA Destination URL
                      </label>
                      <input
                        type="text"
                        value={split1Form.ctaLink}
                        onChange={(e) => setSplit1Form({ ...split1Form, ctaLink: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Editorial Photo URL
                      </label>
                      <input
                        type="url"
                        value={split1Form.campaignImageUrl}
                        onChange={(e) => setSplit1Form({ ...split1Form, campaignImageUrl: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>

                    {/* 3 Featured Products Selector */}
                    <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-neutral-200">
                      <label className="text-xs font-bold uppercase tracking-wider text-black block">
                        Featured Micro Products (3 Items displayed beside photo)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[0, 1, 2].map((slotIdx) => {
                          const currentId = (split1Form.featuredProductIds || [2, 1, 3])[slotIdx];
                          return (
                            <div key={`split1-slot-${slotIdx}`} className="space-y-1">
                              <span className="text-[10px] font-bold text-neutral-500 uppercase">
                                Slot {slotIdx + 1}
                              </span>
                              <select
                                value={currentId || ""}
                                onChange={(e) => {
                                  const nextIds = [...(split1Form.featuredProductIds || [2, 1, 3])];
                                  nextIds[slotIdx] = Number(e.target.value);
                                  setSplit1Form({ ...split1Form, featuredProductIds: nextIds });
                                }}
                                className="w-full bg-white border border-neutral-300 p-2 text-xs font-medium"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    #{p.id}: {p.title} ({p.formattedPriceETB || `Br ${p.price}`})
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="p-5 border border-neutral-200 bg-[#fbfbfb] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2.5 py-1">
                      Split Campaign 2 (Default: Left Photo, Right Text)
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase text-black">
                      <input
                        type="checkbox"
                        checked={split2Form.enabled ?? true}
                        onChange={(e) => setSplit2Form({ ...split2Form, enabled: e.target.checked })}
                        className="w-4 h-4 accent-black"
                      />
                      Active on Storefront
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Badge / Kicker
                      </label>
                      <input
                        type="text"
                        value={split2Form.badge || ""}
                        onChange={(e) => setSplit2Form({ ...split2Form, badge: e.target.value })}
                        placeholder="e.g. CAPSULE HIGHLIGHT"
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Layout Orientation
                      </label>
                      <select
                        value={split2Form.reverseLayout ? "reverse" : "standard"}
                        onChange={(e) =>
                          setSplit2Form({
                            ...split2Form,
                            reverseLayout: e.target.value === "reverse",
                          })
                        }
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      >
                        <option value="reverse">Photo Left / Text Right</option>
                        <option value="standard">Text Left / Photo Right</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Campaign Title
                      </label>
                      <input
                        type="text"
                        value={split2Form.title}
                        onChange={(e) => setSplit2Form({ ...split2Form, title: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Subtitle Copy
                      </label>
                      <input
                        type="text"
                        value={split2Form.subtitle}
                        onChange={(e) => setSplit2Form({ ...split2Form, subtitle: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        CTA Link Label
                      </label>
                      <input
                        type="text"
                        value={split2Form.ctaText}
                        onChange={(e) => setSplit2Form({ ...split2Form, ctaText: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        CTA Destination URL
                      </label>
                      <input
                        type="text"
                        value={split2Form.ctaLink}
                        onChange={(e) => setSplit2Form({ ...split2Form, ctaLink: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Editorial Photo URL
                      </label>
                      <input
                        type="url"
                        value={split2Form.campaignImageUrl}
                        onChange={(e) => setSplit2Form({ ...split2Form, campaignImageUrl: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>

                    {/* 3 Featured Products Selector */}
                    <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-neutral-200">
                      <label className="text-xs font-bold uppercase tracking-wider text-black block">
                        Featured Micro Products (3 Items displayed beside photo)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[0, 1, 2].map((slotIdx) => {
                          const currentId = (split2Form.featuredProductIds || [4, 5, 2])[slotIdx];
                          return (
                            <div key={`split2-slot-${slotIdx}`} className="space-y-1">
                              <span className="text-[10px] font-bold text-neutral-500 uppercase">
                                Slot {slotIdx + 1}
                              </span>
                              <select
                                value={currentId || ""}
                                onChange={(e) => {
                                  const nextIds = [...(split2Form.featuredProductIds || [4, 5, 2])];
                                  nextIds[slotIdx] = Number(e.target.value);
                                  setSplit2Form({ ...split2Form, featuredProductIds: nextIds });
                                }}
                                className="w-full bg-white border border-neutral-300 p-2 text-xs font-medium"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    #{p.id}: {p.title} ({p.formattedPriceETB || `Br ${p.price}`})
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: STORY & ATELIER PROVENANCE */}
            {activeTab === "story" && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-black uppercase tracking-tight">
                      Atelier Heritage &amp; Sustainability Narrative
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Tell the story of traditional Ethiopian hand-weaving, zero-synthetic materials, and artisan cooperatives.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase text-black">
                    <input
                      type="checkbox"
                      checked={storyForm.enabled}
                      onChange={(e) => setStoryForm({ ...storyForm, enabled: e.target.checked })}
                      className="w-4 h-4 accent-black"
                    />
                    Enable Story Section
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Section Badge
                    </label>
                    <input
                      type="text"
                      value={storyForm.badge}
                      onChange={(e) => setStoryForm({ ...storyForm, badge: e.target.value })}
                      placeholder="e.g. ATELIER HERITAGE & PROVENANCE"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Artisan Workshop Photo URL
                    </label>
                    <input
                      type="url"
                      value={storyForm.imageUrl}
                      onChange={(e) => setStoryForm({ ...storyForm, imageUrl: e.target.value })}
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Story Title
                    </label>
                    <input
                      type="text"
                      value={storyForm.title}
                      onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Narrative Paragraph 1
                    </label>
                    <textarea
                      rows={3}
                      value={storyForm.paragraph1}
                      onChange={(e) => setStoryForm({ ...storyForm, paragraph1: e.target.value })}
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Narrative Paragraph 2
                    </label>
                    <textarea
                      rows={3}
                      value={storyForm.paragraph2}
                      onChange={(e) => setStoryForm({ ...storyForm, paragraph2: e.target.value })}
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Master Weaver Quote
                    </label>
                    <input
                      type="text"
                      value={storyForm.quote}
                      onChange={(e) => setStoryForm({ ...storyForm, quote: e.target.value })}
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Quote Attribution
                    </label>
                    <input
                      type="text"
                      value={storyForm.quoteAuthor}
                      onChange={(e) => setStoryForm({ ...storyForm, quoteAuthor: e.target.value })}
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  {/* 3 Metric Highlight Pillars */}
                  <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-neutral-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-black block mb-2">
                      3 Metric Highlights
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1 p-3 bg-neutral-50 border border-neutral-200">
                        <label className="text-[10px] font-bold uppercase text-neutral-500">Pillar 1 Value</label>
                        <input
                          type="text"
                          value={storyForm.stat1Value}
                          onChange={(e) => setStoryForm({ ...storyForm, stat1Value: e.target.value })}
                          className="w-full bg-white border border-neutral-200 p-2 text-xs font-bold"
                        />
                        <label className="text-[10px] font-bold uppercase text-neutral-500 mt-1 block">Label</label>
                        <input
                          type="text"
                          value={storyForm.stat1Label}
                          onChange={(e) => setStoryForm({ ...storyForm, stat1Label: e.target.value })}
                          className="w-full bg-white border border-neutral-200 p-2 text-xs"
                        />
                      </div>

                      <div className="space-y-1 p-3 bg-neutral-50 border border-neutral-200">
                        <label className="text-[10px] font-bold uppercase text-neutral-500">Pillar 2 Value</label>
                        <input
                          type="text"
                          value={storyForm.stat2Value}
                          onChange={(e) => setStoryForm({ ...storyForm, stat2Value: e.target.value })}
                          className="w-full bg-white border border-neutral-200 p-2 text-xs font-bold"
                        />
                        <label className="text-[10px] font-bold uppercase text-neutral-500 mt-1 block">Label</label>
                        <input
                          type="text"
                          value={storyForm.stat2Label}
                          onChange={(e) => setStoryForm({ ...storyForm, stat2Label: e.target.value })}
                          className="w-full bg-white border border-neutral-200 p-2 text-xs"
                        />
                      </div>

                      <div className="space-y-1 p-3 bg-neutral-50 border border-neutral-200">
                        <label className="text-[10px] font-bold uppercase text-neutral-500">Pillar 3 Value</label>
                        <input
                          type="text"
                          value={storyForm.stat3Value}
                          onChange={(e) => setStoryForm({ ...storyForm, stat3Value: e.target.value })}
                          className="w-full bg-white border border-neutral-200 p-2 text-xs font-bold text-emerald-700"
                        />
                        <label className="text-[10px] font-bold uppercase text-neutral-500 mt-1 block">Label</label>
                        <input
                          type="text"
                          value={storyForm.stat3Label}
                          onChange={(e) => setStoryForm({ ...storyForm, stat3Label: e.target.value })}
                          className="w-full bg-white border border-neutral-200 p-2 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ANNOUNCEMENT BAR */}
            {activeTab === "announcement" && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h3 className="text-lg font-bold text-black uppercase tracking-tight">
                    Top Announcement Bar &amp; Color Theme
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Configure the slim luxury banner running across the top of every page, including color themes and CTA links.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enableAnnouncement"
                      checked={announcementForm.enabled}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, enabled: e.target.checked })}
                      className="w-4 h-4 accent-black"
                    />
                    <label
                      htmlFor="enableAnnouncement"
                      className="text-xs font-bold uppercase tracking-wider text-black cursor-pointer"
                    >
                      Enable Announcement Banner on Storefront
                    </label>
                  </div>

                  {/* Theme Color Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black block">
                      Announcement Bar Color Theme
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[
                        { id: "black", name: "Noir Black", bg: "bg-black text-white" },
                        { id: "emerald", name: "Forest Emerald", bg: "bg-[#062c1e] text-emerald-200" },
                        { id: "burgundy", name: "Crimson Velvet", bg: "bg-[#3b0d18] text-[#fce7ed]" },
                        { id: "ochre", name: "Warm Ochre", bg: "bg-[#452c08] text-[#fef3c7]" },
                        { id: "navy", name: "Midnight Navy", bg: "bg-[#0b172a] text-[#e0e7ff]" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            setAnnouncementForm({
                              ...announcementForm,
                              themeColor: t.id as "black" | "emerald" | "burgundy" | "ochre" | "navy",
                            })
                          }
                          className={`p-3 text-center border transition-all ${t.bg} ${
                            (announcementForm.themeColor || "black") === t.id
                              ? "ring-2 ring-black ring-offset-2 scale-[1.02] font-bold"
                              : "opacity-80 hover:opacity-100"
                          }`}
                        >
                          <span className="text-[11px] block uppercase tracking-wider">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Announcement Copy
                    </label>
                    <input
                      type="text"
                      value={announcementForm.text}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, text: e.target.value })}
                      placeholder="e.g. Complimentary worldwide express shipping on orders over Br 25,000 ETB"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Action Text (Optional)
                      </label>
                      <input
                        type="text"
                        value={announcementForm.linkText || ""}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, linkText: e.target.value })}
                        placeholder="e.g. Discover New In"
                        className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Action Link (Optional)
                      </label>
                      <input
                        type="text"
                        value={announcementForm.linkUrl || ""}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, linkUrl: e.target.value })}
                        placeholder="e.g. /products/1"
                        className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: CONCIERGE & FOOTER */}
            {activeTab === "footer" && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h3 className="text-lg font-bold text-black uppercase tracking-tight">
                    Concierge, Boutique &amp; Footer CMS
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Control store provenance copy, boutique phone numbers, concierge hours, and social media handles.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Atelier Provenance Notice
                    </label>
                    <textarea
                      rows={2}
                      value={footerNotice}
                      onChange={(e) => setFooterNotice(e.target.value)}
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Boutique Physical Address
                      </label>
                      <input
                        type="text"
                        value={footerForm.boutiqueAddress}
                        onChange={(e) => setFooterForm({ ...footerForm, boutiqueAddress: e.target.value })}
                        placeholder="e.g. Bole Sub-City, Addis Ababa, Ethiopia"
                        className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Concierge Phone
                      </label>
                      <input
                        type="text"
                        value={footerForm.conciergePhone}
                        onChange={(e) => setFooterForm({ ...footerForm, conciergePhone: e.target.value })}
                        placeholder="e.g. +251 91 123 4567"
                        className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Concierge Email
                      </label>
                      <input
                        type="email"
                        value={footerForm.conciergeEmail}
                        onChange={(e) => setFooterForm({ ...footerForm, conciergeEmail: e.target.value })}
                        placeholder="e.g. concierge@yehagere.com"
                        className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Opening &amp; Concierge Hours
                      </label>
                      <input
                        type="text"
                        value={footerForm.openingHours}
                        onChange={(e) => setFooterForm({ ...footerForm, openingHours: e.target.value })}
                        placeholder="e.g. Mon – Sat: 9:00 AM – 7:30 PM EAT"
                        className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Instagram Profile URL
                      </label>
                      <input
                        type="url"
                        value={footerForm.instagramUrl}
                        onChange={(e) => setFooterForm({ ...footerForm, instagramUrl: e.target.value })}
                        className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">
                        Telegram Channel URL
                      </label>
                      <input
                        type="url"
                        value={footerForm.telegramUrl}
                        onChange={(e) => setFooterForm({ ...footerForm, telegramUrl: e.target.value })}
                        className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: CURATED PRESETS */}
            {activeTab === "presets" && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h3 className="text-lg font-bold text-black uppercase tracking-tight flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-emerald-600" />
                    1-Click Curated Editorial Themes
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Instantly load professionally styled seasonal presets designed for fashion houses and luxury boutiques.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Preset 1 */}
                  <div className="p-5 border border-neutral-200 bg-[#fbfbfb] space-y-3 hover:border-black transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block">
                      Preset 01 • Classic
                    </span>
                    <h4 className="text-base font-bold text-black uppercase">Matching Sets Capsule</h4>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Minimalist noir palette, left-aligned architectural typography, and complimentary express shipping banner.
                    </p>
                    <button
                      type="button"
                      onClick={() => applyPreset("minimal")}
                      className="px-4 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider transition-colors w-full"
                    >
                      Load Matching Sets Preset
                    </button>
                  </div>

                  {/* Preset 2 */}
                  <div className="p-5 border border-neutral-200 bg-[#fbfbfb] space-y-3 hover:border-black transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block">
                      Preset 02 • Heritage
                    </span>
                    <h4 className="text-base font-bold text-black uppercase">Meskel &amp; Tibeb Heritage</h4>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Warm ochre accent bar, center-aligned cultural storytelling, and Dorze hand-woven artisan highlights.
                    </p>
                    <button
                      type="button"
                      onClick={() => applyPreset("heritage")}
                      className="px-4 py-2 bg-[#452c08] text-[#fef3c7] hover:bg-[#342106] text-xs font-bold uppercase tracking-wider transition-colors w-full"
                    >
                      Load Meskel Heritage Preset
                    </button>
                  </div>

                  {/* Preset 3 */}
                  <div className="p-5 border border-neutral-200 bg-[#fbfbfb] space-y-3 hover:border-black transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block">
                      Preset 03 • Winter
                    </span>
                    <h4 className="text-base font-bold text-black uppercase">Heavyweight Outerwear &amp; Wool</h4>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Deep forest emerald accents, tailored trench coats, and structured outerwear focus.
                    </p>
                    <button
                      type="button"
                      onClick={() => applyPreset("outerwear")}
                      className="px-4 py-2 bg-[#062c1e] text-emerald-200 hover:bg-[#041d14] text-xs font-bold uppercase tracking-wider transition-colors w-full"
                    >
                      Load Outerwear Preset
                    </button>
                  </div>

                  {/* Preset 4 */}
                  <div className="p-5 border border-neutral-200 bg-[#fbfbfb] space-y-3 hover:border-black transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block">
                      Preset 04 • Summer Resort
                    </span>
                    <h4 className="text-base font-bold text-black uppercase">Pure Organic Cotton Resort</h4>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Velvet crimson accents, featherweight cottons, sunny resort silhouettes, and monogramming promo.
                    </p>
                    <button
                      type="button"
                      onClick={() => applyPreset("summer")}
                      className="px-4 py-2 bg-[#3b0d18] text-[#fce7ed] hover:bg-[#2b0911] text-xs font-bold uppercase tracking-wider transition-colors w-full"
                    >
                      Load Summer Resort Preset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Save Action Bar */}
            <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-neutral-500">
                All changes synchronize across the storefront and take effect immediately.
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/"
                  target="_blank"
                  className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider border border-neutral-300 text-black hover:border-black transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </Link>
                <button
                  type="button"
                  onClick={() => handleSave()}
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  Publish Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
