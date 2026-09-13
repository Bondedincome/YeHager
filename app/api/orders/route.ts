import { NextResponse } from "next/server";
import { db } from "../../lib/firebase";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, limit } from "firebase/firestore";
import { CustomerOrder } from "../../lib/auth-store";
import { authenticateRequest, requireAdmin } from "../../lib/auth-security";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    const lookupOrderNumber = searchParams.get("orderNumber");
    const lookupEmail = searchParams.get("email");

    // Allow guest lookup of a specific order if orderNumber and email are provided
    const isGuestLookup = !auth.authenticated && lookupOrderNumber && lookupEmail;

    if (!auth.authenticated && !isGuestLookup) {
      return NextResponse.json(
        { error: auth.error || "Authentication required to view orders" },
        { status: auth.status || 401 }
      );
    }

    const ordersCol = collection(db, "orders");
    const q = query(ordersCol, orderBy("createdAt", "desc"), limit(100));
    const snapshot = await getDocs(q);

    let firestoreOrders: CustomerOrder[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      firestoreOrders.push({
        id: docSnap.id,
        orderNumber: data.orderNumber || docSnap.id,
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

    // If admin, return all orders
    if (auth.authenticated && auth.payload?.role === "admin") {
      return NextResponse.json({ success: true, data: firestoreOrders });
    }

    // If authenticated customer or VIP, filter to only their own orders
    if (auth.authenticated && auth.payload) {
      const { userId, email } = auth.payload;
      firestoreOrders = firestoreOrders.filter(
        (o) =>
          (o.userId && o.userId === userId) ||
          (o.customerEmail && o.customerEmail.toLowerCase() === email.toLowerCase())
      );
      return NextResponse.json({ success: true, data: firestoreOrders });
    }

    // If guest lookup, filter strictly to the matched orderNumber and email
    if (isGuestLookup) {
      firestoreOrders = firestoreOrders.filter(
        (o) =>
          o.orderNumber.toLowerCase() === lookupOrderNumber.toLowerCase() &&
          o.customerEmail.toLowerCase() === lookupEmail.toLowerCase()
      );
      return NextResponse.json({ success: true, data: firestoreOrders });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch {
    // If firestore is not yet populated or offline, return empty list cleanly
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const auth = authenticateRequest(request);
    const body = await request.json();

    // If patron is authenticated, bind order to their verified identity
    const verifiedUserId = auth.authenticated && auth.payload ? auth.payload.userId : body.userId || "";
    const verifiedEmail = auth.authenticated && auth.payload ? auth.payload.email : body.customerEmail || "";

    const orderData = {
      orderNumber: body.orderNumber || `YH-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: verifiedUserId,
      customerEmail: verifiedEmail,
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

export async function PATCH(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Admin authorization required" }, { status: auth.status });
    }

    const body = await request.json();
    const { orderId, updates } = body;

    if (!orderId || !updates || typeof updates !== "object") {
      return NextResponse.json({ error: "orderId and updates object are required" }, { status: 400 });
    }

    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, updates);
    } catch (e) {
      console.warn("Firestore order update failed:", e);
    }

    return NextResponse.json({ success: true, orderId, updates });
  } catch (error) {
    console.error("Update order API error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Admin authorization required" }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "orderId parameter is required" }, { status: 400 });
    }

    try {
      await deleteDoc(doc(db, "orders", orderId));
    } catch (e) {
      console.warn("Firestore order deletion failed:", e);
    }

    return NextResponse.json({ success: true, deletedId: orderId });
  } catch (error) {
    console.error("Delete order API error:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
