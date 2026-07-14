import { NextResponse } from "next/server";
import { ensureDbReady, isRedisEnabled, db } from "@/lib/db";
import {
  redisGetProfileBySlug,
  redisListSlugs,
  redisSaveProfile,
} from "@/lib/store-ready";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDbReady();
  const profiles = db.profiles.getAll();
  const redisOn = isRedisEnabled();

  let index: string[] = [];
  const sampleChecks: { slug: string; inRedis: boolean }[] = [];

  if (redisOn) {
    try {
      index = await redisListSlugs();
    } catch {
      index = [];
    }
    for (const p of profiles.slice(0, 12)) {
      const remote = await redisGetProfileBySlug(p.slug);
      sampleChecks.push({
        slug: p.slug,
        inRedis: Boolean(remote && remote.slug),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    domain: process.env.NEXTAUTH_URL || null,
    redisEnabled: redisOn,
    profileCount: profiles.length,
    sampleSlugs: profiles.slice(0, 12).map((p) => p.slug),
    redisSlugIndexCount: index.length,
    redisSlugIndexSample: index.slice(0, 20),
    memoryVsRedis: sampleChecks,
    tip: redisOn
      ? "Redis is on. If a /p/slug 404s, open Dashboard → My Card → Publish short /p/ link."
      : "Redis is OFF. Add UPSTASH_REDIS_REST_URL + TOKEN, redeploy, then Publish short link.",
  });
}

/** Optional diagnostic: write/read a ping key */
export async function POST() {
  if (!isRedisEnabled()) {
    return NextResponse.json({ ok: false, error: "Redis off" }, { status: 400 });
  }
  const test = {
    id: "health-ping",
    slug: "__health_ping__",
    userId: "system",
    fullName: "Health Ping",
    jobTitle: "",
    companyName: "",
    social: {},
    customLinks: [],
    theme: {
      primaryColor: "#1a5ff5",
      secondaryColor: "#22c55e",
      backgroundColor: "#ffffff",
      textColor: "#0f172a",
      buttonStyle: "rounded" as const,
      fontStyle: "modern" as const,
      showBranding: true,
    },
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const wrote = await redisSaveProfile(test);
  const read = await redisGetProfileBySlug("__health_ping__");
  return NextResponse.json({
    ok: wrote && Boolean(read),
    wrote,
    readSlug: read?.slug || null,
  });
}
