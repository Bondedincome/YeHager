import { NextResponse } from "next/server";
import { hashPassword, validatePasswordStrength, generateToken, AUTH_COOKIE_NAME } from "../../../lib/auth-security";
import { INITIAL_USERS, AppUser } from "../../../lib/auth-seed";
import { db } from "../../../lib/firebase";
import { doc, setDoc, collection, getDocs, query, where, limit } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Please enter your full name" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = String(password || "");

    // 1. Duplicate email check in INITIAL_USERS
    if (INITIAL_USERS.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // 2. Duplicate email check in Firestore
    try {
      const usersCol = collection(db, "users");
      const q = query(usersCol, where("email", "==", cleanEmail), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return NextResponse.json(
          { error: "An account with this email address already exists. Please sign in instead." },
          { status: 409 }
        );
      }
    } catch (checkErr) {
      console.warn("Firestore duplicate email check warning:", checkErr);
    }

    // Validate password strength
    const strength = validatePasswordStrength(cleanPassword);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.message }, { status: 400 });
    }

    // Cryptographically secure password hash with unique random salt
    const { hash, salt } = hashPassword(cleanPassword);

    const newUser: AppUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: cleanEmail,
      role: "customer",
      passwordHash: hash,
      passwordSalt: salt,
      memberSince: new Date().toISOString().split("T")[0],
      status: "active",
      totalOrders: 0,
      totalSpentUSD: 0,
    };

    // Persist to Firestore
    try {
      await setDoc(doc(db, "users", newUser.id), newUser);
    } catch (e) {
      console.warn("Firestore user registration write warning:", e);
    }

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    const sanitizedUser: Omit<AppUser, "passwordHash" | "passwordSalt"> = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatarUrl: newUser.avatarUrl,
      memberSince: newUser.memberSince,
      status: newUser.status,
      totalOrders: newUser.totalOrders,
      totalSpentUSD: newUser.totalSpentUSD,
      phone: newUser.phone,
      shippingAddress: newUser.shippingAddress,
    };

    const response = NextResponse.json(
      {
        success: true,
        token,
        user: sanitizedUser,
      },
      { status: 201 }
    );

    // Set HttpOnly, Secure, SameSite=Lax cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 72 * 60 * 60, // 72 hours
    });

    return response;
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: "Failed to create patron account" }, { status: 500 });
  }
}
