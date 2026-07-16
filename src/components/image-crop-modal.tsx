"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCw, Check, Move } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  aspect?: "square" | "circle";
  title?: string;
}

export function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  aspect = "circle",
  title = "Crop Profile Photo",
}: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImgElement(img);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgElement) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 320;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.translate(size / 2 + offset.x, size / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const iw = imgElement.width;
    const ih = imgElement.height;
    const fitScale = Math.min(size / iw, size / ih);
    const dw = iw * fitScale;
    const dh = ih * fitScale;

    ctx.drawImage(imgElement, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();

    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.beginPath();
    ctx.rect(0, 0, size, size);

    const cropRadius = size * 0.42;
    if (aspect === "circle") {
      ctx.arc(size / 2, size / 2, cropRadius, 0, Math.PI * 2, true);
    } else {
      const x0 = size / 2 - cropRadius;
      const y0 = size / 2 - cropRadius;
      const w0 = cropRadius * 2;
      ctx.rect(x0 + w0, y0, -w0, w0);
    }
    ctx.fill();

    ctx.strokeStyle = "#1a5ff5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (aspect === "circle") {
      ctx.arc(size / 2, size / 2, cropRadius, 0, Math.PI * 2);
    } else {
      const x0 = size / 2 - cropRadius;
      const y0 = size / 2 - cropRadius;
      const w0 = cropRadius * 2;
      ctx.rect(x0, y0, w0, w0);
    }
    ctx.stroke();
  }, [imgElement, zoom, rotation, offset, aspect]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleApplyCrop = () => {
    if (!imgElement) return;
    setApplying(true);

    try {
      const outputSize = 800;
      const outCanvas = document.createElement("canvas");
      outCanvas.width = outputSize;
      outCanvas.height = outputSize;
      const ctx = outCanvas.getContext("2d");

      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outputSize, outputSize);

      const previewSize = 320;
      const cropRadius = previewSize * 0.42;
      const cropSizeInPreview = cropRadius * 2;
      const scaleFactor = outputSize / cropSizeInPreview;

      ctx.save();
      ctx.translate(
        outputSize / 2 + offset.x * scaleFactor,
        outputSize / 2 + offset.y * scaleFactor
      );
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

      const iw = imgElement.width;
      const ih = imgElement.height;
      const fitScale = Math.min(previewSize / iw, previewSize / ih);
      const dw = iw * fitScale;
      const dh = ih * fitScale;

      ctx.drawImage(imgElement, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();

      const dataUrl = outCanvas.toDataURL("image/jpeg", 0.9);
      onCropComplete(dataUrl);
      onClose();
    } catch {
      /* ignore */
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h3 className="font-display font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="relative flex justify-center">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              className="cursor-move rounded-xl touch-none border border-slate-200 shadow-inner dark:border-slate-800"
              style={{ width: "320px", height: "320px" }}
            />
            <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white">
              <Move className="h-3 w-3" /> Drag to pan
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer accent-brand-600"
              />
              <ZoomIn className="h-4 w-4 shrink-0 text-slate-400" />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="gap-1.5 text-xs"
              >
                <RotateCw className="h-3.5 w-3.5" /> Rotate
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                  setOffset({ x: 0, y: 0 });
                }}
                className="text-xs"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/50">
          <Button type="button" variant="ghost" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApplyCrop}
            loading={applying}
            size="sm"
            className="gap-1.5"
          >
            <Check className="h-4 w-4" /> Apply Crop
          </Button>
        </div>
      </div>
    </div>
  );
}
