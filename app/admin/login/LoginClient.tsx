"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginClient() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  const loginApi = base ? `${base}/auth/login` : "/api/auth/login";

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(loginApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.access_token);
      }
      router.push('/admin/products');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 sm:p-8">
      <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm">
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8b5e34]">YeHagere Admin</span>
          <h2 className="text-2xl font-bold text-zinc-900 mt-1">Sign In</h2>
          <p className="text-sm text-zinc-500 mt-1">Sign in to manage the store catalog and appearance.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full rounded-xl border border-zinc-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5e34]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-zinc-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5e34]"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3 text-sm transition disabled:opacity-50"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>

          {error && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}

          <div className="text-center pt-4 border-t border-zinc-100">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900 transition">
              ← Return to Storefront
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
