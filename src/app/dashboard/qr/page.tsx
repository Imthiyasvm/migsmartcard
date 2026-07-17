"use client";

import { useEffect, useState } from "react";
import { Download, Copy, Check, Nfc, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function QrNfcPage() {
  const [slug, setSlug] = useState("");
  const [nfcId, setNfcId] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setSlug(d.profile.slug);
          setNfcId(d.profile.nfcId);
        }
      });
  }, []);

  const profileUrl = slug ? `${origin}/p/${slug}` : "";
  const qrPngUrl = profileUrl
    ? `/api/qr?url=${encodeURIComponent(profileUrl + "?src=qr")}&format=png&size=512`
    : "";
  const qrSvgUrl = profileUrl
    ? `/api/qr?url=${encodeURIComponent(profileUrl + "?src=qr")}&format=svg&size=512`
    : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">QR Code & NFC</h1>
        <p className="mt-1 text-sm text-slate-500">
          Share your digital profile via QR codes and NFC smart cards
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* QR Code */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-brand-600" />
              <CardTitle>Dynamic QR Code</CardTitle>
            </div>
            <CardDescription>
              Scans open your live profile — update anytime without reprinting
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {qrPngUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrPngUrl}
                alt="QR Code"
                className="h-64 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                Loading...
              </div>
            )}
            <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row">
              <Button className="flex-1" asChild disabled={!qrPngUrl}>
                <a href={qrPngUrl} download={`${slug}-qr.png`}>
                  <Download className="h-4 w-4" /> PNG
                </a>
              </Button>
              <Button className="flex-1" variant="outline" asChild disabled={!qrSvgUrl}>
                <a href={qrSvgUrl} download={`${slug}-qr.svg`}>
                  <Download className="h-4 w-4" /> SVG
                </a>
              </Button>
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              Print for events, badges, flyers, and booths
            </p>
          </CardContent>
        </Card>

        {/* Link + NFC */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shareable Link</CardTitle>
              <CardDescription>Your public profile URL</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input value={profileUrl} readOnly className="font-mono text-xs" />
                <Button variant="outline" onClick={copyLink}>
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Nfc className="h-5 w-5 text-brand-600" />
                <CardTitle>NFC Smart Card</CardTitle>
              </div>
              <CardDescription>
                Physical card that opens your profile on tap
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nfcId ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                      <Nfc className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                        Card Linked
                      </p>
                      <p className="font-mono text-xs text-emerald-600">
                        {nfcId}
                      </p>
                    </div>
                    <Badge variant="success" className="ml-auto">
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Tap your MigSmartCard on any smartphone to open your
                    profile. NFC URL:{" "}
                    <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">
                      /api/nfc/{nfcId}
                    </code>
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                  <Nfc className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-medium">No NFC card linked</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Order a physical card or ask an admin to assign an NFC ID
                  </p>
                  <Button className="mt-4" size="sm" asChild>
                    <a href="/dashboard/shop">Order NFC Card</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
