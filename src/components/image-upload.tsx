"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  kind?: "photo" | "cover";
  className?: string;
  aspect?: "square" | "wide";
  hint?: string;
  /** Called after successful upload with the final URL */
  onUploaded?: (url: string) => void;
}

/** Compress image client-side so Vercel/Redis can store it */
async function compressImage(
  file: File,
  kind: "photo" | "cover"
): Promise<Blob> {
  const maxW = kind === "cover" ? 1400 : 800;
  const maxH = kind === "cover" ? 600 : 800;
  const quality = 0.82;

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  const scale = Math.min(1, maxW / width, maxH / height);
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
  );
  if (!blob) throw new Error("Compression failed");
  return blob;
}

export function ImageUpload({
  label,
  value,
  onChange,
  kind = "photo",
  className,
  aspect = "square",
  hint,
  onUploaded,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const pick = () => inputRef.current?.click();

  const onFile = async (file?: File | null) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      let uploadBlob: Blob = file;
      let filename = file.name || "photo.jpg";
      try {
        uploadBlob = await compressImage(file, kind);
        filename = filename.replace(/\.\w+$/, "") + ".jpg";
      } catch {
        // use original if compression fails
        uploadBlob = file;
      }

      if (uploadBlob.size > 2.5 * 1024 * 1024) {
        setError("Image still too large. Choose a smaller photo.");
        return;
      }

      const fd = new FormData();
      fd.append(
        "file",
        new File([uploadBlob], filename, {
          type: uploadBlob.type || "image/jpeg",
        })
      );
      fd.append("kind", kind);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      onChange(data.url);
      onUploaded?.(data.url);
    } catch {
      setError("Upload failed — try a smaller JPG/PNG");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              onUploaded?.("");
            }}
            className="flex items-center gap-1 text-xs text-red-500 hover:underline"
          >
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        )}
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50",
          aspect === "wide" ? "h-32 sm:h-40" : "h-36 w-36"
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={pick}
            disabled={uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400 hover:text-brand-600"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ImagePlus className="h-6 w-6" />
            )}
            <span className="text-xs font-medium">
              {uploading ? "Uploading..." : "Upload image"}
            </span>
          </button>
        )}

        {value && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/50 to-transparent p-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={pick}
              disabled={uploading}
              className="h-8 text-xs"
            >
              {uploading ? "Uploading..." : "Change"}
            </Button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
