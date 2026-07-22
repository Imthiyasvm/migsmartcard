import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  db,
  DEFAULT_THEME,
  ensureDbReady,
  findProfileByUserId,
  listProfilesByUserId,
  saveProfilePersistent,
  isRedisEnabled,
  persistDb,
} from "@/lib/db";
import { slugify, normalizeWebsiteUrl } from "@/lib/utils";
import { createId } from "@/lib/id";
import { getMaxCards, getPlan } from "@/lib/plans";
import { DigitalProfile } from "@/types";
import { buildSharePath, encodeShareToken } from "@/lib/share-token";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanSlug(value: string) {
  return (
    (value || "card")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "card"
  );
}

function uniqueSlug(base: string, excludeId?: string) {
  const slug = cleanSlug(base);
  if (!db.profiles.getBySlug(slug) || db.profiles.getBySlug(slug)?.id === excludeId) {
    return slug;
  }
  for (let i = 0; i < 8; i++) {
    const candidate = `${slug}-${createId().slice(0, 4)}`;
    if (
      !db.profiles.getBySlug(candidate) ||
      db.profiles.getBySlug(candidate)?.id === excludeId
    ) {
      return candidate;
    }
  }
  return `${slug}-${createId().slice(0, 8)}`;
}

export async function GET(req: NextRequest) {
  await ensureDbReady();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const list = searchParams.get("list") === "1";

  const user = db.users.getById(session.user.id);
  const planId = user?.plan || session.user.plan || "free";
  const maxCards = getMaxCards(planId);
  const plan = getPlan(planId);

  let profiles = await listProfilesByUserId(session.user.id);

  // Bootstrap first card
  if (profiles.length === 0) {
    const now = new Date().toISOString();
    const base = slugify(session.user.name || "user") || "user";
    const created = await saveProfilePersistent({
      id: createId("profile"),
      userId: session.user.id,
      slug: uniqueSlug(base),
      cardName: "My Card",
      isPrimary: true,
      fullName: session.user.name || "",
      jobTitle: "",
      companyName: "",
      email: session.user.email || "",
      social: {},
      customLinks: [],
      theme: { ...DEFAULT_THEME },
      qrCodeId: createId("qr"),
      isPublic: true,
      createdAt: now,
      updatedAt: now,
    });
    profiles = [created];
  }

  if (list) {
    return NextResponse.json({
      profiles,
      maxCards,
      plan: plan.id,
      planName: plan.name,
      redisEnabled: isRedisEnabled(),
    });
  }

  let profile: DigitalProfile | undefined;
  if (id) {
    profile = profiles.find((p) => p.id === id);
  }
  if (!profile) {
    profile = profiles.find((p) => p.isPrimary) || profiles[0];
  }

  return NextResponse.json({
    profile,
    profiles,
    maxCards,
    plan: plan.id,
    planName: plan.name,
    redisEnabled: isRedisEnabled(),
  });
}

export async function POST(req: NextRequest) {
  await ensureDbReady();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const user = db.users.getById(session.user.id);
  const planId = user?.plan || session.user.plan || "free";
  const maxCards = getMaxCards(planId);
  const existing = await listProfilesByUserId(session.user.id);

  if (existing.length >= maxCards) {
    return NextResponse.json(
      {
        error: `Your ${getPlan(planId).name} plan allows ${maxCards} card${maxCards === 1 ? "" : "s"}. Upgrade to create more.`,
        maxCards,
        current: existing.length,
        upgrade: true,
      },
      { status: 403 }
    );
  }

  const now = new Date().toISOString();
  const cardName = (body.cardName as string) || `Card ${existing.length + 1}`;
  const baseSlug = cleanSlug(
    body.slug || `${session.user.name || "card"}-${existing.length + 1}`
  );

  const profile = await saveProfilePersistent({
    id: createId("profile"),
    userId: session.user.id,
    slug: uniqueSlug(baseSlug),
    cardName,
    isPrimary: existing.length === 0,
    fullName: body.fullName || session.user.name || "",
    jobTitle: body.jobTitle || "",
    companyName: body.companyName || "",
    email: body.email || session.user.email || "",
    social: body.social || {},
    customLinks: body.customLinks || [],
    theme: body.theme || { ...DEFAULT_THEME },
    // Every new profile gets its own dynamic QR code identity (Pro+ surface it
    // with a custom generator; all plans get a live, re-targetable QR).
    qrCodeId: createId("qr"),
    isPublic: body.isPublic !== false,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    success: true,
    profile,
    profiles: await listProfilesByUserId(session.user.id),
    maxCards,
  });
}

export async function PUT(req: NextRequest) {
  await ensureDbReady();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const profiles = await listProfilesByUserId(session.user.id);

  let profile =
    (body.id && profiles.find((p) => p.id === body.id)) ||
    (await findProfileByUserId(session.user.id));

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.userId !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.slug && cleanSlug(body.slug) !== profile.slug) {
    const nextSlug = uniqueSlug(body.slug, profile.id);
    profile = { ...profile, slug: nextSlug };
  }

  // Set primary
  if (body.isPrimary === true) {
    for (const p of profiles) {
      if (p.id !== profile.id && p.isPrimary) {
        await saveProfilePersistent({ ...p, isPrimary: false });
      }
    }
    profile = { ...profile, isPrimary: true };
  }

  const allowed = [
    "cardName",
    "fullName",
    "jobTitle",
    "companyName",
    "profilePhoto",
    "coverImage",
    "bio",
    "phone",
    "email",
    "website",
    "address",
    "city",
    "country",
    "mapsUrl",
    "social",
    "customLinks",
    "theme",
    "isPublic",
  ] as const;

  const next: DigitalProfile = { ...profile };
  for (const key of allowed) {
    if (body[key] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (next as any)[key] = body[key];
    }
  }

  // Enforce plan branding rules
  const userObj = db.users.getById(session.user.id);
  const userPlan = userObj?.plan || session.user.plan || "free";
  if (userPlan === "free") {
    next.theme = {
      ...(next.theme || DEFAULT_THEME),
      showBranding: true,
      brandingMode: "full",
    };
  }
  
  // Normalize website URL to ensure consistent storage
  if (body.website !== undefined) {
    next.website = normalizeWebsiteUrl(body.website);
  }
  
  // Normalize social URLs to ensure consistent storage
  if (body.social && typeof body.social === "object") {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(body.social as Record<string, string>)) {
      if (typeof value === "string" && value.trim()) {
        if (key === "whatsapp") {
          normalized[key] = value.trim(); // Phone numbers don't get URL normalization
        } else {
          normalized[key] = normalizeWebsiteUrl(value);
        }
      }
    }
    next.social = { ...next.social, ...normalized } as typeof next.social;
  }
  
  // Normalize custom link URLs
  if (body.customLinks && Array.isArray(body.customLinks)) {
    next.customLinks = body.customLinks.map((link: { id: string; title: string; url: string; icon?: string }) => ({
      ...link,
      url: link.url ? normalizeWebsiteUrl(link.url) : link.url,
    }));
  }
  
  // Normalize maps URL
  if (body.mapsUrl !== undefined) {
    next.mapsUrl = normalizeWebsiteUrl(body.mapsUrl);
  }
  
  if (body.forcePublic === true) next.isPublic = true;
  if (next.isPublic === undefined || next.isPublic === null) {
    next.isPublic = true;
  }

  // Ensure every profile carries a dynamic QR identity (heal legacy profiles).
  if (!next.qrCodeId) next.qrCodeId = createId("qr");

  const saved = await saveProfilePersistent(next);
  // Double-write: ensure slug key is fresh even if full store write is heavy
  const sharePath = buildSharePath(saved);
  const base = process.env.NEXTAUTH_URL || "https://smartcard.migbiz.com";

  // Verify Redis can read this slug back
  let redisVerified = false;
  if (isRedisEnabled()) {
    try {
      const { redisGetProfileBySlug } = await import("@/lib/store-ready");
      const remote = await redisGetProfileBySlug(saved.slug);
      redisVerified = Boolean(remote && remote.slug === saved.slug);
      if (!redisVerified) {
        // one more attempt
        const { redisSaveProfile } = await import("@/lib/store-ready");
        await redisSaveProfile(saved as unknown as { slug?: string; userId?: string; id?: string; [key: string]: unknown });
        const again = await redisGetProfileBySlug(saved.slug);
        redisVerified = Boolean(again && again.slug);
      }
    } catch (e) {
      console.error("redis verify", e);
    }
  }

  return NextResponse.json({
    profile: saved,
    profiles: await listProfilesByUserId(session.user.id),
    publicUrl: `/p/${saved.slug}`,
    shareUrl: sharePath,
    absoluteShareUrl: `${base}${sharePath}`,
    absoluteUrl: `${base}/p/${saved.slug}`,
    shareToken: encodeShareToken(saved),
    redisEnabled: isRedisEnabled(),
    redisVerified,
    warning: !isRedisEnabled()
      ? "Short /p/slug links need Redis on Vercel. Use shareUrl (/c/...) which works without Redis."
      : !redisVerified
        ? "Saved, but Redis did not confirm the short link yet. Click “Publish short link” or use Copy share link."
        : null,
  });
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
    return NextResponse.json({ error: "Card id required" }, { status: 400 });
  }

  const profiles = await listProfilesByUserId(session.user.id);
  const target = profiles.find((p) => p.id === id);
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (profiles.length <= 1) {
    return NextResponse.json(
      { error: "You must keep at least one card" },
      { status: 400 }
    );
  }

  db.profiles.delete(id);
  await persistDb();

  // Ensure a primary remains
  const remaining = await listProfilesByUserId(session.user.id);
  if (remaining.length && !remaining.some((p) => p.isPrimary)) {
    await saveProfilePersistent({ ...remaining[0], isPrimary: true });
  }

  return NextResponse.json({
    success: true,
    profiles: await listProfilesByUserId(session.user.id),
  });
}
