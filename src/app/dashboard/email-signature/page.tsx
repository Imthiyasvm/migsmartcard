"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DigitalProfile } from "@/types";

export default function EmailSignaturePage() {
  const [profile, setProfile] = useState<DigitalProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile));
  }, []);

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  const cardUrl = `${origin}/p/${profile.slug}`;
  const primary = profile.theme.primaryColor || "#1a5ff5";

  const html = `<!-- MigSmartCard Email Signature -->
<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#334155;line-height:1.4;">
  <tr>
    <td style="padding-right:16px;border-right:2px solid ${primary};vertical-align:top;">
      <div style="width:64px;height:64px;border-radius:50%;background:${primary};color:#fff;text-align:center;line-height:64px;font-weight:bold;font-size:20px;">
        ${profile.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
      </div>
    </td>
    <td style="padding-left:16px;vertical-align:top;">
      <div style="font-size:16px;font-weight:bold;color:#0f172a;">${profile.fullName}</div>
      <div style="color:#64748b;font-size:13px;">${profile.jobTitle}${profile.companyName ? ` · ${profile.companyName}` : ""}</div>
      ${profile.phone ? `<div style="margin-top:6px;font-size:12px;">${profile.phone}</div>` : ""}
      ${profile.email ? `<div style="font-size:12px;"><a href="mailto:${profile.email}" style="color:${primary};text-decoration:none;">${profile.email}</a></div>` : ""}
      <div style="margin-top:8px;">
        <a href="${cardUrl}" style="display:inline-block;background:${primary};color:#fff;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:bold;text-decoration:none;">
          View Digital Card
        </a>
      </div>
    </td>
  </tr>
</table>`;

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
          Generate a professional signature that links to your digital card
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              How your signature will look in email clients
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
