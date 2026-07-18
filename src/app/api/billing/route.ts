import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, ensureDbReady, persistDb } from "@/lib/db";
import { PLANS, getPlan } from "@/lib/plans";
import { createId } from "@/lib/id";
import { absoluteUrl } from "@/lib/utils";
import { createPaymentIntent, isZiinaConfigured } from "@/lib/ziina";
import {
  MIN_CHARGE_FILS,
  grantSubscription,
  planPriceUsd,
  publicPaymentConfig,
  usdToFils,
} from "@/lib/billing";
import { Payment, PlanId } from "@/types";

export async function GET() {
  await ensureDbReady();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = db.users.getById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    plan: getPlan(user.plan),
    plans: PLANS,
    subscriptionEndsAt: user.subscriptionEndsAt,
    status: user.status,
    payment: publicPaymentConfig(),
  });
}

export async function POST(req: NextRequest) {
  await ensureDbReady();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { planId, billingCycle } = body as {
    planId: PlanId;
    billingCycle: "monthly" | "yearly";
  };

  const plan = getPlan(planId);
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  const cycle: "monthly" | "yearly" =
    billingCycle === "yearly" ? "yearly" : "monthly";
  const priceUsd = planPriceUsd(planId, cycle);

  // Free plan / simulated mode: grant directly without a real charge
  // (keeps development & demos working with no Ziina key configured).
  if (priceUsd <= 0 || !isZiinaConfigured()) {
    const user = grantSubscription(session.user.id, planId, cycle);
    await persistDb();

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${plan.name}`,
      plan,
      user: user
        ? {
            id: user.id,
            plan: user.plan,
            subscriptionEndsAt: user.subscriptionEndsAt,
          }
        : null,
      checkoutUrl: null,
      simulated: true,
    });
  }

  // Real payment: create a Ziina Payment Intent and send the user to the
  // hosted checkout (card / Apple Pay / Google Pay).
  try {
    const amountFils = Math.max(usdToFils(priceUsd), MIN_CHARGE_FILS);
    // Ziina does not append the intent id automatically. Per Ziina docs, the
    // literal placeholder below is replaced with the created Payment Intent ID
    // when the hosted checkout returns to our app.
    const confirmUrl = absoluteUrl(
      "/api/billing/confirm?payment_intent={PAYMENT_INTENT_ID}"
    );
    const intent = await createPaymentIntent({
      amountFils,
      message: `MigSmartCard ${plan.name} plan (${cycle})`,
      successUrl: confirmUrl,
      cancelUrl: confirmUrl,
      failureUrl: confirmUrl,
    });

    if (!intent.id || !intent.redirect_url) {
      return NextResponse.json(
        { error: "Payment gateway returned an incomplete response" },
        { status: 502 }
      );
    }

    const now = new Date().toISOString();
    const payment: Payment = {
      id: createId("pay"),
      userId: session.user.id,
      type: "subscription",
      description: `${plan.name} plan (${cycle})`,
      planId,
      billingCycle: cycle,
      amountFils,
      currency: "AED",
      status: "pending",
      intentId: intent.id,
      test: intent.test ?? true,
      createdAt: now,
      updatedAt: now,
    };
    db.payments.create(payment);
    await persistDb();

    return NextResponse.json({
      success: true,
      simulated: false,
      plan,
      redirectUrl: intent.redirect_url,
      payment: {
        id: payment.id,
        intentId: payment.intentId,
        amountFils: payment.amountFils,
        currency: payment.currency,
      },
    });
  } catch (e) {
    console.error("Ziina payment intent creation failed", e);
    return NextResponse.json(
      { error: "Payment gateway unavailable. Please try again later." },
      { status: 502 }
    );
  }
}
