import { NextResponse } from "next/server";
import { hashPassword, generateToken, AUTH_COOKIE_NAME } from "../../../lib/auth-security";
import { AppUser, INITIAL_USERS } from "../../../lib/auth-seed";

declare global {
  var __YEHAGERE_USERS__: AppUser[] | undefined;
}

function getUsersStore(): AppUser[] {
  if (!globalThis.__YEHAGERE_USERS__) {
    globalThis.__YEHAGERE_USERS__ = [...INITIAL_USERS];
  }
  return globalThis.__YEHAGERE_USERS__;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, shippingAddress } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    if (cleanPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Try registering via NestJS backend if available
    const backendUrl = process.env.NESTJS_BACKEND_URL || process.env.BACKEND_URL;
    if (backendUrl) {
      try {
        const nameParts = String(name).trim().split(" ");
        const firstName = nameParts[0] || name;
        const lastName = nameParts.slice(1).join(" ") || "Patron";
        const nestRes = await fetch(`${backendUrl.replace(/\/$/, "")}/api/v1/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            email: cleanEmail,
            password: cleanPassword,
            phone: phone || "+251911000000",
          }),
        });
        if (nestRes.ok) {
          const nestData = await nestRes.json();
          const unwrapped = nestData.data || nestData;
          const token = unwrapped.access_token || unwrapped.token;
          const user = unwrapped.user;

          const response = NextResponse.json({
            success: true,
            token,
            user,
          });

          response.cookies.set({
            name: AUTH_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 72 * 60 * 60,
          });

          return response;
        }
      } catch {
        // Fallback
      }
    }

    const users = getUsersStore();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    const parsedShippingAddress =
      typeof shippingAddress === "object" && shippingAddress !== null
        ? (shippingAddress as { street: string; city: string; state: string; zip: string; country: string })
        : shippingAddress && typeof shippingAddress === "string"
        ? {
            street: shippingAddress,
            city: "Addis Ababa",
            state: "AA",
            zip: "1000",
            country: "Ethiopia",
          }
        : undefined;

    const { hash, salt } = hashPassword(cleanPassword);
    const newUser: AppUser = {
      id: `usr_${Date.now()}`,
      name: String(name).trim(),
      email: cleanEmail,
      passwordHash: hash,
      passwordSalt: salt,
      role: "customer",
      status: "active",
      memberSince: new Date().toISOString().split("T")[0],
      totalOrders: 0,
      totalSpentUSD: 0,
      phone: phone ? String(phone).trim() : undefined,
      shippingAddress: parsedShippingAddress,
    };

    users.push(newUser);

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

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 72 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { error: "Failed to register account" },
      { status: 500 }
    );
  }
}
