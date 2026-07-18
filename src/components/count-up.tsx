"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/utils";

interface CountUpProps {
  end: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  /** Use a full number when compact K/M formatting is not desired. */
  compact?: boolean;
}

/**
 * A small, accessible count-up animation that starts when the stat enters the
 * viewport. It also respects reduced-motion preferences through the CSS
 * animation policy and immediately shows the final value for those users.
 */
export function CountUp({
  end,
  duration = 1500,
  className,
  prefix = "",
  suffix = "",
  compact = true,
}: CountUpProps) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || duration <= 0) {
      setValue(end);
      return;
    }

    let frame = 0;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // Ease out so the count settles naturally rather than stopping abruptly.
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(end * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [started, end, duration]);

  const displayValue = compact ? formatNumber(value) : value.toLocaleString();

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${end.toLocaleString()}${suffix}`}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}
