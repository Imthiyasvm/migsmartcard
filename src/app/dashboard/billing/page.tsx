"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SubscriptionPlan } from "@/types";
import { formatDate } from "@/lib/utils";

interface PaymentConfig {
  configured: boolean;
  testMode: boolean;
  currency: string;
  usdToAed: number;
}

const RETURN_BANNERS: Record<string, { text: string; tone: "success" | "info" | "error" }> = {
  success: { text: "Payment completed — your plan has been updated.", tone: "success" },
  pending: { text: "Payment is processing. Your plan will update as soon as Ziina confirms it.", tone: "info" },
  failed: { text: "Payment failed. You have not been charged — please try again.", tone: "error" },
  cancelled: { text: "Payment was cancelled. You have not been charged.", tone: "error" },
};

function BillingPageInner() {
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [payment, setPayment] = useState<PaymentConfig | null>(null);

  const load = () =>
    fetch("/api/billing")
      .then((r) => r.json())
      .then((d) => {
        setPlans(d.plans || []);
        setCurrentPlan(d.plan);
        setEndsAt(d.subscriptionEndsAt);
        setPayment(d.payment || null);
      });

  useEffect(() => {
    load();
    const status = searchParams.get("payment");
    if (status === "success") {
      update(); // refresh plan in the session token
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const aed = (usd: number) =>
    payment ? Math.round(usd * payment.usdToAed) : null;

  const upgrade = async (planId: string) => {
    setLoading(planId);
    setMessage("");
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle: cycle }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.redirectUrl) {
          // Real payment — hand off to Ziina's hosted checkout
          window.location.assign(data.redirectUrl);
          return;
        }
        setCurrentPlan(data.plan);
        setMessage(data.message);
        await update({ plan: planId });
      } else {
        setMessage(data.error || "Upgrade failed");
      }
    } catch {
      setMessage("Upgrade failed");
    }
    setLoading(null);
  };

  const returnStatus = searchParams.get("payment") || "";
  const banner = RETURN_BANNERS[returnStatus];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Billing & Plans</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your subscription and payment methods
        </p>
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
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30">
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Badge className="text-sm capitalize px-3 py-1">
              {currentPlan?.name || session?.user?.plan || "Free"}
            </Badge>
            {endsAt && (
              <p className="text-sm text-slate-500">
                Renews / ends {formatDate(endsAt)}
              </p>
            )}
            {payment?.configured ? (
              <p className="flex items-center gap-1 text-xs text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure payments by Ziina (AED)
                {payment.testMode && (
                  <Badge variant="warning" className="ml-1">Test mode</Badge>
                )}
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Simulated payments — set ZIINA_API_TOKEN to go live (see ZIINA_SETUP.md)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-2">
        <Button
          size="sm"
          variant={cycle === "monthly" ? "default" : "outline"}
          onClick={() => setCycle("monthly")}
        >
          Monthly
        </Button>
        <Button
          size="sm"
          variant={cycle === "yearly" ? "default" : "outline"}
          onClick={() => setCycle("yearly")}
        >
          Yearly <Badge className="ml-1">-17%</Badge>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = currentPlan?.id === plan.id;
          const priceUsd =
            cycle === "yearly"
              ? Math.round(plan.priceYearly / 12)
              : plan.price;
          const priceAed = aed(priceUsd);
          return (
            <Card
              key={plan.id}
              className={
                plan.popular
                  ? "border-brand-500 ring-1 ring-brand-500"
                  : isCurrent
                    ? "border-emerald-400"
                    : ""
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {isCurrent && <Badge variant="success">Current</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-2">
                  <span className="text-3xl font-extrabold">
                    {priceAed !== null ? `AED ${priceAed}` : `$${priceUsd}`}
                  </span>
                  <span className="text-sm text-slate-500">/mo</span>
                  {priceAed !== null && priceUsd > 0 && (
                    <p className="mt-0.5 text-xs text-slate-400">${priceUsd} USD</p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="mb-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isCurrent ? "secondary" : plan.popular ? "default" : "outline"}
                  disabled={isCurrent}
                  loading={loading === plan.id}
                  onClick={() => upgrade(plan.id)}
                >
                  {isCurrent
                    ? "Current Plan"
                    : plan.price === 0
                      ? "Downgrade"
                      : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-slate-400">
          Loading billing...
        </div>
      }
    >
      <BillingPageInner />
    </Suspense>
  );
}
