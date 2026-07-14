import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  db,
  DEFAULT_THEME,
  ensureDbReady,
  saveProfilePersistent,
  persistDb,
} from "@/lib/db";
import { slugify } from "@/lib/utils";
import { createId } from "@/lib/id";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await ensureDbReady();
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (db.users.getByEmail(email)) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const userId = createId("user");
    const hashed = await bcrypt.hash(password, 10);

    const user = db.users.create({
      id: userId,
      email: email.toLowerCase().trim(),
      password: hashed,
      name: name.trim(),
      role: "user",
      plan: "free",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    await persistDb();

    let slug = slugify(name) || "card";
    if (db.profiles.getBySlug(slug)) {
      slug = `${slug}-${createId().slice(0, 4)}`;
    }

    // CRITICAL: use saveProfilePersistent so Redis gets the public slug
    const profile = await saveProfilePersistent({
      id: createId("profile"),
      userId,
      slug,
      cardName: "My Card",
      isPrimary: true,
      fullName: name.trim(),
      jobTitle: "",
      companyName: "",
      email: email.toLowerCase().trim(),
      social: {},
      customLinks: [],
      theme: { ...DEFAULT_THEME },
      isPublic: true,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      profile: { id: profile.id, slug: profile.slug },
    });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
