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
} from "lucide-react";
import {
  Product,
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
} from "../../lib/products-store";
import {
  Category,
  getAllCategories,
  addCategory,
  deleteCategory,
  updateCategory,
} from "../../lib/categories-store";
import { getStoreSettings } from "../../lib/settings-store";

export default function AdminProductsClient() {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      return getAllProducts();
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  // Categories State
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      return getAllCategories();
    } catch {
      return [];
    }
  });
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

  // New Product Form State
  const initialForm: {
    title: string;
    subtitle: string;
    category: string;
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

  const loadProducts = useCallback(async () => {
    setLoading(true);
    let loadedFromApi = false;
    try {
      const res = await fetch(productsApi);
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json?.data;
        if (Array.isArray(items) && items.length > 0) {
          setProducts(items);
          loadedFromApi = true;
        }
      }
    } catch {
      // Chrome extension, adblocker, or network issue - fallback seamlessly to local store
    } finally {
      setLoading(false);
    }

    if (!loadedFromApi) {
      try {
        const localItems = getAllProducts();
        if (Array.isArray(localItems) && localItems.length > 0) {
          setProducts(localItems);
        }
      } catch {
        // Safe fallback
      }
    }
  }, [productsApi]);

  useEffect(() => {
    let active = true;
    const fetchCatalog = async () => {
      try {
        const res = await fetch(productsApi);
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json) ? json : json?.data;
          if (active && Array.isArray(items) && items.length > 0) {
            setProducts(items);
            return;
          }
        }
      } catch {
        // Fallback silently without throwing unhandled rejection
      }
      if (active) {
        try {
          const localItems = getAllProducts();
          if (Array.isArray(localItems) && localItems.length > 0) {
            setProducts(localItems);
          }
        } catch {
          // Safe fallback
        }
      }
    };

    fetchCatalog();
    return () => {
      active = false;
    };
  }, [productsApi]);

  // Category Synchronization & Handlers
  useEffect(() => {
    const handleSync = () => {
      setCategories(getAllCategories());
    };
    window.addEventListener("yehagere_categories_updated", handleSync);
    return () => window.removeEventListener("yehagere_categories_updated", handleSync);
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        const items = Array.isArray(json) ? json : json?.data;
        if (Array.isArray(items) && items.length > 0) {
          setCategories(items);
        }
      })
      .catch(() => {});
  }, []);

  const getCategoryName = useCallback(
    (slug?: string) => {
      if (!slug) return "Matching Sets";
      const match = categories.find((c) => c.id.toLowerCase() === slug.toLowerCase());
      if (match) return match.name;
      return slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    },
    [categories]
  );

  const handleCreateCategory = (target?: "add" | "edit" | "modal") => {
    if (!newCatName.trim()) {
      setCatError("Please enter a category title");
      return;
    }
    setCatError("");
    try {
      const created = addCategory({
        name: newCatName.trim(),
        id: newCatSlug.trim() || undefined,
        description: newCatDesc.trim(),
      });
      const updatedList = getAllCategories();
      setCategories(updatedList);

      if (target === "add") {
        setFormData((prev) => ({ ...prev, category: created.id }));
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

      fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(created),
      }).catch(() => {});
    } catch (err) {
      setCatError(err instanceof Error ? err.message : "Failed to create category");
    }
  };

  const handleDeleteCategory = (cat: Category) => {
    const assignedCount = products.filter(
      (p) => (p.category || "").toLowerCase() === cat.id.toLowerCase()
    ).length;

    const confirmMsg =
      assignedCount > 0
        ? `Category "${cat.name}" currently has ${assignedCount} garment(s) assigned to it. Deleting this category will reassign those garments to "Matching Sets". Proceed?`
        : `Are you sure you want to delete category "${cat.name}"?`;

    if (!confirm(confirmMsg)) return;

    if (assignedCount > 0) {
      products.forEach((p) => {
        if ((p.category || "").toLowerCase() === cat.id.toLowerCase()) {
          updateProduct(p.id, { category: "sets" });
        }
      });
      setProducts(getAllProducts());
    }

    deleteCategory(cat.id);
    setCategories(getAllCategories());
    showToast(`Category "${cat.name}" deleted.`);

    fetch(`/api/categories/${cat.id}`, { method: "DELETE" }).catch(() => {});
  };

  const handleUpdateCategory = (catId: string) => {
    if (!editingCatName.trim()) return;
    updateCategory(catId, {
      name: editingCatName.trim(),
      description: editingCatDesc.trim(),
    });
    setCategories(getAllCategories());
    setEditingCatId(null);
    showToast("Category updated.");

    fetch(`/api/categories/${catId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingCatName.trim(), description: editingCatDesc.trim() }),
    }).catch(() => {});
  };

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

    const createdLocal = addProduct(payload);
    setProducts((prev) => [createdLocal, ...prev]);
    setFormData(initialForm);
    setShowAddModal(false);
    showToast(`Garment "${formData.title}" added to atelier catalog!`);

    try {
      await fetch(productsApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Safe fallback - item is already in local catalog
    }
  };

  // Update Product (Full Edit)
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const updated = updateProduct(editingProduct.id, {
      ...editingProduct,
      price: Number(editingProduct.price),
      priceETB: Number(editingProduct.priceETB || editingProduct.price * settings.exchangeRateUSDToETB),
      stock: Number(editingProduct.stock),
    });
    if (updated) {
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
    showToast(`Garment #${editingProduct.id} "${editingProduct.title}" updated successfully.`);
    setEditingProduct(null);

    try {
      await fetch(`${productsApi}/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingProduct,
          price: Number(editingProduct.price),
          priceETB: Number(editingProduct.priceETB || editingProduct.price * settings.exchangeRateUSDToETB),
          stock: Number(editingProduct.stock),
        }),
      });
    } catch {
      // Safe fallback
    }
  };

  // Quick Stock Adjustment (+ / -)
  const handleAdjustStock = async (product: Product, delta: number) => {
    const newStock = Math.max(0, (product.stock ?? 0) + delta);
    updateProduct(product.id, { stock: newStock });
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
    );

    try {
      await fetch(`${productsApi}/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
    } catch {
      // Safe fallback
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

    const duplicated = duplicateProduct(product.id);
    if (duplicated) {
      setProducts((prev) => [duplicated, ...prev]);
      showToast(`Duplicated "${product.title}"`);
    }

    try {
      await fetch(productsApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Safe fallback
    }
  };

  // Delete Product
  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the atelier catalog?`)) return;
    deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast(`Item #${id} removed.`);

    try {
      await fetch(`${productsApi}/${id}`, { method: "DELETE" });
    } catch {
      // Safe fallback
    }
  };

  // Toggle "New In" tag
  const handleToggleNew = async (product: Product) => {
    const isCurrentlyNew = product.tag === "New" || product.isNew;
    const nextTag = isCurrentlyNew ? "Heritage" : "New";
    updateProduct(product.id, { tag: nextTag, isNew: !isCurrentlyNew });
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, tag: nextTag, isNew: !isCurrentlyNew } : p
      )
    );

    try {
      await fetch(`${productsApi}/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: nextTag, isNew: !isCurrentlyNew }),
      });
    } catch {
      // Safe fallback
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
              onClick={() => {
                setCatError("");
                setShowCategoriesModal(true);
              }}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-white text-black border border-neutral-300 hover:bg-neutral-100 transition-colors flex items-center gap-2 shadow-2xs"
            >
              <FolderPlus className="w-4 h-4 text-black" />
              Manage Categories
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
                          {getCategoryName(p.category)}
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
                    value={editingProduct.category || "sets"}
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
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCatError("");
                        setNewCatName("");
                        setNewCatSlug("");
                        setNewCatDesc("");
                        setQuickCategoryTarget("add");
                      }}
                      className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-800 hover:text-black underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      New Category
                    </button>
                  </div>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      if (e.target.value === "__NEW__") {
                        setCatError("");
                        setNewCatName("");
                        setNewCatSlug("");
                        setNewCatDesc("");
                        setQuickCategoryTarget("add");
                      } else {
                        setFormData({ ...formData, category: e.target.value });
                      }
                    }}
                    className="w-full bg-[#f4f4f4] border border-neutral-300 px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                  >
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

      {/* Quick Add Category Modal (Invoked from inside Add/Edit Garment Form) */}
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
              Create a new merchandise category. It will be immediately saved to the atelier taxonomy and selected for this garment.
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
                  Atelier Garment Categories
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
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingCatName}
                                  onChange={(e) => setEditingCatName(e.target.value)}
                                  className="bg-white border border-neutral-300 px-2 py-1 text-xs font-bold text-black"
                                />
                                <input
                                  type="text"
                                  value={editingCatDesc}
                                  placeholder="Description"
                                  onChange={(e) => setEditingCatDesc(e.target.value)}
                                  className="bg-white border border-neutral-300 px-2 py-1 text-xs text-neutral-600 flex-1"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateCategory(cat.id)}
                                  className="px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingCatId(null)}
                                  className="px-3 py-1 bg-neutral-100 text-neutral-600 text-[10px] font-bold uppercase tracking-wider"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
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
                                {cat.description || "Atelier seasonal collection"}
                              </p>
                            </>
                          )}
                        </div>

                        {!isEditing && (
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-xs font-bold text-black block">
                                {assigned} {assigned === 1 ? "garment" : "garments"}
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
