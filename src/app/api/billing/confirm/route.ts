import { NextRequest, NextResponse } from "next/server";
import { ensureDbReady } from "@/lib/db";
import { isZiinaConfigured } from "@/lib/ziina";
import { fulfillPaymentIntent } from "@/lib/billing";
import { PaymentStatus } from "@/types";

// The hosted checkout redirects here — never prerender
export const dynamic = "force-dynamic";

const RETURN_STATUS: Record<PaymentStatus, string> = {
  completed: "success",
  pending: "pending",
  failed: "failed",
  cancelled: "cancelled",
};

function redirectTo(req: NextRequest, base: string, status: string) {
  const url = new URL(base, req.url);
  url.searchParams.set("payment", status);
  return NextResponse.redirect(url);
}

/**
 * Return-URL finalizer for the Ziina hosted checkout.
 *
 * Ziina sends the browser back here (success, cancel and failure URLs all
 * point at this route) with the payment_intent id in the query string. We
 * re-fetch the intent from Ziina (the authoritative status) and fulfill
 * immediately, so users don't have to wait for the webhook to arrive.
 * The webhook remains a redundant, idempotent second path.
 */
export async function GET(req: NextRequest) {
  await ensureDbReady();

  const params = req.nextUrl.searchParams;
  const intentId =
    params.get("payment_intent") ||
    params.get("payment_intent_id") ||
    params.get("id");

  const requested = params.get("to") || "/dashboard/billing";
  const to =
    requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/dashboard/billing";

  if (!isZiinaConfigured() || !intentId) {
    return redirectTo(req, to, "failed");
  }

  try {
    const result = await fulfillPaymentIntent(intentId);
    if (!result.payment || !result.status) {
      return redirectTo(req, to, "failed");
    }
    return redirectTo(req, to, RETURN_STATUS[result.status]);
  } catch (e) {
    // Gateway temporarily unreachable — the webhook will finalize later.
    console.error("Ziina confirm error", e);
    return redirectTo(req, to, "pending");
  }
}
