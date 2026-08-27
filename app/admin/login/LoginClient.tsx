"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginClient() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <h2 className="text-2xl font-semibold mb-4">Admin Login</h2>
      <form onSubmit={submit} className="space-y-3">
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="w-full p-2 border" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" className="w-full p-2 border" />
        <div className="flex items-center justify-between">
          <button type="submit" className="rounded bg-zinc-900 text-white px-4 py-2">Login</button>
        </div>
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
}
