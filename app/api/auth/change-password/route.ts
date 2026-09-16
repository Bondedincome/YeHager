import { NextResponse } from "next/server";
import {
  authenticateRequest,
  extractTokenFromRequest,
  verifyPassword,
  hashPassword,
  AUTH_COOKIE_NAME,
} from "../../../lib/auth-security";
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

export async function POST(request: Request) {
  try {
    const token = extractTokenFromRequest(request);
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.payload || !token) {
      return NextResponse.json(
        { error: auth.error || "Authentication required" },
        { status: auth.status || 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Both current password and new password are required" },
        { status: 400 }
      );
    }

    if (String(newPassword).length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Direct synchronization with NestJS backend if configured
    const backendUrl = process.env.NESTJS_BACKEND_URL || process.env.BACKEND_URL;
    if (backendUrl) {
      try {
        const incomingCookie = request.headers.get("cookie") || "";
        const cookieHeader = incomingCookie.includes(AUTH_COOKIE_NAME)
          ? incomingCookie
          : `${AUTH_COOKIE_NAME}=${token}; ${incomingCookie}`.trim();

        const nestRes = await fetch(
          `${backendUrl.replace(/\/$/, "")}/api/v1/auth/change-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${token}`,
              cookie: cookieHeader,
            },
            body: JSON.stringify({
              currentPassword: String(currentPassword),
              newPassword: String(newPassword),
            }),
          }
        );

        const nestData = await nestRes.json().catch(() => null);

        if (!nestRes.ok) {
          const errorMessage =
            nestData?.message ||
            nestData?.error ||
            (nestRes.status === 401 ? "Current password is incorrect" : "Failed to update password");
          return NextResponse.json({ error: errorMessage }, { status: nestRes.status });
        }

        return NextResponse.json({
          success: true,
          message: "Password updated successfully",
        });
      } catch (err) {
        console.error("Backend change-password connectivity failure:", err);
        return NextResponse.json(
          { error: "Authentication service currently unreachable. Please try again shortly." },
          { status: 503 }
        );
      }
    }

    // In production, centralized authentication is strictly mandatory; local fallback is prohibited
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Centralized authentication backend must be configured in production." },
        { status: 503 }
      );
    }

    // Development local store fallback
    const { userId, email } = auth.payload;
    const users = getUsersStore();
    const user =
      users.find((u) => u.id === userId) ||
      users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    if (user.status === "suspended") {
      return NextResponse.json({ error: "Your account is temporarily suspended" }, { status: 403 });
    }

    if (!user.passwordHash || !user.passwordSalt) {
      return NextResponse.json(
        { error: "Account credentials cannot be updated directly" },
        { status: 400 }
      );
    }

    const isCurrentValid = verifyPassword(
      String(currentPassword),
      user.passwordHash,
      user.passwordSalt
    );

    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Current password is not correct" },
        { status: 400 }
      );
    }

    const { hash: newHash, salt: newSalt } = hashPassword(String(newPassword));
    user.passwordHash = newHash;
    user.passwordSalt = newSalt;

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change Password API Error:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}
