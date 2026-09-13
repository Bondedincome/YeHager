import { NextResponse } from "next/server";
import { verifyPassword, generateToken, AUTH_COOKIE_NAME } from "../../../lib/auth-security";
import { INITIAL_USERS, AppUser } from "../../../lib/auth-seed";
import { db } from "../../../lib/firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";

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

  // Lock for 60 seconds after 5 consecutive failed attempts
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

    // Rate limiting check
    const rateCheck = checkRateLimit(identifier);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. For security, please wait ${rateCheck.waitSeconds}s before trying again.`,
        },
        { status: 429 }
      );
    }

    // User lookup: check Firestore first, then fallback to INITIAL_USERS and client users
    let user: AppUser | undefined;

    try {
      const usersCol = collection(db, "users");
      if (identifier === "admin" || identifier === "admin@yehagere.com") {
        const q = query(usersCol, where("role", "==", "admin"), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = snap.docs[0].data();
          user = { id: snap.docs[0].id, ...docData } as AppUser;
        }
      } else {
        const q = query(usersCol, where("email", "==", identifier), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = snap.docs[0].data();
          user = { id: snap.docs[0].id, ...docData } as AppUser;
        }
      }
    } catch (dbErr) {
      console.warn("Firestore user lookup warning, continuing with local fallback:", dbErr);
    }

    if (!user) {
      if (identifier === "admin" || identifier === "admin@yehagere.com") {
        user = INITIAL_USERS.find((u) => u.role === "admin") || INITIAL_USERS[0];
      } else {
        user = INITIAL_USERS.find((u) => u.email.toLowerCase() === identifier);
      }
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

    // Verify Password using PBKDF2 (100,000 rounds) and constant-time comparison
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

    // Authentication succeeded: clear rate limits
    recordSuccess(identifier);

    // Generate signed session token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return sanitized user (strip passwordHash and passwordSalt)
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
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred during authentication" },
      { status: 500 }
    );
  }
}
