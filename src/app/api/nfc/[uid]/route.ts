import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbReady } from "@/lib/db";
import { createId } from "@/lib/id";

export async function GET(
  _req: NextRequest,
  { params }: { params: { uid: string } }
) {
  await ensureDbReady();
  const card = db.nfc.getByUid(params.uid);

  if (!card || card.status !== "assigned" || !card.profileId) {
    return NextResponse.redirect(
      new URL("/nfc-not-found", process.env.NEXTAUTH_URL || "http://localhost:3000")
    );
  }

  const profile = db.profiles.getById(card.profileId);
  if (!profile) {
    return NextResponse.redirect(
      new URL("/nfc-not-found", process.env.NEXTAUTH_URL || "http://localhost:3000")
    );
  }

  // Track NFC tap
  db.analytics.create({
    id: createId('evt'),
    profileId: profile.id,
    userId: profile.userId,
    type: "nfc_tap",
    device: "mobile",
    createdAt: new Date().toISOString(),
  });

  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return NextResponse.redirect(new URL(`/p/${profile.slug}?src=nfc`, base));
}
