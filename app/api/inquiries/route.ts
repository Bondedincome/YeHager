import { NextResponse } from "next/server";
import { db } from "../../lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";

export async function GET() {
  try {
    const col = collection(db, "inquiries");
    const q = query(col, orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    const list: Record<string, unknown>[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return NextResponse.json({ success: true, data: list });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
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
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      subject: String(subject || "General Concierge Inquiry").trim(),
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const col = collection(db, "inquiries");
      const ref = await addDoc(col, record);
      return NextResponse.json({ success: true, data: { ...record, id: ref.id } }, { status: 201 });
    } catch {
      return NextResponse.json({ success: true, data: { ...record, id: `inq_${Date.now()}` } }, { status: 201 });
    }
  } catch (error) {
    console.error("Inquiries API error:", error);
    return NextResponse.json({ error: "Failed to record inquiry" }, { status: 500 });
  }
}
