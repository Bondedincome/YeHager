import { NextResponse } from "next/server";
import { authenticateRequest, extractTokenFromRequest, AUTH_COOKIE_NAME } from "../../../lib/auth-security";
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
    const token = extractTokenFromRequest(request);
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.payload || !token) {
      return NextResponse.json(
        { error: auth.error || "Not authenticated" },
        { status: auth.status || 401 }
      );
    }

    const { userId, email } = auth.payload;

    // Direct synchronization with NestJS backend if configured
    const backendUrl = process.env.NESTJS_BACKEND_URL || process.env.BACKEND_URL;
    if (backendUrl) {
      try {
        const incomingCookie = request.headers.get("cookie") || "";
        const cookieHeader = incomingCookie.includes(AUTH_COOKIE_NAME)
          ? incomingCookie
          : `${AUTH_COOKIE_NAME}=${token}; ${incomingCookie}`.trim();

        const nestRes = await fetch(`${backendUrl.replace(/\/$/, "")}/api/v1/auth/me`, {
          headers: {
            authorization: `Bearer ${token}`,
            cookie: cookieHeader,
          },
          cache: "no-store",
        });

        if (nestRes.ok) {
          const nestData = await nestRes.json();
          const user = nestData.data || nestData;
          return NextResponse.json({ success: true, user });
        }

        // If backend explicitly rejected (e.g. 401 user missing/suspended, 403 forbidden)
        if (nestRes.status === 401 || nestRes.status === 403) {
          return NextResponse.json(
            { error: "Session expired or user account no longer active" },
            { status: 401 }
          );
        }
      } catch (err) {
        console.error("Failed contacting authentication backend in auth/me:", err);
      }

      // In production, when backend is configured, reject rather than inventing synthetic state
      if (process.env.NODE_ENV === "production" && !process.env.ALLOW_LOCAL_AUTH_IN_PROD) {
        return NextResponse.json(
          { error: "Authentication service unavailable" },
          { status: 503 }
        );
      }
    }

    // Local dev store verification
    const users = getUsersStore();
    const user =
      users.find((u) => u.id === userId) ||
      users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    // Never return synthetic placeholder identity if account was deleted
    if (!user) {
      return NextResponse.json(
        { error: "User account no longer exists or session has expired" },
        { status: 401 }
      );
    }

    if (user.status === "suspended") {
      return NextResponse.json(
        { error: "Your account is temporarily suspended" },
        { status: 403 }
      );
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
