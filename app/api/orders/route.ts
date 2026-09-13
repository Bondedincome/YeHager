import { NextResponse } from "next/server";
import { CustomerOrder } from "../../lib/auth-store";
import { authenticateRequest, requireAdmin } from "../../lib/auth-security";

// Global in-memory orders cache for local development/preview fallback
declare global {
  var __YEHAGERE_ORDERS__: CustomerOrder[] | undefined;
}

function getOrdersStore(): CustomerOrder[] {
  if (!globalThis.__YEHAGERE_ORDERS__) {
    globalThis.__YEHAGERE_ORDERS__ = [
      {
        id: "ord_101",
        orderNumber: "YH-748291",
        userId: "usr_client_01",
        customerEmail: "daniot.mihrete-ug@aau.edu.et",
        customerName: "Daniot Mihrete",
        items: [
          {
            id: 1,
            title: "The micro cable polo",
            price: 210.0,
            quantity: 1,
            color: "Cream",
            size: "M",
          },
        ],
        totalUSD: 210.0,
        totalETB: 26250.0,
        status: "confirmed",
        paymentMethod: "stripe",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        shippingAddress: {
          street: "Bole Medhanialem",
          city: "Addis Ababa",
          postalCode: "1000",
          country: "Ethiopia",
        },
        trackingNumber: "DHL-ET-9182736",
        carrier: "DHL Express Heritage Courier",
      },
    ];
  }
  return globalThis.__YEHAGERE_ORDERS__;
}

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    const lookupOrderNumber = searchParams.get("orderNumber");
    const lookupEmail = searchParams.get("email");

    const isGuestLookup = !auth.authenticated && lookupOrderNumber && lookupEmail;

    if (!auth.authenticated && !isGuestLookup) {
      return NextResponse.json(
        { error: auth.error || "Authentication required to view orders" },
        { status: auth.status || 401 }
      );
    }

    // Try fetching from NestJS backend if available
    const backendUrl = process.env.NESTJS_BACKEND_URL || process.env.BACKEND_URL;
    if (backendUrl) {
      try {
        const headers: Record<string, string> = {};
        const authHeader = request.headers.get("authorization");
        if (authHeader) headers["authorization"] = authHeader;
        const res = await fetch(`${backendUrl.replace(/\/$/, "")}/api/v1/orders`, {
          headers,
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          return NextResponse.json({ success: true, data });
        }
      } catch {
        // Continue to local store fallback
      }
    }

    const orders = getOrdersStore();

    if (auth.authenticated && auth.payload?.role === "admin") {
      return NextResponse.json({ success: true, data: orders });
    }

    if (auth.authenticated && auth.payload) {
      const { userId, email } = auth.payload;
      const userOrders = orders.filter(
        (o) =>
          (o.userId && o.userId === userId) ||
          (o.customerEmail && o.customerEmail.toLowerCase() === email.toLowerCase())
      );
      return NextResponse.json({ success: true, data: userOrders });
    }

    if (isGuestLookup) {
      const guestOrders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase() === lookupOrderNumber.toLowerCase() &&
          o.customerEmail.toLowerCase() === lookupEmail.toLowerCase()
      );
      return NextResponse.json({ success: true, data: guestOrders });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const auth = authenticateRequest(request);
    const body = await request.json();

    const verifiedUserId = auth.authenticated && auth.payload ? auth.payload.userId : body.userId || "";
    const verifiedEmail = auth.authenticated && auth.payload ? auth.payload.email : body.customerEmail || "";

    const orderData: CustomerOrder = {
      id: `ord_${Date.now()}`,
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
      shippingAddress: body.shippingAddress || {
        street: "",
        city: "",
        postalCode: "",
        country: "",
      },
      trackingNumber: `DHL-ET-${Math.floor(1000000 + Math.random() * 9000000)}`,
      carrier: "DHL Express Heritage Courier",
    };

    const backendUrl = process.env.NESTJS_BACKEND_URL || process.env.BACKEND_URL;
    if (backendUrl) {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const authHeader = request.headers.get("authorization");
        if (authHeader) headers["authorization"] = authHeader;
        const res = await fetch(`${backendUrl.replace(/\/$/, "")}/api/v1/orders`, {
          method: "POST",
          headers,
          body: JSON.stringify(orderData),
        });
        if (res.ok) {
          const json = await res.json();
          const created = json.data || json;
          return NextResponse.json({ success: true, data: created }, { status: 201 });
        }
      } catch {
        // Fallback to local store
      }
    }

    const store = getOrdersStore();
    store.unshift(orderData);

    return NextResponse.json(
      { success: true, data: orderData },
      { status: 201 }
    );
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

    const store = getOrdersStore();
    const orderIndex = store.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (orderIndex >= 0) {
      store[orderIndex] = { ...store[orderIndex], ...updates };
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

    const store = getOrdersStore();
    const index = store.findIndex((o) => o.id === orderId);
    if (index >= 0) {
      store.splice(index, 1);
    }

    return NextResponse.json({ success: true, deletedId: orderId });
  } catch (error) {
    console.error("Delete order API error:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
