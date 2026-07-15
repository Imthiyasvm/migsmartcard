import { NextRequest, NextResponse } from "next/server";
import { ensureDbReady } from "@/lib/db";
import {
  verifyWebhookSignature,
  webhookIntentId,
  ziinaWebhookSecret,
  ZiinaWebhookEvent,
} from "@/lib/ziina";
import { fulfillPaymentIntent } from "@/lib/billing";

// HMAC verification needs the Node.js crypto runtime
export const runtime = "nodejs";

/**
 * Ziina webhook receiver.
 *
 * Register https://YOUR-DOMAIN/api/billing/webhook in the Ziina dashboard
 * (Developers → Webhooks) together with ZIINA_WEBHOOK_SECRET.
 *
 * Every event is verified against the X-Hmac-Signature header, then fulfilled
 * through the shared idempotent helper — duplicate deliveries are harmless.
 */
export async function POST(req: NextRequest) {
  await ensureDbReady();

  if (!ziinaWebhookSecret()) {
    return NextResponse.json(
      { error: "Webhook is not configured" },
      { status: 503 }
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-hmac-signature");
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: ZiinaWebhookEvent;
  try {
    payload = JSON.parse(rawBody) as ZiinaWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const intentId = webhookIntentId(payload);
  if (!intentId) {
    return NextResponse.json(
      { error: "Missing payment intent id" },
      { status: 400 }
    );
  }

  try {
    const result = await fulfillPaymentIntent(intentId);
    if (!result.payment) {
      // Intent we don't recognize (not created by this app) — acknowledge so
      // Ziina doesn't retry forever.
      return NextResponse.json({ received: true, ignored: true });
    }
    return NextResponse.json({
      received: true,
      status: result.status,
      fulfilled: result.fulfilled || result.alreadyCompleted,
    });
  } catch (e) {
    console.error("Ziina webhook fulfillment error", e);
    return NextResponse.json(
      { error: "Payment gateway unreachable" },
      { status: 502 }
    );
  }
}
