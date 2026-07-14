import { NextResponse } from "next/server";
import { ensureDbReady, isRedisEnabled, db } from "@/lib/db";
import {
  getRedisDiag,
  redisGetProfileBySlug,
  redisListSlugs,
  redisPing,
  redisSaveProfile,
} from "@/lib/store-ready";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDbReady();
  const profiles = db.profiles.getAll();
  const redisOn = isRedisEnabled();
  const diag = getRedisDiag();

  const ping = redisOn ? await redisPing() : null;

  let index: string[] = [];
  const sampleChecks: { slug: string; inRedis: boolean }[] = [];

  if (redisOn) {
    index = await redisListSlugs();
    for (const p of profiles.slice(0, 12)) {
      const remote = await redisGetProfileBySlug(p.slug);
      sampleChecks.push({
        slug: p.slug,
        inRedis: Boolean(remote && remote.slug),
      });
    }
  }

  // Self-heal: if Redis works but seed/demo profiles missing, write them
  let healed = 0;
  if (redisOn && ping?.ok) {
    for (const p of profiles) {
      const remote = await redisGetProfileBySlug(p.slug);
      if (!remote) {
        const ok = await redisSaveProfile(p);
        if (ok) healed++;
      }
    }
    if (healed > 0) {
      index = await redisListSlugs();
      sampleChecks.length = 0;
      for (const p of profiles.slice(0, 12)) {
        const remote = await redisGetProfileBySlug(p.slug);
        sampleChecks.push({
          slug: p.slug,
          inRedis: Boolean(remote && remote.slug),
        });
      }
    }
  }

  const allInRedis =
    sampleChecks.length > 0 && sampleChecks.every((c) => c.inRedis);

  return NextResponse.json({
    ok: true,
    domain: process.env.NEXTAUTH_URL || null,
    redisEnabled: redisOn,
    redis: {
      ...diag,
      pingOk: ping?.ok ?? null,
      pingError: ping?.error ?? null,
      setResult: ping?.setResult ?? null,
      getResult: ping?.getResult ?? null,
    },
    profileCount: profiles.length,
    sampleSlugs: profiles.slice(0, 12).map((p) => p.slug),
    redisSlugIndexCount: index.length,
    redisSlugIndexSample: index.slice(0, 30),
    memoryVsRedis: sampleChecks,
    healedProfilesWritten: healed,
    shortLinksReady: allInRedis,
    tip: !redisOn
      ? "Redis env vars missing. Add UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN and redeploy."
      : ping && !ping.ok
        ? `Redis credentials/network failing: ${ping.error || diag.lastError}. Re-copy REST URL + TOKEN from Upstash console (not the Redis URL with rediss://).`
        : allInRedis
          ? "Redis OK. Short /p/slug links should work for listed slugs. For your cards: My Card → Save → Publish short /p/ link."
          : "Redis ping OK but some slugs missing. Open My Card → Publish short /p/ link for each card.",
  });
}

export async function POST() {
  await ensureDbReady();
  if (!isRedisEnabled()) {
    return NextResponse.json(
      { ok: false, error: "Redis env not set" },
      { status: 400 }
    );
  }

  const ping = await redisPing();
  if (!ping.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Redis ping failed",
        detail: ping,
        diag: getRedisDiag(),
        fix: "In Upstash → your database → REST API, copy UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN exactly. Do NOT use the redis:// connection string.",
      },
      { status: 500 }
    );
  }

  // Force-write all in-memory profiles to Redis
  const profiles = db.profiles.getAll();
  const results: { slug: string; ok: boolean }[] = [];
  for (const p of profiles) {
    const ok = await redisSaveProfile({
      ...p,
      isPublic: true,
    });
    results.push({ slug: p.slug, ok });
  }

  const verified: { slug: string; inRedis: boolean }[] = [];
  for (const p of profiles) {
    const remote = await redisGetProfileBySlug(p.slug);
    verified.push({ slug: p.slug, inRedis: Boolean(remote?.slug) });
  }

  return NextResponse.json({
    ok: verified.every((v) => v.inRedis),
    ping,
    wrote: results,
    verified,
    tip: "If verified is all true, open /p/alex-rivera and your published slugs in a private window.",
  });
}
