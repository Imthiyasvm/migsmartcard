"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin?resource=stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Platform Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Growth and engagement across MigSmartCard
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Users", value: stats.totalUsers },
          { label: "Profiles", value: stats.totalProfiles },
          { label: "Views", value: stats.totalViews },
          { label: "Leads", value: stats.totalLeads },
          { label: "MRR", value: `$${stats.mrr}` },
          { label: "NFC Assigned", value: stats.nfcAssigned },
          { label: "Orders", value: stats.totalOrders },
          { label: "Active Users", value: stats.activeUsers },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 text-center">
              <p className="text-2xl font-bold">
                {typeof s.value === "number" ? formatNumber(s.value) : s.value}
              </p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.planCounts || {}).map(([plan, count]) => {
              const pct =
                stats.totalUsers > 0
                  ? Math.round(((count as number) / stats.totalUsers) * 100)
                  : 0;
              return (
                <div key={plan}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize font-medium">{plan}</span>
                    <span className="text-slate-500">
                      {count as number} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
