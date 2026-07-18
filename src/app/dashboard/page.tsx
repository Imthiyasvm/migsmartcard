"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Eye,
  Users,
  MousePointerClick,
  Nfc,
  ExternalLink,
  QrCode,
  ArrowRight,
  TrendingUp,
  Crown,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { canUseFeature } from "@/lib/plans";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsSummary {
  views: number;
  uniqueVisitors: number;
  linkClicks: number;
  saves: number;
  nfcTaps: number;
  qrScans: number;
  leads: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const planId = session?.user?.plan || "free";
  const isProPlus = canUseFeature(planId, "analytics");

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [daily, setDaily] = useState<{ date: string; views: number }[]>([]);
  const [leads, setLeads] = useState<
    { id: string; name: string; email: string; createdAt: string; viewed: boolean }[]
  >([]);
  const [profile, setProfile] = useState<{ slug: string; fullName: string } | null>(
    null
  );

  useEffect(() => {
    if (!isProPlus) return;
    fetch("/api/analytics?days=30")
      .then((r) => r.json())
      .then((d) => {
        setSummary(d.summary);
        setDaily(d.daily || []);
      })
      .catch(() => {});

    fetch("/api/leads")
      .then((r) => r.json())
      .then((d) => setLeads((d.leads || []).slice(0, 5)))
      .catch(() => {});

    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile))
      .catch(() => {});
  }, [isProPlus]);

  const stats = [
    {
      label: "Profile Views",
      value: summary?.views ?? 0,
      icon: Eye,
      color: "text-brand-600 bg-brand-50 dark:bg-brand-950",
    },
    {
      label: "Unique Visitors",
      value: summary?.uniqueVisitors ?? 0,
      icon: Users,
      color: "text-violet-600 bg-violet-50 dark:bg-violet-950",
    },
    {
      label: "Link Clicks",
      value: summary?.linkClicks ?? 0,
      icon: MousePointerClick,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950",
    },
    {
      label: "Leads",
      value: summary?.leads ?? 0,
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950",
    },
    {
      label: "NFC Taps",
      value: summary?.nfcTaps ?? 0,
      icon: Nfc,
      color: "text-rose-600 bg-rose-50 dark:bg-rose-950",
    },
    {
      label: "QR Scans",
      value: summary?.qrScans ?? 0,
      icon: QrCode,
      color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950",
    },
  ];

  // Free user: grayed out overview with upgrade prompt
  if (!isProPlus) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Welcome back, {session?.user?.name?.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Here&apos;s how your digital profile is performing
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/p/${profile.slug}`} target="_blank">
                  <ExternalLink className="h-4 w-4" /> View Profile
                </Link>
              </Button>
            )}
            <Button size="sm" asChild>
              <Link href="/dashboard/profile">Edit Profile</Link>
            </Button>
          </div>
        </div>

        {/* Grayed out content overlay */}
        <div className="relative">
          {/* Blurred / grayed out stats grid */}
          <div className="pointer-events-none select-none opacity-30 grayscale">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((s) => (
                <Card key={s.label}>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}
                    >
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{s.label}</p>
                      <p className="text-2xl font-bold">{formatNumber(s.value)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Blurred chart */}
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Views (Last 30 Days)</CardTitle>
                  <CardDescription>Profile views, NFC taps & QR scans</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-sm text-slate-400">
                    Analytics data
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Leads</CardTitle>
                  <CardDescription>Latest contact exchanges</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="py-8 text-center text-sm text-slate-400">Lead data</p>
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
                Overview is a Pro+ Feature
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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Welcome back, {session?.user?.name?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s how your digital profile is performing
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/p/${profile.slug}`} target="_blank">
                <ExternalLink className="h-4 w-4" /> View Profile
              </Link>
            </Button>
          )}
          <Button size="sm" asChild>
            <Link href="/dashboard/profile">Edit Profile</Link>
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="text-2xl font-bold">{formatNumber(s.value)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Leads */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Views (Last 30 Days)</CardTitle>
            <CardDescription>Profile views, NFC taps & QR scans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {daily.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d4a574" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#d4a574" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => v.slice(5)}
                      className="text-slate-400"
                    />
                    <YAxis tick={{ fontSize: 11 }} className="text-slate-400" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 13,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#d4a574"
                      fill="url(#colorViews)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No analytics data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Latest contact exchanges</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/leads">
                All <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {leads.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">
                No leads yet. Share your profile!
              </p>
            )}
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-[#141414]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {lead.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{lead.name}</p>
                    {!lead.viewed && (
                      <Badge variant="default" className="text-[10px]">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">{lead.email}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {formatDateTime(lead.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/qr">
          <Card className="transition hover:border-brand-300 hover:shadow-card">
            <CardContent className="flex items-center gap-4 p-5">
              <QrCode className="h-8 w-8 text-brand-600" />
              <div>
                <p className="font-semibold">QR & NFC</p>
                <p className="text-xs text-slate-500">Download QR, manage NFC</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/shop">
          <Card className="transition hover:border-brand-300 hover:shadow-card">
            <CardContent className="flex items-center gap-4 p-5">
              <Nfc className="h-8 w-8 text-brand-600" />
              <div>
                <p className="font-semibold">Order NFC Card</p>
                <p className="text-xs text-slate-500">Physical NFC smart cards</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/billing">
          <Card className="transition hover:border-brand-300 hover:shadow-card">
            <CardContent className="flex items-center gap-4 p-5">
              <TrendingUp className="h-8 w-8 text-brand-600" />
              <div>
                <p className="font-semibold">Upgrade Plan</p>
                <p className="text-xs text-slate-500">
                  Current:{" "}
                  <span className="capitalize font-medium">{session?.user?.plan}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
