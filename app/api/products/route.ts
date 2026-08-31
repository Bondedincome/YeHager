import { NextResponse } from "next/server";
import { getAllProducts, addProduct } from "../../lib/products-store";
import { db } from "../../lib/firebase";
import { serverTimestamp, getDocs, query, orderBy, doc, setDoc, collection } from "firebase/firestore";

export async function GET() {
  try {
    if (db) {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestoreProducts = snapshot.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.data().id || docSnap.id,
        }));
        return NextResponse.json({ data: firestoreProducts });
      }
    }
  } catch {
    // Fallback to local catalog
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
      description: body.description || "",
      price: Number(body.price) || 0,
      imageUrl: body.imageUrl || "",
      stock: Number(body.stock) || 0,
    });

    // Mirror to Firestore collection
    try {
      if (db) {
        const productRef = doc(db, "products", String(product.id));
        await setDoc(productRef, {
          ...product,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ data: product, ...product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create product" }, { status: 400 });
  }
}

