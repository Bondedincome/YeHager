import Link from "next/link";
import { NESTJS_API_BASE } from "../../lib/api";
import ProductDetailClient from "../../components/ProductDetailClient";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product = null;
  try {
    const response = await fetch(`${NESTJS_API_BASE}/products/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (response.ok) {
      const payload = await response.json();
      product = payload.data ?? payload;
    }
  } catch {
    product = null;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white text-black p-6 sm:p-12">
        <div className="max-w-xl mx-auto text-center py-24 space-y-4">
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <p className="text-sm text-neutral-600">The garment or collection item you requested is currently unavailable.</p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-block bg-black text-white px-8 py-3.5 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
            >
              Return to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ProductDetailClient product={product} />;
}


