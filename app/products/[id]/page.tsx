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
      <div className="px-6 sm:px-12">
        <div className="max-w-xl mx-auto text-center py-24 space-y-4">
          <h1 className="heading-display text-4xl">Product not found</h1>
          <p className="text-sm text-neutral-600">This product is no longer available.</p>
          <div className="pt-4">
            <Link href="/products" className="btn-primary">
              Shop all
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ProductDetailClient product={product} />;
}


