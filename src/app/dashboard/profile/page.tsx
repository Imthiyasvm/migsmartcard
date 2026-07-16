"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Save,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  X,
  CreditCard,
  Star,
  Crown,
  Copy,
  Check,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DigitalProfile, CustomLink, SocialLinks, ProfileTheme } from "@/types";
import { createId } from "@/lib/id";
import { PublicProfileView } from "@/components/public-profile-view";
import { ImageUpload } from "@/components/image-upload";
import { CARD_TEMPLATES, canUseTemplate } from "@/lib/templates";
import { useSession } from "next-auth/react";

export default function ProfileEditorPage() {
  const { data: session } = useSession();
  const planId = session?.user?.plan || "free";
  const [profiles, setProfiles] = useState<DigitalProfile[]>([]);
  const [profile, setProfile] = useState<DigitalProfile | null>(null);
  const [maxCards, setMaxCards] = useState(1);
  const [planName, setPlanName] = useState("Free");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [origin, setOrigin] = useState("");
  const [redisOn, setRedisOn] = useState<boolean | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async (preferId?: string) => {
    const res = await fetch("/api/profile?list=1");
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Failed to load");
    const list: DigitalProfile[] = d.profiles || (d.profile ? [d.profile] : []);
    setProfiles(list);
    setMaxCards(d.maxCards ?? 1);
    setPlanName(d.planName || d.plan || "Free");
    if (typeof d.redisEnabled === "boolean") setRedisOn(d.redisEnabled);
    const selected =
      (preferId && list.find((p) => p.id === preferId)) ||
      list.find((p) => p.isPrimary) ||
      list[0] ||
      null;
    setProfile(selected);
    return selected;
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    load()
      .catch(() => setMessage("Failed to load cards"))
      .finally(() => setLoading(false));
  }, [load]);

  const update = <K extends keyof DigitalProfile>(
    key: K,
    value: DigitalProfile[K]
  ) => {
    if (!profile) return;
    setProfile({ ...profile, [key]: value });
  };

  const updateSocial = (key: keyof SocialLinks, value: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      social: { ...profile.social, [key]: value },
    });
  };

  /** Normalize URL on blur — add https:// if no protocol present */
  const normalizeUrlOnBlur = (currentUrl: string): string => {
    if (!currentUrl || !currentUrl.trim()) return currentUrl;
    const trimmed = currentUrl.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const updateTheme = (key: keyof ProfileTheme, value: string | boolean) => {
    if (!profile) return;
    setProfile({
      ...profile,
      theme: { ...profile.theme, [key]: value },
    });
  };

  const addLink = () => {
    if (!profile) return;
    const link: CustomLink = { id: createId(), title: "", url: "" };
    update("customLinks", [...profile.customLinks, link]);
  };

  const updateLink = (id: string, field: "title" | "url", value: string) => {
    if (!profile) return;
    update(
      "customLinks",
      profile.customLinks.map((l) =>
        l.id === id ? { ...l, [field]: value } : l
      )
    );
  };

  const removeLink = (id: string) => {
    if (!profile) return;
    update(
      "customLinks",
      profile.customLinks.filter((l) => l.id !== id)
    );
  };

  const save = async (openPublic = false) => {
    if (!profile) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        ...profile,
        id: profile.id,
        isPublic: true,
        forcePublic: true,
        slug:
          (profile.slug || "card")
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "") || "card",
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
        if (data.profiles) setProfiles(data.profiles);
        if (typeof data.redisEnabled === "boolean") setRedisOn(data.redisEnabled);
        const share =
          data.absoluteShareUrl ||
          (data.shareUrl ? `${window.location.origin}${data.shareUrl}` : "");
        if (share) setShareUrl(share);
        setMessage(
          data.warning
            ? "Saved. Use Copy share link (works without Redis). Short /p/ links need Redis."
            : "Card saved successfully!"
        );
        if (openPublic) {
          // Always open working share link if available
          if (share) {
            window.open(share, "_blank", "noopener,noreferrer");
          } else if (data.redisEnabled === false) {
            window.open("/dashboard/preview", "_blank", "noopener,noreferrer");
          } else {
            window.open(
              `${window.location.origin}/p/${data.profile.slug}`,
              "_blank",
              "noopener,noreferrer"
            );
          }
        }
      } else {
        setMessage(data.error || "Failed to save");
      }
    } catch {
      setMessage("Failed to save");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 6000);
  };

  const createCard = async () => {
    if (profiles.length >= maxCards) {
      setMessage(
        `Your ${planName} plan allows ${maxCards} card${maxCards === 1 ? "" : "s"}. Upgrade to create more.`
      );
      return;
    }
    setCreating(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardName: `Card ${profiles.length + 1}`,
          fullName: profile?.fullName || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Could not create card");
        if (data.upgrade) {
          // leave message as is
        }
      } else {
        setProfiles(data.profiles || []);
        setProfile(data.profile);
        setMessage("New card created — customize it below.");
      }
    } catch {
      setMessage("Could not create card");
    }
    setCreating(false);
    setTimeout(() => setMessage(""), 5000);
  };

  const deleteCard = async (id: string) => {
    if (profiles.length <= 1) {
      setMessage("You must keep at least one card");
      return;
    }
    if (!confirm("Delete this card permanently?")) return;
    const res = await fetch(`/api/profile?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Delete failed");
      return;
    }
    setProfiles(data.profiles || []);
    setProfile(data.profiles?.[0] || null);
    setMessage("Card deleted");
  };

  const setPrimary = async () => {
    if (!profile) return;
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: profile.id, isPrimary: true }),
    });
    const data = await res.json();
    if (res.ok) {
      setProfile(data.profile);
      setProfiles(data.profiles || []);
      setMessage("Set as primary card");
    }
    setSaving(false);
  };


  const copyShareLink = async () => {
    if (!profile) return;
    // Prefer last saved share URL; otherwise request a save to generate one
    let url = shareUrl;
    if (!url) {
      setSaving(true);
      try {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...profile, id: profile.id, forcePublic: true, isPublic: true }),
        });
        const data = await res.json();
        if (res.ok && data.profile) {
          setProfile(data.profile);
          url =
            data.absoluteShareUrl ||
            (data.shareUrl ? `${window.location.origin}${data.shareUrl}` : "");
          if (url) setShareUrl(url);
          if (typeof data.redisEnabled === "boolean") setRedisOn(data.redisEnabled);
        }
      } finally {
        setSaving(false);
      }
    }
    if (!url) {
      setMessage("Could not create share link — save the card first");
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setMessage("Share link copied! Anyone can open this link (no login needed).");
    setTimeout(() => setCopied(false), 2500);
  };


  const publishShortLink = async () => {
    setSaving(true);
    setMessage("");
    try {
      // Save first so memory has latest, then force redis publish
      if (profile) {
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...profile,
            id: profile.id,
            forcePublic: true,
            isPublic: true,
          }),
        });
      }
      const res = await fetch("/api/profile/publish", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Publish failed");
        return;
      }
      const ok = data.verified
        ? Object.entries(data.verified as Record<string, boolean>)
            .filter(([, v]) => v)
            .map(([s]) => s)
        : data.published || [];
      if (ok.length) {
        setMessage(
          `Short link published: ${ok.map((s: string) => `/p/${s}`).join(", ")}. Open in a private window.`
        );
        if (profile && ok.includes(profile.slug)) {
          window.open(`/p/${profile.slug}`, "_blank", "noopener,noreferrer");
        }
      } else {
        setMessage(
          data.tip ||
            "Publish ran but Redis did not verify. Use Copy share link, or remove huge uploaded photos and try again."
        );
      }
    } catch {
      setMessage("Publish failed");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 8000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading cards...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500">No cards found</p>
        <Button className="mt-4" onClick={createCard}>
          Create card
        </Button>
      </div>
    );
  }

  const publicPath = `/p/${profile.slug || "your-slug"}`;
  const atLimit = profiles.length >= maxCards;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">My Digital Cards</h1>
          <p className="mt-1 text-sm text-slate-500">
            {profiles.length} of {maxCards} card{maxCards === 1 ? "" : "s"} on{" "}
            <Badge className="align-middle capitalize">{planName}</Badge>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setShowLivePreview(true)}
          >
            <Eye className="h-4 w-4" /> Live Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={copyShareLink}
            loading={saving}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy share link"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            loading={saving}
            onClick={() => save(true)}
          >
            <ExternalLink className="h-4 w-4" /> Save & Open share
          </Button>
          <Button size="sm" onClick={() => save(false)} loading={saving}>
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      {/* Card switcher */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-brand-600" /> Your cards
            </CardTitle>
            <CardDescription>
              Free = 1 card · Pro = 5 · Business = 25 · Enterprise = unlimited
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={createCard}
            loading={creating}
            disabled={atLimit}
            title={atLimit ? "Upgrade your plan for more cards" : "Create another card"}
          >
            <Plus className="h-4 w-4" /> New Card
          </Button>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {profiles.map((p) => {
            const active = p.id === profile.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfile(p)}
                className={`flex min-w-[140px] flex-1 items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition sm:flex-none ${
                  active
                    ? "border-brand-500 bg-brand-50 shadow-sm dark:bg-brand-950/40"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs font-bold dark:bg-slate-700">
                  {p.profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.profilePhoto}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (p.fullName || "C")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {p.cardName || p.fullName || "Untitled"}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    /p/{p.slug}
                  </p>
                </div>
                {p.isPrimary && (
                  <Star className="ml-auto h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                )}
              </button>
            );
          })}
          {atLimit && (
            <Link
              href="/dashboard/billing"
              className="flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 px-3 py-2.5 text-sm font-medium text-brand-700 sm:flex-none dark:border-brand-800 dark:text-brand-300"
            >
              <Crown className="h-4 w-4" /> Upgrade for more
            </Link>
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-brand-900 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-100">
        <p className="font-medium">How to share this card</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-xs sm:text-sm">
          <li>
            <strong>Copy share link</strong> — works for anyone on Vercel (long{" "}
            <code className="rounded bg-white/60 px-1">/c/...</code> URL)
          </li>
          <li>
            <strong>Live Preview / Card Preview</strong> — only while you are logged in
          </li>
          <li>
            Short link{" "}
            <span className="font-mono text-[11px]">
              {origin}
              {publicPath}
            </span>{" "}
            needs Redis env vars on Vercel
          </li>
          {redisOn === false && (
            <li className="font-semibold text-amber-900">
              Redis is OFF — do not send /p/slug to clients yet; use Copy share link
            </li>
          )}
          {redisOn === true && (
            <li className="text-emerald-800">
              Redis is ON — click <strong>Publish short /p/ link</strong> after Save, then open in a private window
            </li>
          )}
        </ul>
        {shareUrl && (
          <p className="mt-2 break-all rounded-lg bg-white/70 p-2 font-mono text-[10px] text-slate-700 dark:bg-black/20 dark:text-slate-200">
            {shareUrl}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" type="button" onClick={copyShareLink} loading={saving}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy share link"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            type="button"
            onClick={publishShortLink}
            loading={saving}
          >
            Publish short /p/ link
          </Button>
          <Button size="sm" variant="outline" type="button" asChild>
            <a href="/dashboard/preview" target="_blank" rel="noreferrer">
              <Link2 className="h-4 w-4" /> Owner preview
            </a>
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.toLowerCase().includes("fail") ||
            message.toLowerCase().includes("upgrade") ||
            message.toLowerCase().includes("allows")
              ? "bg-amber-50 text-amber-900 dark:bg-amber-950/30"
              : message.includes("success") || message.includes("Saved") || message.includes("created")
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800"
          }`}
        >
          {message}{" "}
          {(message.includes("Upgrade") || message.includes("allows")) && (
            <Link href="/dashboard/billing" className="font-semibold underline">
              View plans
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!profile.isPrimary && (
          <Button variant="outline" size="sm" onClick={setPrimary} loading={saving}>
            <Star className="h-4 w-4" /> Set as primary
          </Button>
        )}
        {profiles.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600"
            onClick={() => deleteCard(profile.id)}
          >
            <Trash2 className="h-4 w-4" /> Delete this card
          </Button>
        )}
      </div>

      <Tabs defaultValue="basic">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="social">Social & Links</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Identity</CardTitle>
              <CardDescription>How this card appears publicly</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Card name (internal)"
                value={profile.cardName || ""}
                onChange={(e) => update("cardName", e.target.value)}
                placeholder="Work, Personal, Sales..."
                hint="Only you see this in the dashboard"
              />
              <Input
                label="Profile URL Slug"
                value={profile.slug}
                onChange={(e) =>
                  update(
                    "slug",
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                  )
                }
                hint={`${origin || "yoursite.com"}${publicPath}`}
              />
              <Input
                label="Full Name"
                value={profile.fullName}
                onChange={(e) => update("fullName", e.target.value)}
              />
              <Input
                label="Job Title"
                value={profile.jobTitle}
                onChange={(e) => update("jobTitle", e.target.value)}
              />
              <Input
                label="Company"
                value={profile.companyName}
                onChange={(e) => update("companyName", e.target.value)}
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Bio / About"
                  value={profile.bio || ""}
                  onChange={(e) => update("bio", e.target.value)}
                  placeholder="Tell people about yourself..."
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:col-span-2">
                <div className="flex items-center gap-3">
                  {profile.isPublic ? (
                    <Eye className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-slate-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Public Profile</p>
                    <p className="text-xs text-slate-500">
                      Required for the public /p/ link to work
                    </p>
                  </div>
                </div>
                <Switch
                  checked={profile.isPublic}
                  onCheckedChange={(v) => update("isPublic", v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile & cover photos</CardTitle>
              <CardDescription>
                Upload JPG, PNG, WebP, or GIF (max 4MB). On Vercel, images are
                stored inline until you connect Cloudinary/S3.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <ImageUpload
                label="Profile photo"
                kind="photo"
                aspect="square"
                value={profile.profilePhoto || ""}
                onChange={(url) => update("profilePhoto", url)}
                onUploaded={async (url) => {
                  if (!profile) return;
                  const next = { ...profile, profilePhoto: url, isPublic: true, forcePublic: true };
                  setProfile(next);
                  setSaving(true);
                  try {
                    const res = await fetch("/api/profile", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ...next, id: next.id }),
                    });
                    const data = await res.json();
                    if (res.ok && data.profile) {
                      setProfile(data.profile);
                      setMessage("Profile photo saved");
                    } else setMessage(data.error || "Photo uploaded but save failed — click Save");
                  } catch {
                    setMessage("Photo uploaded — click Save to keep it");
                  }
                  setSaving(false);
                }}
                hint="Auto-compressed. Square works best. Click Save if needed."
              />
              <ImageUpload
                label="Cover image"
                kind="cover"
                aspect="wide"
                value={profile.coverImage || ""}
                onChange={(url) => update("coverImage", url)}
                onUploaded={async (url) => {
                  if (!profile) return;
                  const next = { ...profile, coverImage: url, isPublic: true, forcePublic: true };
                  setProfile(next);
                  setSaving(true);
                  try {
                    const res = await fetch("/api/profile", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ...next, id: next.id }),
                    });
                    const data = await res.json();
                    if (res.ok && data.profile) {
                      setProfile(data.profile);
                      setMessage("Cover image saved");
                    } else setMessage(data.error || "Cover uploaded but save failed — click Save");
                  } catch {
                    setMessage("Cover uploaded — click Save to keep it");
                  }
                  setSaving(false);
                }}
                hint="Auto-compressed. Wide image recommended."
              />
              <div className="sm:col-span-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="mb-2 text-sm font-medium">Profile photo shape</p>
                <div className="flex gap-2">
                  {(["circle", "square"] as const).map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() =>
                        update("theme", {
                          ...profile.theme,
                          photoShape: shape,
                        })
                      }
                      className={`flex-1 border px-3 py-2 text-sm capitalize ${
                        (profile.theme?.photoShape || "circle") === shape
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-slate-200"
                      } ${shape === "circle" ? "rounded-full" : "rounded-xl"}`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Uploads are center-cropped to a square so they fit round or square frames cleanly.
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="mb-2 text-xs font-medium text-slate-500">
                  Or paste image URLs
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Profile photo URL"
                    value={
                      profile.profilePhoto?.startsWith("data:")
                        ? ""
                        : profile.profilePhoto || ""
                    }
                    onChange={(e) => update("profilePhoto", e.target.value)}
                    placeholder="https://..."
                  />
                  <Input
                    label="Cover image URL"
                    value={
                      profile.coverImage?.startsWith("data:")
                        ? ""
                        : profile.coverImage || ""
                    }
                    onChange={(e) => update("coverImage", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Card templates</CardTitle>
              <CardDescription>
                Free: Classic only. Pro+: Glassmorphism & Premium Dark with demo 3D avatars.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {CARD_TEMPLATES.map((tpl) => {
                const allowed = canUseTemplate(planId, tpl.id);
                const active =
                  (profile.theme?.templateId || profile.theme?.layout || "default") ===
                    tpl.id ||
                  (profile.theme?.layout === tpl.layout && tpl.id !== "default");
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    disabled={!allowed}
                    onClick={async () => {
                      if (!allowed || !profile) return;
                      const nextTheme = {
                        ...profile.theme,
                        ...tpl.theme,
                        templateId: tpl.id,
                        layout: tpl.layout,
                      };
                      const next = {
                        ...profile,
                        theme: nextTheme,
                        // Apply polished template mockup assets (user can re-upload after)
                        profilePhoto: tpl.avatar,
                        coverImage: tpl.cover,
                      };
                      setProfile(next);
                      setSaving(true);
                      const res = await fetch("/api/profile", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...next,
                          id: next.id,
                          forcePublic: true,
                          isPublic: true,
                        }),
                      });
                      const data = await res.json();
                      if (res.ok && data.profile) {
                        setProfile(data.profile);
                        setMessage(`Template “${tpl.name}” applied`);
                      } else {
                        setMessage(data.error || "Could not apply template");
                      }
                      setSaving(false);
                    }}
                    className={`overflow-hidden rounded-2xl border-2 text-left transition ${
                      active
                        ? "border-brand-500 shadow-glow"
                        : allowed
                          ? "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                          : "cursor-not-allowed border-slate-200 opacity-60 dark:border-slate-800"
                    }`}
                  >
                    <div className="relative aspect-[16/10] bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tpl.cover}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute -bottom-6 left-4 h-14 w-14 overflow-hidden rounded-full border-2 border-white shadow">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={tpl.avatar}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      {!allowed && (
                        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
                          <Crown className="h-3 w-3 text-amber-300" /> Pro+
                        </div>
                      )}
                    </div>
                    <div className="px-4 pb-4 pt-8">
                      <p className="font-semibold">{tpl.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{tpl.description}</p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
          <p className="text-xs text-slate-500">
            Applying a template sets colors/layout. Demo avatar & cover are only applied if you have not uploaded your own photos yet.
          </p>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Phone"
                type="tel"
                value={profile.phone || ""}
                onChange={(e) => update("phone", e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={profile.email || ""}
                onChange={(e) => update("email", e.target.value)}
              />
              <Input
                label="Website"
                value={profile.website || ""}
                onChange={(e) => update("website", e.target.value)}
                onBlur={(e) => update("website", normalizeUrlOnBlur(e.target.value))}
                placeholder="example.com or https://example.com"
                hint="Auto-normalized: protocol added, trailing slashes removed"
              />
              <Input
                label="Address"
                value={profile.address || ""}
                onChange={(e) => update("address", e.target.value)}
              />
              <Input
                label="City"
                value={profile.city || ""}
                onChange={(e) => update("city", e.target.value)}
              />
              <Input
                label="Country"
                value={profile.country || ""}
                onChange={(e) => update("country", e.target.value)}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Google Maps URL"
                  value={profile.mapsUrl || ""}
                  onChange={(e) => update("mapsUrl", e.target.value)}
                  onBlur={(e) => update("mapsUrl", normalizeUrlOnBlur(e.target.value))}
                  placeholder="https://maps.google.com/..."
                  hint="Optional: auto-normalized with https:// if needed"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {([
                  ["linkedin", "LinkedIn", "linkedin.com/in/username"],
                  ["instagram", "Instagram", "instagram.com/username"],
                  ["twitter", "Twitter / X", "x.com/username"],
                  ["facebook", "Facebook", "facebook.com/page"],
                  ["youtube", "YouTube", "youtube.com/@channel"],
                  ["github", "GitHub", "github.com/username"],
                  ["whatsapp", "WhatsApp (phone)", "+1234567890"],
                  ["calendly", "Calendly", "calendly.com/username"],
                ] as const).map(([key, label, placeholder]) => (
                <Input
                  key={key}
                  label={label}
                  value={profile.social[key] || ""}
                  onChange={(e) => updateSocial(key, e.target.value)}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val && key !== "whatsapp") {
                      updateSocial(key, normalizeUrlOnBlur(val));
                    }
                  }}
                  placeholder={placeholder}
                  hint="URL auto-normalized on save"
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Custom Links</CardTitle>
              </div>
              <Button size="sm" variant="outline" onClick={addLink}>
                <Plus className="h-4 w-4" /> Add Link
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.customLinks.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">
                  No custom links yet
                </p>
              )}
              {profile.customLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700 sm:flex-row sm:items-end"
                >
                  <Input
                    label="Title"
                    value={link.title}
                    onChange={(e) =>
                      updateLink(link.id, "title", e.target.value)
                    }
                  />
                  <Input
                    label="URL"
                    value={link.url}
                    onChange={(e) => updateLink(link.id, "url", e.target.value)}
                    onBlur={(e) => updateLink(link.id, "url", normalizeUrlOnBlur(e.target.value))}
                    placeholder="https://..."
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLink(link.id)}
                    className="shrink-0 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={profile.theme.primaryColor}
                    onChange={(e) => updateTheme("primaryColor", e.target.value)}
                    className="h-11 w-14 cursor-pointer rounded-lg border border-slate-200"
                  />
                  <Input
                    value={profile.theme.primaryColor}
                    onChange={(e) => updateTheme("primaryColor", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={profile.theme.secondaryColor}
                    onChange={(e) =>
                      updateTheme("secondaryColor", e.target.value)
                    }
                    className="h-11 w-14 cursor-pointer rounded-lg border border-slate-200"
                  />
                  <Input
                    value={profile.theme.secondaryColor}
                    onChange={(e) =>
                      updateTheme("secondaryColor", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:col-span-2">
                <div>
                  <p className="text-sm font-medium">Show MigSmartCard Branding</p>
                </div>
                <Switch
                  checked={profile.theme.showBranding}
                  onCheckedChange={(v) => updateTheme("showBranding", v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => setShowLivePreview(true)} size="lg">
          <Eye className="h-4 w-4" /> Live Preview
        </Button>
        <Button onClick={() => save(false)} loading={saving} size="lg">
          <Save className="h-4 w-4" /> Save Card
        </Button>
      </div>

      {showLivePreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/50">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
            <div>
              <p className="text-sm font-semibold">
                Live preview · {profile.cardName || profile.fullName}
              </p>
              <p className="text-xs text-slate-500">Includes unsaved changes</p>
            </div>
            <button
              type="button"
              onClick={() => setShowLivePreview(false)}
              className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PublicProfileView
              profile={{ ...profile, isPublic: true }}
              src="preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
