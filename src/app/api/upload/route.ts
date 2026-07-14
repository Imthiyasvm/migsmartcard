import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createId } from "@/lib/id";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024; // 4MB (Vercel serverless body limit friendly)
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
    const kind = String(form.get("kind") || "photo"); // photo | cover

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
        { error: "Image must be under 4MB" },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";

    const filename = `${kind}-${session.user.id.slice(0, 8)}-${createId().slice(0, 10)}.${ext}`;

    // On Vercel filesystem is ephemeral — also return data URL fallback path
    // Prefer writing to public/uploads when possible (local / persistent disk)
    const isVercel = process.env.VERCEL === "1";

    if (isVercel) {
      // Store as data URL so it works without S3/Cloudinary on serverless
      const dataUrl = `data:${file.type};base64,${bytes.toString("base64")}`;
      return NextResponse.json({
        success: true,
        url: dataUrl,
        storage: "inline",
        warning:
          "Stored inline (Vercel). For production scale, connect Cloudinary or S3.",
      });
    }

    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const full = path.join(dir, filename);
    await writeFile(full, bytes);

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
      storage: "disk",
    });
  } catch (e) {
    console.error("Upload error", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
