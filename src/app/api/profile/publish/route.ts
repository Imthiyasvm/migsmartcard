import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ensureDbReady,
  isRedisEnabled,
  listProfilesByUserId,
  republishUserProfiles,
} from "@/lib/db";
import { redisGetProfileBySlug, redisListSlugs } from "@/lib/store-ready";

export const dynamic = "force-dynamic";

/**
 * Force re-publish all of the current user's cards to Redis
 * so short /p/slug links work on every Vercel instance.
 */
export async function POST() {
  await ensureDbReady();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isRedisEnabled()) {
    return NextResponse.json(
      {
        error: "Redis is not configured",
        redisEnabled: false,
        tip: "Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel, then redeploy.",
      },
      { status: 400 }
    );
  }

  const before = await listProfilesByUserId(session.user.id);
  const result = await republishUserProfiles(session.user.id);

  const verified: Record<string, boolean> = {};
  for (const slug of result.slugs) {
    const remote = await redisGetProfileBySlug(slug);
    verified[slug] = Boolean(remote && remote.slug);
  }

  const base = process.env.NEXTAUTH_URL || "https://smartcard.migbiz.com";

  return NextResponse.json({
    success: true,
    redisEnabled: true,
    published: result.slugs,
    verified,
    publicUrls: result.slugs.map((s) => `${base}/p/${s}`),
    beforeCount: before.length,
    tip: Object.values(verified).every(Boolean)
      ? "All slugs verified in Redis. Open /p/your-slug in a private window."
      : "Some slugs failed verification — check Upstash logs / size limits (avoid huge data-URL photos).",
  });
}

export async function GET() {
  await ensureDbReady();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profiles = await listProfilesByUserId(session.user.id);
  const checks: { slug: string; inRedis: boolean }[] = [];
  for (const p of profiles) {
    const remote = await redisGetProfileBySlug(p.slug);
    checks.push({ slug: p.slug, inRedis: Boolean(remote) });
  }

  let index: string[] = [];
  try {
    index = await redisListSlugs();
  } catch {
    index = [];
  }

  return NextResponse.json({
    redisEnabled: isRedisEnabled(),
    cards: checks,
    knownSlugsSample: index.slice(0, 50),
  });
}
