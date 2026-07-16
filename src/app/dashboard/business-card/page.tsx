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
import { cn, getInitials, displayWebsiteUrl } from "@/lib/utils";

type Orientation = "landscape" | "portrait";
type StyleId = "white" | "black" | "custom";
type FontWeight = "600" | "700" | "800";
type NameSize = "md" | "lg" | "xl";

const STYLES: Record<
  StyleId,
  {
    name: string;
    bg0: string;
    bg1: string;
    fg: string;
    accent: string;
    muted: string;
    qrPad: string;
  }
> = {
  white: {
    name: "White",
    bg0: "#ffffff",
    bg1: "#f1f5f9",
    fg: "#0f172a",
    accent: "#1a5ff5",
    muted: "#64748b",
    qrPad: "#ffffff",
  },
  black: {
    name: "Black",
    bg0: "#0a0a0a",
    bg1: "#1c1917",
    fg: "#fafaf9",
    accent: "#fbbf24",
    muted: "rgba(250,250,249,0.72)",
    qrPad: "#ffffff",
  },
  custom: {
    name: "Custom",
    bg0: "#0b1224",
    bg1: "#1a5ff5",
    fg: "#ffffff",
    accent: "#7dd3fc",
    muted: "rgba(255,255,255,0.75)",
    qrPad: "#ffffff",
  },
};

const NAME_PX: Record<NameSize, { land: number; port: number }> = {
  md: { land: 44, port: 42 },
  lg: { land: 54, port: 50 },
  xl: { land: 64, port: 58 },
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

/** Draw image with object-fit: cover, object-position: center */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(size / iw, size / ih);
  const sw = size / scale;
  const sh = size / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, size, size);
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

export default function BusinessCardDesignerPage() {
  const { data: session } = useSession();
  const planId = session?.user?.plan || "free";
  const plan = getPlan(planId);
  const allowed = plan.limits.businessCardDesigner;

  const [profiles, setProfiles] = useState<DigitalProfile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [styleId, setStyleId] = useState<StyleId>("black");
  const [customAccent, setCustomAccent] = useState("#1a5ff5");
  const [customBg, setCustomBg] = useState("#0b1224");
  const [photoShape, setPhotoShape] = useState<"circle" | "square">("circle");
  const [nameSize, setNameSize] = useState<NameSize>("lg");
  const [fontWeight, setFontWeight] = useState<FontWeight>("800");
  const [showTitle, setShowTitle] = useState(true);
  const [showCompany, setShowCompany] = useState(true);
  const [showWebsite, setShowWebsite] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
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
        if (primary) {
          setProfileId(primary.id);
          if (primary.theme?.photoShape === "square") setPhotoShape("square");
        }
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
      /* keep */
    }
    setQrUrl(`/api/qr?url=${encodeURIComponent(target)}&format=png&size=720`);
  }, [profile]);

  const isLandscape = orientation === "landscape";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !profile) return;

    const baseStyle = STYLES[styleId];
    const style =
      styleId === "custom"
        ? { ...baseStyle, bg0: customBg, bg1: customAccent, accent: customAccent }
        : baseStyle;

    const W = isLandscape ? 1260 : 780;
    const H = isLandscape ? 720 : 1260;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let cancelled = false;

    (async () => {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, style.bg0);
      g.addColorStop(1, style.bg1);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle =
        styleId === "white" ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.12)";
      ctx.lineWidth = 3;
      roundRect(ctx, 20, 20, W - 40, H - 40, 32);
      ctx.stroke();

      const rg = ctx.createRadialGradient(W * 0.15, 0, 20, W * 0.2, 0, W * 0.55);
      rg.addColorStop(0, "rgba(255,255,255,0.14)");
      rg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);

      const photo = profile.profilePhoto
        ? await loadImage(profile.profilePhoto)
        : null;
      const qr = qrUrl ? await loadImage(qrUrl) : null;
      const logo = await loadImage(
        styleId === "white" ? "/brand/logo.svg" : "/brand/logo-dark.svg"
      );
      if (cancelled) return;

      const drawAvatar = (x: number, y: number, size: number) => {
        ctx.save();
        if (photoShape === "circle") {
          ctx.beginPath();
          ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
        } else {
          roundRect(ctx, x, y, size, size, size * 0.14);
          ctx.clip();
        }
        if (photo) {
          drawCover(ctx, photo, x, y, size);
        } else {
          ctx.fillStyle =
            styleId === "white" ? "#e2e8f0" : "rgba(255,255,255,0.12)";
          ctx.fillRect(x, y, size, size);
          ctx.fillStyle = style.accent;
          ctx.font = `bold ${Math.floor(size * 0.28)}px Inter, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            getInitials(profile.fullName || "U"),
            x + size / 2,
            y + size / 2
          );
        }
        ctx.restore();
        ctx.strokeStyle = style.accent;
        ctx.lineWidth = 6;
        if (photoShape === "circle") {
          ctx.beginPath();
          ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          roundRect(ctx, x, y, size, size, size * 0.14);
          ctx.stroke();
        }
      };

      const drawQr = (x: number, y: number, size: number) => {
        const pad = 18;
        ctx.fillStyle = style.qrPad;
        roundRect(ctx, x, y, size, size, 22);
        ctx.fill();
        ctx.strokeStyle =
          styleId === "white" ? "rgba(15,23,42,0.08)" : "rgba(0,0,0,0.06)";
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, size, size, 22);
        ctx.stroke();
        if (qr) {
          ctx.drawImage(qr, x + pad, y + pad, size - pad * 2, size - pad * 2);
        }
      };

      const website = displayWebsiteUrl(profile.website);
      const namePx = NAME_PX[nameSize][isLandscape ? "land" : "port"];
      const weight =
        fontWeight === "600" ? "600" : fontWeight === "700" ? "700" : "800";

      if (isLandscape) {
        const avatar = 210; // bigger photo
        const qrSize = 240;
        drawAvatar(52, H / 2 - avatar / 2, avatar);
        const tx = 300;
        ctx.textAlign = "left";
        ctx.fillStyle = style.fg;
        ctx.font = `${weight} ${namePx}px Inter, system-ui, sans-serif`;
        ctx.fillText(profile.fullName || "Your Name", tx, H / 2 - 78, 560);
        let ty = H / 2 - 30;
        if (showTitle && profile.jobTitle) {
          ctx.fillStyle = style.muted;
          ctx.font = "26px Inter, system-ui, sans-serif";
          ctx.fillText(profile.jobTitle, tx, ty, 560);
          ty += 40;
        }
        if (showCompany) {
          ctx.fillStyle = style.accent;
          ctx.font = "bold 28px Inter, system-ui, sans-serif";
          ctx.fillText(profile.companyName || "Company Name", tx, ty, 560);
          ty += 40;
        }
        ctx.fillStyle = style.muted;
        ctx.font = "22px Inter, system-ui, sans-serif";
        if (showWebsite && website) {
          ctx.fillText(website, tx, ty, 560);
          ty += 32;
        }
        if (showEmail && profile.email) {
          ctx.fillText(profile.email, tx, ty, 560);
          ty += 30;
        }
        if (showPhone && profile.phone) {
          ctx.fillText(profile.phone.trim(), tx, ty, 560);
        }
        drawQr(W - 310, H / 2 - qrSize / 2, qrSize);
        ctx.fillStyle = style.muted;
        ctx.font = "15px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Scan digital card", W - 190, H / 2 + qrSize / 2 + 30);
      } else {
        const avatar = 240;
        const qrSize = 280;
        drawAvatar(W / 2 - avatar / 2, 64, avatar);
        ctx.textAlign = "center";
        ctx.fillStyle = style.fg;
        ctx.font = `${weight} ${namePx}px Inter, system-ui, sans-serif`;
        ctx.fillText(profile.fullName || "Your Name", W / 2, 360, W - 80);
        let ty = 410;
        if (showTitle && profile.jobTitle) {
          ctx.fillStyle = style.muted;
          ctx.font = "24px Inter, system-ui, sans-serif";
          ctx.fillText(profile.jobTitle, W / 2, ty, W - 80);
          ty += 40;
        }
        if (showCompany) {
          ctx.fillStyle = style.accent;
          ctx.font = "bold 28px Inter, system-ui, sans-serif";
          ctx.fillText(profile.companyName || "Company Name", W / 2, ty, W - 80);
          ty += 42;
        }
        ctx.fillStyle = style.muted;
        ctx.font = "22px Inter, system-ui, sans-serif";
        if (showWebsite && website) {
          ctx.fillText(website, W / 2, ty, W - 80);
          ty += 34;
        }
        if (showEmail && profile.email) {
          ctx.fillText(profile.email, W / 2, ty, W - 80);
        }
        drawQr(W / 2 - qrSize / 2, H - 420, qrSize);
        ctx.fillStyle = style.muted;
        ctx.font = "16px Inter, system-ui, sans-serif";
        ctx.fillText("Scan to connect", W / 2, H - 110);
      }

      // Brand logo
      if (logo) {
        const lw = 160;
        const lh = (logo.height / logo.width) * lw;
        ctx.globalAlpha = 0.85;
        ctx.drawImage(logo, 36, H - lh - 28, lw, lh);
        ctx.globalAlpha = 1;
      } else {
        ctx.textAlign = "left";
        ctx.fillStyle = style.muted;
        ctx.font = "13px Inter, system-ui, sans-serif";
        ctx.fillText("MigSmartCard", 36, H - 28);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    profile,
    orientation,
    styleId,
    qrUrl,
    isLandscape,
    customAccent,
    customBg,
    photoShape,
    nameSize,
    fontWeight,
    showTitle,
    showCompany,
    showWebsite,
    showEmail,
    showPhone,
  ]);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || !profile) return;
    setExporting(true);
    try {
      const a = document.createElement("a");
      a.download = `${profile.slug || "business-card"}-${orientation}-${styleId}.png`;
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
          Premium business cards
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          White, black, or custom layouts with large photo, QR, and text style
          controls. Pro and above.
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
            Premium models · large centered photo · text styles · QR
          </p>
        </div>
        <Button size="sm" onClick={downloadPng} loading={exporting}>
          <Download className="h-4 w-4" /> Download PNG
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Source card</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={profile.id}
                onChange={(e) => setProfileId(e.target.value)}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.cardName || p.fullName}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href="/dashboard/profile">
                  <RefreshCw className="h-4 w-4" /> Edit profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Orientation</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {(
                [
                  ["landscape", Monitor, "Landscape"],
                  ["portrait", Smartphone, "Portrait"],
                ] as const
              ).map(([id, Icon, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setOrientation(id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-3 text-sm font-medium",
                    orientation === id
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 dark:border-slate-700"
                  )}
                >
                  <Icon className="h-5 w-5" /> {label}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Premium models</CardTitle>
              <CardDescription>White · Black · Custom</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(STYLES) as StyleId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStyleId(id)}
                    className={cn(
                      "rounded-xl border p-3 text-center text-xs font-semibold",
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
              </div>
              {styleId === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Accent
                    </label>
                    <input
                      type="color"
                      value={customAccent}
                      onChange={(e) => setCustomAccent(e.target.value)}
                      className="h-10 w-full cursor-pointer rounded-lg border"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Background
                    </label>
                    <input
                      type="color"
                      value={customBg}
                      onChange={(e) => setCustomBg(e.target.value)}
                      className="h-10 w-full cursor-pointer rounded-lg border"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Photo & text style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium">Photo shape</p>
                <div className="flex gap-2">
                  {(["circle", "square"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPhotoShape(s)}
                      className={cn(
                        "flex-1 border px-3 py-2 text-sm capitalize",
                        photoShape === s
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-slate-200",
                        s === "circle" ? "rounded-full" : "rounded-xl"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium">Name size</p>
                <div className="flex gap-2">
                  {(["md", "lg", "xl"] as NameSize[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNameSize(s)}
                      className={cn(
                        "flex-1 rounded-xl border px-3 py-2 text-sm uppercase",
                        nameSize === s
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-slate-200"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium">Name weight</p>
                <div className="flex gap-2">
                  {(["600", "700", "800"] as FontWeight[]).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setFontWeight(w)}
                      className={cn(
                        "flex-1 rounded-xl border px-3 py-2 text-sm",
                        fontWeight === w
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-slate-200"
                      )}
                      style={{ fontWeight: Number(w) }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {(
                  [
                    ["Title / job", showTitle, setShowTitle],
                    ["Company", showCompany, setShowCompany],
                    ["Website", showWebsite, setShowWebsite],
                    ["Email", showEmail, setShowEmail],
                    ["Phone", showPhone, setShowPhone],
                  ] as const
                ).map(([label, val, set]) => (
                  <label
                    key={label}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                  >
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={(e) => set(e.target.checked)}
                    />
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-4 text-xs text-slate-500">
              <p>Extra-large photo (center-cropped) + large QR for print.</p>
              <Badge className="capitalize">{plan.name}</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-100/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">
            Live preview
          </p>
          <div
            className={cn(
              "overflow-hidden rounded-2xl shadow-card",
              isLandscape ? "w-full max-w-[620px]" : "w-full max-w-[360px]"
            )}
          >
            <canvas
              ref={canvasRef}
              className="h-auto w-full"
              style={{ display: "block" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
