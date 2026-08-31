import { NextResponse } from "next/server";
import { getProductById, deleteProduct } from "../../../lib/products-store";
import { getSupabaseAdmin, getSupabase } from "../../../lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        return NextResponse.json({
          id: data.id,
          title: data.title,
          name: data.name || data.title,
          subtitle: data.subtitle,
          description: data.description,
          price: Number(data.price),
          priceETB: Number(data.price_etb || data.price * 125),
          formattedPriceETB: data.formatted_price_etb,
          imageUrl: data.image_url,
          galleryImages: data.gallery_images || [data.image_url],
          category: data.category,
          isNew: data.is_new,
          tag: data.tag,
          colors: data.colors || [],
          sizes: data.sizes || [],
          stock: data.stock,
          details: data.details || {},
        });
      }
    } catch {
      // fallback
    }
  }

  const product = getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteProduct(id);

  const supabaseAdmin = getSupabaseAdmin() || getSupabase();
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from("products").delete().eq("id", id);
    } catch {
      // ignore
    }
  }

  if (!deleted) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: "Product deleted" });
}

