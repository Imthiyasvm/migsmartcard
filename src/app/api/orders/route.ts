import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, ensureDbReady, persistDb } from "@/lib/db";
import { createId } from "@/lib/id";
import { absoluteUrl } from "@/lib/utils";
import { cardUnitPriceUsd, getCardDesign } from "@/lib/cards";
import { createPaymentIntent, isZiinaConfigured } from "@/lib/ziina";
import { MIN_CHARGE_FILS, usdToFils } from "@/lib/billing";
import { CardOrder, Payment } from "@/types";

export async function GET() {
  await ensureDbReady();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = db.orders.getByUserId(session.user.id);
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  await ensureDbReady();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { quantity, design, logoUrl, shippingAddress } = body;

  if (!quantity || !design || !shippingAddress) {
    return NextResponse.json(
      { error: "Quantity, design, and address required" },
      { status: 400 }
    );
  }

  const qty = Math.min(500, Math.max(1, parseInt(String(quantity), 10) || 1));
  const unitPriceUsd = cardUnitPriceUsd(design);
  const designName = getCardDesign(design)?.name || design.replace(/-/g, " ");
  const now = new Date().toISOString();

  // Real payment via Ziina: order is stored pending until the payment
  // intent completes (webhook / return-confirm marks it processing).
  if (isZiinaConfigured()) {
    try {
      const totalFils = Math.max(usdToFils(unitPriceUsd * qty), MIN_CHARGE_FILS);
      const confirmUrl = absoluteUrl("/api/billing/confirm?to=/dashboard/shop");
      const intent = await createPaymentIntent({
        amountFils: totalFils,
        message: `MigSmartCard order — ${designName} × ${qty}`,
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

      const order: CardOrder = {
        id: createId("order"),
        userId: session.user.id,
        quantity: qty,
        design,
        logoUrl,
        status: "pending",
        shippingAddress,
        totalAmount: totalFils / 100,
        currency: "AED",
        createdAt: now,
        updatedAt: now,
      };
      db.orders.create(order);

      const payment: Payment = {
        id: createId("pay"),
        userId: session.user.id,
        type: "order",
        description: `Card order — ${designName} × ${qty}`,
        orderId: order.id,
        amountFils: totalFils,
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
        order,
        simulated: false,
        redirectUrl: intent.redirect_url,
      });
    } catch (e) {
      console.error("Ziina order payment intent failed", e);
      return NextResponse.json(
        { error: "Payment gateway unavailable. Please try again later." },
        { status: 502 }
      );
    }
  }

  // Simulated mode (no Ziina key): place the order exactly as before — no
  // real charge, admin workflow unchanged.
  const order = db.orders.create({
    id: createId("order"),
    userId: session.user.id,
    quantity: qty,
    design,
    logoUrl,
    status: "pending",
    shippingAddress,
    totalAmount: unitPriceUsd * qty,
    currency: "USD",
    createdAt: now,
    updatedAt: now,
  });
  await persistDb();

  return NextResponse.json({ success: true, order, simulated: true });
}
