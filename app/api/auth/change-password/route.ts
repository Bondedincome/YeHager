import { NextResponse } from "next/server";
import { authenticateRequest, verifyPassword, hashPassword } from "../../../lib/auth-security";
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
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.payload) {
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

    const { userId, email } = auth.payload;
    const users = getUsersStore();
    const user =
      users.find((u) => u.id === userId) ||
      users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
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
