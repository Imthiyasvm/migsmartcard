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
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
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
  const [leadStatus, setLeadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Track view
    const device =
      /Mobi|Android/i.test(navigator.userAgent)
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

  const theme = profile.theme;
  const primary = theme.primaryColor || "#1a5ff5";

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
      } else {
        setLeadStatus("error");
      }
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

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.backgroundColor || "#f8fafc" }}
    >
      {/* Cover */}
      <div
        className="relative h-36 sm:h-48"
        style={{
          background: profile.coverImage
            ? `url(${profile.coverImage}) center/cover`
            : `linear-gradient(135deg, ${primary} 0%, ${theme.secondaryColor || "#22c55e"} 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="relative mx-auto max-w-lg px-4 pb-12">
        {/* Avatar */}
        <div className="-mt-14 flex justify-center sm:-mt-16">
          <div
            className="rounded-full p-1 shadow-card"
            style={{ backgroundColor: theme.backgroundColor || "#fff" }}
          >
            <UserAvatar
              name={profile.fullName}
              src={profile.profilePhoto}
              className="h-28 w-28 text-2xl sm:h-32 sm:w-32"
            />
          </div>
        </div>

        {/* Identity */}
        <div className="mt-4 text-center" style={{ color: theme.textColor }}>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            {profile.fullName}
          </h1>
          {profile.jobTitle && (
            <p className="mt-1 text-base font-medium opacity-80">
              {profile.jobTitle}
            </p>
          )}
          {profile.companyName && (
            <p className="mt-0.5 text-sm opacity-60">{profile.companyName}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a href={`/api/vcard?slug=${profile.slug}`}>
            <button
              className={cn(
                "inline-flex h-11 items-center gap-2 px-5 text-sm font-semibold text-white shadow-soft transition hover:opacity-90",
                radius
              )}
              style={{ backgroundColor: primary }}
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
            style={{ borderColor: primary, color: primary }}
          >
            <MessageCircle className="h-4 w-4" /> Exchange
          </button>
          <button
            onClick={handleShare}
            className={cn(
              "inline-flex h-11 items-center gap-2 border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm",
              radius
            )}
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-soft dark:bg-slate-900">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Contact info */}
        <div className="mt-4 space-y-2">
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className={cn(
                "flex items-center gap-3 bg-white p-4 shadow-soft transition hover:shadow-card dark:bg-slate-900",
                radius
              )}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${primary}15` }}
              >
                <Phone className="h-4 w-4" style={{ color: primary }} />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {profile.phone}
              </span>
            </a>
          )}
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className={cn(
                "flex items-center gap-3 bg-white p-4 shadow-soft transition hover:shadow-card dark:bg-slate-900",
                radius
              )}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${primary}15` }}
              >
                <Mail className="h-4 w-4" style={{ color: primary }} />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {profile.email}
              </span>
            </a>
          )}
          {profile.website && (
            <button
              onClick={() => handleLinkClick("Website", profile.website!)}
              className={cn(
                "flex w-full items-center gap-3 bg-white p-4 shadow-soft transition hover:shadow-card dark:bg-slate-900",
                radius
              )}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${primary}15` }}
              >
                <Globe className="h-4 w-4" style={{ color: primary }} />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {profile.website.replace(/^https?:\/\//, "")}
              </span>
            </button>
          )}
          {profile.address && (
            <a
              href={profile.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(profile.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-3 bg-white p-4 shadow-soft transition hover:shadow-card dark:bg-slate-900",
                radius
              )}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${primary}15` }}
              >
                <MapPin className="h-4 w-4" style={{ color: primary }} />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {profile.address}
              </span>
            </a>
          )}
        </div>

        {/* Social links */}
        {Object.keys(profile.social).length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {Object.entries(profile.social).map(([key, url]) => {
              if (!url) return null;
              if (key === "whatsapp") {
                const phone = url.replace(/\D/g, "");
                return (
                  <a
                    key={key}
                    href={`https://wa.me/${phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      handleLinkClick("WhatsApp", `https://wa.me/${phone}`)
                    }
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
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-soft transition hover:scale-105 dark:bg-slate-800 dark:text-slate-200"
                >
                  <SocialGlyph network={key} className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        )}

        {/* Custom links */}
        {profile.customLinks.length > 0 && (
          <div className="mt-6 space-y-2">
            {profile.customLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.title, link.url)}
                className={cn(
                  "flex w-full items-center justify-between bg-white p-4 shadow-soft transition hover:shadow-card dark:bg-slate-900",
                  radius
                )}
              >
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {link.title}
                </span>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
        )}

        {/* Branding */}
        {theme.showBranding && (
          <div className="mt-10 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-brand-600"
            >
              Powered by{" "}
              <span className="font-semibold">MigSmartCard</span>
            </a>
          </div>
        )}
      </div>

      {/* Exchange modal */}
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
                <p className="mt-1 text-sm text-slate-500">
                  {profile.fullName} will receive your details.
                </p>
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
                  <p className="text-sm text-red-500">
                    Something went wrong. Please try again.
                  </p>
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
