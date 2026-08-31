"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppearance } from "../../components/AppearanceProvider";

export default function AdminAppearanceClient() {
  const { appearance, setAppearance } = useAppearance();
  const [bannerImage, setBannerImage] = useState(appearance.banner?.imageUrl || "");
  const [headline, setHeadline] = useState(appearance.banner?.headline || "");
  const [subheadline, setSubheadline] = useState(appearance.banner?.subheadline || "");
  const [featuredCsv, setFeaturedCsv] = useState((appearance.featuredProductIds || []).join(","));
  const [promosText, setPromosText] = useState((appearance.promos || []).map(p => `${p.text}|${p.link||""}`).join("\n"));
  const [saved, setSaved] = useState(false);

  function onSave() {
    const featured = featuredCsv.split(",").map(s => s.trim()).filter(Boolean);
    const promos = promosText
      .split(/\n|\r/)
      .map(l => l.trim())
      .filter(Boolean)
      .map(line => {
        const [text, link] = line.split("|").map(s => s.trim());
        return { text, link };
      });

    setAppearance({
      banner: { imageUrl: bannerImage, headline, subheadline },
      featuredProductIds: featured,
      promos,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-[#8b5e34]/20">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8b5e34]">YeHagere Admin</span>
          <h1 className="text-2xl font-bold text-[#1a1410]">Homepage Appearance</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="px-3 py-1.5 text-xs font-medium bg-white border border-[#8b5e34]/20 hover:bg-[#e8ddd0] text-[#1a1410] rounded-lg transition">
            Manage Products
          </Link>
          <Link href="/" className="px-3 py-1.5 text-xs font-medium bg-[#1a1410] hover:bg-[#3d3228] text-white rounded-lg transition">
            View Live Site
          </Link>
        </div>
      </div>

      {saved && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between">
          <span>✓ Appearance settings updated and saved to preview!</span>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#8b5e34]/15 shadow-sm space-y-5">
        <div>
          <label className="block mb-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">Hero image URL</label>
          <input className="w-full p-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5e34]" placeholder="https://..." value={bannerImage} onChange={e => setBannerImage(e.target.value)} />
        </div>

        <div>
          <label className="block mb-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">Headline</label>
          <input className="w-full p-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5e34]" placeholder="Jackets for the Modern Man" value={headline} onChange={e => setHeadline(e.target.value)} />
        </div>

        <div>
          <label className="block mb-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">Subheadline</label>
          <input className="w-full p-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5e34]" placeholder="Explore premium outerwear designed for city life..." value={subheadline} onChange={e => setSubheadline(e.target.value)} />
        </div>

        <div>
          <label className="block mb-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">Featured product IDs (comma separated)</label>
          <input className="w-full p-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5e34]" placeholder="1, 2, 3" value={featuredCsv} onChange={e => setFeaturedCsv(e.target.value)} />
        </div>

        <div>
          <label className="block mb-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">Promo banners (one per line, format: text|link)</label>
          <textarea className="w-full p-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5e34]" rows={4} placeholder="Limited 50% Off ARO Collection|/#products" value={promosText} onChange={e => setPromosText(e.target.value)} />
        </div>

        <div className="pt-2">
          <button className="px-6 py-3 bg-[#1a1410] hover:bg-[#3d3228] text-white font-medium text-sm rounded-xl transition" onClick={onSave}>Save Appearance</button>
        </div>
      </div>
    </div>
  );
}
