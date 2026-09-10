import { NextResponse } from "next/server";
import { verifyPassword, hashPassword, validatePasswordStrength } from "../../../lib/auth-security";
import { AppUser } from "../../../lib/auth-seed";
import { db } from "../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

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

    let targetUser: AppUser | undefined;

    // Check Firestore user doc first
    try {
      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        targetUser = { id: snap.id, ...snap.data() } as AppUser;
      }
    } catch (dbErr) {
      console.warn("Firestore lookup in change-password warning:", dbErr);
    }

    if (!targetUser) {
      const users: AppUser[] = Array.isArray(clientUsers) ? clientUsers : [];
      targetUser = users.find((u) => u.id === userId);
    }

    if (!targetUser || !targetUser.passwordHash || !targetUser.passwordSalt) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const isMatch = verifyPassword(currentPassword, targetUser.passwordHash, targetUser.passwordSalt);
    if (!isMatch) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const { hash, salt } = hashPassword(newPassword);

    // Update in Firestore
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        passwordHash: hash,
        passwordSalt: salt,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Failed to persist updated password to Firestore:", e);
    }

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
