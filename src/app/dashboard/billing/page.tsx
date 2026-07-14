"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Check, CreditCard } from "lucide-react";
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

export default function BillingPage() {
  const { data: session, update } = useSession();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/billing")
      .then((r) => r.json())
      .then((d) => {
        setPlans(d.plans || []);
        setCurrentPlan(d.plan);
        setEndsAt(d.subscriptionEndsAt);
      });
  }, []);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Billing & Plans</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your subscription and payment methods
        </p>
      </div>

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
            <p className="text-xs text-slate-400">
              Payments simulated (Stripe / Razorpay / PayPal ready)
            </p>
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
          const price =
            cycle === "yearly"
              ? Math.round(plan.priceYearly / 12)
              : plan.price;
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
                  <span className="text-3xl font-extrabold">${price}</span>
                  <span className="text-sm text-slate-500">/mo</span>
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
