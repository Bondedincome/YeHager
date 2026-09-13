import { NextResponse } from "next/server";
import { authenticateRequest } from "../../../lib/auth-security";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { INITIAL_USERS, AppUser } from "../../../lib/auth-seed";

function sanitize(user: AppUser): Omit<AppUser, "passwordHash" | "passwordSalt"> {
  const sanitized = { ...user };
  delete (sanitized as Partial<AppUser>).passwordHash;
  delete (sanitized as Partial<AppUser>).passwordSalt;
  return sanitized;
}

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json(
        { success: false, authenticated: false, error: auth.error || "Authentication required" },
        { status: auth.status || 401 }
      );
    }

    const { userId, email } = auth.payload;
    let user: AppUser | undefined;

    // 1. Check Firestore by document ID
    try {
      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        user = { id: snap.id, ...snap.data() } as AppUser;
      }
    } catch (err) {
      console.warn("Firestore user lookup in /api/auth/me failed, falling back to seed:", err);
    }

    // 2. Fallback to INITIAL_USERS if not in Firestore
    if (!user) {
      user = INITIAL_USERS.find(
        (u) => u.id === userId || u.email.toLowerCase() === email.toLowerCase()
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, authenticated: false, error: "User account no longer exists." },
        { status: 401 }
      );
    }

    if (user.status === "suspended") {
      return NextResponse.json(
        { success: false, authenticated: false, error: "Account is suspended." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: sanitize(user),
    });
  } catch (error) {
    console.error("Auth verification error:", error);
    return NextResponse.json(
      { success: false, authenticated: false, error: "Internal server error verifying session" },
      { status: 500 }
    );
  }
}
