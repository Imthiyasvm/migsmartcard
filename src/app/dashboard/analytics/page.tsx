"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Eye,
  Users,
  MousePointerClick,
  Download,
  Nfc,
  QrCode,
  TrendingUp,
  Lock,
  Crown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { canUseFeature } from "@/lib/plans";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#1a5ff5", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const planId = session?.user?.plan || "free";
  const isProPlus = canUseFeature(planId, "analytics");

  const [days, setDays] = useState(30);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [days, isProPlus]);

  const summary = data?.summary || {};

  const cards = [
    { label: "Views", value: summary.views, icon: Eye },
    { label: "Unique", value: summary.uniqueVisitors, icon: Users },
    { label: "Clicks", value: summary.linkClicks, icon: MousePointerClick },
    { label: "Saves", value: summary.saves, icon: Download },
    { label: "NFC Taps", value: summary.nfcTaps, icon: Nfc },
    { label: "QR Scans", value: summary.qrScans, icon: QrCode },
    { label: "Leads", value: summary.leads, icon: TrendingUp },
  ];

  // Free user: grayed out content with upgrade prompt
  if (!isProPlus) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Analytics</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track engagement across all channels
            </p>
          </div>
          <div className="flex gap-2">
            {[7, 14, 30, 90].map((d) => (
              <Button
                key={d}
                size="sm"
                variant={days === d ? "default" : "outline"}
                onClick={() => setDays(d)}
                disabled
              >
                {d}d
              </Button>
            ))}
          </div>
        </div>

        {/* Grayed out content overlay */}
        <div className="relative">
          {/* Blurred / grayed out stats grid */}
          <div className="pointer-events-none select-none opacity-30 grayscale">
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
              {cards.map((c) => (
                <Card key={c.label}>
                  <CardContent className="p-4 text-center">
                    <c.icon className="mx-auto h-5 w-5 text-brand-600" />
                    <p className="mt-2 text-xl font-bold">
                      {formatNumber(c.value || 0)}
                    </p>
                    <p className="text-[11px] text-slate-500">{c.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Blurred chart */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72 flex items-center justify-center text-sm text-slate-400">
                    Analytics data
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Devices</CardTitle>
                  <CardDescription>Where visitors open your card</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-sm text-slate-400">
                    No device data
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Upgrade overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="mx-auto max-w-md rounded-2xl border border-brand-200 bg-white/95 p-8 text-center shadow-glow backdrop-blur-sm dark:border-brand-800 dark:bg-[#141414]/95">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950">
                <Lock className="h-8 w-8 text-brand-600" />
              </div>
              <h2 className="font-display text-xl font-bold">
                Analytics is a Pro+ Feature
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Unlock your analytics dashboard, lead tracking, and detailed profile insights with a Pro plan or higher.
              </p>
              <Button className="mt-6" size="lg" asChild>
                <Link href="/dashboard/billing">
                  <Crown className="h-4 w-4" /> Upgrade to Pro
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data?.isAdmin
              ? "Platform-wide engagement across every profile"
              : "Track engagement across all channels"}
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 90].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? "default" : "outline"}
              onClick={() => setDays(d)}
            >
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          Loading analytics...
        </div>
      ) : (
        <>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
            {cards.map((c) => (
              <Card key={c.label}>
                <CardContent className="p-4 text-center">
                  <c.icon className="mx-auto h-5 w-5 text-brand-600" />
                  <p className="mt-2 text-xl font-bold">
                    {formatNumber(c.value || 0)}
                  </p>
                  <p className="text-[11px] text-slate-500">{c.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Traffic Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.daily || []}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a5ff5" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#1a5ff5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => v.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#1a5ff5"
                      fill="url(#g1)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Devices</CardTitle>
                <CardDescription>Where visitors open your card</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {(data?.devices || []).length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.devices}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, percent }) =>
                            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                        >
                          {(data.devices as { name: string }[]).map(
                            (_: { name: string }, i: number) => (
                              <Cell
                                key={i}
                                fill={COLORS[i % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      No device data
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
                <CardDescription>Countries by visits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {(data?.countries || []).length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.countries} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={100}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip />
                        <Bar dataKey="value" fill="#1a5ff5" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      No location data
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {(data?.topLinks || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.topLinks.map(
                    (link: { name: string; value: number }, i: number) => (
                      <div
                        key={link.name}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium">{link.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-500">
                          {link.value} clicks
                        </span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}