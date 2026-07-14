import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbReady } from "@/lib/db";
import { createId } from "@/lib/id";

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

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${profile.fullName}`,
    `N:${profile.fullName.split(" ").slice(-1)[0]};${profile.fullName.split(" ").slice(0, -1).join(" ")};;;`,
  ];

  if (profile.jobTitle) lines.push(`TITLE:${profile.jobTitle}`);
  if (profile.companyName) lines.push(`ORG:${profile.companyName}`);
  if (profile.phone) lines.push(`TEL;TYPE=CELL:${profile.phone}`);
  if (profile.email) lines.push(`EMAIL:${profile.email}`);
  if (profile.website) lines.push(`URL:${profile.website}`);
  if (profile.address) lines.push(`ADR;TYPE=WORK:;;${profile.address};;;;`);
  if (profile.bio) lines.push(`NOTE:${profile.bio.replace(/\n/g, "\\n")}`);
  if (profile.social.linkedin)
    lines.push(`URL;TYPE=LinkedIn:${profile.social.linkedin}`);

  lines.push("END:VCARD");

  const vcard = lines.join("\r\n");
  const filename = `${profile.slug}.vcf`;

  return new NextResponse(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
