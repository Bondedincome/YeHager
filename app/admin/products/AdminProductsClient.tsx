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
  FolderPlus,
  Star,
} from "lucide-react";
import { Product } from "../../lib/products-store";
import { Category } from "../../lib/categories-store";
import { getStoreSettings } from "../../lib/settings-store";
import ProductColorManager from "../../components/ProductColorManager";
import NewProductForm from "./NewProductForm";
import { apiFetch } from "../../lib/api";
import { marginOf, toProduct } from "../../lib/format";

function MarginNote({ price, cost }: { price: number; cost: number | null | undefined }) {
  const margin = marginOf(price, cost);
  if (margin === null) return <div className="text-[11px] text-amber-700">No cost entered</div>;
  return (
    <div className={`text-[11px] ${margin < 0 ? "text-red-700" : "text-neutral-500"}`}>
      Cost ${Number(cost).toFixed(2)} · {(margin * 100).toFixed(0)}% margin
    </div>
  );
}

/** Unit cost input with a live margin readout. Cost is private to admins. */
function CostField({
  value,
  price,
  rate,
  onChange,
}: {
  value: string;
  price: number;
  rate: number;
  onChange: (value: string) => void;
}) {
  const cost = value === "" ? null : parseFloat(value);
  const margin = marginOf(price, cost !== null && Number.isFinite(cost) ? cost : null);
  const profit = margin === null || cost === null ? null : price - cost;
  const id = React.useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-black">
        Cost per item ($ USD)
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          id={id}
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="What one unit costs you"
          className="w-48 bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-sm font-bold text-black"
        />
        {profit !== null && margin !== null ? (
          <span className={`text-xs font-semibold ${profit < 0 ? "text-red-700" : "text-emerald-700"}`}>
            {profit < 0 ? "Loss" : "Profit"} ${Math.abs(profit).toFixed(2)} (Br{Math.round(Math.abs(profit) * rate).toLocaleString()}) per item ·{" "}
            {(margin * 100).toFixed(0)}% margin
          </span>
        ) : (
          <span className="text-xs text-neutral-500">Used for the Profit &amp; loss report. Customers never see it.</span>
        )}
      </div>
    </div>
  );
}

export default function AdminProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  // Categories State
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [quickCategoryTarget, setQuickCategoryTarget] = useState<"add" | "edit" | null>(null);

  // New Category input states
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [catError, setCatError] = useState("");

  // Editing existing category state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [editingCatDesc, setEditingCatDesc] = useState("");

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out" | "healthy">("all");

  const settings = useMemo(() => getStoreSettings(), []);
  const lowStockThreshold = settings.lowStockThreshold || 15;

  // Category picked in the New product form (also set by the quick "New category" dialog)
  const [newProductCategory, setNewProductCategory] = useState("");

  const productsApi = "products";

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(productsApi);
      if (!res.ok) throw new Error(`Product request failed (${res.status})`);
      const json = await res.json();
      const items = Array.isArray(json) ? json : json?.data;
      setProducts(Array.isArray(items) ? items.map(toProduct) : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [productsApi]);

  useEffect(() => {
    let active = true;
    const fetchCatalog = async () => {
      try {
        const res = await apiFetch(productsApi);
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json) ? json : json?.data;
          if (active && Array.isArray(items)) {
            setProducts(items.map(toProduct));
            return;
          }
        }
      } catch {
        // Fallback silently without throwing unhandled rejection
      }
      if (active) setProducts([]);
    };

    fetchCatalog();
    return () => {
      active = false;
    };
  }, [productsApi]);

  useEffect(() => {
    apiFetch("categories")
      .then((res) => {
        if (!res.ok) throw new Error(`Category request failed (${res.status})`);
        return res.json();
      })
      .then((json) => {
        const items = Array.isArray(json) ? json : json?.data;
        if (Array.isArray(items)) {
          setCategories(items.map((category) => ({
            ...category,
            id: category.slug || category.id,
            apiId: category.id,
          })));
        }
      })
      .catch(() => {});
  }, []);

  const getCategoryName = useCallback(
    (slug?: string) => {
      if (!slug) return "No category";
      const match = categories.find((c) => c.id.toLowerCase() === slug.toLowerCase());
      if (match) return match.name;
      return slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    },
    [categories]
  );

  const handleCreateCategory = async (target?: "add" | "edit" | "modal") => {
    if (!newCatName.trim()) {
      setCatError("Please enter a category title");
      return;
    }
    setCatError("");
    try {
      const categoryPayload = {
        name: newCatName.trim(),
        slug: newCatSlug.trim() || undefined,
        description: newCatDesc.trim(),
      };
      const response = await apiFetch("categories", {
        method: "POST",
        body: JSON.stringify(categoryPayload),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || payload.error || "Failed to create category");
      const value = payload.data ?? payload;
      const created = { ...value, id: value.slug || value.id, apiId: value.id } as Category;
      setCategories((prev) => [created, ...prev]);

      if (target === "add") {
        setNewProductCategory(created.id);
        setQuickCategoryTarget(null);
      } else if (target === "edit") {
        setEditingProduct((prev) => (prev ? { ...prev, category: created.id } : null));
        setQuickCategoryTarget(null);
      } else {
        setNewCatName("");
        setNewCatSlug("");
        setNewCatDesc("");
      }

      showToast(`Category "${created.name}" created successfully`);
    } catch (err) {
      setCatError(err instanceof Error ? err.message : "Failed to create category");
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    const assignedCount = products.filter(
      (p) => (p.category || "").toLowerCase() === cat.id.toLowerCase()
    ).length;

    const confirmMsg =
      assignedCount > 0
        ? `Category "${cat.name}" currently has ${assignedCount} product(s) assigned to it. Deleting this category will leave those products without a category. Proceed?`
        : `Are you sure you want to delete category "${cat.name}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      const reassigned = products.filter((product) => (product.category || "").toLowerCase() === cat.id.toLowerCase());
      const updates = await Promise.all(reassigned.map((product) => apiFetch(`products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({ category: "" }),
      })));
      if (updates.some((response) => !response.ok)) throw new Error("Failed to reassign products from this category");
      const response = await apiFetch(`categories/${encodeURIComponent(cat.apiId || cat.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete category");
      setProducts((prev) => prev.map((product) => reassigned.some((item) => item.id === product.id) ? { ...product, category: "" } : product));
      setCategories((prev) => prev.filter((category) => category.id !== cat.id));
      showToast(`Category "${cat.name}" deleted.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to delete category");
    }
  };

  const handleUpdateCategory = async (catId: string) => {
    if (!editingCatName.trim()) return;
    const category = categories.find((item) => item.id === catId);
    try {
      const response = await apiFetch(`categories/${encodeURIComponent(category?.apiId || catId)}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editingCatName.trim(), description: editingCatDesc.trim() }),
      });
      if (!response.ok) throw new Error("Failed to update category");
      setCategories((prev) => prev.map((item) => item.id === catId ? {
        ...item,
        name: editingCatName.trim(),
        description: editingCatDesc.trim(),
      } : item));
      setEditingCatId(null);
      showToast("Category updated.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update category");
    }
  };

  // Quick Active Color Switcher
  const handleQuickSetActiveColor = async (product: Product, colorIndex: number) => {
    try {
      const response = await apiFetch(`${productsApi}/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({
          activeColorIndex: colorIndex,
          activeColorName: product.colors?.[colorIndex]?.name,
          imageUrl: product.colors?.[colorIndex]?.image || product.imageUrl,
        }),
      });
      if (!response.ok) throw new Error("Failed to update product color");
      const updated = { ...product, activeColorIndex: colorIndex, activeColorName: product.colors?.[colorIndex]?.name };
      setProducts((prev) => prev.map((item) => item.id === product.id ? updated : item));
      const colorName = updated.activeColorName || `Color #${colorIndex + 1}`;
      showToast(`"${product.title}": Active default color set to ${colorName}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update product color");
    }
  };

  // Update Product (Full Edit)
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const activeIdx = editingProduct.activeColorIndex ?? 0;
    const activeColor = editingProduct.colors?.[activeIdx];

    const updates = {
      ...editingProduct,
      price: Number(editingProduct.price),
      priceETB: Number(editingProduct.priceETB || editingProduct.price * settings.exchangeRateUSDToETB),
      costPrice:
        editingProduct.costPrice === null || editingProduct.costPrice === undefined
          ? null
          : Math.max(0, Number(editingProduct.costPrice) || 0),
      stock: Number(editingProduct.stock),
      activeColorIndex: activeIdx,
      activeColorName: activeColor?.name,
      imageUrl: activeColor?.image || editingProduct.imageUrl,
    };

    try {
      const response = await apiFetch(`${productsApi}/${editingProduct.id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update product");
      setProducts((prev) => prev.map((product) => product.id === editingProduct.id ? updates : product));
      showToast(`Product #${editingProduct.id} "${editingProduct.title}" updated successfully.`);
      setEditingProduct(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update product");
    }
  };

  // Quick Stock Adjustment (+ / -)
  const handleAdjustStock = async (product: Product, delta: number) => {
    const newStock = Math.max(0, (product.stock ?? 0) + delta);
    try {
      const response = await apiFetch(`${productsApi}/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({ stock: newStock }),
      });
      if (!response.ok) throw new Error("Failed to update stock");
      setProducts((prev) => prev.map((item) => item.id === product.id ? { ...item, stock: newStock } : item));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update stock");
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
      costPrice: product.costPrice ?? null,
      stock: product.stock,
      tag: product.tag,
      imageUrl: product.imageUrl,
      colors: product.colors,
      activeColorIndex: product.activeColorIndex,
      activeColorName: product.activeColorName,
      description: product.description,
      details: product.details,
    };

    try {
      const response = await apiFetch(productsApi, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || "Failed to duplicate product");
      setProducts((prev) => [toProduct(result.data ?? result), ...prev]);
      showToast(`Duplicated "${product.title}"`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to duplicate product");
    }
  };

  // Delete Product
  const handleDelete = async (id: Product["id"], title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" ? This can't be undone.`)) return;
    try {
      const response = await apiFetch(`${productsApi}/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to remove product");
      setProducts((prev) => prev.filter((product) => product.id !== id));
      showToast(`Item #${id} removed.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to remove product");
    }
  };

  // Toggle "New In" tag
  const handleToggleNew = async (product: Product) => {
    const isCurrentlyNew = product.tag === "New" || product.isNew;
    const nextTag = isCurrentlyNew ? "Heritage" : "New";
    try {
      const response = await apiFetch(`${productsApi}/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({ tag: nextTag, isNew: !isCurrentlyNew }),
      });
      if (!response.ok) throw new Error("Failed to update product tag");
      setProducts((prev) => prev.map((item) => item.id === product.id ? { ...item, tag: nextTag, isNew: !isCurrentlyNew } : item));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update product tag");
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
    <div className="min-h-screen bg-white text-black pb-24">
      {/* Main Container */}
      <div className="max-w-[1520px] mx-auto px-4 sm:px-8 pt-8 space-y-8">
        {/* Title & Actions Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
          <div>
            <h1 className="text-2xl font-semibold text-black">Products</h1>
          <p className="text-sm text-neutral-600 mt-1">Add and edit products, prices, stock and categories.</p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={loadProducts}
              className="p-2.5 text-neutral-600 hover:text-black border border-neutral-300 hover:bg-neutral-100 transition-colors flex-shrink-0"
              title="Refresh Products"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => {
                setCatError("");
                setShowCategoriesModal(true);
              }}
              className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-white text-black border border-neutral-300 hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              <FolderPlus className="w-4 h-4 text-black" />
              <span>Manage Categories</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Inventory KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-neutral-200 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
              Active Catalog SKUs
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-black mt-1 flex items-baseline gap-2">
              {products.length}
              <span className="text-xs font-normal text-neutral-500">products</span>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
              Total Units On Hand
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-black mt-1 flex items-baseline gap-2">
              {totalUnits}
              <span className="text-xs font-normal text-neutral-500">pieces</span>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
              Inventory Valuation
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-black mt-1">
              ${totalValuationUSD.toLocaleString()}
              <span className="text-xs font-normal text-neutral-500 ml-1.5 block sm:inline">
                (Br {(totalValuationUSD * settings.exchangeRateUSDToETB).toLocaleString()})
              </span>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
              Stock Warnings
            </span>
            <div className="text-xl sm:text-2xl font-extrabold mt-1 flex items-center gap-3">
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
              placeholder="Search products by name, tag, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#f4f4f4] text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full md:w-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 whitespace-nowrap">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto px-2.5 py-1.5 bg-[#f4f4f4] border border-neutral-200 text-xs font-bold text-black focus:outline-none"
              >
                <option value="all">All Categories ({products.length})</option>
                {categories.map((cat) => {
                  const count = products.filter(
                    (p) => (p.category || "").toLowerCase() === cat.id.toLowerCase()
                  ).length;
                  return (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Stock Health Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 whitespace-nowrap">Stock:</span>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as "all" | "low" | "out" | "healthy")}
                className="w-full sm:w-auto px-2.5 py-1.5 bg-[#f4f4f4] border border-neutral-200 text-xs font-bold text-black focus:outline-none"
              >
                <option value="all">All Levels</option>
                <option value="low">Low Stock (&le; {lowStockThreshold})</option>
                <option value="out">Out of Stock (0)</option>
                <option value="healthy">Healthy Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* MOBILE PRODUCTS CARDS VIEW (md:hidden) */}
        <div className="md:hidden space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-neutral-200 p-8 text-center text-xs text-neutral-500">
              No products matching your filter criteria.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const stock = p.stock ?? 0;
              const isOut = stock === 0;
              const isLow = stock > 0 && stock <= lowStockThreshold;

              return (
                <div key={p.id} className="bg-white border border-neutral-200 p-4 space-y-3 shadow-2xs">
                  {/* Card Header: Image + Details + Tag */}
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-20 bg-neutral-100 relative flex-shrink-0 overflow-hidden border border-neutral-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] text-neutral-400 font-mono">#{p.id}</span>
                        <button
                          onClick={() => handleToggleNew(p)}
                          className={`text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded border transition-colors ${
                            p.tag === "New" || p.isNew
                              ? "bg-amber-50 text-amber-900 border-amber-300"
                              : "bg-neutral-50 text-neutral-500 border-neutral-200"
                          }`}
                        >
                          {p.tag || "Standard"}
                        </button>
                      </div>

                      <h3 className="text-sm font-bold text-black tracking-tight mt-0.5 truncate">
                        {p.title}
                      </h3>
                      <span className="text-[11px] text-neutral-500 block truncate">
                        {p.subtitle || "Handmade"}
                      </span>

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-700">
                          {getCategoryName(p.category)}
                        </span>
                        <span className="text-xs font-bold text-black">
                          ${p.price.toFixed(2)} USD
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          (Br{p.priceETB ? p.priceETB.toLocaleString() : (p.price * settings.exchangeRateUSDToETB).toLocaleString()})
                        </span>
                        <MarginNote price={p.price} cost={p.costPrice} />
                      </div>

                      {/* Mobile Colorways & Active Selector */}
                      {p.colors && p.colors.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-neutral-100 flex-wrap">
                          <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                            Colors:
                          </span>
                          <div className="flex items-center gap-1.5">
                            {p.colors.map((c, cIdx) => {
                              const isActive = cIdx === (p.activeColorIndex ?? 0);
                              return (
                                <button
                                  key={c.name}
                                  type="button"
                                  onClick={() => handleQuickSetActiveColor(p, cIdx)}
                                  className={`relative w-4 h-4 rounded-full border transition-all ${
                                    isActive
                                      ? "ring-2 ring-black border-white scale-110 shadow-xs"
                                      : "border-neutral-300 opacity-70 hover:opacity-100"
                                  }`}
                                  style={{ backgroundColor: c.hex }}
                                  title={`${c.name}${isActive ? " (Active)" : " (Click to set active)"}`}
                                />
                              );
                            })}
                          </div>
                          <span className="text-[10px] font-bold text-black flex items-center gap-1">
                            {p.colors[p.activeColorIndex ?? 0]?.name || p.colors[0]?.name}
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100 px-1 rounded">
                              Active
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stock Stepper & Health Status Bar */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Stock:
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAdjustStock(p, -1)}
                          className="w-7 h-7 flex items-center justify-center bg-neutral-100 active:bg-neutral-200 text-neutral-800 font-bold text-sm border border-neutral-300"
                          aria-label="Decrease stock"
                        >
                          -
                        </button>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 min-w-[36px] text-center border ${
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
                          className="w-7 h-7 flex items-center justify-center bg-neutral-100 active:bg-neutral-200 text-neutral-800 font-bold text-sm border border-neutral-300"
                          aria-label="Increase stock"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 font-bold ${
                        isOut ? "text-rose-700 bg-rose-50" : isLow ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50"
                      }`}
                    >
                      {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                    </span>
                  </div>

                  {/* Mobile Quick Actions Row */}
                  <div className="pt-2 border-t border-neutral-100 grid grid-cols-4 gap-1.5 text-xs">
                    <button
                      onClick={() => setEditingProduct({ ...p })}
                      className="py-2 px-1 text-center bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 font-bold text-neutral-700 flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDuplicate(p)}
                      className="py-2 px-1 text-center bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 font-bold text-neutral-700 flex items-center justify-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Clone</span>
                    </button>
                    <Link
                      href={`/products/${p.id}`}
                      target="_blank"
                      className="py-2 px-1 text-center bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 font-bold text-neutral-700 flex items-center justify-center gap-1"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      className="py-2 px-1 text-center bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold text-rose-700 flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP PRODUCTS TABLE (hidden md:block) */}
        <div className="hidden md:block bg-white border border-neutral-200 divide-y divide-neutral-100 overflow-hidden shadow-2xs">
          <div className="grid grid-cols-12 px-6 py-3.5 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            <div className="col-span-4">Product Silhouette</div>
            <div className="col-span-2">Category &amp; Tag</div>
            <div className="col-span-2 text-right">Price (USD / ETB)</div>
            <div className="col-span-2 text-center">Stock Inventory</div>
            <div className="col-span-2 text-right">Admin Actions</div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-500">
              No products matching your filter criteria.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const stock = p.stock ?? 0;
              const isOut = stock === 0;
              const isLow = stock > 0 && stock <= lowStockThreshold;

              return (
                <div
                  key={p.id}
                  className="grid grid-cols-12 px-6 py-4 items-center hover:bg-neutral-50/75 transition-colors"
                >
                  {/* Product Details */}
                  <div className="col-span-4 flex items-center gap-4">
                    <div className="w-14 h-16 bg-neutral-100 relative flex-shrink-0 overflow-hidden border border-neutral-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-black tracking-tight truncate">
                          {p.title}
                        </h3>
                        <span className="text-[10px] text-neutral-400 font-mono">#{p.id}</span>
                      </div>
                      <span className="text-[11px] text-neutral-500 block truncate">
                        {p.subtitle || "Handmade"}
                      </span>

                      {/* Colorways and 1-Click Active Selector */}
                      {p.colors && p.colors.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <div className="flex items-center -space-x-0.5">
                            {p.colors.map((c, cIdx) => {
                              const isActive = cIdx === (p.activeColorIndex ?? 0);
                              return (
                                <button
                                  key={c.name}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickSetActiveColor(p, cIdx);
                                  }}
                                  title={`${c.name}${
                                    isActive
                                      ? " (Active default - click to change)"
                                      : " (Click to set as Active Default)"
                                  }`}
                                  className={`relative w-4 h-4 rounded-full border transition-all ${
                                    isActive
                                      ? "ring-2 ring-black border-white z-10 scale-110 shadow-xs"
                                      : "border-neutral-300 opacity-70 hover:opacity-100 hover:scale-110 hover:z-10"
                                  }`}
                                  style={{ backgroundColor: c.hex }}
                                />
                              );
                            })}
                          </div>
                          <span className="text-[10px] text-neutral-500 font-medium flex items-center gap-1">
                            <span className="font-bold text-black truncate max-w-[100px]">
                              {p.colors[p.activeColorIndex ?? 0]?.name || p.colors[0]?.name}
                            </span>
                            <span className="text-[8px] font-extrabold uppercase tracking-widest text-amber-900 bg-amber-100 px-1 py-0.2 rounded flex items-center gap-0.5">
                              <Star className="w-2 h-2 fill-amber-700 text-amber-700" />
                              Active
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category & Tag */}
                  <div className="col-span-2">
                    <div className="space-y-1">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-neutral-100 px-2 py-0.5 rounded text-neutral-800">
                        {getCategoryName(p.category)}
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
                  <div className="col-span-2 text-right">
                    <div className="text-sm font-bold text-black">${p.price.toFixed(2)} USD</div>
                    <div className="text-[11px] text-neutral-500">
                      Br{p.priceETB ? p.priceETB.toLocaleString() : (p.price * settings.exchangeRateUSDToETB).toLocaleString()} ETB
                    </div>
                    <MarginNote price={p.price} cost={p.costPrice} />
                  </div>

                  {/* Stock Controls (Interactive +/- buttons) */}
                  <div className="col-span-2 flex flex-col items-center justify-center">
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
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingProduct({ ...p })}
                      className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
                      title="Edit Product Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(p)}
                      className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
                      title="Clone / Duplicate Product"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/products/${p.id}`}
                      target="_blank"
                      className="p-2 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
                      title="Preview in Storefront"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Product"
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
                className="p-1 text-neutral-400 hover:text-black text-sm font-bold" aria-label="Close">
                <X className="size-5" />
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
                    value={editingProduct.stock ?? 0}
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

              <CostField
                value={editingProduct.costPrice === null || editingProduct.costPrice === undefined ? "" : String(editingProduct.costPrice)}
                price={Number(editingProduct.price) || 0}
                rate={settings.exchangeRateUSDToETB}
                onChange={(v) =>
                  setEditingProduct({ ...editingProduct, costPrice: v === "" ? null : Math.max(0, parseFloat(v) || 0) })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Collection Category
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCatError("");
                        setNewCatName("");
                        setNewCatSlug("");
                        setNewCatDesc("");
                        setQuickCategoryTarget("edit");
                      }}
                      className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-800 hover:text-black underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      New Category
                    </button>
                  </div>
                  <select
                    value={editingProduct.category || ""}
                    onChange={(e) => {
                      if (e.target.value === "__NEW__") {
                        setCatError("");
                        setNewCatName("");
                        setNewCatSlug("");
                        setNewCatDesc("");
                        setQuickCategoryTarget("edit");
                      } else {
                        setEditingProduct({ ...editingProduct, category: e.target.value });
                      }
                    }}
                    className="w-full bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">No category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="__NEW__" className="font-bold text-neutral-900 bg-neutral-100">
                      + Create New Category...
                    </option>
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
                  Product Description
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

              {/* Multi-Color Management & Active Color Selector */}
              <ProductColorManager
                colors={editingProduct.colors || []}
                activeColorIndex={editingProduct.activeColorIndex ?? 0}
                onChange={(colors, activeIndex) => {
                  const activeColor = colors[activeIndex];
                  setEditingProduct({
                    ...editingProduct,
                    colors,
                    activeColorIndex: activeIndex,
                    activeColorName: activeColor?.name,
                    imageUrl: activeColor?.image || editingProduct.imageUrl,
                  });
                }}
              />

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
        <NewProductForm
          categories={categories}
          rate={settings.exchangeRateUSDToETB || 125}
          category={newProductCategory}
          onCategoryChange={setNewProductCategory}
          onRequestNewCategory={() => {
            setCatError("");
            setNewCatName("");
            setNewCatSlug("");
            setNewCatDesc("");
            setQuickCategoryTarget("add");
          }}
          onCancel={() => setShowAddModal(false)}
          onCreated={(created) => {
            setProducts((prev) => [created, ...prev]);
            setShowAddModal(false);
            setNewProductCategory("");
            showToast(`Product "${created.title}" added.`);
          }}
        />
      )}

      {/* Quick Add Category Modal (Invoked from inside Add/Edit Product Form) */}
      {quickCategoryTarget && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-black" />
                <h3 className="text-base font-extrabold text-black">
                  Create New Category
                </h3>
              </div>
              <button
                onClick={() => {
                  setQuickCategoryTarget(null);
                  setCatError("");
                }}
                className="text-neutral-400 hover:text-black p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              Create a new merchandise category. It will be saved and selected for this product.
            </p>

            {catError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {catError}
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-black">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Traditional Habesha Kemis, Evening &amp; Gala"
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    if (!newCatSlug || newCatSlug === newCatName.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
                      setNewCatSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                    }
                  }}
                  className="w-full bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-black">
                  Identifier / Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. habesha-kemis"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="w-full bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-xs font-mono text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-black">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Handcrafted festive ceremonial dresses"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setQuickCategoryTarget(null);
                  setCatError("");
                }}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreateCategory(quickCategoryTarget)}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors shadow-2xs"
              >
                Save &amp; Select
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Categories Management Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-neutral-500">
                    Taxonomy &amp; Merchandising
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black text-white">
                    {categories.length} Categories
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-black">
                  Categories
                </h2>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Create new collection categories, adjust metadata, and organize your storefront catalog filters.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCategoriesModal(false);
                  setCatError("");
                  setEditingCatId(null);
                }}
                className="p-2 text-neutral-400 hover:text-black border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Create New Category Card */}
              <div className="bg-neutral-50 border border-neutral-200 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-black" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-black">
                    Add New Category
                  </h3>
                </div>

                {catError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {catError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-black">
                      Category Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Habesha Kemis"
                      value={newCatName}
                      onChange={(e) => {
                        setNewCatName(e.target.value);
                        if (!newCatSlug || newCatSlug === newCatName.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
                          setNewCatSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                        }
                      }}
                      className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-black">
                      Slug / Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. habesha-kemis"
                      value={newCatSlug}
                      onChange={(e) => setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs font-mono text-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-black">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Handcrafted ceremonial pieces"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleCreateCategory("modal")}
                    className="px-5 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Category
                  </button>
                </div>
              </div>

              {/* Existing Categories Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
                    Active Catalog Categories ({categories.length})
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    Click Edit to rename or adjust description
                  </span>
                </div>

                <div className="border border-neutral-200 divide-y divide-neutral-200 bg-white">
                  {categories.map((cat) => {
                    const assigned = products.filter(
                      (p) => (p.category || "").toLowerCase() === cat.id.toLowerCase()
                    ).length;
                    const isEditing = editingCatId === cat.id;

                    return (
                      <div
                        key={cat.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors"
                      >
                        <div className="space-y-1 flex-1">
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <input
                                  type="text"
                                  value={editingCatName}
                                  onChange={(e) => setEditingCatName(e.target.value)}
                                  className="bg-white border border-neutral-300 px-2.5 py-1.5 text-xs font-bold text-black sm:w-48"
                                  placeholder="Category Name"
                                />
                                <input
                                  type="text"
                                  value={editingCatDesc}
                                  placeholder="Description"
                                  onChange={(e) => setEditingCatDesc(e.target.value)}
                                  className="bg-white border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-600 flex-1"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateCategory(cat.id)}
                                  className="px-3.5 py-1.5 bg-black text-white text-[10px] font-bold uppercase tracking-wider"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingCatId(null)}
                                  className="px-3.5 py-1.5 bg-neutral-100 text-neutral-600 text-[10px] font-bold uppercase tracking-wider"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-extrabold text-black">
                                  {cat.name}
                                </span>
                                <span className="text-[10px] font-mono bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                                  #{cat.id}
                                </span>
                                {cat.isDefault && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider bg-neutral-200 text-neutral-700 px-1.5 py-0.2 rounded">
                                    Core
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-500">
                                {cat.description || "No description"}
                              </p>
                            </>
                          )}
                        </div>

                        {!isEditing && (
                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                            <div className="text-left sm:text-right">
                              <span className="text-xs font-bold text-black block">
                                {assigned} {assigned === 1 ? "product" : "products"}
                              </span>
                              <span className="text-[10px] text-neutral-400">
                                in inventory
                              </span>
                            </div>

                            <div className="flex items-center gap-1 border-l border-neutral-200 pl-3">
                              <button
                                onClick={() => {
                                  setEditingCatId(cat.id);
                                  setEditingCatName(cat.name);
                                  setEditingCatDesc(cat.description || "");
                                }}
                                className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
                                title="Edit Category Name &amp; Description"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {!cat.isDefault && (
                                <button
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Delete Category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500">
              <span>Categories synchronize across storefront filters and Lookbook displays.</span>
              <button
                onClick={() => {
                  setShowCategoriesModal(false);
                  setCatError("");
                  setEditingCatId(null);
                }}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
