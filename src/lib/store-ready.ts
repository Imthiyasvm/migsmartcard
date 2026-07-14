/**
 * Upstash Redis REST client for public /p/[slug] cards.
 *
 * Required env (Vercel Production + Preview):
 *   UPSTASH_REDIS_REST_URL   e.g. https://xxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN e.g. AXxxxx...
 *
 * Docs: https://upstash.com/docs/redis/features/restapi
 */

const REDIS_URL = (process.env.UPSTASH_REDIS_REST_URL || "").trim();
const REDIS_TOKEN = (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();

const KEY_STORE = "migsmartcard:v2:store";
const KEY_SLUG_INDEX = "migsmartcard:v2:slugs";
const KEY_PROFILE_SLUG = (slug: string) =>
  `migsmartcard:v2:profile:slug:${slug.toLowerCase().trim()}`;
const KEY_PROFILE_ID = (id: string) => `migsmartcard:v2:profile:id:${id}`;

// Allow compressed JPEG data URLs (~up to ~400KB base64) for profile photos
const MAX_INLINE_IMAGE = 550_000;

export type RedisDiag = {
  enabled: boolean;
  urlHost: string | null;
  tokenSet: boolean;
  lastError: string | null;
  lastStatus: number | null;
  pingOk: boolean | null;
};

let lastError: string | null = null;
let lastStatus: number | null = null;

export function isRedisEnabled() {
  return Boolean(REDIS_URL && REDIS_TOKEN);
}

export function getRedisDiag(): RedisDiag {
  let urlHost: string | null = null;
  try {
    if (REDIS_URL) urlHost = new URL(REDIS_URL).host;
  } catch {
    urlHost = "invalid-url";
  }
  return {
    enabled: isRedisEnabled(),
    urlHost,
    tokenSet: Boolean(REDIS_TOKEN),
    lastError,
    lastStatus,
    pingOk: null,
  };
}

/**
 * Upstash REST accepts either:
 *  - POST body: ["CMD", "arg1", ...]
 *  - or pipeline: [["CMD", ...], ...]
 */
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

    lastStatus = res.status;
    const text = await res.text();

    if (!res.ok) {
      lastError = `HTTP ${res.status}: ${text.slice(0, 300)}`;
      console.error("Redis error", lastError);
      return null;
    }

    let json: { result?: unknown; error?: string };
    try {
      json = JSON.parse(text) as { result?: unknown; error?: string };
    } catch {
      lastError = `Invalid JSON: ${text.slice(0, 200)}`;
      return null;
    }

    if (json.error) {
      lastError = String(json.error);
      console.error("Redis result error", json.error);
      return null;
    }

    lastError = null;
    return json.result ?? null;
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
    console.error("Redis fetch failed", e);
    return null;
  }
}

function slimImage(value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (value.startsWith("data:") && value.length > MAX_INLINE_IMAGE) {
    return "";
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

export async function redisPing(): Promise<{
  ok: boolean;
  setResult: unknown;
  getResult: unknown;
  error: string | null;
}> {
  if (!isRedisEnabled()) {
    return {
      ok: false,
      setResult: null,
      getResult: null,
      error: "Redis env vars missing",
    };
  }
  const key = "migsmartcard:v2:ping";
  const val = `ok-${Date.now()}`;
  const setResult = await redisCommand(["SET", key, val]);
  const getResult = await redisCommand(["GET", key]);
  const ok = getResult === val;
  return {
    ok,
    setResult,
    getResult,
    error: ok ? null : lastError || "SET/GET mismatch",
  };
}

export async function loadStoreFromRedis(): Promise<Record<
  string,
  unknown
> | null> {
  if (!isRedisEnabled()) return null;
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
    analytics: [],
    nfcCards: store.nfcCards,
    orders: store.orders,
  };
  let body = JSON.stringify(payload);
  if (body.length > 900_000) {
    body = JSON.stringify({ ...payload, leads: [], analytics: [] });
  }
  const result = await redisCommand(["SET", KEY_STORE, body]);
  return result === "OK";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function redisSaveProfile(profile: any): Promise<boolean> {
  if (!isRedisEnabled() || !profile?.slug) return false;
  const slim = slimProfileForRedis(profile);
  const slug = String(slim.slug).toLowerCase().trim();
  const json = JSON.stringify(slim);

  // Sequential writes so we can detect the first failure clearly
  const setSlug = await redisCommand(["SET", KEY_PROFILE_SLUG(slug), json]);
  if (setSlug !== "OK") {
    console.error("redisSaveProfile SET slug failed", slug, setSlug, lastError);
    return false;
  }

  await redisCommand(["SADD", KEY_SLUG_INDEX, slug]);

  if (slim.id) {
    await redisCommand(["SET", KEY_PROFILE_ID(String(slim.id)), json]);
  }
  if (slim.userId) {
    await redisCommand([
      "SET",
      `migsmartcard:v2:profile:user:${slim.userId}`,
      json,
    ]);
  }

  // v1 compatibility keys
  await redisCommand(["SET", `migsmartcard:v1:profile:slug:${slug}`, json]);

  // Verify read-back
  const check = await redisCommand(["GET", KEY_PROFILE_SLUG(slug)]);
  if (typeof check !== "string") {
    console.error("redisSaveProfile verify GET failed", slug, lastError);
    return false;
  }
  return true;
}

export async function redisGetProfileBySlug(
  slug: string
): Promise<Record<string, unknown> | null> {
  if (!isRedisEnabled() || !slug) return null;
  const key = slug.toLowerCase().trim();

  const keys = [
    KEY_PROFILE_SLUG(key),
    `migsmartcard:v1:profile:slug:${key}`,
  ];

  for (const k of keys) {
    const raw = await redisCommand(["GET", k]);
    if (typeof raw === "string" && raw.length > 0) {
      try {
        return JSON.parse(raw);
      } catch {
        /* try next */
      }
    }
  }
  return null;
}

export async function redisGetProfileByUserId(
  userId: string
): Promise<Record<string, unknown> | null> {
  if (!isRedisEnabled() || !userId) return null;
  for (const k of [
    `migsmartcard:v2:profile:user:${userId}`,
    `migsmartcard:v1:profile:user:${userId}`,
  ]) {
    const raw = await redisCommand(["GET", k]);
    if (typeof raw === "string" && raw.length > 0) {
      try {
        return JSON.parse(raw);
      } catch {
        /* next */
      }
    }
  }
  return null;
}

export async function redisListSlugs(): Promise<string[]> {
  if (!isRedisEnabled()) return [];
  const result = await redisCommand(["SMEMBERS", KEY_SLUG_INDEX]);
  if (Array.isArray(result)) return result.map(String);
  return [];
}

export async function redisVerifySlug(slug: string): Promise<boolean> {
  const p = await redisGetProfileBySlug(slug);
  return Boolean(p && p.slug);
}
