import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, ensureDbReady, persistDb } from "@/lib/db";
import { createId } from "@/lib/id";
import bcrypt from "bcryptjs";
import { getPlan } from "@/lib/plans";

function omitPassword<T extends { password?: string }>(user: T) {
  const { password, ...rest } = user;
  void password;
  return rest;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return null;
  }
  return session;
}

export async function GET(req: NextRequest) {
  await ensureDbReady();
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("resource") || "stats";

  if (resource === "stats") {
    const users = db.users.getAll();
    const profiles = db.profiles.getAll();
    const leads = db.leads.getAll();
    const cards = db.nfc.getAll();
    const orders = db.orders.getAll();
    const events = db.analytics.getAll();

    const planCounts: Record<string, number> = {};
    users.forEach((u) => {
      planCounts[u.plan] = (planCounts[u.plan] || 0) + 1;
    });

    const mrr = users.reduce((sum, u) => {
      const plan = getPlan(u.plan);
      return sum + (u.status === "active" ? plan.price : 0);
    }, 0);

    return NextResponse.json({
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      totalProfiles: profiles.length,
      nfcAssigned: cards.filter((c) => c.status === "assigned").length,
      nfcUnassigned: cards.filter((c) => c.status === "unassigned").length,
      totalLeads: leads.length,
      totalOrders: orders.length,
      totalViews: events.filter((e) => e.type === "view").length,
      mrr,
      planCounts,
      recentUsers: users
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5)
        .map(omitPassword),
    });
  }

  if (resource === "users") {
    const users = db.users.getAll().map(omitPassword);
    return NextResponse.json({ users });
  }

  if (resource === "nfc") {
    return NextResponse.json({ cards: db.nfc.getAll() });
  }

  if (resource === "orders") {
    return NextResponse.json({ orders: db.orders.getAll() });
  }

  return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  await ensureDbReady();
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "assign-nfc") {
    const { nfcUid, userId } = body;
    const profile = db.profiles.getByUserId(userId);
    if (!profile) {
      return NextResponse.json(
        { error: "User has no profile" },
        { status: 400 }
      );
    }
    const card = db.nfc.assign(nfcUid, userId, profile.id);
    if (!card) {
      return NextResponse.json({ error: "NFC card not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, card });
  }

  if (action === "create-nfc") {
    const { nfcUid, design } = body;
    if (db.nfc.getByUid(nfcUid)) {
      return NextResponse.json(
        { error: "NFC UID already exists" },
        { status: 409 }
      );
    }
    const card = db.nfc.create({
      id: createId('nfc'),
      nfcUid,
      status: "unassigned",
      design: design || "classic-black",
    });
    return NextResponse.json({ success: true, card });
  }

  if (action === "update-user") {
    const { userId, ...data } = body;
    const allowed = ["status", "plan", "role", "name", "email"];
    const updates: Record<string, unknown> = {};
    for (const k of allowed) {
      if (data[k] !== undefined) updates[k] = data[k];
    }
    const user = db.users.update(userId, updates);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, user: omitPassword(user) });
  }

  if (action === "create-user") {
    const { name, email, password, plan, role } = body;
    if (db.users.getByEmail(email)) {
      return NextResponse.json({ error: "Email exists" }, { status: 409 });
    }
    const now = new Date().toISOString();
    const hashed = await bcrypt.hash(password || "password123", 10);
    const user = db.users.create({
      id: createId("user"),
      email,
      password: hashed,
      name,
      role: role || "user",
      plan: plan || "free",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ success: true, user: omitPassword(user) });
  }

  if (action === "delete-user") {
    db.users.delete(body.userId);
    return NextResponse.json({ success: true });
  }

  if (action === "update-order") {
    const order = db.orders.update(body.orderId, {
      status: body.status,
      trackingNumber: body.trackingNumber,
    });
    return NextResponse.json({ success: true, order });
  }

  // ─── Self-service account actions (admin manages their own account) ──
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
