import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createId } from "@/lib/id";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Keep under typical serverless body limits after base64 (~1.3x)
const MAX_BYTES = 2.5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "photo");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WebP, or GIF images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          error:
            "Image too large after upload (max ~2.5MB). Use a smaller photo or crop first.",
        },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const mime = file.type === "image/jpg" ? "image/jpeg" : file.type;
    const ext =
      mime === "image/png"
        ? "png"
        : mime === "image/webp"
          ? "webp"
          : mime === "image/gif"
            ? "gif"
            : "jpg";

    const filename = `${kind}-${session.user.id.slice(0, 8)}-${createId().slice(0, 10)}.${ext}`;
    const isVercel = process.env.VERCEL === "1";

    // Always return a data URL that can be saved into the profile JSON/Redis
    // Prefer jpeg/webp data URLs for size; keep original mime
    const dataUrl = `data:${mime};base64,${bytes.toString("base64")}`;

    if (dataUrl.length > 1_200_000) {
      return NextResponse.json(
        {
          error:
            "Encoded image is too large to store. Please use a smaller image (under ~800KB recommended).",
          size: dataUrl.length,
        },
        { status: 400 }
      );
    }

    if (!isVercel) {
      try {
        const dir = path.join(process.cwd(), "public", "uploads");
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, filename), bytes);
        // Local: prefer public URL (smaller profile payload)
        return NextResponse.json({
          success: true,
          url: `/uploads/${filename}`,
          dataUrl,
          storage: "disk",
        });
      } catch {
        // fall through to data URL
      }
    }

    return NextResponse.json({
      success: true,
      url: dataUrl,
      storage: "inline",
      bytes: bytes.length,
      warning:
        "Image stored with profile. Prefer images under 800KB for reliable Redis short links.",
    });
  } catch (e) {
    console.error("Upload error", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
