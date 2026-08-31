"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Sliders,
  ArrowUpRight,
  LogOut,
  Sparkles,
  X,
  RefreshCw,
} from "lucide-react";
import LogoMark from "../../components/LogoMark";
import { Product } from "../../lib/products-store";

export default function AdminProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const router = useRouter();

  // New Product Form State
  const initialForm = {
    title: "",
    subtitle: "",
    category: "sets",
    price: "",
    priceETB: "",
    stock: "20",
    imageUrl: "",
    description: "",
    fabric: "100% Hand-spun Ethiopian Cotton / Merino Wool",
    care: "Dry clean only or delicate cold hand wash",
  };
  const [formData, setFormData] = useState(initialForm);

  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  const productsApi = base ? `${base}/products` : "/api/products";

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const loadProducts = useCallback(() => {
    setLoading(true);
    fetch(productsApi)
      .then((r) => r.json())
      .then((res) => {
        const items = Array.isArray(res) ? res : res?.data ?? [];
        setProducts(items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productsApi]);

  useEffect(() => {
    let active = true;
    fetch(productsApi)
      .then((r) => r.json())
      .then((res) => {
        if (!active) return;
        const items = Array.isArray(res) ? res : res?.data ?? [];
        setProducts(items);
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, [productsApi]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price) return;

    const priceNum = parseFloat(formData.price) || 0;
    const priceETBNum = formData.priceETB ? parseFloat(formData.priceETB) : priceNum * 125;

    const payload = {
      title: formData.title,
      name: formData.title,
      subtitle: formData.subtitle || "Handcrafted Heritage Collection",
      category: formData.category,
      price: priceNum,
      priceETB: priceETBNum,
      formattedPriceETB: `Br${priceETBNum.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB`,
      stock: parseInt(formData.stock) || 10,
      imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
      description: formData.description || "Impeccably tailored contemporary garment woven by master artisans in Addis Ababa.",
      details: {
        overview: formData.description,
        measurements: ["Tailored contemporary fit", "Model is 5'10\" and wears size Small"],
        fabric: formData.fabric,
        care: formData.care,
      },
    };

    try {
      const res = await fetch(productsApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setFormData(initialForm);
        setShowAddModal(false);
        showToast(`Garment "${formData.title}" added to atelier catalog!`);
        loadProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the atelier catalog?`)) return;
    try {
      const res = await fetch(`${productsApi}/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`Item #${id} removed.`);
        loadProducts();
      }
    } catch (err) {
      console.error(err);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-neutral-200">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-neutral-500">
              Inventory &amp; Merchandising
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black mt-0.5">
              Garment Collections ({products.length})
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Add new garments, update prices in USD &amp; ETB, adjust stock levels, and review catalog items.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadProducts}
              className="p-2.5 text-neutral-600 hover:text-black border border-neutral-300 hover:bg-neutral-100 transition-colors"
              title="Refresh Products"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Garment
            </button>
          </div>
        </div>

        {/* Toast feedback */}
        {toastMsg && (
          <div className="mt-4 p-4 bg-black text-white text-xs font-medium uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {toastMsg}
            </span>
          </div>
        )}

        {/* Products Table / Grid View */}
        <div className="mt-8 bg-white border border-neutral-200 divide-y divide-neutral-100">
          <div className="grid grid-cols-12 px-6 py-3.5 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            <div className="col-span-6 sm:col-span-5">Garment Details</div>
            <div className="col-span-2 hidden sm:block">Category</div>
            <div className="col-span-3 sm:col-span-2 text-right">Price (USD / ETB)</div>
            <div className="col-span-1 hidden sm:block text-center">Stock</div>
            <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-500">
              No garments loaded in catalog. Click &quot;Add Garment&quot; to begin.
            </div>
          ) : (
            products.map((p) => (
              <div key={p.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-neutral-50/75 transition-colors">
                {/* Garment Details */}
                <div className="col-span-6 sm:col-span-5 flex items-center gap-4">
                  <div className="w-14 h-16 bg-neutral-100 relative flex-shrink-0 overflow-hidden border border-neutral-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-black tracking-tight">{p.title}</h3>
                    <span className="text-[11px] text-neutral-500">{p.subtitle || "Atelier Silhouette"}</span>
                    <div className="sm:hidden text-xs font-semibold text-black mt-1">
                      ${p.price.toFixed(2)} • Br{p.priceETB?.toLocaleString()} ETB
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-2 hidden sm:block">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">
                    {p.category || "General"}
                  </span>
                </div>

                {/* Price */}
                <div className="col-span-3 sm:col-span-2 text-right hidden sm:block">
                  <div className="text-sm font-bold text-black">${p.price.toFixed(2)}</div>
                  <div className="text-[11px] text-neutral-500">Br{p.priceETB?.toLocaleString()} ETB</div>
                </div>

                {/* Stock */}
                <div className="col-span-1 hidden sm:block text-center text-xs font-semibold text-neutral-700">
                  {p.stock ?? 12}
                </div>

                {/* Actions */}
                <div className="col-span-6 sm:col-span-2 flex items-center justify-end gap-2">
                  <Link
                    href={`/products/${p.id}`}
                    target="_blank"
                    className="p-2 text-neutral-500 hover:text-black transition-colors"
                    title="View Garment Page"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id, p.title)}
                    className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                    title="Delete Garment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Garment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Atelier Form</span>
                <h3 className="text-xl font-bold text-black">New Garment Piece</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-neutral-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-black">Title / Silhouette Name</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. The Hand-Loomed Tibeb Coat"
                  className="w-full bg-[#f4f4f4] px-4 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black">Price (USD $)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="240.00"
                    className="w-full bg-[#f4f4f4] px-4 py-2.5 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black">Price in ETB (Br)</label>
                  <input
                    type="number"
                    value={formData.priceETB}
                    onChange={(e) => setFormData({ ...formData, priceETB: e.target.value })}
                    placeholder="30000"
                    className="w-full bg-[#f4f4f4] px-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black">Collection Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#f4f4f4] px-3 py-2.5 text-sm"
                  >
                    <option value="sets">Matching Sets</option>
                    <option value="fall">Hello Fall</option>
                    <option value="knitwear">Knitwear</option>
                    <option value="denim">Denim</option>
                    <option value="outerwear">Outerwear</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black">Stock Inventory</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="25"
                    className="w-full bg-[#f4f4f4] px-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-black">High-Res Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#f4f4f4] px-4 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-black">Fabric &amp; Care Details</label>
                <input
                  type="text"
                  value={formData.fabric}
                  onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  placeholder="100% Hand-Spun Cotton"
                  className="w-full bg-[#f4f4f4] px-4 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-black">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Artisan tailored silhouette woven with authentic Ethiopian heritage motifs..."
                  className="w-full bg-[#f4f4f4] px-4 py-2.5 text-sm"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800"
                >
                  Save to Atelier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
