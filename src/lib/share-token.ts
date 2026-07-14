import { DigitalProfile } from "@/types";

/**
 * Compact public share payload so cards can be opened on Vercel
 * without Redis. Large data-URL photos are stripped (use Redis or
 * external image URLs for permanent short /p/slug links with photos).
 */

const MAX_TOKEN_CHARS = 12000; // keep URLs usable

export type SharePayload = {
  v: 1;
  slug: string;
  fullName: string;
  jobTitle?: string;
  companyName?: string;
  profilePhoto?: string;
  coverImage?: string;
  bio?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  mapsUrl?: string;
  social?: DigitalProfile["social"];
  customLinks?: DigitalProfile["customLinks"];
  theme?: DigitalProfile["theme"];
  cardName?: string;
};

function isHugeDataUrl(value?: string) {
  return Boolean(value && value.startsWith("data:") && value.length > 2500);
}

export function profileToSharePayload(profile: DigitalProfile): SharePayload {
  const photo = isHugeDataUrl(profile.profilePhoto)
    ? undefined
    : profile.profilePhoto;
  const cover = isHugeDataUrl(profile.coverImage)
    ? undefined
    : profile.coverImage;

  return {
    v: 1,
    slug: profile.slug,
    fullName: profile.fullName,
    jobTitle: profile.jobTitle,
    companyName: profile.companyName,
    profilePhoto: photo,
    coverImage: cover,
    bio: profile.bio,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    address: profile.address,
    city: profile.city,
    country: profile.country,
    mapsUrl: profile.mapsUrl,
    social: profile.social || {},
    customLinks: profile.customLinks || [],
    theme: profile.theme,
    cardName: profile.cardName,
  };
}

export function encodeShareToken(profile: DigitalProfile): string {
  let payload = profileToSharePayload(profile);
  let json = JSON.stringify(payload);
  // If still too large, drop photos
  if (json.length > MAX_TOKEN_CHARS) {
    payload = { ...payload, profilePhoto: undefined, coverImage: undefined };
    json = JSON.stringify(payload);
  }
  if (json.length > MAX_TOKEN_CHARS) {
    payload = {
      ...payload,
      bio: (payload.bio || "").slice(0, 280),
      customLinks: (payload.customLinks || []).slice(0, 5),
    };
    json = JSON.stringify(payload);
  }
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeShareToken(token: string): SharePayload | null {
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    const data = JSON.parse(json) as SharePayload;
    if (!data || data.v !== 1 || !data.fullName) return null;
    return data;
  } catch {
    return null;
  }
}

export function sharePayloadToProfile(data: SharePayload): DigitalProfile {
  const now = new Date().toISOString();
  return {
    id: `share-${data.slug || "card"}`,
    userId: "share",
    slug: data.slug || "card",
    cardName: data.cardName,
    fullName: data.fullName,
    jobTitle: data.jobTitle || "",
    companyName: data.companyName || "",
    profilePhoto: data.profilePhoto,
    coverImage: data.coverImage,
    bio: data.bio,
    phone: data.phone,
    email: data.email,
    website: data.website,
    address: data.address,
    city: data.city,
    country: data.country,
    mapsUrl: data.mapsUrl,
    social: data.social || {},
    customLinks: data.customLinks || [],
    theme: data.theme || {
      primaryColor: "#1a5ff5",
      secondaryColor: "#22c55e",
      backgroundColor: "#ffffff",
      textColor: "#0f172a",
      buttonStyle: "rounded",
      fontStyle: "modern",
      showBranding: true,
    },
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildSharePath(profile: DigitalProfile): string {
  const token = encodeShareToken(profile);
  return `/c/${token}`;
}
