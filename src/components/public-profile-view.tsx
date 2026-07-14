"use client";

import { useEffect, useState } from "react";
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  Download,
  Share2,
  MessageCircle,
  Calendar,
  ExternalLink,
  Check,
  X,
} from "lucide-react";
import { DigitalProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Props {
  profile: DigitalProfile;
  src?: string;
}

function SocialGlyph({
  network,
  className,
}: {
  network: string;
  className?: string;
}) {
  const paths: Record<string, string> = {
    linkedin:
      "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    instagram:
      "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z",
    twitter:
      "M22 5.8c-.7.3-1.5.5-2.3.6a4 4 0 0 0 1.8-2.2 8 8 0 0 1-2.6 1 4 4 0 0 0-6.9 3.7A11.4 11.4 0 0 1 3.2 4.7a4 4 0 0 0 1.2 5.4 4 4 0 0 1-1.8-.5v.1a4 4 0 0 0 3.2 4 4 4 0 0 1-1.8.1 4 4 0 0 0 3.7 2.8A8.1 8.1 0 0 1 2 18.6 11.4 11.4 0 0 0 8.1 20c7.3 0 11.3-6.1 11.3-11.3v-.5A8 8 0 0 0 22 5.8z",
    facebook:
      "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
    youtube:
      "M22.5 6.5a2.8 2.8 0 0 0-2-2C18.9 4 12 4 12 4s-6.9 0-8.5.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1 12a29 29 0 0 0 .5 5.5 2.8 2.8 0 0 0 2 2C5.1 20 12 20 12 20s6.9 0 8.5-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 23 12a29 29 0 0 0-.5-5.5zM10 15.5v-7l6 3.5-6 3.5z",
    github:
      "M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1-1.4-1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.3 2.8 1a9.5 9.5 0 0 1 5 0c2-1.3 2.8-1 2.8-1a3.6 3.6 0 0 1 .1 2.7 3.9 3.9 0 0 1 1 2.7c0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2z",
  };
  const d = paths[network];
  if (!d) return <Globe className={className} />;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function PublicProfileView({ profile, src }: Props) {
  const [showExchange, setShowExchange] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [leadStatus, setLeadStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const device = /Mobi|Android/i.test(navigator.userAgent)
      ? "mobile"
      : /Tablet|iPad/i.test(navigator.userAgent)
        ? "tablet"
        : "desktop";

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId: profile.id,
        type: src === "nfc" ? "nfc_tap" : src === "qr" ? "qr_scan" : "view",
        device,
      }),
    }).catch(() => {});
  }, [profile.id, src]);

  const theme = profile.theme || ({} as DigitalProfile["theme"]);
  const primary = theme.primaryColor || "#1a5ff5";
  const layout =
    theme.layout ||
    (theme.templateId === "glass"
      ? "glass"
      : theme.templateId === "premium"
        ? "premium"
        : "classic");
  const isGlass = layout === "glass";
  const isPremium = layout === "premium";
  const photoShape = theme.photoShape === "square" ? "square" : "circle";

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: profile.fullName,
        text: `${profile.fullName} — ${profile.jobTitle}`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLinkClick = (label: string, url: string) => {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId: profile.id,
        type: "link_click",
        linkLabel: label,
        device: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
      }),
    }).catch(() => {});
    window.open(url, "_blank", "noopener");
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadStatus("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
          ...leadForm,
          source: src === "nfc" ? "nfc" : src === "qr" ? "qr" : "form",
        }),
      });
      if (res.ok) {
        setLeadStatus("success");
        setLeadForm({ name: "", email: "", phone: "", company: "", message: "" });
      } else setLeadStatus("error");
    } catch {
      setLeadStatus("error");
    }
  };

  const radius =
    theme.buttonStyle === "pill"
      ? "rounded-full"
      : theme.buttonStyle === "square"
        ? "rounded-md"
        : "rounded-xl";

  const panel = cn(
    "shadow-soft transition",
    isGlass
      ? "border border-white/20 bg-white/10 backdrop-blur-xl"
      : isPremium
        ? "border border-amber-500/20 bg-zinc-900/80"
        : "bg-white dark:bg-slate-900",
    radius
  );

  const pageBg = isGlass
    ? {
        backgroundImage: profile.coverImage
          ? `linear-gradient(180deg, rgba(15,23,42,0.55), rgba(15,23,42,0.92)), url(${profile.coverImage})`
          : `linear-gradient(160deg, #0f172a 0%, #312e81 45%, #0ea5e9 120%)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : isPremium
      ? {
          background:
            "radial-gradient(ellipse at top, #292524 0%, #0a0a0a 55%, #000 100%)",
        }
      : { backgroundColor: theme.backgroundColor || "#f8fafc" };

  const textColor = isGlass || isPremium ? "#f8fafc" : theme.textColor || "#0f172a";

  return (
    <div className="min-h-screen" style={pageBg}>
      {/* Cover — classic only (glass uses full-page bg) */}
      {!isGlass && (
        <div
          className={cn(
            "relative h-36 sm:h-48",
            isPremium && "h-40 sm:h-52"
          )}
          style={{
            background: profile.coverImage
              ? `url(${profile.coverImage}) center/cover`
              : isPremium
                ? `linear-gradient(135deg, #1c1917 0%, #78350f 50%, ${primary} 120%)`
                : `linear-gradient(135deg, ${primary} 0%, ${theme.secondaryColor || "#22c55e"} 100%)`,
          }}
        >
          <div
            className={cn(
              "absolute inset-0",
              isPremium ? "bg-gradient-to-t from-black/70 to-transparent" : "bg-black/10"
            )}
          />
        </div>
      )}

      {isGlass && <div className="h-28 sm:h-36" />}

      <div className="relative mx-auto max-w-lg px-4 pb-12">
        {/* Avatar */}
        <div
          className={cn(
            "flex justify-center",
            isGlass ? "-mt-6" : "-mt-14 sm:-mt-16"
          )}
        >
          <div
            className={cn(
              "p-1 shadow-card",
              photoShape === "square" ? "rounded-2xl" : "rounded-full",
              isGlass && "border border-white/30 bg-white/10 p-1.5 backdrop-blur-md",
              isPremium && "border-2 p-1",
              !isGlass && !isPremium && "bg-white dark:bg-slate-900"
            )}
            style={isPremium ? { borderColor: primary } : undefined}
          >
            <UserAvatar
              name={profile.fullName}
              src={profile.profilePhoto}
              className={cn(
                "h-32 w-32 text-2xl sm:h-36 sm:w-36",
                photoShape === "square" ? "rounded-xl" : "rounded-full"
              )}
            />
          </div>
        </div>

        <div className="mt-4 text-center" style={{ color: textColor }}>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            {profile.fullName}
          </h1>
          {profile.jobTitle && (
            <p className="mt-1 text-base font-medium opacity-80">
              {profile.jobTitle}
            </p>
          )}
          {profile.companyName && (
            <p
              className="mt-0.5 text-sm font-semibold opacity-90"
              style={{ color: isPremium || isGlass ? primary : undefined }}
            >
              {profile.companyName}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a href={`/api/vcard?slug=${profile.slug}`}>
            <button
              className={cn(
                "inline-flex h-11 items-center gap-2 px-5 text-sm font-semibold shadow-soft transition hover:opacity-90",
                radius,
                isGlass || isPremium ? "text-slate-900" : "text-white"
              )}
              style={{
                backgroundColor: isGlass || isPremium ? primary : primary,
                color: isPremium ? "#0a0a0a" : "#fff",
              }}
            >
              <Download className="h-4 w-4" /> Save Contact
            </button>
          </a>
          <button
            onClick={() => setShowExchange(true)}
            className={cn(
              "inline-flex h-11 items-center gap-2 border-2 px-5 text-sm font-semibold transition hover:opacity-80",
              radius
            )}
            style={{
              borderColor: primary,
              color: isGlass || isPremium ? primary : primary,
              background: isGlass ? "rgba(255,255,255,0.08)" : "transparent",
            }}
          >
            <MessageCircle className="h-4 w-4" /> Exchange
          </button>
          <button
            onClick={handleShare}
            className={cn(
              "inline-flex h-11 items-center gap-2 border px-4 text-sm font-semibold shadow-sm",
              radius,
              isGlass || isPremium
                ? "border-white/20 bg-white/10 text-white"
                : "border-slate-200 bg-white text-slate-700"
            )}
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </button>
        </div>

        {profile.bio && (
          <div className={cn("mt-6 p-5", panel)}>
            <p
              className="text-sm leading-relaxed"
              style={{ color: isGlass || isPremium ? "rgba(248,250,252,0.85)" : undefined }}
            >
              {profile.bio}
            </p>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className={cn("flex items-center gap-3 p-4", panel)}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${primary}22` }}
              >
                <Phone className="h-4 w-4" style={{ color: primary }} />
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: textColor }}
              >
                {profile.phone}
              </span>
            </a>
          )}
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className={cn("flex items-center gap-3 p-4", panel)}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${primary}22` }}
              >
                <Mail className="h-4 w-4" style={{ color: primary }} />
              </div>
              <span className="text-sm font-medium" style={{ color: textColor }}>
                {profile.email}
              </span>
            </a>
          )}
          {profile.website && (
            <button
              onClick={() => handleLinkClick("Website", profile.website!)}
              className={cn("flex w-full items-center gap-3 p-4", panel)}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${primary}22` }}
              >
                <Globe className="h-4 w-4" style={{ color: primary }} />
              </div>
              <span className="text-sm font-medium" style={{ color: textColor }}>
                {profile.website.replace(/^https?:\/\//, "")}
              </span>
            </button>
          )}
          {profile.address && (
            <a
              href={
                profile.mapsUrl ||
                `https://maps.google.com/?q=${encodeURIComponent(profile.address)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className={cn("flex items-center gap-3 p-4", panel)}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${primary}22` }}
              >
                <MapPin className="h-4 w-4" style={{ color: primary }} />
              </div>
              <span className="text-sm font-medium" style={{ color: textColor }}>
                {profile.address}
              </span>
            </a>
          )}
        </div>

        {Object.keys(profile.social || {}).length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {Object.entries(profile.social || {}).map(([key, url]) => {
              if (!url) return null;
              if (key === "whatsapp") {
                const phone = url.replace(/\D/g, "");
                return (
                  <a
                    key={key}
                    href={`https://wa.me/${phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-soft transition hover:scale-105"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                );
              }
              if (key === "calendly") {
                return (
                  <button
                    key={key}
                    onClick={() => handleLinkClick("Calendly", url)}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#006BFF] text-white shadow-soft transition hover:scale-105"
                  >
                    <Calendar className="h-5 w-5" />
                  </button>
                );
              }
              return (
                <button
                  key={key}
                  onClick={() => handleLinkClick(key, url)}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full shadow-soft transition hover:scale-105",
                    isGlass || isPremium
                      ? "border border-white/20 bg-white/10 text-white"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  )}
                >
                  <SocialGlyph network={key} className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        )}

        {(profile.customLinks || []).length > 0 && (
          <div className="mt-6 space-y-2">
            {profile.customLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.title, link.url)}
                className={cn(
                  "flex w-full items-center justify-between p-4",
                  panel
                )}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: textColor }}
                >
                  {link.title}
                </span>
                <ExternalLink
                  className="h-4 w-4 opacity-60"
                  style={{ color: textColor }}
                />
              </button>
            ))}
          </div>
        )}

        {theme.showBranding !== false && (
          <div className="mt-10 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs opacity-50 transition hover:opacity-100"
              style={{ color: textColor }}
            >
              Powered by <span className="font-semibold">MigSmartCard</span>
            </a>
          </div>
        )}
      </div>

      {showExchange && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md animate-slide-up rounded-2xl bg-white p-6 shadow-card dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Exchange Contact</h3>
              <button
                onClick={() => {
                  setShowExchange(false);
                  setLeadStatus("idle");
                }}
                className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {leadStatus === "success" ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="font-semibold">Contact shared!</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setShowExchange(false);
                    setLeadStatus("idle");
                  }}
                >
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={submitLead} className="space-y-3">
                <Input
                  label="Your Name *"
                  required
                  value={leadForm.name}
                  onChange={(e) =>
                    setLeadForm({ ...leadForm, name: e.target.value })
                  }
                />
                <Input
                  label="Email *"
                  type="email"
                  required
                  value={leadForm.email}
                  onChange={(e) =>
                    setLeadForm({ ...leadForm, email: e.target.value })
                  }
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={leadForm.phone}
                  onChange={(e) =>
                    setLeadForm({ ...leadForm, phone: e.target.value })
                  }
                />
                <Input
                  label="Company"
                  value={leadForm.company}
                  onChange={(e) =>
                    setLeadForm({ ...leadForm, company: e.target.value })
                  }
                />
                <Textarea
                  label="Message"
                  value={leadForm.message}
                  onChange={(e) =>
                    setLeadForm({ ...leadForm, message: e.target.value })
                  }
                  rows={2}
                />
                {leadStatus === "error" && (
                  <p className="text-sm text-red-500">Something went wrong.</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  loading={leadStatus === "loading"}
                  style={{ backgroundColor: primary }}
                >
                  Send Contact
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
