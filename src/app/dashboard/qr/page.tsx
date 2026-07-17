"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Download, Copy, Check, Nfc, QrCode, Lock, Crown } from "lucide-react";
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
import { canUseFeature } from "@/lib/plans";

export default function QrNfcPage() {
  const { data: session } = useSession();
  const planId = session?.user?.plan || "free";
  const isProPlus = canUseFeature(planId, "customTheme");

  const [slug, setSlug] = useState("");
  const [nfcId, setNfcId] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [generatingQr, setGeneratingQr] = useState(false);
  const [qrError, setQrError] = useState("");
  const [qrSuccess, setQrSuccess] = useState(false);

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
  const defaultQrPngUrl = profileUrl
    ? `/api/qr?url=${encodeURIComponent(profileUrl + "?src=qr")}&format=png&size=512`
    : "";
  const defaultQrSvgUrl = profileUrl
    ? `/api/qr?url=${encodeURIComponent(profileUrl + "?src=qr")}&format=svg&size=512`
    : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateCustomQr = async () => {
    if (!qrUrl.trim() || !isProPlus) return;
    setGeneratingQr(true);
    setQrError("");
    try {
      const res = await fetch(
        `/api/qr?url=${encodeURIComponent(qrUrl)}&format=png&size=512`
      );
      if (!res.ok) throw new Error("Failed to generate QR");
      const blob = await res.blob();
      const dataUrl = URL.createObjectURL(blob);
      setQrDataUrl(dataUrl);
      setQrSuccess(true);
      setTimeout(() => setQrSuccess(false), 3000);
    } catch {
      setQrError("Failed to generate QR code");
    } finally {
      setGeneratingQr(false);
    }
  };

  function DefaultQrCode() {
    return (
      <div className="w-full flex flex-col items-center">
        {defaultQrPngUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={defaultQrPngUrl}
            alt="QR Code"
            className="h-64 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
          />
        ) : (
          <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            Loading...
          </div>
        )}
        <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row">
          <Button className="flex-1" asChild disabled={!defaultQrPngUrl}>
            <a href={defaultQrPngUrl} download={`${slug}-qr.png`}>
              <Download className="h-4 w-4" /> PNG
            </a>
          </Button>
          <Button className="flex-1" variant="outline" asChild disabled={!defaultQrSvgUrl}>
            <a href={defaultQrSvgUrl} download={`${slug}-qr.svg`}>
              <Download className="h-4 w-4" /> SVG
            </a>
          </Button>
        </div>
      </div>
    );
  }

  function CustomQrCode() {
    return (
      <div className="w-full flex flex-col items-center">
        <img
          src={qrDataUrl}
          alt="Custom QR Code"
          className="h-64 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
        />
        <div className="mt-3 flex w-full flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
            <a href={qrDataUrl} download="custom-qr.png">
              <Download className="h-4 w-4" /> Download Custom QR
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setQrDataUrl("");
              setQrUrl("");
            }}
            className="flex-1 sm:flex-none"
          >
            <QrCode className="h-4 w-4" /> Back to Default
          </Button>
        </div>
      </div>
    );
  }

  function ProPlusQrGenerator() {
    return (
      <div className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Pro+ Custom QR Generator
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Generate a QR code for any URL (landing page, portfolio, calendar, etc.)
        </p>
        <div className="mt-3 flex gap-2">
          <Input
            type="url"
            placeholder="https://your-link.com"
            value={qrUrl}
            onChange={(e) => setQrUrl(e.target.value)}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={generateCustomQr}
            loading={generatingQr}
            disabled={!qrUrl.trim()}
          >
            <QrCode className="h-4 w-4" /> Generate
          </Button>
        </div>
        {qrError && <p className="mt-2 text-xs text-red-500">{qrError}</p>}
        {qrSuccess && (
          <p className="mt-2 text-xs text-emerald-600">
            Custom QR generated! Download or go back to default.
          </p>
        )}
      </div>
    );
  }

  function FreeQrUpgradePrompt() {
    return (
      <div className="mt-4 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4 text-center dark:border-slate-700 dark:bg-slate-900/30">
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <Lock className="h-4 w-4" />
          <span>Upgrade to Pro+ for custom QR code generation</span>
        </div>
        <Button variant="link" size="sm" asChild className="mt-2">
          <Link href="/dashboard/billing">
            <Crown className="h-3 w-3" /> View Plans
          </Link>
        </Button>
      </div>
    );
  }

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
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="w-full flex flex-col items-center">
              {qrDataUrl ? <CustomQrCode /> : <DefaultQrCode />}
            </div>

            {/* Custom QR Generator for Pro+ */}
            {isProPlus ? <ProPlusQrGenerator /> : <FreeQrUpgradePrompt />}

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
                      <p className="font-mono text-xs text-emerald-600">{nfcId}</p>
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
                    <Link href="/dashboard/shop">Order NFC Card</Link>
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