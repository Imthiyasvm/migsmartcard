import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const format = searchParams.get("format") || "png";
  const size = parseInt(searchParams.get("size") || "400", 10);

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    if (format === "svg") {
      const svg = await QRCode.toString(url, {
        type: "svg",
        width: size,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const buffer = await QRCode.toBuffer(url, {
      type: "png",
      width: size,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "QR generation failed" }, { status: 500 });
  }
}
