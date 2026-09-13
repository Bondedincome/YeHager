import { NextResponse } from "next/server";

// Global in-memory inquiries store for local development/preview fallback
declare global {
  var __YEHAGERE_INQUIRIES__: Array<{
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: string;
  }> | undefined;
}

function getInquiriesStore() {
  if (!globalThis.__YEHAGERE_INQUIRIES__) {
    globalThis.__YEHAGERE_INQUIRIES__ = [
      {
        id: "inq_1",
        name: "Yared Wolde",
        email: "yared@example.com",
        subject: "Bespoke Habesha Kemis Consultation",
        message: "Inquiring about a custom wedding garment with gold tilet embellishments.",
        createdAt: new Date().toISOString(),
      },
    ];
  }
  return globalThis.__YEHAGERE_INQUIRIES__;
}

export async function GET() {
  const backendUrl = process.env.NESTJS_BACKEND_URL || process.env.BACKEND_URL;
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl.replace(/\/$/, "")}/api/v1/inquiries`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        return NextResponse.json({ success: true, data });
      }
    } catch {
      // Fallback
    }
  }

  return NextResponse.json({ success: true, data: getInquiriesStore() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    const record = {
      id: `inq_${Date.now()}`,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      subject: String(subject || "General Concierge Inquiry").trim(),
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
    };

    const backendUrl = process.env.NESTJS_BACKEND_URL || process.env.BACKEND_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl.replace(/\/$/, "")}/api/v1/inquiries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        });
        if (res.ok) {
          const json = await res.json();
          return NextResponse.json({ success: true, data: json.data || json }, { status: 201 });
        }
      } catch {
        // Fallback
      }
    }

    const store = getInquiriesStore();
    store.unshift(record);

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error("Inquiries API error:", error);
    return NextResponse.json({ error: "Failed to record inquiry" }, { status: 500 });
  }
}
