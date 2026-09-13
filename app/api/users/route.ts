import { NextResponse } from "next/server";
import { db } from "../../lib/firebase";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { INITIAL_USERS, AppUser } from "../../lib/auth-seed";
import { hashPassword, requireAdmin } from "../../lib/auth-security";

function sanitize(user: AppUser): Omit<AppUser, "passwordHash" | "passwordSalt"> {
  const sanitized = { ...user };
  delete (sanitized as Partial<AppUser>).passwordHash;
  delete (sanitized as Partial<AppUser>).passwordSalt;
  return sanitized;
}

export async function GET(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Admin authorization required" }, { status: auth.status });
    }

    const col = collection(db, "users");
    const snapshot = await getDocs(col);

    if (snapshot.empty) {
      // Seed Firestore with INITIAL_USERS
      const seeded: AppUser[] = [];
      for (const u of INITIAL_USERS) {
        await setDoc(doc(db, "users", u.id), u);
        seeded.push(u);
      }
      return NextResponse.json({ success: true, data: seeded.map(sanitize) });
    }

    const users: AppUser[] = [];
    snapshot.forEach((d) => {
      users.push({ id: d.id, ...d.data() } as AppUser);
    });

    return NextResponse.json({ success: true, data: users.map(sanitize) });
  } catch (error) {
    console.warn("Firestore users read fallback to seed:", error);
    return NextResponse.json({ success: true, data: INITIAL_USERS.map(sanitize) });
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Admin authorization required" }, { status: auth.status });
    }

    const body = await request.json();
    const { name, email, role = "customer", phone, shippingAddress, password } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const pass = password || "patron2026";
    const { hash, salt } = hashPassword(pass);

    const newUser: AppUser = {
      id,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      role,
      passwordHash: hash,
      passwordSalt: salt,
      memberSince: new Date().toISOString().split("T")[0],
      status: "active",
      totalOrders: 0,
      totalSpentUSD: 0,
      phone,
      shippingAddress,
    };

    try {
      await setDoc(doc(db, "users", id), newUser);
    } catch (e) {
      console.warn("Firestore user creation write failed:", e);
    }

    return NextResponse.json({ success: true, data: sanitize(newUser) }, { status: 201 });
  } catch (error) {
    console.error("Create user API error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Admin authorization required" }, { status: auth.status });
    }

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId || !updates || typeof updates !== "object") {
      return NextResponse.json({ error: "userId and valid updates object are required" }, { status: 400 });
    }

    // Strip any attempted injection of password hashes or salts via PATCH
    const safeUpdates = { ...updates };
    delete safeUpdates.passwordHash;
    delete safeUpdates.passwordSalt;

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, safeUpdates);
    } catch (e) {
      console.warn("Firestore user patch failed:", e);
    }

    return NextResponse.json({ success: true, userId, updates: safeUpdates });
  } catch (error) {
    console.error("Update user API error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Admin authorization required" }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    // Prevent deleting own account or the primary seed admin
    if (auth.payload?.userId === userId) {
      return NextResponse.json({ error: "You cannot delete your own active administrator account." }, { status: 400 });
    }
    if (userId === "usr_admin_1") {
      return NextResponse.json({ error: "The primary atelier director account is protected and cannot be deleted." }, { status: 400 });
    }

    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (e) {
      console.warn("Firestore user deletion failed:", e);
    }

    return NextResponse.json({ success: true, deletedId: userId });
  } catch (error) {
    console.error("Delete user API error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
