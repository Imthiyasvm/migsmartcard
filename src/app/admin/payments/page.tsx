"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { CardOrder, Payment } from "@/types";

interface EnrichedPayment extends Payment {
  userEmail: string;
  order: CardOrder | null;
}

interface PaymentsResponse {
  payments: EnrichedPayment[];
  summary: {
    revenueAed: number;
    completed: number;
    pending: number;
    failed: number;
  };
}

const statusVariant = (s: string) => {
  if (s === "completed") return "success" as const;
  if (s === "pending") return "warning" as const;
  return "danger" as const;
};

export default function AdminPaymentsPage() {
  const [data, setData] = useState<PaymentsResponse | null>(null);

  useEffect(() => {
    fetch("/api/admin?resource=payments")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading payments...
      </div>
    );
  }

  const { payments, summary } = data;

  const stats = [
    {
      label: "Revenue",
      value: `AED ${summary.revenueAed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Wallet,
      sub: "Completed payments",
    },
    {
      label: "Completed",
      value: summary.completed,
      icon: CheckCircle2,
      sub: "Successful transactions",
    },
    {
      label: "Pending",
      value: summary.pending,
      icon: Clock,
      sub: "Awaiting confirmation",
    },
    {
      label: "Failed",
      value: summary.failed,
      icon: XCircle,
      sub: "Failed or cancelled",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Payment History</h1>
        <p className="mt-1 text-sm text-slate-500">
          All Ziina transactions — subscriptions and card orders (AED)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {s.label}
              </CardTitle>
              <s.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="mt-1 text-xs text-slate-400">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" /> {payments.length} Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {payments.length === 0 && (
            <p className="py-8 text-center text-slate-400">
              No transactions yet
            </p>
          )}
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={p.type === "subscription" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {p.type}
                  </Badge>
                  <p className="font-semibold">{p.description}</p>
                  {p.test && <Badge variant="warning">test</Badge>}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {p.userEmail} · {formatDateTime(p.createdAt)}
                </p>
                {p.intentId && (
                  <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                    {p.intentId}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold">
                  AED {(p.amountFils / 100).toFixed(2)}
                </p>
                <Badge variant={statusVariant(p.status)} className="capitalize">
                  {p.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
