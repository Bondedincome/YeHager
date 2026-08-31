"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Product = {
  id: number;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stock?: number;
};

export default function AdminProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ title: "", price: "", description: "", imageUrl: "", stock: "" });
  const [loading, setLoading] = useState(false);

  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  const productsApi = base ? `${base}/products` : "/api/products";

  const loadProducts = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setLoading(true);
    fetch(productsApi, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((res) => {
        const items = Array.isArray(res) ? res : (res?.data ?? []);
        setProducts(items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productsApi]);

  useEffect(() => {
    let active = true;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    fetch(productsApi, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((res) => {
        if (!active) return;
        const items = Array.isArray(res) ? res : (res?.data ?? []);
        setProducts(items);
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, [productsApi]);

  const refresh = () => {
    loadProducts();
  };

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.title) return;
    const payload = {
      title: form.title,
      name: form.title,
      price: Number(form.price) || 0,
      description: form.description,
      imageUrl: form.imageUrl,
      stock: Number(form.stock) || 0,
    };
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    await fetch(productsApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });
    setForm({ title: "", price: "", description: "", imageUrl: "", stock: "" });
    refresh();
  };

  const remove = async (id: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    await fetch(`${productsApi}/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    refresh();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/admin/login';
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token)
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h2 className="text-2xl font-semibold mb-4">Admin: Products</h2>
        <p className="text-zinc-600 mb-4">
          You must <Link className="underline font-medium text-[#8b5e34]" href="/admin/login">log in</Link> to manage products.
        </p>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">← Back to Storefront</Link>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-zinc-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8b5e34]">YeHagere Admin</span>
          <h2 className="text-2xl font-bold text-zinc-900">Product Management</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/appearance" className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg transition">
            Appearance
          </Link>
          <Link href="/" className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg transition">
            View Store
          </Link>
          <button onClick={handleLogout} className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition">
            Logout
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm mb-8">
        <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
        <form onSubmit={create} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input placeholder="Title / Product Name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-zinc-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5e34]" required />
          <input placeholder="Price (e.g. 189.99)" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-lg border border-zinc-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5e34]" required />
          <input placeholder="Image URL (https://...)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="col-span-1 md:col-span-2 w-full rounded-lg border border-zinc-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5e34]" />
          <input placeholder="Stock (e.g. 15)" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full rounded-lg border border-zinc-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5e34]" />
          <input placeholder="Short Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-zinc-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5e34]" />
          <button className="col-span-1 md:col-span-2 rounded-xl bg-zinc-900 text-white px-4 py-3 text-sm font-medium hover:bg-zinc-800 transition">Create Product</button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900">Current Catalog ({products.length})</h3>
          {loading && <span className="text-xs text-zinc-500">Refreshing...</span>}
        </div>
        {products.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4">No products in catalog.</p>
        ) : (
          products.map((p) => (
            <div key={p.id} className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
              <div className="flex items-center gap-4">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.title} className="w-14 h-14 object-cover rounded-xl bg-zinc-100 flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center text-xs text-zinc-400 flex-shrink-0">No img</div>
                )}
                <div>
                  <div className="font-semibold text-zinc-900">{p.title}</div>
                  <div className="text-sm text-zinc-500">${p.price.toFixed(2)} • Stock: {p.stock ?? 0}</div>
                  {p.description && <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{p.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/products/${p.id}`} className="text-xs text-zinc-600 hover:text-zinc-900 border px-3 py-1.5 rounded-lg">View</Link>
                <button className="text-xs text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition" onClick={() => remove(p.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
