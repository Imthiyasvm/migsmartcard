import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, ensureDbReady } from "@/lib/db";
import { PLANS, getPlan } from "@/lib/plans";
import { PlanId } from "@/types";

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

  // Simulated payment success (Stripe/Razorpay/PayPal would go here)
  const endsAt = new Date();
  if (billingCycle === "yearly") {
    endsAt.setFullYear(endsAt.getFullYear() + 1);
  } else {
    endsAt.setMonth(endsAt.getMonth() + 1);
  }

  const user = db.users.update(session.user.id, {
    plan: planId,
    subscriptionEndsAt: endsAt.toISOString(),
  });

  // Update profile branding based on plan
  const profile = db.profiles.getByUserId(session.user.id);
  if (profile) {
    db.profiles.update(profile.id, {
      theme: {
        ...profile.theme,
        showBranding: !plan.limits.removeBranding,
      },
    });
  }

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
    // In production: return Stripe checkout URL
    checkoutUrl: null,
    simulated: true,
  });
}
