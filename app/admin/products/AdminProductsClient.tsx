"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit,
  Copy,
  ArrowUpRight,
  Sparkles,
  X,
  RefreshCw,
  Search,
  Check,
  AlertTriangle,
  Layers,
  DollarSign,
  Package,
} from "lucide-react";
import { Product } from "../../lib/products-store";
import { getStoreSettings } from "../../lib/settings-store";

export default function AdminProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out" | "healthy">("all");

  const settings = useMemo(() => getStoreSettings(), []);
  const lowStockThreshold = settings.lowStockThreshold || 15;

  // New Product Form State
  const initialForm: {
    title: string;
    subtitle: string;
    category: NonNullable<Product["category"]>;
    price: string;
    priceETB: string;
    stock: string;
    tag: string;
    imageUrl: string;
    description: string;
    fabric: string;
    care: string;
  } = {
    title: "",
    subtitle: "",
    category: "sets",
    price: "",
    priceETB: "",
    stock: "20",
    tag: "New",
    imageUrl: "",
    description: "",
    fabric: "100% Hand-spun Ethiopian Cotton / Fine Wool",
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

  // Create Product
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price) return;

    const priceNum = parseFloat(formData.price) || 0;
    const priceETBNum = formData.priceETB ? parseFloat(formData.priceETB) : priceNum * settings.exchangeRateUSDToETB;

    const payload = {
      title: formData.title,
      name: formData.title,
      subtitle: formData.subtitle || "Handcrafted Heritage Collection",
      category: formData.category,
      tag: formData.tag || "New",
      isNew: formData.tag === "New",
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

  // Update Product (Full Edit)
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const res = await fetch(`${productsApi}/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingProduct,
          price: Number(editingProduct.price),
          priceETB: Number(editingProduct.priceETB || editingProduct.price * settings.exchangeRateUSDToETB),
          stock: Number(editingProduct.stock),
        }),
      });

      if (res.ok) {
        showToast(`Garment #${editingProduct.id} "${editingProduct.title}" updated successfully.`);
        setEditingProduct(null);
        loadProducts();
      } else {
        showToast("Error updating product");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Stock Adjustment (+ / -)
  const handleAdjustStock = async (product: Product, delta: number) => {
    const newStock = Math.max(0, (product.stock ?? 0) + delta);
    try {
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
      );

      await fetch(`${productsApi}/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
    } catch (err) {
      console.error(err);
      loadProducts();
    }
  };

  // Duplicate / Clone Product
  const handleDuplicate = async (product: Product) => {
    const payload = {
      title: `${product.title} (Copy)`,
      name: `${product.title} (Copy)`,
      subtitle: product.subtitle,
      category: product.category,
      price: product.price,
      priceETB: product.priceETB,
      stock: product.stock,
      tag: product.tag,
      imageUrl: product.imageUrl,
      description: product.description,
      details: product.details,
    };

    try {
      const res = await fetch(productsApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(`Duplicated "${product.title}"`);
        loadProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Product
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

  // Toggle "New In" tag
  const handleToggleNew = async (product: Product) => {
    const isCurrentlyNew = product.tag === "New" || product.isNew;
    const nextTag = isCurrentlyNew ? "Heritage" : "New";
    try {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, tag: nextTag, isNew: !isCurrentlyNew } : p
        )
      );

      await fetch(`${productsApi}/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: nextTag, isNew: !isCurrentlyNew }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered List
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.subtitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.tag || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = categoryFilter === "all" || p.category === categoryFilter;

      let matchesStock = true;
      const stock = p.stock ?? 0;
      if (stockFilter === "low") matchesStock = stock > 0 && stock <= lowStockThreshold;
      else if (stockFilter === "out") matchesStock = stock === 0;
      else if (stockFilter === "healthy") matchesStock = stock > lowStockThreshold;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, stockFilter, lowStockThreshold]);

  // Inventory KPI metrics
  const totalUnits = useMemo(
    () => products.reduce((sum, p) => sum + (p.stock || 0), 0),
    [products]
  );
  const totalValuationUSD = useMemo(
    () => products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0),
    [products]
  );
  const lowStockCount = useMemo(
    () => products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= lowStockThreshold).length,
    [products, lowStockThreshold]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => (p.stock ?? 0) === 0).length,
    [products]
  );

  return (
    <div className="min-h-screen bg-[#fafafa] text-black pb-24">
      {/* Main Container */}
      <div className="max-w-[1520px] mx-auto px-4 sm:px-8 pt-8 space-y-8">
        {/* Title & Actions Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-neutral-500">
                Catalog &amp; Inventory Governance
              </span>
              <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black text-white">
                Live Merchandising
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black">
              Garment Collections &amp; Stock Levels
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Full administrative control: adjust pricing in USD and ETB, update stock in real-time, toggle campaign tags, and duplicate silhouettes.
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
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              Add New Garment
            </button>
          </div>
        </div>

        {/* Inventory KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-neutral-200 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
              Active Catalog SKUs
            </span>
            <div className="text-2xl font-extrabold text-black mt-1 flex items-baseline gap-2">
              {products.length}
              <span className="text-xs font-normal text-neutral-500">silhouettes</span>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
              Total Units On Hand
            </span>
            <div className="text-2xl font-extrabold text-black mt-1 flex items-baseline gap-2">
              {totalUnits}
              <span className="text-xs font-normal text-neutral-500">pieces</span>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
              Inventory Valuation
            </span>
            <div className="text-2xl font-extrabold text-black mt-1">
              ${totalValuationUSD.toLocaleString()}
              <span className="text-xs font-normal text-neutral-500 ml-2">
                (Br {(totalValuationUSD * settings.exchangeRateUSDToETB).toLocaleString()})
              </span>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
              Stock Warnings
            </span>
            <div className="text-2xl font-extrabold mt-1 flex items-center gap-3">
              <span className={lowStockCount > 0 ? "text-amber-600" : "text-neutral-700"}>
                {lowStockCount} Low
              </span>
              <span className="text-neutral-300">/</span>
              <span className={outOfStockCount > 0 ? "text-rose-600" : "text-neutral-700"}>
                {outOfStockCount} Out
              </span>
            </div>
          </div>
        </div>

        {/* Toast feedback */}
        {toastMsg && (
          <div className="p-3 bg-black text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Search & Filtering Bar */}
        <div className="bg-white border border-neutral-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search garments by name, tag, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#f4f4f4] text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#f4f4f4] border border-neutral-200 text-xs font-bold text-black focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="sets">Matching Sets</option>
                <option value="fall">Hello Fall</option>
                <option value="denim">Denim</option>
                <option value="knitwear">Knitwear</option>
                <option value="outerwear">Outerwear</option>
              </select>
            </div>

            {/* Stock Health Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Stock:</span>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as "all" | "low" | "out" | "healthy")}
                className="px-2.5 py-1.5 bg-[#f4f4f4] border border-neutral-200 text-xs font-bold text-black focus:outline-none"
              >
                <option value="all">All Levels</option>
                <option value="low">Low Stock (&le; {lowStockThreshold})</option>
                <option value="out">Out of Stock (0)</option>
                <option value="healthy">Healthy Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white border border-neutral-200 divide-y divide-neutral-100 overflow-hidden shadow-2xs">
          <div className="grid grid-cols-12 px-4 sm:px-6 py-3.5 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            <div className="col-span-6 sm:col-span-4">Garment Silhouette</div>
            <div className="col-span-2 hidden sm:block">Category &amp; Tag</div>
            <div className="col-span-3 sm:col-span-2 text-right">Price (USD / ETB)</div>
            <div className="col-span-3 sm:col-span-2 text-center">Stock Inventory</div>
            <div className="col-span-3 sm:col-span-2 text-right">Admin Actions</div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-500">
              No garments matching your filter criteria.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const stock = p.stock ?? 0;
              const isOut = stock === 0;
              const isLow = stock > 0 && stock <= lowStockThreshold;

              return (
                <div
                  key={p.id}
                  className="grid grid-cols-12 px-4 sm:px-6 py-4 items-center hover:bg-neutral-50/75 transition-colors gap-2 sm:gap-0"
                >
                  {/* Garment Details */}
                  <div className="col-span-6 sm:col-span-4 flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-14 sm:w-14 sm:h-16 bg-neutral-100 relative flex-shrink-0 overflow-hidden border border-neutral-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-black tracking-tight truncate">
                          {p.title}
                        </h3>
                        <span className="text-[10px] text-neutral-400 font-mono">#{p.id}</span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-neutral-500 block truncate">
                        {p.subtitle || "Atelier Handcrafted Piece"}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 sm:hidden">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-neutral-100 rounded text-neutral-700">
                          {p.category}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-bold">
                          ${p.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category & Tag */}
                  <div className="col-span-2 hidden sm:block">
                    <div className="space-y-1">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">
                        {p.category || "sets"}
                      </span>
                      <button
                        onClick={() => handleToggleNew(p)}
                        className={`block text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.2 rounded border transition-colors ${
                          p.tag === "New" || p.isNew
                            ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                            : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100"
                        }`}
                        title="Click to toggle New In status"
                      >
                        {p.tag || "Standard"}
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <div className="text-sm font-bold text-black">${p.price.toFixed(2)} USD</div>
                    <div className="text-[11px] text-neutral-500">
                      Br{p.priceETB ? p.priceETB.toLocaleString() : (p.price * settings.exchangeRateUSDToETB).toLocaleString()} ETB
                    </div>
                  </div>

                  {/* Stock Controls (Interactive +/- buttons) */}
                  <div className="col-span-3 sm:col-span-2 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAdjustStock(p, -1)}
                        className="w-6 h-6 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs border border-neutral-300"
                        title="Decrease stock by 1"
                      >
                        -
                      </button>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 min-w-[36px] text-center border ${
                          isOut
                            ? "bg-rose-50 text-rose-800 border-rose-300"
                            : isLow
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-emerald-50 text-emerald-800 border-emerald-300"
                        }`}
                      >
                        {stock}
                      </span>
                      <button
                        onClick={() => handleAdjustStock(p, +1)}
                        className="w-6 h-6 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs border border-neutral-300"
                        title="Increase stock by 1"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-neutral-400 mt-1 font-semibold">
                      {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                    </span>
                  </div>

                  {/* Admin Actions */}
                  <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1 sm:gap-2">
                    <button
                      onClick={() => setEditingProduct({ ...p })}
                      className="p-1.5 sm:p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
                      title="Edit Garment Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(p)}
                      className="p-1.5 sm:p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
                      title="Clone / Duplicate Garment"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/products/${p.id}`}
                      target="_blank"
                      className="p-1.5 sm:p-2 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
                      title="Preview in Storefront"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      className="p-1.5 sm:p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Garment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* EDIT GARMENT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-neutral-200 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                  Editing Piece #{editingProduct.id}
                </span>
                <h3 className="text-xl font-bold text-black">{editingProduct.title}</h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 text-neutral-400 hover:text-black text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-black">
                  Title / Silhouette Name
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.title}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      title: e.target.value,
                      name: e.target.value,
                    })
                  }
                  className="w-full bg-[#f4f4f4] border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-black">
                  Subtitle / Material Summary
                </label>
                <input
                  type="text"
                  value={editingProduct.subtitle || ""}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, subtitle: e.target.value })
                  }
                  className="w-full bg-[#f4f4f4] border border-neutral-300 px-4 py-2 text-sm text-black"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black">
                    Price ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setEditingProduct({
                        ...editingProduct,
                        price: val,
                        priceETB: val * settings.exchangeRateUSDToETB,
                      });
                    }}
                    className="w-full bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-sm font-bold text-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black">
                    Price in ETB (Br)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.priceETB || editingProduct.price * settings.exchangeRateUSDToETB}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        priceETB: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-sm font-bold text-black"
                  />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={editingProduct.stock ?? 10}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-sm font-bold text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black">
                    Collection Category
                  </label>
                  <select
                    value={editingProduct.category || "sets"}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value as Product["category"] })
                    }
                    className="w-full bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-xs font-bold text-black"
                  >
                    <option value="sets">Matching Sets</option>
                    <option value="fall">Hello Fall</option>
                    <option value="knitwear">Knitwear</option>
                    <option value="denim">Denim</option>
                    <option value="outerwear">Outerwear</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black">
                    Display Tag
                  </label>
                  <input
                    type="text"
                    value={editingProduct.tag || ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, tag: e.target.value })
                    }
                    placeholder="e.g. New, Hello Fall, Bestseller"
                    className="w-full bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-xs text-black"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-black">
                  Hero Image URL
                </label>
                <input
                  type="url"
                  value={editingProduct.imageUrl || ""}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, imageUrl: e.target.value })
                  }
                  className="w-full bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-xs text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-black">
                  Fabric Composition
                </label>
                <input
                  type="text"
                  value={editingProduct.details?.fabric || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      details: {
                        ...editingProduct.details,
                        overview: editingProduct.description || "",
                        measurements: editingProduct.details?.measurements || [],
                        fabric: e.target.value,
                        care: editingProduct.details?.care || "",
                      },
                    })
                  }
                  className="w-full bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-xs text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-black">
                  Garment Description
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ""}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-xs text-black"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 shadow-sm"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD GARMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-neutral-200 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                  Catalog Creation
                </span>
                <h3 className="text-xl font-bold text-black">New Garment Piece</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-black">
                  Title / Silhouette Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. The Hand-Loomed Tibeb Coat"
                  className="w-full bg-[#f4f4f4] border border-neutral-300 px-4 py-2 text-sm text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black">
                    Price (USD $)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        price: e.target.value,
                        priceETB: (val * settings.exchangeRateUSDToETB).toString(),
                      });
                    }}
                    placeholder="240.00"
                    className="w-full bg-[#f4f4f4] border border-neutral-300 px-4 py-2 text-sm text-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black">
                    Price in ETB (Br)
                  </label>
                  <input
                    type="number"
                    value={formData.priceETB}
                    onChange={(e) => setFormData({ ...formData, priceETB: e.target.value })}
                    placeholder="30000"
                    className="w-full bg-[#f4f4f4] border border-neutral-300 px-4 py-2 text-sm text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as NonNullable<Product["category"]> })
                    }
                    className="w-full bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-xs font-bold text-black"
                  >
                    <option value="sets">Matching Sets</option>
                    <option value="fall">Hello Fall</option>
                    <option value="knitwear">Knitwear</option>
                    <option value="denim">Denim</option>
                    <option value="outerwear">Outerwear</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black">
                    Display Tag
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    placeholder="New"
                    className="w-full bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-xs text-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-black">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="20"
                    className="w-full bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-xs text-black"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-black">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#f4f4f4] border border-neutral-300 px-4 py-2 text-xs text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-black">
                  Fabric &amp; Care
                </label>
                <input
                  type="text"
                  value={formData.fabric}
                  onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  placeholder="100% Hand-Spun Cotton"
                  className="w-full bg-[#f4f4f4] border border-neutral-300 px-4 py-2 text-xs text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-black">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Artisan tailored silhouette woven with authentic Ethiopian heritage motifs..."
                  className="w-full bg-[#f4f4f4] border border-neutral-300 px-4 py-2 text-xs text-black"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 shadow-sm"
                >
                  Save to Atelier Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
