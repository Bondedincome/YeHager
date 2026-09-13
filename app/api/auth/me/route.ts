import { NextResponse } from "next/server";
import { authenticateRequest } from "../../../lib/auth-security";
import { INITIAL_USERS, AppUser } from "../../../lib/auth-seed";

declare global {
  var __YEHAGERE_USERS__: AppUser[] | undefined;
}

function getUsersStore(): AppUser[] {
  if (!globalThis.__YEHAGERE_USERS__) {
    globalThis.__YEHAGERE_USERS__ = [...INITIAL_USERS];
  }
  return globalThis.__YEHAGERE_USERS__;
}

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json(
        { error: auth.error || "Not authenticated" },
        { status: auth.status || 401 }
      );
    }

    const { userId, email, role } = auth.payload;

    // Try fetching from NestJS backend if available
    const backendUrl = process.env.NESTJS_BACKEND_URL || process.env.BACKEND_URL;
    if (backendUrl) {
      try {
        const authHeader = request.headers.get("authorization");
        const headers: Record<string, string> = {};
        if (authHeader) headers["authorization"] = authHeader;
        const nestRes = await fetch(`${backendUrl.replace(/\/$/, "")}/api/v1/auth/me`, {
          headers,
          cache: "no-store",
        });
        if (nestRes.ok) {
          const nestData = await nestRes.json();
          return NextResponse.json({ success: true, user: nestData.data || nestData });
        }
      } catch {
        // Fallback
      }
    }

    const users = getUsersStore();
    const user =
      users.find((u) => u.id === userId) ||
      users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ||
      (role === "admin" ? users.find((u) => u.role === "admin") : undefined);

    if (!user) {
      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          email,
          role,
          name: email.split("@")[0],
          memberSince: "2024-01-01",
          status: "active",
        },
      });
    }

    const sanitizedUser: Omit<AppUser, "passwordHash" | "passwordSalt"> = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      memberSince: user.memberSince,
      status: user.status,
      totalOrders: user.totalOrders,
      totalSpentUSD: user.totalSpentUSD,
      phone: user.phone,
      shippingAddress: user.shippingAddress,
    };

    return NextResponse.json({ success: true, user: sanitizedUser });
  } catch (error) {
    console.error("Auth Me API Error:", error);
    return NextResponse.json(
      { error: "Internal server error verifying session" },
      { status: 500 }
    );
  }
}
