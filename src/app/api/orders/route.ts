import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, ensureDbReady } from "@/lib/db";
import { createId } from "@/lib/id";

const DESIGN_PRICES: Record<string, number> = {
  "premium-metal": 59,
  "wood-grain": 45,
  "custom-print": 49,
};

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

  const unitPrice = DESIGN_PRICES[design] || 29;
  const total = unitPrice * quantity;

  const order = db.orders.create({
    id: createId('order'),
    userId: session.user.id,
    quantity,
    design,
    logoUrl,
    status: "pending",
    shippingAddress,
    totalAmount: total,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, order });
}
