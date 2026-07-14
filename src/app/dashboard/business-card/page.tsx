"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Download,
  Crown,
  RefreshCw,
  Smartphone,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DigitalProfile } from "@/types";
import { getPlan } from "@/lib/plans";
import { buildSharePath } from "@/lib/share-token";
import { cn, getInitials } from "@/lib/utils";

type Orientation = "landscape" | "portrait";
type StyleId = "midnight" | "ocean" | "minimal" | "gold";

const STYLES: Record<
  StyleId,
  { name: string; bg0: string; bg1: string; fg: string; accent: string; muted: string }
> = {
  midnight: {
    name: "Midnight",
    bg0: "#0b1224",
    bg1: "#1a5ff5",
    fg: "#ffffff",
    accent: "#59a5ff",
    muted: "rgba(255,255,255,0.72)",
  },
  ocean: {
    name: "Ocean",
    bg0: "#062a3f",
    bg1: "#0b6e99",
    fg: "#ffffff",
    accent: "#7dd3fc",
    muted: "rgba(255,255,255,0.75)",
  },
  minimal: {
    name: "Minimal Light",
    bg0: "#ffffff",
    bg1: "#e2e8f0",
    fg: "#0f172a",
    accent: "#1a5ff5",
    muted: "#64748b",
  },
  gold: {
    name: "Executive",
    bg0: "#1c1917",
    bg1: "#78350f",
    fg: "#fafaf9",
    accent: "#fbbf24",
    muted: "rgba(250,250,249,0.7)",
  },
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export default function BusinessCardDesignerPage() {
  const { data: session } = useSession();
  const planId = session?.user?.plan || "free";
  const plan = getPlan(planId);
  const allowed = plan.limits.businessCardDesigner;

  const [profiles, setProfiles] = useState<DigitalProfile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [styleId, setStyleId] = useState<StyleId>("midnight");
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch("/api/profile?list=1")
      .then((r) => r.json())
      .then((d) => {
        const list: DigitalProfile[] =
          d.profiles || (d.profile ? [d.profile] : []);
        setProfiles(list);
        const primary = list.find((p) => p.isPrimary) || list[0];
        if (primary) setProfileId(primary.id);
      })
      .finally(() => setLoading(false));
  }, []);

  const profile = profiles.find((p) => p.id === profileId) || profiles[0];

  useEffect(() => {
    if (!profile || typeof window === "undefined") {
      setQrUrl("");
      return;
    }
    let target = `${window.location.origin}/p/${profile.slug}`;
    try {
      target = `${window.location.origin}${buildSharePath(profile)}`;
    } catch {
      /* keep short */
    }
    setQrUrl(`/api/qr?url=${encodeURIComponent(target)}&format=png&size=512`);
  }, [profile]);

  const style = STYLES[styleId];
  const isLandscape = orientation === "landscape";

  // Draw preview + export canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !profile) return;

    const W = isLandscape ? 1050 : 675;
    const H = isLandscape ? 600 : 1050;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;

    (async () => {
      // Background gradient
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, style.bg0);
      g.addColorStop(1, style.bg1);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Soft highlight
      const rg = ctx.createRadialGradient(W * 0.2, 0, 10, W * 0.2, 0, W * 0.6);
      rg.addColorStop(0, "rgba(255,255,255,0.16)");
      rg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);

      const photo = profile.profilePhoto
        ? await loadImage(profile.profilePhoto)
        : null;
      const qr = qrUrl ? await loadImage(qrUrl) : null;
      if (cancelled) return;

      const drawAvatar = (x: number, y: number, size: number) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        if (photo) {
          ctx.drawImage(photo, x, y, size, size);
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          ctx.fillRect(x, y, size, size);
          ctx.fillStyle = style.accent;
          ctx.font = `bold ${Math.floor(size * 0.32)}px Inter, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(getInitials(profile.fullName || "U"), x + size / 2, y + size / 2);
        }
        ctx.restore();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.strokeStyle = style.accent;
        ctx.lineWidth = 4;
        ctx.stroke();
      };

      const drawQr = (x: number, y: number, size: number) => {
        const pad = 12;
        ctx.fillStyle = "#ffffff";
        roundRect(ctx, x, y, size, size, 16);
        ctx.fill();
        if (qr) {
          ctx.drawImage(qr, x + pad, y + pad, size - pad * 2, size - pad * 2);
        }
      };

      const website = (profile.website || "")
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");

      if (isLandscape) {
        drawAvatar(48, H / 2 - 80, 120);
        ctx.textAlign = "left";
        ctx.fillStyle = style.fg;
        ctx.font = "bold 44px Inter, system-ui, sans-serif";
        ctx.fillText(profile.fullName || "Your Name", 200, H / 2 - 50, 520);
        if (profile.jobTitle) {
          ctx.fillStyle = style.muted;
          ctx.font = "22px Inter, system-ui, sans-serif";
          ctx.fillText(profile.jobTitle, 200, H / 2 - 14, 520);
        }
        ctx.fillStyle = style.accent;
        ctx.font = "bold 24px Inter, system-ui, sans-serif";
        ctx.fillText(profile.companyName || "Company Name", 200, H / 2 + 36, 520);
        ctx.fillStyle = style.muted;
        ctx.font = "20px Inter, system-ui, sans-serif";
        let ty = H / 2 + 70;
        if (website) {
          ctx.fillText(website, 200, ty, 520);
          ty += 30;
        }
        if (profile.email) {
          ctx.fillText(profile.email, 200, ty, 520);
          ty += 28;
        }
        if (profile.phone) {
          ctx.fillText(profile.phone, 200, ty, 520);
        }
        drawQr(W - 220, H / 2 - 100, 180);
        ctx.fillStyle = style.muted;
        ctx.font = "14px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Scan to open digital card", W - 130, H / 2 + 100);
      } else {
        drawAvatar(W / 2 - 70, 70, 140);
        ctx.textAlign = "center";
        ctx.fillStyle = style.fg;
        ctx.font = "bold 42px Inter, system-ui, sans-serif";
        ctx.fillText(profile.fullName || "Your Name", W / 2, 260, W - 80);
        if (profile.jobTitle) {
          ctx.fillStyle = style.muted;
          ctx.font = "22px Inter, system-ui, sans-serif";
          ctx.fillText(profile.jobTitle, W / 2, 298, W - 80);
        }
        ctx.fillStyle = style.accent;
        ctx.font = "bold 26px Inter, system-ui, sans-serif";
        ctx.fillText(profile.companyName || "Company Name", W / 2, 350, W - 80);
        ctx.fillStyle = style.muted;
        ctx.font = "20px Inter, system-ui, sans-serif";
        if (website) ctx.fillText(website, W / 2, 388, W - 80);
        drawQr(W / 2 - 110, H - 320, 220);
        ctx.fillStyle = style.muted;
        ctx.font = "16px Inter, system-ui, sans-serif";
        ctx.fillText("Scan to connect", W / 2, H - 80);
      }

      // Brand mark
      ctx.textAlign = "left";
      ctx.fillStyle = style.muted;
      ctx.font = "12px Inter, system-ui, sans-serif";
      ctx.fillText("MigSmartCard", 28, H - 24);
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, orientation, styleId, qrUrl, isLandscape, style]);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || !profile) return;
    setExporting(true);
    try {
      const a = document.createElement("a");
      a.download = `${profile.slug || "business-card"}-${orientation}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Crown className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-bold">
          Printable business cards
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Auto-generate portrait or landscape cards with photo, name, company,
          website, and QR. Available on <strong>Pro</strong>,{" "}
          <strong>Business</strong>, and <strong>Enterprise</strong>.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Your plan:{" "}
          <span className="font-semibold capitalize">{plan.name}</span>
        </p>
        <Button className="mt-6" asChild>
          <Link href="/dashboard/billing">Upgrade plan</Link>
        </Button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-16 text-center text-slate-500">
        Create a digital card first.{" "}
        <Link href="/dashboard/profile" className="text-brand-600 underline">
          My Card
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Business card designer
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Auto-generated print layouts with QR · Pro+ feature
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={downloadPng}
            loading={exporting}
          >
            <Download className="h-4 w-4" /> Download PNG
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Source card</CardTitle>
              <CardDescription>
                Uses data from your digital profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block text-sm font-medium">Profile</label>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={profile.id}
                onChange={(e) => setProfileId(e.target.value)}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.cardName || p.fullName} (/p/{p.slug})
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href="/dashboard/profile">
                  <RefreshCw className="h-4 w-4" /> Edit profile data
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Orientation</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrientation("landscape")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 text-sm font-medium",
                  orientation === "landscape"
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 dark:border-slate-700"
                )}
              >
                <Monitor className="h-5 w-5" /> Landscape
              </button>
              <button
                type="button"
                onClick={() => setOrientation("portrait")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 text-sm font-medium",
                  orientation === "portrait"
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 dark:border-slate-700"
                )}
              >
                <Smartphone className="h-5 w-5" /> Portrait
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Style</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {(Object.keys(STYLES) as StyleId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStyleId(id)}
                  className={cn(
                    "rounded-xl border p-3 text-left text-xs font-semibold",
                    styleId === id
                      ? "border-brand-500 ring-1 ring-brand-500"
                      : "border-slate-200 dark:border-slate-700"
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${STYLES[id].bg0}, ${STYLES[id].bg1})`,
                    color: STYLES[id].fg,
                  }}
                >
                  {STYLES[id].name}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-4 text-xs text-slate-500">
              <p>
                Includes: profile photo, name, company, website, and QR to your
                digital card.
              </p>
              <p>
                Landscape ≈ 3.5″ × 2″ · Portrait ≈ 2″ × 3.5″ (export is high-res
                PNG).
              </p>
              <Badge className="capitalize">{plan.name}</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center justify-start rounded-2xl border border-slate-200 bg-slate-100/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">
            Live preview
          </p>
          <div
            className={cn(
              "overflow-hidden rounded-2xl shadow-card",
              isLandscape ? "w-full max-w-[560px]" : "w-full max-w-[320px]"
            )}
          >
            <canvas
              ref={canvasRef}
              className="h-auto w-full"
              style={{ display: "block" }}
            />
          </div>
          <p className="mt-4 max-w-md text-center text-xs text-slate-400">
            Click <strong>Download PNG</strong> to save for print shops or
            digital sharing. QR opens your MigSmartCard digital profile.
          </p>
        </div>
      </div>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
