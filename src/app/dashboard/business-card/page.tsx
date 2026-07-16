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
  Sparkles,
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
import { ImageUpload } from "@/components/image-upload";

type Orientation = "landscape" | "portrait";
type StyleId = "white" | "black" | "glass" | "custom";
type FontWeight = "600" | "700" | "800";
type NameSize = "md" | "lg" | "xl";
type BrandingOption = "full" | "favicon" | "none";

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
  glass: {
    name: "Glassmorphism",
    bg0: "#0f172a",
    bg1: "#1e1b4b",
    fg: "#ffffff",
    accent: "#38bdf8",
    muted: "rgba(255,255,255,0.85)",
    qrPad: "rgba(255,255,255,0.92)",
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
  w: number,
  h: number
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
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
  const canRemoveBranding = plan.limits.removeBranding;

  const [profiles, setProfiles] = useState<DigitalProfile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [styleId, setStyleId] = useState<StyleId>("glass");
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
  const [brandingMode, setBrandingMode] = useState<BrandingOption>("full");
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
          if (primary.theme?.brandingMode) setBrandingMode(primary.theme.brandingMode);
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

  const updateProfilePhoto = (newUrl: string) => {
    if (!profile) return;
    const next = { ...profile, profilePhoto: newUrl };
    setProfiles((prev) =>
      prev.map((p) => (p.id === profile.id ? next : p))
    );
    // Persist via PUT
    fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...next, id: next.id }),
    }).catch(() => {});
  };

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
      // Load both uploaded images (profile photo + cover image)
      const photo = profile.profilePhoto
        ? await loadImage(profile.profilePhoto)
        : null;
      const cover = profile.coverImage
        ? await loadImage(profile.coverImage)
        : null;
      const qr = qrUrl ? await loadImage(qrUrl) : null;
      const logo = await loadImage(
        styleId === "white" ? "/brand/logo.svg" : "/brand/logo-dark.svg"
      );
      const faviconLogo = await loadImage("/icon.svg");

      if (cancelled) return;

      // Draw background
      if (styleId === "glass" && cover) {
        // 2-Image Aspect: Cover as rich blurred backdrop
        drawCover(ctx, cover, 0, 0, W, H);
        // Dark translucent vignette over background
        const bgOverlay = ctx.createLinearGradient(0, 0, W, H);
        bgOverlay.addColorStop(0, "rgba(15, 23, 42, 0.70)");
        bgOverlay.addColorStop(1, "rgba(15, 23, 42, 0.88)");
        ctx.fillStyle = bgOverlay;
        ctx.fillRect(0, 0, W, H);
      } else {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, style.bg0);
        g.addColorStop(1, style.bg1);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        if (cover) {
          ctx.globalAlpha = 0.25;
          drawCover(ctx, cover, 0, 0, W, H);
          ctx.globalAlpha = 1.0;
        }
      }

      // Border frame
      ctx.strokeStyle =
        styleId === "white"
          ? "rgba(15,23,42,0.08)"
          : "rgba(255,255,255,0.22)";
      ctx.lineWidth = 3;
      roundRect(ctx, 20, 20, W - 40, H - 40, 32);
      ctx.stroke();

      // Subtle glassmorphism overlay (2-image design: cover + frosted glass card surface)
      // Removed previous heavy multi-panel frosted glass effect for cleaner modern look
      if (styleId === "glass") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.085)";
        roundRect(ctx, 26, 26, W - 52, H - 52, 30);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
        ctx.lineWidth = 1.1;
        roundRect(ctx, 26, 26, W - 52, H - 52, 30);
        ctx.stroke();

        // soft inner glass highlight
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.lineWidth = 0.8;
        roundRect(ctx, 38, 38, W - 76, H - 76, 22);
        ctx.stroke();
      }

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
          drawCover(ctx, photo, x, y, size, size);
        } else {
          ctx.fillStyle =
            styleId === "white" ? "#e2e8f0" : "rgba(255,255,255,0.15)";
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
        ctx.lineWidth = 5;
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
          styleId === "white" ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.3)";
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
        const avatar = 180;
        const qrSize = 210;
        drawAvatar(70, H / 2 - avatar / 2 - 20, avatar);

        const tx = 325;
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

        drawQr(W - 280, H / 2 - qrSize / 2 - 15, qrSize);
        ctx.fillStyle = style.muted;
        ctx.font = "15px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Scan digital card", W - 175, H / 2 + qrSize / 2 + 15);
      } else {
        const avatar = 210;
        const qrSize = 250;
        drawAvatar(W / 2 - avatar / 2, 80, avatar);
        ctx.textAlign = "center";
        ctx.fillStyle = style.fg;
        ctx.font = `${weight} ${namePx}px Inter, system-ui, sans-serif`;
        ctx.fillText(profile.fullName || "Your Name", W / 2, 380, W - 80);
        let ty = 430;
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
        drawQr(W / 2 - qrSize / 2, H - 410, qrSize);
        ctx.fillStyle = style.muted;
        ctx.font = "16px Inter, system-ui, sans-serif";
        ctx.fillText("Scan to connect", W / 2, H - 120);
      }

      // Branding rendering based on Enterprise option
      if (canRemoveBranding && brandingMode === "none") {
        // Skip branding completely for enterprise / pro users
      } else if (brandingMode === "favicon" && faviconLogo) {
        // Enterprise option: Keep only the favicon logo for branding
        const size = 36;
        ctx.globalAlpha = 0.9;
        ctx.drawImage(faviconLogo, 36, H - size - 28, size, size);
        ctx.globalAlpha = 1;
      } else {
        // Full logo branding
        if (logo) {
          // Use same logo size perspective as reference business card designs (smaller, clean bottom-left)
          const lw = 112;
          const lh = (logo.height / logo.width) * lw;
          ctx.globalAlpha = 0.82;
          ctx.drawImage(logo, 38, H - lh - 26, lw, lh);
          ctx.globalAlpha = 1;
        } else {
          ctx.textAlign = "left";
          ctx.fillStyle = style.muted;
          ctx.font = "13px Inter, system-ui, sans-serif";
          ctx.fillText("MigSmartCard", 38, H - 26);
        }
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
    brandingMode,
    canRemoveBranding,
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
          Glassmorphism 2-image cards, White, Black, or Custom layouts with large photo, QR, and text style controls. Pro and above.
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
            Glassmorphism 2-image models · interactive photo cropper · enterprise branding controls
          </p>
        </div>
        <Button size="sm" onClick={downloadPng} loading={exporting}>
          <Download className="h-4 w-4" /> Download PNG
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
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

          {/* Profile Photo Uploader & Cropper in Business Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Profile Photo Crop</span>
                <Sparkles className="h-4 w-4 text-brand-600" />
              </CardTitle>
              <CardDescription>
                Crop or upload the photo used on your business card design
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                label="Profile photo"
                kind="photo"
                aspect={photoShape === "square" ? "square" : "circle"}
                value={profile.profilePhoto || ""}
                onChange={(url) => updateProfilePhoto(url)}
                hint="Crop photo to zoom, rotate, or align cleanly"
              />
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
              <CardTitle className="text-base flex items-center justify-between">
                <span>Design models</span>
                <Badge variant="outline" className="text-[10px]">
                  2-Image Aspect
                </Badge>
              </CardTitle>
              <CardDescription>
                Subtle glassmorphism on cover + photo · White · Black · Custom
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(STYLES) as StyleId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStyleId(id)}
                    className={cn(
                      "rounded-xl border p-2.5 text-center text-xs font-semibold transition",
                      styleId === id
                        ? "border-brand-500 ring-2 ring-brand-500"
                        : "border-slate-200 dark:border-slate-700"
                    )}
                    style={{
                      background:
                        id === "glass"
                          ? "linear-gradient(135deg, #0f172a, #312e81)"
                          : `linear-gradient(135deg, ${STYLES[id].bg0}, ${STYLES[id].bg1})`,
                      color: STYLES[id].fg,
                    }}
                  >
                    {STYLES[id].name}
                  </button>
                ))}
              </div>
              {styleId === "custom" && (
                <div className="grid grid-cols-2 gap-3 pt-2">
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

          {/* Branding Control for Enterprise */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Branding mode</CardTitle>
              <CardDescription>
                Customize brand logo on printable business cards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["full", "Full Logo"],
                    ["favicon", "Favicon Logo Only"],
                    ["none", "No Branding"],
                  ] as const
                ).map(([modeId, label]) => {
                  const active = brandingMode === modeId;
                  const isLocked = !canRemoveBranding && modeId !== "full";
                  return (
                    <button
                      key={modeId}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setBrandingMode(modeId)}
                      className={cn(
                        "rounded-xl border p-2.5 text-center text-xs font-medium transition flex flex-col items-center justify-center gap-1",
                        active
                          ? "border-brand-500 bg-brand-50 font-semibold text-brand-700 dark:bg-brand-950/40"
                          : "border-slate-200 dark:border-slate-700",
                        isLocked && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {modeId === "favicon" && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src="/icon.svg" alt="" className="h-4 w-4" />
                      )}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
              {!canRemoveBranding && (
                <p className="text-[11px] text-slate-500">
                  Favicon logo & remove branding options require Enterprise or Pro plans.
                </p>
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
        </div>

        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-100/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">
            Live preview
          </p>
          <div
            className={cn(
              "overflow-hidden rounded-2xl shadow-card transition-all duration-300",
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
