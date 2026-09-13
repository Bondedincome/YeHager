import { NextResponse } from "next/server";
import { verifyPassword, generateToken, AUTH_COOKIE_NAME } from "../../../lib/auth-security";
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

// In-memory rate limiting map: identifier -> { attempts: number, lockUntil: number }
const loginAttempts = new Map<string, { attempts: number; lockUntil: number }>();

function checkRateLimit(key: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (record) {
    if (record.lockUntil > now) {
      const waitSeconds = Math.ceil((record.lockUntil - now) / 1000);
      return { allowed: false, waitSeconds };
    }
    if (record.lockUntil <= now && record.attempts >= 5) {
      loginAttempts.delete(key);
    }
  }
  return { allowed: true };
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const record = loginAttempts.get(key) || { attempts: 0, lockUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= 5) {
    record.lockUntil = now + 60 * 1000;
  }
  loginAttempts.set(key, record);
}

function recordSuccess(key: string) {
  loginAttempts.delete(key);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawIdentifier = body.emailOrUsername || body.username || body.email;
    const password = body.password;

    if (!rawIdentifier || !password) {
      return NextResponse.json(
        { error: "Both identifier (email or username) and password are required" },
        { status: 400 }
      );
    }

    const identifier = String(rawIdentifier).trim().toLowerCase();
    const cleanPassword = String(password);

    const rateCheck = checkRateLimit(identifier);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. For security, please wait ${rateCheck.waitSeconds}s before trying again.`,
        },
        { status: 429 }
      );
    }

    // Try authenticating via NestJS backend if available
    const backendUrl = process.env.NESTJS_BACKEND_URL || process.env.BACKEND_URL;
    if (backendUrl) {
      try {
        const nestRes = await fetch(`${backendUrl.replace(/\/$/, "")}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: identifier, password: cleanPassword }),
        });
        if (nestRes.ok) {
          const nestData = await nestRes.json();
          const unwrapped = nestData.data || nestData;
          recordSuccess(identifier);

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
        // Fallback to local user store
      }
    }

    const users = getUsersStore();
    let user: AppUser | undefined;

    if (identifier === "admin" || identifier === "admin@yehagere.com") {
      user = users.find((u) => u.role === "admin") || users[0];
    } else {
      user = users.find((u) => u.email.toLowerCase() === identifier);
    }

    if (!user) {
      recordFailedAttempt(identifier);
      return NextResponse.json(
        { error: "Invalid credentials. Please check your email and password." },
        { status: 401 }
      );
    }

    if (user.status === "suspended") {
      return NextResponse.json(
        { error: "Your account is temporarily suspended. Please contact concierge support." },
        { status: 403 }
      );
    }

    if (!user.passwordHash || !user.passwordSalt) {
      recordFailedAttempt(identifier);
      return NextResponse.json(
        { error: "Account requires a password reset. Please contact support." },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(cleanPassword, user.passwordHash, user.passwordSalt);

    if (!isValid) {
      recordFailedAttempt(identifier);
      return NextResponse.json(
        { error: "Invalid credentials. Please check your email and password." },
        { status: 401 }
      );
    }

    recordSuccess(identifier);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

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

    const response = NextResponse.json({
      success: true,
      token,
      user: sanitizedUser,
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
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred during authentication" },
      { status: 500 }
    );
  }
}
