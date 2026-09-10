import { NextResponse } from "next/server";
import { verifyPassword, hashPassword, validatePasswordStrength } from "../../../lib/auth-security";
import { AppUser } from "../../../lib/auth-seed";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword, clientUsers } = body;

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.message }, { status: 400 });
    }

    const users: AppUser[] = Array.isArray(clientUsers) ? clientUsers : [];
    const targetUser = users.find((u) => u.id === userId);

    if (!targetUser || !targetUser.passwordHash || !targetUser.passwordSalt) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const isMatch = verifyPassword(currentPassword, targetUser.passwordHash, targetUser.passwordSalt);
    if (!isMatch) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const { hash, salt } = hashPassword(newPassword);

    return NextResponse.json({
      success: true,
      message: "Password updated successfully with enterprise cryptographic encryption.",
      passwordHash: hash,
      passwordSalt: salt,
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
