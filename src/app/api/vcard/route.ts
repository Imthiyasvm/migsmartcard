import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbReady } from "@/lib/db";
import { createId } from "@/lib/id";
import { normalizeWebsiteUrl } from "@/lib/utils";

/** Escape vCard text values per RFC 6350 */
function escapeVCardText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Normalize a social URL — add https:// if missing */
function normalizeSocialUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Generate a simple SVG avatar as a data URI for vCard when no photo is uploaded */
function generateSvgAvatar(name: string, primaryColor: string): string {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="${primaryColor}" rx="0"/>
  <text x="100" y="108" font-family="Arial,Helvetica,sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function GET(req: NextRequest) {
  await ensureDbReady();
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  const profile = db.profiles.getBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Track save contact
  db.analytics.create({
    id: createId('evt'),
    profileId: profile.id,
    userId: profile.userId,
    type: "save_contact",
    device: "mobile",
    createdAt: new Date().toISOString(),
  });

  // Parse name parts properly
  const nameParts = (profile.fullName || "").trim().split(/\s+/);
  const familyName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : "";
  const givenName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : nameParts[0] || "";

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCardText(profile.fullName || "Unknown")}`,
    `N:${escapeVCardText(familyName)};${escapeVCardText(givenName)};;;`,
  ];

  // Add profile photo if available — auto-generate avatar if no photo uploaded
  const primaryColor = profile.theme?.primaryColor || "#d4a574";
  const photoSource = profile.profilePhoto || generateSvgAvatar(profile.fullName || "User", primaryColor);

  if (photoSource.startsWith("http://") || photoSource.startsWith("https://")) {
    lines.push(`PHOTO;VALUE=uri:${photoSource}`);
  } else if (photoSource.startsWith("data:image/svg+xml;base64,")) {
    // For SVG data URIs, use the URI reference format
    lines.push(`PHOTO;VALUE=uri:${photoSource}`);
  } else if (photoSource.startsWith("data:")) {
    // Extract base64 portion from data URI (for PNG/JPEG uploads)
    const base64Match = photoSource.match(/^data:image\/(jpeg|png|jpg|webp|gif);base64,(.+)$/i);
    if (base64Match) {
      const mediaType = base64Match[1].toUpperCase() === "JPG" ? "JPEG" : base64Match[1].toUpperCase();
      lines.push(`PHOTO;ENCODING=b;TYPE=${mediaType}:${base64Match[2]}`);
    }
  } else if (photoSource.startsWith("/")) {
    // Relative URL — construct full URL (best-effort)
    const host = req.headers.get("host") || "";
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    if (host) {
      lines.push(`PHOTO;VALUE=uri:${protocol}://${host}${photoSource}`);
    }
  }

  if (profile.jobTitle) lines.push(`TITLE:${escapeVCardText(profile.jobTitle)}`);
  if (profile.companyName) lines.push(`ORG:${escapeVCardText(profile.companyName)}`);
  if (profile.phone) lines.push(`TEL;TYPE=CELL:${profile.phone.replace(/\s+/g, "")}`);
  if (profile.email) lines.push(`EMAIL;TYPE=INTERNET:${profile.email.trim()}`);
  
  // Normalize website URL — ensure it has a protocol
  if (profile.website) {
    lines.push(`URL:${normalizeWebsiteUrl(profile.website)}`);
  }
  
  // Build address with city/country if available
  if (profile.address || profile.city || profile.country) {
    const street = profile.address || "";
    const city = profile.city || "";
    const country = profile.country || "";
    lines.push(`ADR;TYPE=WORK:;;${escapeVCardText(street)};${escapeVCardText(city)};;${escapeVCardText(country)}`);
  }
  
  if (profile.bio) lines.push(`NOTE:${escapeVCardText(profile.bio)}`);
  
  // Social links with proper normalization
  if (profile.social.linkedin) {
    lines.push(`URL;TYPE=LinkedIn:${normalizeSocialUrl(profile.social.linkedin)}`);
  }
  if (profile.social.instagram) {
    lines.push(`URL;TYPE=Instagram:${normalizeSocialUrl(profile.social.instagram)}`);
  }
  if (profile.social.twitter) {
    lines.push(`URL;TYPE=Twitter:${normalizeSocialUrl(profile.social.twitter)}`);
  }
  if (profile.social.facebook) {
    lines.push(`URL;TYPE=Facebook:${normalizeSocialUrl(profile.social.facebook)}`);
  }
  if (profile.social.github) {
    lines.push(`URL;TYPE=GitHub:${normalizeSocialUrl(profile.social.github)}`);
  }
  if (profile.social.youtube) {
    lines.push(`URL;TYPE=YouTube:${normalizeSocialUrl(profile.social.youtube)}`);
  }

  // REV date
  lines.push(`REV:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`);
  lines.push(`PRODID:-//MigSmartCard//EN`);
  lines.push("END:VCARD");

  const vcard = lines.join("\r\n");
  const filename = `${(profile.fullName || profile.slug).replace(/[^a-zA-Z0-9]/g, "_")}.vcf`;

  return new NextResponse(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
