import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function absoluteUrl(path: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}${path}`
    : `http://localhost:3000${path}`;
}

/**
 * Normalize a website URL to ensure it has a valid protocol.
 * - Adds https:// if no protocol is present
 * - Removes trailing slashes
 * - Handles empty/invalid input gracefully
 */
export function normalizeWebsiteUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string") return "";
  
  let normalized = url.trim();
  
  // Return empty if no meaningful content
  if (!normalized) return "";
  
  // Add https:// if no protocol is present
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  
  // Remove trailing slash
  normalized = normalized.replace(/\/+$/, "");
  
  return normalized;
}

/**
 * Display a website URL in a user-friendly format (without protocol, without www)
 */
export function displayWebsiteUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string") return "";
  
  return url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}

/**
 * Calculate appropriate contrast text color (#0f172a or #ffffff) for a given hex background color
 */
export function getContrastColor(hexColor: string | undefined | null): string {
  if (!hexColor || typeof hexColor !== "string") return "#0f172a";
  let hex = hexColor.replace("#", "").trim();
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (hex.length !== 6) return "#0f172a";
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "#0f172a";
  // YIQ luminance formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#0f172a" : "#ffffff";
}

/**
 * Validate if a string is a valid URL format
 */
export function isValidUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  
  try {
    const normalized = normalizeWebsiteUrl(url);
    new URL(normalized);
    return true;
  } catch {
    return false;
  }
}
