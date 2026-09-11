import { NextResponse } from "next/server";
import { getAllProducts, addProduct } from "../../lib/products-store";
import { getSupabaseAdmin, getSupabase } from "../../lib/supabase";

export async function GET() {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mappedProducts = data.map((item) => ({
          id: item.id,
          title: item.title,
          name: item.name || item.title,
          subtitle: item.subtitle,
          description: item.description,
          price: Number(item.price),
          priceETB: Number(item.price_etb || item.price * 125),
          formattedPriceETB: item.formatted_price_etb,
          imageUrl: item.image_url,
          galleryImages: item.gallery_images || [item.image_url],
          category: item.category,
          isNew: item.is_new,
          tag: item.tag,
          colors: item.colors || [],
          activeColorIndex: item.active_color_index ?? item.activeColorIndex ?? 0,
          activeColorName: item.active_color_name ?? item.activeColorName,
          sizes: item.sizes || [],
          stock: item.stock,
          details: item.details || {},
        }));
        return NextResponse.json({ data: mappedProducts });
      }
    } catch {
      // Fallback to local catalog if table not yet populated or offline
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

    const supabaseAdmin = getSupabaseAdmin() || getSupabase();
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from("products").insert({
          id: product.id,
          title: product.title,
          name: product.name,
          subtitle: product.subtitle || "",
          description: product.description || "",
          price: product.price,
          price_etb: product.priceETB,
          formatted_price_etb: product.formattedPriceETB,
          image_url: product.imageUrl,
          gallery_images: product.galleryImages,
          category: product.category,
          is_new: product.isNew,
          tag: product.tag,
          colors: product.colors,
          sizes: product.sizes,
          stock: product.stock,
          details: product.details,
        });
      } catch {
        // Fallback gracefully
      }
    }

    return NextResponse.json({ data: product, ...product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create product" }, { status: 400 });
  }
}

