"use client";

import { useEffect, useState } from "react";
import {
  Users,
  CreditCard,
  Nfc,
  TrendingUp,
  Eye,
  ShoppingBag,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDate } from "@/lib/utils";

export default function AdminDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin?resource=stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading admin stats...
      </div>
    );
  }

  const cards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      sub: `${stats.activeUsers} active`,
    },
    {
      label: "MRR",
      value: `$${stats.mrr}`,
      icon: CreditCard,
      sub: "Simulated revenue",
    },
    {
      label: "NFC Assigned",
      value: stats.nfcAssigned,
      icon: Nfc,
      sub: `${stats.nfcUnassigned} unassigned`,
    },
    {
      label: "Leads Generated",
      value: stats.totalLeads,
      icon: TrendingUp,
      sub: "Platform-wide",
    },
    {
      label: "Profile Views",
      value: stats.totalViews,
      icon: Eye,
      sub: "All time",
    },
    {
      label: "Card Orders",
      value: stats.totalOrders,
      icon: ShoppingBag,
      sub: "Physical cards",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform overview for MigSmartCard
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{c.label}</p>
                <p className="text-2xl font-bold">
                  {typeof c.value === "number"
                    ? formatNumber(c.value)
                    : c.value}
                </p>
                <p className="text-xs text-slate-400">{c.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions by Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.planCounts || {}).map(([plan, count]) => (
              <div
                key={plan}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50"
              >
                <Badge className="capitalize">{plan}</Badge>
                <span className="font-semibold">{count as number} users</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest signups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats.recentUsers || []).map(
              (u: {
                id: string;
                name: string;
                email: string;
                plan: string;
                createdAt: string;
              }) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50"
                >
                  <div>
                    <p className="text-sm font-semibold">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="capitalize">{u.plan}</Badge>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {formatDate(u.createdAt)}
                    </p>
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
