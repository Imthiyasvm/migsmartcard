import { db, persistDb } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import {
  getPaymentIntent,
  intentStatus,
  isZiinaConfigured,
  ziinaTestMode,
  ZiinaIntentStatus,
} from "@/lib/ziina";
import { Payment, PaymentStatus, PlanId } from "@/types";

export const AED = "AED";
export const FILS_PER_AED = 100;
/** Ziina minimum charge: 2 AED (200 fils). */
export const MIN_CHARGE_FILS = 200;

/** USD → AED conversion rate; configurable, defaults to the pegged rate. */
export function usdToAedRate(): number {
  const raw = parseFloat((process.env.ZIINA_USD_TO_AED || "").trim());
  return Number.isFinite(raw) && raw > 0 ? raw : 3.6725;
}

export function usdToFils(usd: number): number {
  return Math.round(usd * usdToAedRate() * FILS_PER_AED);
}

export function filsToAed(fils: number): number {
  return Math.round(fils) / FILS_PER_AED;
}

export function formatAedFils(fils: number): string {
  return filsToAed(fils).toFixed(2);
}

export function planPriceUsd(
  planId: string,
  billingCycle: "monthly" | "yearly"
): number {
  const plan = getPlan(planId);
  return billingCycle === "yearly" ? plan.priceYearly : plan.price;
}

export function ziinaStatusToPaymentStatus(
  status: ZiinaIntentStatus | string | null
): PaymentStatus {
  switch (status) {
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "canceled":
    case "cancelled":
    case "expired":
      return "cancelled";
    default:
      return "pending";
  }
}

/** Grant (or extend) a subscription and sync profile branding to the plan. */
export function grantSubscription(
  userId: string,
  planId: PlanId,
  billingCycle: "monthly" | "yearly"
) {
  const plan = getPlan(planId);
  const user = db.users.getById(userId);
  if (!user) return null;

  const now = new Date();
  const currentEnd = user.subscriptionEndsAt
    ? new Date(user.subscriptionEndsAt)
    : null;
  const base = currentEnd && currentEnd > now ? currentEnd : now;
  const endsAt = new Date(base);
  if (billingCycle === "yearly") {
    endsAt.setFullYear(endsAt.getFullYear() + 1);
  } else {
    endsAt.setMonth(endsAt.getMonth() + 1);
  }

  const updated = db.users.update(userId, {
    plan: planId,
    subscriptionEndsAt: endsAt.toISOString(),
  });

  const profile = db.profiles.getByUserId(userId);
  if (profile) {
    db.profiles.update(profile.id, {
      theme: {
        ...profile.theme,
        showBranding: !plan.limits.removeBranding,
      },
    });
  }
  return updated;
}

export interface FulfillResult {
  payment: Payment | null;
  status: PaymentStatus | null;
  ziinaStatus: string | null;
  fulfilled: boolean;
  alreadyCompleted: boolean;
}

/**
 * Idempotent fulfillment shared by the webhook and the return-URL confirm
 * route — one dispatcher covering subscriptions AND card orders. The payment
 * intent is always re-fetched from Ziina so callers can never trust a
 * client-supplied status; re-processing a completed payment is a no-op.
 */
export async function fulfillPaymentIntent(
  intentId: string
): Promise<FulfillResult> {
  const payment = db.payments.getByIntentId(intentId);
  if (!payment) {
    return {
      payment: null,
      status: null,
      ziinaStatus: null,
      fulfilled: false,
      alreadyCompleted: false,
    };
  }
  if (payment.status === "completed") {
    return {
      payment,
      status: "completed",
      ziinaStatus: "completed",
      fulfilled: false,
      alreadyCompleted: true,
    };
  }

  const intent = await getPaymentIntent(intentId);
  const zStatus = intentStatus(intent);
  const status = ziinaStatusToPaymentStatus(zStatus);

  let fulfilled = false;
  if (status === "completed") {
    if (payment.type === "order" && payment.orderId) {
      // Paid — move the order into fulfillment
      db.orders.update(payment.orderId, { status: "processing" });
      fulfilled = true;
    } else if (
      payment.type === "subscription" &&
      payment.planId &&
      payment.billingCycle
    ) {
      grantSubscription(payment.userId, payment.planId, payment.billingCycle);
      fulfilled = true;
    }
  }

  db.payments.update(payment.id, { status });
  await persistDb();

  return {
    payment: db.payments.getById(payment.id) || payment,
    status,
    ziinaStatus: zStatus,
    fulfilled,
    alreadyCompleted: false,
  };
}

/** Gateway state exposed to the client (mode, currency, conversion rate). */
export function publicPaymentConfig() {
  return {
    configured: isZiinaConfigured(),
    testMode: ziinaTestMode(),
    currency: AED,
    usdToAed: usdToAedRate(),
  };
}
