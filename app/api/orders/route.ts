import { NextResponse } from "next/server";
import { db } from "../../lib/firebase";
import { collection, getDocs, addDoc, query, orderBy, limit } from "firebase/firestore";
import { CustomerOrder } from "../../lib/auth-store";

export async function GET() {
  try {
    const ordersCol = collection(db, "orders");
    const q = query(ordersCol, orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);

    const firestoreOrders: CustomerOrder[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      firestoreOrders.push({
        id: doc.id,
        orderNumber: data.orderNumber || doc.id,
        userId: data.userId,
        customerEmail: data.customerEmail || "",
        customerName: data.customerName || "",
        items: data.items || [],
        totalUSD: data.totalUSD || 0,
        totalETB: data.totalETB || 0,
        status: data.status || "confirmed",
        paymentMethod: data.paymentMethod || "stripe",
        paymentIntentId: data.paymentIntentId,
        last4: data.last4 || "4242",
        createdAt: data.createdAt || new Date().toISOString(),
        shippingAddress: data.shippingAddress || {
          street: "",
          city: "",
          postalCode: "",
          country: "",
        },
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        internalNotes: data.internalNotes,
      });
    });

    return NextResponse.json({ success: true, data: firestoreOrders });
  } catch {
    // If firestore is not yet populated or offline, return empty list cleanly
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderData = {
      orderNumber: body.orderNumber || `YH-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: body.userId || "",
      customerEmail: body.customerEmail || "",
      customerName: body.customerName || "Atelier Client",
      items: body.items || [],
      totalUSD: Number(body.totalUSD) || 0,
      totalETB: Number(body.totalETB) || 0,
      status: body.status || "confirmed",
      paymentMethod: body.paymentMethod || "stripe",
      paymentIntentId: body.paymentIntentId || `pi_${Date.now()}`,
      last4: body.last4 || "4242",
      createdAt: body.createdAt || new Date().toISOString(),
      shippingAddress: body.shippingAddress || {},
      trackingNumber: `DHL-ET-${Math.floor(1000000 + Math.random() * 9000000)}`,
      carrier: "DHL Express Heritage Courier",
    };

    try {
      const ordersCol = collection(db, "orders");
      const docRef = await addDoc(ordersCol, orderData);
      return NextResponse.json(
        { success: true, data: { ...orderData, id: docRef.id } },
        { status: 201 }
      );
    } catch {
      // Fallback: return order with local ID
      return NextResponse.json(
        { success: true, data: { ...orderData, id: `ord_${Date.now()}` } },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Failed to process order:", error);
    return NextResponse.json({ error: "Failed to record order" }, { status: 400 });
  }
}
