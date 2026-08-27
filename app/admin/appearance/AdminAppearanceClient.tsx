"use client";

import React, { useState } from "react";
import { useAppearance } from "../../components/AppearanceProvider";

export default function AdminAppearanceClient() {
  const { appearance, setAppearance } = useAppearance();
  const [bannerImage, setBannerImage] = useState(appearance.banner?.imageUrl || "");
  const [headline, setHeadline] = useState(appearance.banner?.headline || "");
  const [subheadline, setSubheadline] = useState(appearance.banner?.subheadline || "");
  const [featuredCsv, setFeaturedCsv] = useState((appearance.featuredProductIds || []).join(","));
  const [promosText, setPromosText] = useState((appearance.promos || []).map(p => `${p.text}|${p.link||""}`).join("\n"));

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
    alert("Saved appearance settings (local preview). Connect to backend later to persist.");
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Appearance — Homepage</h1>

      <label className="block mb-2 text-sm font-medium">Hero image URL</label>
      <input className="w-full mb-4 p-2 border rounded" value={bannerImage} onChange={e => setBannerImage(e.target.value)} />

      <label className="block mb-2 text-sm font-medium">Headline</label>
      <input className="w-full mb-4 p-2 border rounded" value={headline} onChange={e => setHeadline(e.target.value)} />

      <label className="block mb-2 text-sm font-medium">Subheadline</label>
      <input className="w-full mb-4 p-2 border rounded" value={subheadline} onChange={e => setSubheadline(e.target.value)} />

      <label className="block mb-2 text-sm font-medium">Featured product IDs (comma separated)</label>
      <input className="w-full mb-4 p-2 border rounded" value={featuredCsv} onChange={e => setFeaturedCsv(e.target.value)} />

      <label className="block mb-2 text-sm font-medium">Promo banners (one per line, format: text|link)</label>
      <textarea className="w-full mb-4 p-2 border rounded" rows={6} value={promosText} onChange={e => setPromosText(e.target.value)} />

      <div className="flex gap-3">
        <button className="px-4 py-2 bg-[#1a1410] text-white rounded" onClick={onSave}>Save</button>
      </div>
    </div>
  );
}
