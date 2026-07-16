import crypto from "crypto";
import { db } from "@/lib/db";

/**
 * Ziina (UAE) payment gateway client.
 *
 * - Payment Intents API: https://api.ziina.com/api/payment_intent
 * - Amounts are in fils (1 AED = 100 fils; Ziina minimum charge is 200 fils = 2 AED)
 * - Webhooks are authenticated with an `X-Hmac-Signature` header:
 *   hex-encoded HMAC-SHA256 of the raw request body using the webhook secret.
 *
 * Credentials come from environment variables first; if they are absent the
 * platform settings saved by the admin (Admin → Settings → Ziina) are used.
 * With no configured token, the app stays in simulated mode.
 */

const API_BASE = (
  process.env.ZIINA_API_BASE || "https://api.ziina.com/api"
).replace(/\/+$/, "");

export type ZiinaIntentStatus =
  | "requires_payment_instrument"
  | "requires_user_action"
  | "completed"
  | "canceled"
  | "failed"
  | "expired";

export interface ZiinaPaymentIntent {
  id: string;
  amount?: number;
  currency_code?: string;
  status?: ZiinaIntentStatus;
  redirect_url?: string;
  message?: string;
  test?: boolean;
  latest_operation?: { status?: ZiinaIntentStatus };
  [key: string]: unknown;
}

/** API token: env var wins, then the value saved by the admin. */
export function ziinaApiToken(): string {
  const env = (process.env.ZIINA_API_TOKEN || "").trim();
  return env || (db.settings.get().ziinaApiToken || "").trim();
}

/** Webhook secret: env var wins, then the value saved by the admin. */
export function ziinaWebhookSecret(): string {
  const env = (process.env.ZIINA_WEBHOOK_SECRET || "").trim();
  return env || (db.settings.get().ziinaWebhookSecret || "").trim();
}

/** Test mode unless explicitly disabled — never charge real cards by accident. */
export function ziinaTestMode(): boolean {
  const env = (process.env.ZIINA_TEST_MODE || "").trim();
  if (env) return env.toLowerCase() !== "false";
  const stored = db.settings.get().ziinaTestMode;
  return stored === undefined ? true : stored;
}

export function isZiinaConfigured(): boolean {
  return ziinaApiToken().length > 0;
}

async function ziinaFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = ziinaApiToken();
  if (!token) {
    throw new Error("ZIINA_API_TOKEN is not configured");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (data as { message?: string } | null)?.message ||
      text ||
      res.statusText;
    throw new Error(`Ziina API error ${res.status}: ${message}`);
  }
  return data as T;
}

export interface CreatePaymentIntentInput {
  /** Amount in fils (integer). Ziina minimum: 200 fils (2 AED). */
  amountFils: number;
  message?: string;
  successUrl: string;
  cancelUrl: string;
  failureUrl: string;
  test?: boolean;
}

/** Create a Payment Intent; returns the hosted checkout page as redirect_url. */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput
): Promise<ZiinaPaymentIntent> {
  return ziinaFetch<ZiinaPaymentIntent>("/payment_intent", {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(input.amountFils),
      currency_code: "AED",
      message: input.message,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      failure_url: input.failureUrl,
      test: input.test ?? ziinaTestMode(),
    }),
  });
}

export async function getPaymentIntent(
  id: string
): Promise<ZiinaPaymentIntent> {
  return ziinaFetch<ZiinaPaymentIntent>(
    `/payment_intent/${encodeURIComponent(id)}`
  );
}

/** Current authoritative status (top-level, or latest operation). */
export function intentStatus(
  intent: ZiinaPaymentIntent
): ZiinaIntentStatus | null {
  return intent.status || intent.latest_operation?.status || null;
}

/**
 * Verify the X-Hmac-Signature webhook header (hex HMAC-SHA256 of the raw
 * body), compared in constant time.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = ziinaWebhookSecret();
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const provided = signature.trim().toLowerCase();
  if (provided.length !== expected.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(provided, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

export interface ZiinaWebhookEvent {
  event?: string;
  data?: ({ id?: string; status?: string; payment_intent_id?: string } &
    Record<string, unknown>) | null;
  [key: string]: unknown;
}

/** Extract the payment intent id, tolerant of payload shape variants. */
export function webhookIntentId(
  payload: ZiinaWebhookEvent | null | undefined
): string | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload.data;
  const id =
    data?.id ||
    data?.payment_intent_id ||
    (payload as { id?: string }).id ||
    null;
  return typeof id === "string" && id.length > 0 ? id : null;
}
