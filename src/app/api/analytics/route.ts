import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, ensureDbReady } from "@/lib/db";
import { createId } from "@/lib/id";

export async function GET(req: NextRequest) {
  await ensureDbReady();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30", 10);

  const events = db.analytics.getByUserId(session.user.id);
  const cutoff = Date.now() - days * 86400000;
  const filtered = events.filter(
    (e) => new Date(e.createdAt).getTime() >= cutoff
  );

  const views = filtered.filter((e) => e.type === "view").length;
  const uniqueDevices = new Set(
    filtered.filter((e) => e.type === "view").map((e) => `${e.device}-${e.city}`)
  ).size;
  const linkClicks = filtered.filter((e) => e.type === "link_click").length;
  const saves = filtered.filter((e) => e.type === "save_contact").length;
  const nfcTaps = filtered.filter((e) => e.type === "nfc_tap").length;
  const qrScans = filtered.filter((e) => e.type === "qr_scan").length;
  const leads = filtered.filter((e) => e.type === "lead").length;

  // Device breakdown
  const deviceMap: Record<string, number> = {};
  filtered.forEach((e) => {
    if (e.type === "view") {
      deviceMap[e.device] = (deviceMap[e.device] || 0) + 1;
    }
  });

  // Country breakdown
  const countryMap: Record<string, number> = {};
  filtered.forEach((e) => {
    if (e.country) {
      countryMap[e.country] = (countryMap[e.country] || 0) + 1;
    }
  });

  // Daily views for chart
  const dailyMap: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = 0;
  }
  filtered
    .filter((e) => e.type === "view" || e.type === "nfc_tap" || e.type === "qr_scan")
    .forEach((e) => {
      const key = e.createdAt.slice(0, 10);
      if (dailyMap[key] !== undefined) dailyMap[key]++;
    });

  const daily = Object.entries(dailyMap).map(([date, count]) => ({
    date,
    views: count,
  }));

  // Top links
  const linkMap: Record<string, number> = {};
  filtered
    .filter((e) => e.type === "link_click" && e.linkLabel)
    .forEach((e) => {
      linkMap[e.linkLabel!] = (linkMap[e.linkLabel!] || 0) + 1;
    });

  return NextResponse.json({
    summary: {
      views,
      uniqueVisitors: uniqueDevices,
      linkClicks,
      saves,
      nfcTaps,
      qrScans,
      leads,
    },
    devices: Object.entries(deviceMap).map(([name, value]) => ({ name, value })),
    countries: Object.entries(countryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
    daily,
    topLinks: Object.entries(linkMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
  });
}

export async function POST(req: NextRequest) {
  await ensureDbReady();
  try {
    const body = await req.json();
    const { profileId, type, linkId, linkLabel, device, country, city, referrer } =
      body;

    if (!profileId || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const profile = db.profiles.getById(profileId);
    if (!profile) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const event = db.analytics.create({
      id: createId('evt'),
      profileId,
      userId: profile.userId,
      type,
      linkId,
      linkLabel,
      device: device || "mobile",
      country: country || "Unknown",
      city: city || "Unknown",
      referrer,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, event });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
