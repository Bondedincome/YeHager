import { NextResponse } from "next/server";
import { authenticateRequest, requireAdmin, hashPassword } from "../../lib/auth-security";
import { INITIAL_USERS, AppUser } from "../../lib/auth-seed";

declare global {
  var __YEHAGERE_USERS__: AppUser[] | undefined;
}

function getUsersStore(): AppUser[] {
  if (!globalThis.__YEHAGERE_USERS__) {
    globalThis.__YEHAGERE_USERS__ = [...INITIAL_USERS];
  }
  return globalThis.__YEHAGERE_USERS__;
}

function sanitizeUser(user: AppUser): Omit<AppUser, "passwordHash" | "passwordSalt"> {
  return {
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
}

export async function GET(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || "Admin access required" },
        { status: auth.status }
      );
    }

    const backendUrl = process.env.NESTJS_BACKEND_URL || process.env.BACKEND_URL;
    if (backendUrl) {
      try {
        const authHeader = request.headers.get("authorization");
        const headers: Record<string, string> = {};
        if (authHeader) headers["authorization"] = authHeader;
        const res = await fetch(`${backendUrl.replace(/\/$/, "")}/api/v1/users`, {
          headers,
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          return NextResponse.json({ success: true, data });
        }
      } catch {
        // Fallback
      }
    }

    const users = getUsersStore();
    return NextResponse.json({
      success: true,
      data: users.map(sanitizeUser),
    });
  } catch (error) {
    console.error("Users GET API Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || "Admin access required" },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { name, email, role, status, phone, shippingAddress, password } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const users = getUsersStore();

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 409 }
      );
    }

    const initialPass = password || "YeHagere2026!";
    const { hash, salt } = hashPassword(initialPass);

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

    const newUser: AppUser = {
      id: `usr_${Date.now()}`,
      name: String(name).trim(),
      email: cleanEmail,
      passwordHash: hash,
      passwordSalt: salt,
      role: role || "customer",
      status: status || "active",
      memberSince: new Date().toISOString().split("T")[0],
      totalOrders: 0,
      totalSpentUSD: 0,
      phone: phone ? String(phone).trim() : undefined,
      shippingAddress: parsedShippingAddress,
    };

    users.push(newUser);

    return NextResponse.json(
      { success: true, data: sanitizeUser(newUser) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Users POST API Error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return NextResponse.json({ error: "userId and updates are required" }, { status: 400 });
    }

    // Only admin can edit other users; regular users can only edit their own name/phone/address
    const isSelf = auth.payload.userId === userId;
    const isAdmin = auth.payload.role === "admin";

    if (!isSelf && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = getUsersStore();
    const targetUser = users.find((u) => u.id === userId);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Apply allowed updates
    if (updates.name) targetUser.name = String(updates.name).trim();
    if (updates.phone !== undefined) targetUser.phone = String(updates.phone).trim();
    if (updates.shippingAddress !== undefined) {
      targetUser.shippingAddress =
        typeof updates.shippingAddress === "object" && updates.shippingAddress !== null
          ? updates.shippingAddress
          : {
              street: String(updates.shippingAddress),
              city: "Addis Ababa",
              state: "AA",
              zip: "1000",
              country: "Ethiopia",
            };
    }

    if (isAdmin) {
      if (updates.role) targetUser.role = updates.role;
      if (updates.status) targetUser.status = updates.status;
      if (updates.totalOrders !== undefined) targetUser.totalOrders = Number(updates.totalOrders);
      if (updates.totalSpentUSD !== undefined) targetUser.totalSpentUSD = Number(updates.totalSpentUSD);
    }

    return NextResponse.json({ success: true, data: sanitizeUser(targetUser) });
  } catch (error) {
    console.error("Users PATCH API Error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || "Admin access required" },
        { status: auth.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    const users = getUsersStore();
    const index = users.findIndex((u) => u.id === userId);

    if (index >= 0) {
      users.splice(index, 1);
    }

    return NextResponse.json({ success: true, deletedId: userId });
  } catch (error) {
    console.error("Users DELETE API Error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
