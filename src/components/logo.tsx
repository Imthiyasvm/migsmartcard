"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";

/**
 * Brand logos:
 * - Light UI: /brand/logo.svg (dark marks)
 * - Dark UI:  /brand/logo-dark.svg (white marks)
 * - Favicon:  /favicon.svg
 */
export function Logo({
  className,
  showText = true,
  href = "/",
  variant = "auto",
  force = "auto",
}: {
  className?: string;
  showText?: boolean;
  href?: string;
  variant?: "auto" | "full" | "mark";
  /** force light/dark logo asset */
  force?: "auto" | "light" | "dark";
}) {
  const { theme } = useTheme();
  const mode = variant === "auto" ? (showText ? "full" : "mark") : variant;
  const useDark =
    force === "dark" || (force === "auto" && theme === "dark");
  const src = useDark ? "/brand/logo-dark.svg" : "/brand/logo.svg";

  return (
    <Link href={href} className={cn("flex items-center", className)}>
      {mode === "full" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="MigSmartCard — Smart Way to Connect"
          className="h-9 w-auto max-w-[200px] object-contain object-left"
        />
      ) : (
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-900 shadow-soft ring-1 ring-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon.svg"
            alt="MigSmartCard"
            className="h-9 w-9 object-cover"
          />
        </span>
      )}
    </Link>
  );
}

export function LogoSvg({
  className,
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dark ? "/brand/logo-dark.svg" : "/brand/logo.svg"}
      alt="MigSmartCard"
      className={cn("h-9 w-auto", className)}
    />
  );
}
