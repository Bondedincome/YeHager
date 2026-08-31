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
  LogOut,
  BellRing,
  Layers,
  Eye,
} from "lucide-react";
import { useAppearance, DEFAULT_CMS_CONTENT } from "../../components/AppearanceProvider";
import LogoMark from "../../components/LogoMark";
import { getAllProducts } from "../../lib/products-store";

export default function AdminAppearanceClient() {
  const { cms, updateCMS, resetCMS } = useAppearance();
  const [activeTab, setActiveTab] = useState<"hero" | "lookbook" | "splits" | "announcement" | "footer">("hero");
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  // Local form drafts initialized from CMS snapshot
  const [heroForm, setHeroForm] = useState(cms.hero);
  const [lookbookForm, setLookbookForm] = useState(cms.lookbook);
  const [split1Form, setSplit1Form] = useState(cms.splitSection1);
  const [split2Form, setSplit2Form] = useState(cms.splitSection2);
  const [announcementForm, setAnnouncementForm] = useState(cms.announcement);
  const [footerNotice, setFooterNotice] = useState(cms.footerNotice);

  const products = getAllProducts();

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateCMS({
      hero: heroForm,
      lookbook: lookbookForm,
      splitSection1: split1Form,
      splitSection2: split2Form,
      announcement: announcementForm,
      footerNotice: footerNotice,
    });
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
      setAnnouncementForm(DEFAULT_CMS_CONTENT.announcement);
      setFooterNotice(DEFAULT_CMS_CONTENT.footerNotice);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-black pb-24">
      {/* Main Container */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-8">
        {/* Title & Actions Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-neutral-200">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-neutral-500">
              Content Management System
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black mt-0.5">
              Storefront &amp; Editorial CMS
            </h1>
            <p className="text-xs text-neutral-600 mt-1 max-w-xl">
              Customize live campaigns, editorial headlines, lookbooks, campaign images, and announcement banners in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-black border border-neutral-300 hover:bg-neutral-100 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Check className="w-4 h-4" />
              Publish Changes
            </button>
          </div>
        </div>

        {/* Save Banner Toast */}
        {saved && (
          <div className="mt-4 p-4 bg-black text-white text-xs font-medium uppercase tracking-wider flex items-center justify-between animate-in fade-in duration-200">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Changes successfully published to the live storefront!
            </span>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-neutral-100 text-[11px] font-bold uppercase tracking-wider rounded-none transition-colors shadow-sm"
            >
              <span>View Storefront</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-black" />
            </Link>
          </div>
        )}

        {/* CMS Editor Tabs */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar Menu */}
          <div className="lg:col-span-3 space-y-1">
            <button
              onClick={() => setActiveTab("hero")}
              className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors ${
                activeTab === "hero" ? "bg-black text-white" : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black"
              } border border-neutral-200`}
            >
              <span className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4" />
                1. Hero Campaign Banner
              </span>
              <span className="text-[10px] opacity-70">Top</span>
            </button>

            <button
              onClick={() => setActiveTab("lookbook")}
              className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors ${
                activeTab === "lookbook" ? "bg-black text-white" : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black"
              } border border-neutral-200`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutTemplate className="w-4 h-4" />
                2. Hello Fall Lookbook
              </span>
              <span className="text-[10px] opacity-70">Grid</span>
            </button>

            <button
              onClick={() => setActiveTab("splits")}
              className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors ${
                activeTab === "splits" ? "bg-black text-white" : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black"
              } border border-neutral-200`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                3. Denim Split Campaigns
              </span>
              <span className="text-[10px] opacity-70">Dual</span>
            </button>

            <button
              onClick={() => setActiveTab("announcement")}
              className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors ${
                activeTab === "announcement" ? "bg-black text-white" : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black"
              } border border-neutral-200`}
            >
              <span className="flex items-center gap-2.5">
                <BellRing className="w-4 h-4" />
                4. Announcement Bar
              </span>
              <span className="text-[10px] opacity-70">Header</span>
            </button>

            <button
              onClick={() => setActiveTab("footer")}
              className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors ${
                activeTab === "footer" ? "bg-black text-white" : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black"
              } border border-neutral-200`}
            >
              <span className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4" />
                5. Atelier Footer Notice
              </span>
              <span className="text-[10px] opacity-70">Bottom</span>
            </button>
          </div>

          {/* Right Main Form Content */}
          <div className="lg:col-span-9 bg-white border border-neutral-200 p-6 sm:p-8">
            {/* TAB 1: HERO */}
            {activeTab === "hero" && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h3 className="text-lg font-bold text-black uppercase tracking-tight">Main Hero Editorial Campaign</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Edit the large full-width campaign banner at the top of the homepage.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">Campaign Headline</label>
                    <input
                      type="text"
                      value={heroForm.headline}
                      onChange={(e) => setHeroForm({ ...heroForm, headline: e.target.value })}
                      placeholder="e.g. MATCHING SETS"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">Sub-Headline / Description</label>
                    <input
                      type="text"
                      value={heroForm.subheadline}
                      onChange={(e) => setHeroForm({ ...heroForm, subheadline: e.target.value })}
                      placeholder="e.g. The sets you'll live in—your most effortless outfits start here"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">Call To Action (Button Text)</label>
                    <input
                      type="text"
                      value={heroForm.ctaText}
                      onChange={(e) => setHeroForm({ ...heroForm, ctaText: e.target.value })}
                      placeholder="e.g. Shop Now"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">CTA Destination URL</label>
                    <input
                      type="text"
                      value={heroForm.ctaLink}
                      onChange={(e) => setHeroForm({ ...heroForm, ctaLink: e.target.value })}
                      placeholder="e.g. /products/3"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">Hero Background Image URL</label>
                    <input
                      type="url"
                      value={heroForm.imageUrl}
                      onChange={(e) => setHeroForm({ ...heroForm, imageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                {/* Hero Preview Box */}
                <div className="mt-6 pt-6 border-t border-neutral-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Live Hero Preview</span>
                  <div className="relative aspect-[21/9] w-full bg-neutral-200 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={heroForm.imageUrl} alt="Hero Preview" className="w-full h-full object-cover object-top" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6 text-white">
                      <div>
                        <div className="text-2xl font-extrabold uppercase tracking-tight">{heroForm.headline || "HEADLINE"}</div>
                        <p className="text-xs text-neutral-200">{heroForm.subheadline}</p>
                        <span className="text-xs font-bold underline underline-offset-4 mt-2 inline-block text-white">{heroForm.ctaText} →</span>
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
                  <h3 className="text-lg font-bold text-black uppercase tracking-tight">Lookbook Grid Section</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Control section copy and collection themes for the 4-column lookbook cards.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">Section Title</label>
                    <input
                      type="text"
                      value={lookbookForm.title}
                      onChange={(e) => setLookbookForm({ ...lookbookForm, title: e.target.value })}
                      placeholder="e.g. Hello, Fall"
                      className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">Section Subtitle / Copy</label>
                    <textarea
                      rows={2}
                      value={lookbookForm.subtitle}
                      onChange={(e) => setLookbookForm({ ...lookbookForm, subtitle: e.target.value })}
                      placeholder="Check every box: layers, denim, done..."
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
                  <h3 className="text-lg font-bold text-black uppercase tracking-tight">Split Editorial Campaigns (Denim &amp; Silhouettes)</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Customize the two high-impact split campaign sections featuring editorial photos alongside 3-column micro product cards.</p>
                </div>

                {/* Section 1 */}
                <div className="p-5 border border-neutral-200 bg-[#fdfdfd] space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2.5 py-1 inline-block">Split Campaign 1 (Left Text, Right Photo)</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">Campaign Title</label>
                      <input
                        type="text"
                        value={split1Form.title}
                        onChange={(e) => setSplit1Form({ ...split1Form, title: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">Subtitle</label>
                      <input
                        type="text"
                        value={split1Form.subtitle}
                        onChange={(e) => setSplit1Form({ ...split1Form, subtitle: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">CTA Link Label</label>
                      <input
                        type="text"
                        value={split1Form.ctaText}
                        onChange={(e) => setSplit1Form({ ...split1Form, ctaText: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">CTA Destination URL</label>
                      <input
                        type="text"
                        value={split1Form.ctaLink}
                        onChange={(e) => setSplit1Form({ ...split1Form, ctaLink: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">Editorial Photo URL</label>
                      <input
                        type="url"
                        value={split1Form.campaignImageUrl}
                        onChange={(e) => setSplit1Form({ ...split1Form, campaignImageUrl: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="p-5 border border-neutral-200 bg-[#fdfdfd] space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2.5 py-1 inline-block">Split Campaign 2 (Left Photo, Right Text)</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">Campaign Title</label>
                      <input
                        type="text"
                        value={split2Form.title}
                        onChange={(e) => setSplit2Form({ ...split2Form, title: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">Subtitle</label>
                      <input
                        type="text"
                        value={split2Form.subtitle}
                        onChange={(e) => setSplit2Form({ ...split2Form, subtitle: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">CTA Link Label</label>
                      <input
                        type="text"
                        value={split2Form.ctaText}
                        onChange={(e) => setSplit2Form({ ...split2Form, ctaText: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">CTA Destination URL</label>
                      <input
                        type="text"
                        value={split2Form.ctaLink}
                        onChange={(e) => setSplit2Form({ ...split2Form, ctaLink: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">Editorial Photo URL</label>
                      <input
                        type="url"
                        value={split2Form.campaignImageUrl}
                        onChange={(e) => setSplit2Form({ ...split2Form, campaignImageUrl: e.target.value })}
                        className="w-full bg-white border border-neutral-200 px-3 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ANNOUNCEMENT BAR */}
            {activeTab === "announcement" && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h3 className="text-lg font-bold text-black uppercase tracking-tight">Top Announcement Bar</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Configure the slim luxury banner running across the very top of every page.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enableAnnouncement"
                      checked={announcementForm.enabled}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, enabled: e.target.checked })}
                      className="w-4 h-4 accent-black"
                    />
                    <label htmlFor="enableAnnouncement" className="text-xs font-bold uppercase tracking-wider text-black cursor-pointer">
                      Enable Announcement Banner on Storefront
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">Announcement Copy</label>
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
                      <label className="text-xs font-bold uppercase tracking-wider text-black">Action Text (Optional)</label>
                      <input
                        type="text"
                        value={announcementForm.linkText || ""}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, linkText: e.target.value })}
                        placeholder="e.g. Discover New In"
                        className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-black">Action Link (Optional)</label>
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

            {/* TAB 5: FOOTER */}
            {activeTab === "footer" && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h3 className="text-lg font-bold text-black uppercase tracking-tight">Atelier Footer Notice</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Control the trademark and brand provenance text displayed in the footer.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-black">Provenance / Heritage Notice</label>
                  <textarea
                    rows={3}
                    value={footerNotice}
                    onChange={(e) => setFooterNotice(e.target.value)}
                    className="w-full bg-[#f4f4f4] px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
            )}

            {/* Bottom Save Trigger */}
            <div className="mt-8 pt-6 border-t border-neutral-200 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">All updates immediately sync to the live store.</span>
              <button
                type="button"
                onClick={() => handleSave()}
                className="px-6 py-3 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Publish Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
