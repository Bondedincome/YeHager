import { NextResponse } from "next/server";
import { hashPassword, validatePasswordStrength, generateToken } from "../../../lib/auth-security";
import { AppUser } from "../../../lib/auth-seed";
import { db } from "../../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

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

    return NextResponse.json(
      {
        success: true,
        token,
        user: sanitizedUser,
        fullUser: newUser, // returned for client-side persistent storage update
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: "Failed to create patron account" }, { status: 500 });
  }
}
