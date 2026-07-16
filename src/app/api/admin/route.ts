import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, ensureDbReady, persistDb } from "@/lib/db";
import { createId } from "@/lib/id";
import bcrypt from "bcryptjs";
import { getPlan } from "@/lib/plans";
import { ziinaTestMode } from "@/lib/ziina";
import { PlatformSettings } from "@/types";

function omitPassword<T extends { password?: string }>(user: T) {
  const { password, ...rest } = user;
  void password;
  return rest;
}

/** Return only masked Ziina configuration metadata, never credentials. */
function ziinaConfigView() {
  const settings = db.settings.get();
  const envToken = (process.env.ZIINA_API_TOKEN || "").trim();
  const savedToken = (settings.ziinaApiToken || "").trim();
  const envSecret = (process.env.ZIINA_WEBHOOK_SECRET || "").trim();
  const savedSecret = (settings.ziinaWebhookSecret || "").trim();
  const activeToken = envToken || savedToken;
  const envTestMode = (process.env.ZIINA_TEST_MODE || "").trim();

  return {
    configured: activeToken.length > 0,
    tokenSet: activeToken.length > 0,
    tokenLast4: activeToken ? activeToken.slice(-4) : null,
    tokenSource: envToken ? "env" : savedToken ? "database" : null,
    secretSet: (envSecret || savedSecret).length > 0,
    secretSource: envSecret ? "env" : savedSecret ? "database" : null,
    testMode: ziinaTestMode(),
    testModeSource: envTestMode
      ? "env"
      : settings.ziinaTestMode !== undefined
        ? "database"
        : "default",
    webhookPath: "/api/billing/webhook",
  };
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

  if (resource === "payments") {
    const payments = db.payments
      .getAll()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((p) => ({
        ...p,
        userEmail: db.users.getById(p.userId)?.email || "unknown",
        order: p.orderId ? db.orders.getById(p.orderId) || null : null,
      }));

    const completed = payments.filter((p) => p.status === "completed");
    return NextResponse.json({
      payments,
      summary: {
        // Revenue counts completed transactions only, in AED
        revenueAed:
          completed.reduce((sum, p) => sum + p.amountFils, 0) / 100,
        completed: completed.length,
        pending: payments.filter((p) => p.status === "pending").length,
        failed:
          payments.filter((p) => p.status === "failed").length +
          payments.filter((p) => p.status === "cancelled").length,
      },
    });
  }

  if (resource === "ziina") {
    return NextResponse.json(ziinaConfigView());
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

  if (action === "save-ziina") {
    // Blank fields retain the saved value, so credentials are never echoed.
    const updates: Partial<PlatformSettings> = {};
    if (typeof body.ziinaApiToken === "string" && body.ziinaApiToken.trim()) {
      updates.ziinaApiToken = body.ziinaApiToken.trim();
    }
    if (
      typeof body.ziinaWebhookSecret === "string" &&
      body.ziinaWebhookSecret.trim()
    ) {
      updates.ziinaWebhookSecret = body.ziinaWebhookSecret.trim();
    }
    if (typeof body.ziinaTestMode === "boolean") {
      updates.ziinaTestMode = body.ziinaTestMode;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nothing to save — enter a token, secret, or change test mode" },
        { status: 400 }
      );
    }
    db.settings.update(updates);
    await persistDb();
    return NextResponse.json({ success: true, ziina: ziinaConfigView() });
  }

  if (action === "clear-ziina") {
    db.settings.update({
      ziinaApiToken: "",
      ziinaWebhookSecret: "",
      ziinaTestMode: undefined,
    });
    await persistDb();
    return NextResponse.json({ success: true, ziina: ziinaConfigView() });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
