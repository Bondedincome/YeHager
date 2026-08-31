import { NextResponse } from "next/server";
import { getProductById, deleteProduct } from "../../../lib/products-store";
import { db } from "../../../lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  try {
    if (db) {
      await deleteDoc(doc(db, "products", id));
    }
  } catch {
    // ignore
  }
  if (!deleted) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: "Product deleted" });
}

