/**
 * Upstash Redis persistence for Vercel public /p/[slug] cards.
 *
 * Env:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";

const KEY_STORE = "migsmartcard:v2:store";
const KEY_SLUG_INDEX = "migsmartcard:v2:slugs";
const KEY_PROFILE_SLUG = (slug: string) =>
  `migsmartcard:v2:profile:slug:${slug.toLowerCase().trim()}`;
const KEY_PROFILE_ID = (id: string) => `migsmartcard:v2:profile:id:${id}`;
const KEY_USER_PROFILES = (userId: string) =>
  `migsmartcard:v2:user:${userId}:profiles`;

// Upstash free tier ~1MB per value — strip huge inline images from Redis copies
const MAX_INLINE_IMAGE = 80_000;

export function isRedisEnabled() {
  return Boolean(REDIS_URL && REDIS_TOKEN);
}

async function redisCommand(command: unknown[]): Promise<unknown> {
  if (!isRedisEnabled()) return null;
  try {
    const res = await fetch(REDIS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("Redis error", res.status, text.slice(0, 500));
      return null;
    }
    try {
      const json = JSON.parse(text) as { result?: unknown; error?: string };
      if (json.error) {
        console.error("Redis result error", json.error);
        return null;
      }
      return json.result ?? null;
    } catch {
      return null;
    }
  } catch (e) {
    console.error("Redis fetch failed", e);
    return null;
  }
}

function slimImage(value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (value.startsWith("data:") && value.length > MAX_INLINE_IMAGE) {
    return ""; // drop huge data URLs so Redis write succeeds
  }
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function slimProfileForRedis(profile: any): any {
  if (!profile || typeof profile !== "object") return profile;
  return {
    ...profile,
    profilePhoto: slimImage(profile.profilePhoto),
    coverImage: slimImage(profile.coverImage),
  };
}

export async function loadStoreFromRedis(): Promise<Record<string, unknown> | null> {
  if (!isRedisEnabled()) return null;
  // Prefer v2, fall back to v1 for older deploys
  let raw = await redisCommand(["GET", KEY_STORE]);
  if (!raw || typeof raw !== "string") {
    raw = await redisCommand(["GET", "migsmartcard:v1:store"]);
  }
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function saveStoreToRedis(
  store: Record<string, unknown>
): Promise<boolean> {
  if (!isRedisEnabled()) return false;
  const profiles = Array.isArray(store.profiles)
    ? (store.profiles as Record<string, unknown>[]).map(slimProfileForRedis)
    : [];
  const payload = {
    users: store.users,
    profiles,
    companies: store.companies,
    leads: store.leads,
    analytics: store.analytics,
    nfcCards: store.nfcCards,
    orders: store.orders,
  };
  const json = JSON.stringify(payload);
  // If still huge, drop analytics from full store (profiles kept via slug keys)
  let body = json;
  if (body.length > 900_000) {
    body = JSON.stringify({ ...payload, analytics: [] });
  }
  const result = await redisCommand(["SET", KEY_STORE, body]);
  return result === "OK" || result === true || result === "ok";
}

// Accept any profile-like object (DigitalProfile or plain record)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function redisSaveProfile(profile: any): Promise<boolean> {
  if (!isRedisEnabled() || !profile?.slug) return false;
  const slim = slimProfileForRedis(profile);
  const slug = String(slim.slug).toLowerCase().trim();
  const json = JSON.stringify(slim);

  const ops: Promise<unknown>[] = [
    redisCommand(["SET", KEY_PROFILE_SLUG(slug), json]),
    redisCommand(["SADD", KEY_SLUG_INDEX, slug]),
  ];
  if (slim.id) {
    ops.push(redisCommand(["SET", KEY_PROFILE_ID(String(slim.id)), json]));
  }
  if (slim.userId) {
    // Keep a list of profile ids for the user
    if (slim.id) {
      ops.push(
        redisCommand(["SADD", KEY_USER_PROFILES(String(slim.userId)), String(slim.id)])
      );
    }
    // Also store primary/latest under user key for backward compat
    ops.push(
      redisCommand([
        "SET",
        `migsmartcard:v2:profile:user:${slim.userId}`,
        json,
      ])
    );
    // v1 key compat
    ops.push(
      redisCommand([
        "SET",
        `migsmartcard:v1:profile:slug:${slug}`,
        json,
      ])
    );
  }

  const results = await Promise.all(ops);
  const ok = results.some((r) => r === "OK" || r === true || r === 1 || r === "ok");
  if (!ok) {
    console.error("redisSaveProfile failed for", slug, results);
  }
  return ok;
}

export async function redisGetProfileBySlug(
  slug: string
): Promise<Record<string, unknown> | null> {
  if (!isRedisEnabled() || !slug) return null;
  const key = slug.toLowerCase().trim();
  // Try v2 then v1
  let raw = await redisCommand(["GET", KEY_PROFILE_SLUG(key)]);
  if (!raw || typeof raw !== "string") {
    raw = await redisCommand([
      "GET",
      `migsmartcard:v1:profile:slug:${key}`,
    ]);
  }
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function redisGetProfileByUserId(
  userId: string
): Promise<Record<string, unknown> | null> {
  if (!isRedisEnabled() || !userId) return null;
  let raw = await redisCommand([
    "GET",
    `migsmartcard:v2:profile:user:${userId}`,
  ]);
  if (!raw || typeof raw !== "string") {
    raw = await redisCommand([
      "GET",
      `migsmartcard:v1:profile:user:${userId}`,
    ]);
  }
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function redisListSlugs(): Promise<string[]> {
  if (!isRedisEnabled()) return [];
  const result = await redisCommand(["SMEMBERS", KEY_SLUG_INDEX]);
  if (Array.isArray(result)) return result.map(String);
  return [];
}

/** Verify a slug is readable from Redis after write */
export async function redisVerifySlug(slug: string): Promise<boolean> {
  const p = await redisGetProfileBySlug(slug);
  return Boolean(p && p.slug);
}
