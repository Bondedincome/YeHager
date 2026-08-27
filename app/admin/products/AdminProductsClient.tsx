"use client";

import { useEffect, useState } from "react";

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

  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    fetch(`${base}/products`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then(setProducts)
      .catch(console.error);
  }, [base]);

  const refresh = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return fetch(`${base}/products`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then(setProducts)
      .catch(console.error);
  };

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      price: Number(form.price),
      description: form.description,
      imageUrl: form.imageUrl,
      stock: Number(form.stock) || 0,
    };
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    await fetch(`${base}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
    setForm({ title: "", price: "", description: "", imageUrl: "", stock: "" });
    refresh();
  };

  const remove = async (id: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    await fetch(`${base}/products/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
    refresh();
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token)
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h2 className="text-2xl font-semibold mb-4">Admin: Products</h2>
        <p>
          You must <a className="underline" href="/admin/login">log in</a> to manage products.
        </p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <h2 className="text-2xl font-semibold mb-4">Admin: Products</h2>
      <form onSubmit={create} className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border p-3" />
        <input placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-lg border p-3" />
        <input placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="col-span-1 md:col-span-2 w-full rounded-lg border p-3" />
        <input placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full rounded-lg border p-3" />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="col-span-1 md:col-span-2 w-full rounded-lg border p-3" />
        <button className="col-span-1 md:col-span-2 rounded-full bg-zinc-900 text-white px-4 py-3">Create Product</button>
      </form>

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="flex flex-col gap-4 rounded-3xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-sm text-zinc-600">${p.price.toFixed(2)}</div>
            </div>
            <div className="flex gap-3">
              <button className="text-red-600" onClick={() => remove(p.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
