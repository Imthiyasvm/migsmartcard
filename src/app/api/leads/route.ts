import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, ensureDbReady } from "@/lib/db";
import { createId } from "@/lib/id";

export async function GET() {
  await ensureDbReady();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "admin";

  // Platform admins see every contact exchange across all profiles;
  // regular users only see leads captured on their own profiles.
  let leads = isAdmin
    ? [...db.leads.getAll()].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : db.leads.getByUserId(session.user.id);

  if (isAdmin) {
    leads = leads.map((l) => {
      const profile = l.profileId
        ? db.profiles.getById(l.profileId)
        : undefined;
      const owner = profile
        ? db.users.getById(profile.userId)
        : l.userId
          ? db.users.getById(l.userId)
          : undefined;
      return {
        ...l,
        profileName: profile?.cardName || profile?.fullName,
        profileSlug: profile?.slug,
        ownerName: owner?.name,
        ownerEmail: owner?.email,
      };
    });
  }

  return NextResponse.json({ leads, isAdmin });
}

export async function POST(req: NextRequest) {
  await ensureDbReady();
  try {
    const body = await req.json();
    const { profileId, name, email, phone, company, message, source } = body;

    if (!profileId || !name || !email) {
      return NextResponse.json(
        { error: "Name, email, and profile are required" },
        { status: 400 }
      );
    }

    const profile = db.profiles.getById(profileId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const lead = db.leads.create({
      id: createId('lead'),
      profileId,
      userId: profile.userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      company: company?.trim(),
      message: message?.trim(),
      source: source || "form",
      createdAt: new Date().toISOString(),
      viewed: false,
    });

    // Track analytics
    db.analytics.create({
      id: createId('evt'),
      profileId,
      userId: profile.userId,
      type: "lead",
      device: "mobile",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, lead });
  } catch {
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await ensureDbReady();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
  }

  const isAdmin = session.user.role === "admin";
  const scope = isAdmin
    ? db.leads.getAll()
    : db.leads.getByUserId(session.user.id);
  if (!scope.find((l) => l.id === id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.leads.delete(id);
  return NextResponse.json({ success: true });
}
