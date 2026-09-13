import { NextResponse } from "next/server";
import { db } from "../../lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { INITIAL_USERS } from "../../lib/auth-seed";
import { INITIAL_ORDERS, AppUser, CustomerOrder } from "../../lib/auth-store";
import { requireAdmin } from "../../lib/auth-security";

export async function GET(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Admin authorization required" }, { status: auth.status });
    }

    const usersSnap = await getDocs(collection(db, "users"));
    const ordersSnap = await getDocs(collection(db, "orders"));
    const inqSnap = await getDocs(collection(db, "inquiries"));

    return NextResponse.json({
      success: true,
      status: {
        firestoreUsersCount: usersSnap.size,
        firestoreOrdersCount: ordersSnap.size,
        firestoreInquiriesCount: inqSnap.size,
        isSeeded: usersSnap.size > 0,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to inspect Firestore collections",
    });
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Admin authorization required" }, { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const clientUsers: AppUser[] = Array.isArray(body.users) ? body.users : [];
    const clientOrders: CustomerOrder[] = Array.isArray(body.orders) ? body.orders : [];

    let migratedUsersCount = 0;
    let migratedOrdersCount = 0;

    // Combine INITIAL_USERS with clientUsers
    const usersToMigrate = [...INITIAL_USERS];
    for (const u of clientUsers) {
      if (!usersToMigrate.some((existing) => existing.id === u.id || existing.email.toLowerCase() === u.email.toLowerCase())) {
        usersToMigrate.push(u);
      }
    }

    // Write users to Firestore
    for (const user of usersToMigrate) {
      try {
        await setDoc(doc(db, "users", user.id), user, { merge: true });
        migratedUsersCount++;
      } catch (err) {
        console.warn(`Failed migrating user ${user.id}:`, err);
      }
    }

    // Combine INITIAL_ORDERS with clientOrders
    const ordersToMigrate = [...INITIAL_ORDERS];
    for (const o of clientOrders) {
      if (!ordersToMigrate.some((existing) => existing.id === o.id || existing.orderNumber === o.orderNumber)) {
        ordersToMigrate.push(o);
      }
    }

    // Write orders to Firestore
    for (const order of ordersToMigrate) {
      try {
        await setDoc(doc(db, "orders", order.id), order, { merge: true });
        migratedOrdersCount++;
      } catch (err) {
        console.warn(`Failed migrating order ${order.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data migration to Cloud Firestore completed successfully.",
      summary: {
        migratedUsers: migratedUsersCount,
        migratedOrders: migratedOrdersCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to complete data migration to Firestore." },
      { status: 500 }
    );
  }
}
