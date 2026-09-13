import { NextResponse } from "next/server";
import { getAllProducts, addProduct } from "../../lib/products-store";

export async function GET() {
  const backendUrl = process.env.NESTJS_BACKEND_URL || process.env.BACKEND_URL;
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl.replace(/\/$/, "")}/api/v1/products`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data) && data.length > 0) {
          return NextResponse.json({ data });
        }
      }
    } catch {
      // Fallback cleanly to local store
    }
  }

  const products = getAllProducts();
  return NextResponse.json({ data: products });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const product = addProduct({
      title: body.title || "Untitled Product",
      name: body.name || body.title || "Untitled Product",
      subtitle: body.subtitle,
      description: body.description || "",
      price: Number(body.price) || 0,
      priceETB: body.priceETB ? Number(body.priceETB) : undefined,
      imageUrl: body.imageUrl || "",
      stock: Number(body.stock) || 0,
      category: body.category || "sets",
      tag: body.tag || "New",
      colors: body.colors,
      activeColorIndex: body.activeColorIndex,
      activeColorName: body.activeColorName,
      details: body.details,
    });

    const backendUrl = process.env.NESTJS_BACKEND_URL || process.env.BACKEND_URL;
    if (backendUrl) {
      try {
        await fetch(`${backendUrl.replace(/\/$/, "")}/api/v1/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(product),
        });
      } catch {
        // Continue
      }
    }

    return NextResponse.json({ data: product, ...product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create product" }, { status: 400 });
  }
}
