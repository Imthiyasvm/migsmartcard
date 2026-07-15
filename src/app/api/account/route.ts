import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, ensureDbReady, persistDb } from "@/lib/db";
import bcrypt from "bcryptjs";

function omitPassword<T extends { password?: string }>(user: T) {
  const { password, ...rest } = user;
  void password;
  return rest;
}

/**
 * Self-service account actions for any authenticated user.
 * Both actions verify the current password before applying changes.
 */
export async function POST(req: NextRequest) {
  await ensureDbReady();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (action === "change-email") {
    const { currentPassword, newEmail } = body;
    if (!currentPassword || !newEmail) {
      return NextResponse.json(
        { error: "Current password and new email are required" },
        { status: 400 }
      );
    }
    const normalized = String(newEmail).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }
    const user = db.users.getById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }
    const existing = db.users.getByEmail(normalized);
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json(
        { error: "That email is already in use" },
        { status: 409 }
      );
    }
    const updated = db.users.update(session.user.id, { email: normalized });
    await persistDb();
    return NextResponse.json({ success: true, user: omitPassword(updated!) });
  }

  if (action === "change-password") {
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }
    if (String(newPassword).length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }
    if (String(newPassword) === String(currentPassword)) {
      return NextResponse.json(
        { error: "New password must be different from the current password" },
        { status: 400 }
      );
    }
    const user = db.users.getById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }
    const hashed = await bcrypt.hash(String(newPassword), 10);
    const updated = db.users.update(session.user.id, { password: hashed });
    await persistDb();
    return NextResponse.json({ success: true, user: omitPassword(updated!) });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
