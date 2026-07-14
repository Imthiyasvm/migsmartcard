import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, DEFAULT_THEME, ensureDbReady } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { createId } from "@/lib/id";
import bcrypt from "bcryptjs";

export async function GET() {
  await ensureDbReady();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = db.users.getById(session.user.id);
  if (!user?.companyId) {
    return NextResponse.json({ company: null, members: [] });
  }

  const company = db.companies.getById(user.companyId);
  if (!company) {
    return NextResponse.json({ company: null, members: [] });
  }

  const members = company.employeeIds
    .map((id) => {
      const u = db.users.getById(id);
      if (!u) return null;
      const profile = db.profiles.getByUserId(id);
      const safe = { ...u, password: undefined };
      delete (safe as { password?: string }).password;
      return { ...safe, profile };
    })
    .filter(Boolean);

  return NextResponse.json({ company, members });
}

export async function POST(req: NextRequest) {
  await ensureDbReady();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "create-company") {
    const { name } = body;
    const now = new Date().toISOString();
    const companyId = createId('company');
    const company = db.companies.create({
      id: companyId,
      name,
      slug: slugify(name),
      primaryColor: "#1a5ff5",
      adminUserId: session.user.id,
      plan: (session.user.plan as "business") || "business",
      employeeIds: [session.user.id],
      createdAt: now,
    });
    db.users.update(session.user.id, {
      companyId,
      role: "company_admin",
    });
    return NextResponse.json({ success: true, company });
  }

  if (action === "add-member") {
    const user = db.users.getById(session.user.id);
    if (!user?.companyId) {
      return NextResponse.json({ error: "No company" }, { status: 400 });
    }
    const company = db.companies.getById(user.companyId);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { name, email, jobTitle } = body;
    if (db.users.getByEmail(email)) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const userId = createId('user');
    const hashed = await bcrypt.hash("welcome123", 10);

    db.users.create({
      id: userId,
      email,
      password: hashed,
      name,
      role: "user",
      plan: company.plan,
      status: "active",
      companyId: company.id,
      createdAt: now,
      updatedAt: now,
    });

    let slug = slugify(name);
    if (db.profiles.getBySlug(slug)) {
      slug = `${slug}-${createId().slice(0, 4)}`;
    }

    db.profiles.create({
      id: createId('profile'),
      userId,
      slug,
      fullName: name,
      jobTitle: jobTitle || "",
      companyName: company.name,
      email,
      social: {},
      customLinks: [],
      theme: {
        ...DEFAULT_THEME,
        primaryColor: company.primaryColor,
      },
      isPublic: true,
      createdAt: now,
      updatedAt: now,
    });

    db.companies.update(company.id, {
      employeeIds: [...company.employeeIds, userId],
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
