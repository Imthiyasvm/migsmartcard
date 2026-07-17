"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Copy, Check, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DigitalProfile } from "@/types";
import { canUseFeature } from "@/lib/plans";

type SignatureTemplate = "classic" | "modern" | "minimal" | "bold";

const TEMPLATE_INFO: Record<SignatureTemplate, { name: string; description: string }> = {
  classic: { name: "Classic", description: "Traditional layout with avatar, details, and CTA button" },
  modern: { name: "Modern", description: "Clean horizontal layout with accent divider" },
  minimal: { name: "Minimal", description: "Simple text-only with subtle branding" },
  bold: { name: "Bold", description: "Full-width accent bar with prominent name" },
};

function generateSignature(
  profile: DigitalProfile,
  cardUrl: string,
  template: SignatureTemplate
): string {
  const primary = profile.theme.primaryColor || "#d4a574";
  const initials = profile.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const jobLine = `${profile.jobTitle}${profile.companyName ? ` · ${profile.companyName}` : ""}`;

  switch (template) {
    case "modern":
      return `<!-- MigSmartCard Email Signature — Modern -->
<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#334155;line-height:1.5;">
  <tr>
    <td style="padding-right:20px;border-right:3px solid ${primary};vertical-align:top;">
      <div style="width:72px;height:72px;border-radius:12px;background:${primary};color:#fff;text-align:center;line-height:72px;font-weight:bold;font-size:22px;">
        ${initials}
      </div>
    </td>
    <td style="padding-left:20px;vertical-align:top;">
      <div style="font-size:18px;font-weight:700;color:#0f172a;">${profile.fullName}</div>
      <div style="color:#64748b;font-size:13px;margin-top:2px;">${jobLine}</div>
      <div style="margin-top:8px;font-size:12px;color:#475569;">
        ${profile.phone ? `<span style="margin-right:12px;">${profile.phone}</span>` : ""}
        ${profile.email ? `<a href="mailto:${profile.email}" style="color:${primary};text-decoration:none;">${profile.email}</a>` : ""}
      </div>
      <div style="margin-top:10px;">
        <a href="${cardUrl}" style="display:inline-block;background:${primary};color:#fff;padding:7px 16px;border-radius:8px;font-size:11px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
          View Digital Profile →
        </a>
      </div>
    </td>
  </tr>
</table>`;

    case "minimal":
      return `<!-- MigSmartCard Email Signature — Minimal -->
<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#475569;line-height:1.6;">
  <tr>
    <td>
      <span style="font-size:15px;font-weight:700;color:#0f172a;">${profile.fullName}</span>
      <span style="color:#94a3b8;margin:0 6px;">|</span>
      <span>${jobLine}</span>
    </td>
  </tr>
  <tr>
    <td style="padding-top:4px;">
      ${profile.phone ? `${profile.phone} <span style="color:#94a3b8;margin:0 6px;">·</span>` : ""}
      ${profile.email ? `<a href="mailto:${profile.email}" style="color:${primary};text-decoration:none;">${profile.email}</a>` : ""}
    </td>
  </tr>
  <tr>
    <td style="padding-top:6px;">
      <a href="${cardUrl}" style="color:${primary};text-decoration:none;font-weight:600;font-size:12px;">
        ▸ Digital Profile
      </a>
    </td>
  </tr>
</table>`;

    case "bold":
      return `<!-- MigSmartCard Email Signature — Bold -->
<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#334155;line-height:1.4;max-width:480px;">
  <tr>
    <td style="background:${primary};padding:14px 18px;border-radius:8px 8px 0 0;">
      <div style="font-size:20px;font-weight:800;color:#fff;">${profile.fullName}</div>
      <div style="color:rgba(255,255,255,0.85);font-size:12px;margin-top:2px;">${jobLine}</div>
    </td>
  </tr>
  <tr>
    <td style="background:#f8fafc;padding:12px 18px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;border-top:none;">
      ${profile.phone ? `<div style="font-size:12px;margin-bottom:4px;">${profile.phone}</div>` : ""}
      ${profile.email ? `<div style="font-size:12px;margin-bottom:4px;"><a href="mailto:${profile.email}" style="color:${primary};text-decoration:none;">${profile.email}</a></div>` : ""}
      <div style="margin-top:8px;">
        <a href="${cardUrl}" style="display:inline-block;background:${primary};color:#fff;padding:8px 18px;border-radius:6px;font-size:11px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:0.5px;">
          Connect With Me
        </a>
      </div>
    </td>
  </tr>
</table>`;

    case "classic":
    default:
      return `<!-- MigSmartCard Email Signature — Classic -->
<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#334155;line-height:1.4;">
  <tr>
    <td style="padding-right:16px;border-right:2px solid ${primary};vertical-align:top;">
      <div style="width:64px;height:64px;border-radius:50%;background:${primary};color:#fff;text-align:center;line-height:64px;font-weight:bold;font-size:20px;">
        ${initials}
      </div>
    </td>
    <td style="padding-left:16px;vertical-align:top;">
      <div style="font-size:16px;font-weight:bold;color:#0f172a;">${profile.fullName}</div>
      <div style="color:#64748b;font-size:13px;">${jobLine}</div>
      ${profile.phone ? `<div style="margin-top:6px;font-size:12px;">${profile.phone}</div>` : ""}
      ${profile.email ? `<div style="font-size:12px;"><a href="mailto:${profile.email}" style="color:${primary};text-decoration:none;">${profile.email}</a></div>` : ""}
      <div style="margin-top:8px;">
        <a href="${cardUrl}" style="display:inline-block;background:${primary};color:#fff;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:bold;text-decoration:none;">
          View Digital Profile
        </a>
      </div>
    </td>
  </tr>
</table>`;
  }
}

export default function EmailSignaturePage() {
  const { data: session } = useSession();
  const planId = session?.user?.plan || "free";
  const isPro = canUseFeature(planId, "analytics"); // Pro+ has analytics, use as proxy

  const [profile, setProfile] = useState<DigitalProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<SignatureTemplate>("classic");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile));
  }, []);

  // Pro-only restriction
  if (!isPro) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-bold">
          Email Signature Generator
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Generate professional email signatures with multiple templates that link to your digital profile. Available for Pro and above plans.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/dashboard/billing">
            <Crown className="h-4 w-4" /> Upgrade to Pro
          </Link>
        </Button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  const cardUrl = `${origin}/p/${profile.slug}`;
  const html = generateSignature(profile, cardUrl, selectedTemplate);

  const copyHtml = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Email Signature</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate a professional signature that links to your digital profile
        </p>
      </div>

      {/* Template selector */}
      <div className="grid gap-3 sm:grid-cols-4">
        {(Object.keys(TEMPLATE_INFO) as SignatureTemplate[]).map((tpl) => (
          <button
            key={tpl}
            type="button"
            onClick={() => setSelectedTemplate(tpl)}
            className={`rounded-xl border p-4 text-left transition ${
              selectedTemplate === tpl
                ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500 dark:bg-brand-950/40"
                : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
            }`}
          >
            <p className="text-sm font-semibold">{TEMPLATE_INFO[tpl].name}</p>
            <p className="mt-1 text-[11px] text-slate-500">{TEMPLATE_INFO[tpl].description}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              How your &quot;{TEMPLATE_INFO[selectedTemplate].name}&quot; signature will look in email clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Install</CardTitle>
            <CardDescription>
              Copy the HTML and paste into Gmail, Outlook, or Apple Mail
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={copyHtml} className="w-full">
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy HTML Signature
                </>
              )}
            </Button>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-400">
              <li>Click &quot;Copy HTML Signature&quot;</li>
              <li>
                Open your email client signature settings (Gmail → Settings →
                Signature)
              </li>
              <li>Paste into the signature editor</li>
              <li>Save — every email now links to your MigSmartCard</li>
            </ol>
            <pre className="max-h-48 overflow-auto rounded-xl bg-slate-900 p-4 text-[10px] text-slate-300">
              {html}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
