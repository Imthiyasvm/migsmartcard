"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShoppingBag, Package, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { CARD_DESIGNS } from "@/lib/cards";
import { CardOrder } from "@/types";

interface PaymentConfig {
  configured: boolean;
  testMode: boolean;
  currency: string;
  usdToAed: number;
}

const RETURN_BANNERS: Record<string, { text: string; tone: "success" | "info" | "error" }> = {
  success: { text: "Payment completed — your order is being processed.", tone: "success" },
  pending: { text: "Payment is processing. Your order will update once Ziina confirms it.", tone: "info" },
  failed: { text: "Payment failed. You have not been charged — your order is still pending.", tone: "error" },
  cancelled: { text: "Payment was cancelled. You have not been charged — your order is still pending.", tone: "error" },
};

function ShopPageInner() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<CardOrder[]>([]);
  const [selected, setSelected] = useState(CARD_DESIGNS[0].id);
  const [qty, setQty] = useState(1);
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [payment, setPayment] = useState<PaymentConfig | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []));
    fetch("/api/billing")
      .then((r) => r.json())
      .then((d) => setPayment(d.payment || null))
      .catch(() => {});

    // Returning from Ziina checkout — refresh order list to pick up status
    if (searchParams.get("payment")) {
      fetch("/api/orders")
        .then((r) => r.json())
        .then((d) => setOrders(d.orders || []));
    }
  }, [searchParams]);

  const design = CARD_DESIGNS.find((d) => d.id === selected)!;
  const aedPrice = (usd: number) =>
    payment ? Math.round(usd * payment.usdToAed) : null;
  const totalAed = aedPrice(design.priceUsd * qty);

  const placeOrder = async () => {
    if (!address.trim()) {
      setMessage("Please enter a shipping address");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: qty,
          design: selected,
          logoUrl: logoUrl || undefined,
          shippingAddress: address,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.redirectUrl) {
          // Real payment — hand off to Ziina's hosted checkout
          window.location.assign(data.redirectUrl);
          return;
        }
        setOrders((prev) => [data.order, ...prev]);
        setMessage("Order placed successfully! We'll ship soon.");
        setAddress("");
      } else {
        setMessage(data.error || "Order failed");
      }
    } catch {
      setMessage("Order failed");
    }
    setLoading(false);
  };

  const statusVariant = (s: string) => {
    if (s === "delivered") return "success" as const;
    if (s === "shipped") return "default" as const;
    if (s === "cancelled") return "danger" as const;
    return "warning" as const;
  };

  const orderTotal = (o: CardOrder) =>
    o.currency === "AED" ? `AED ${o.totalAmount.toFixed(2)}` : `$${o.totalAmount}`;

  const returnStatus = searchParams.get("payment") || "";
  const banner = RETURN_BANNERS[returnStatus];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold">Order NFC Cards</h1>
          <p className="mt-1 text-sm text-slate-500">
            Premium physical MigSmartCards with embedded NFC
          </p>
        </div>
        {payment?.configured && (
          <p className="flex items-center gap-1 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure checkout by Ziina (AED)
            {payment.testMode && <Badge variant="warning" className="ml-1">Test mode</Badge>}
          </p>
        )}
      </div>

      {banner && (
        <div
          className={
            banner.tone === "success"
              ? "rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30"
              : banner.tone === "info"
                ? "rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:bg-brand-950/30"
                : "rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30"
          }
        >
          {banner.text}
        </div>
      )}

      {message && (
        <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:bg-brand-950/30">
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {CARD_DESIGNS.map((d) => {
          const priceAed = aedPrice(d.priceUsd);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelected(d.id)}
              className={`overflow-hidden rounded-2xl border-2 text-left transition ${
                selected === d.id
                  ? "border-brand-500 shadow-glow"
                  : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
              }`}
            >
              <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.image}
                  alt={d.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="font-semibold">{d.name}</p>
                <p className="mt-1 text-xs text-slate-500">{d.description}</p>
                <p className="mt-2 text-lg font-bold">
                  {priceAed !== null ? `AED ${priceAed}` : `$${d.priceUsd}`}
                  {priceAed !== null && (
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      (${d.priceUsd})
                    </span>
                  )}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Checkout
          </CardTitle>
          <CardDescription>
            {design.name} ·{" "}
            {aedPrice(design.priceUsd) !== null
              ? `AED ${aedPrice(design.priceUsd)} each`
              : `$${design.priceUsd} each`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Quantity"
            type="number"
            min={1}
            max={500}
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <Input
            label="Logo URL (optional — for Custom Print)"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
          />
          <div className="sm:col-span-2">
            <Input
              label="Shipping Address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, City, Country, Postal Code"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800 sm:col-span-2">
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold">
                {totalAed !== null ? `AED ${totalAed}` : `$${design.priceUsd * qty}`}
              </p>
            </div>
            <Button size="lg" onClick={placeOrder} loading={loading}>
              Place Order
            </Button>
          </div>
        </CardContent>
      </Card>

      {orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Order History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div>
                  <p className="font-semibold capitalize">
                    {o.design.replace(/-/g, " ")} × {o.quantity}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(o.createdAt)} · {orderTotal(o)}
                  </p>
                  {o.trackingNumber && (
                    <p className="text-xs text-brand-600">
                      Tracking: {o.trackingNumber}
                    </p>
                  )}
                </div>
                <Badge variant={statusVariant(o.status)} className="capitalize">
                  {o.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-slate-400">
          Loading shop...
        </div>
      }
    >
      <ShopPageInner />
    </Suspense>
  );
}
