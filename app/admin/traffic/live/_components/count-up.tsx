'use client';

import { useLayoutEffect, useRef } from 'react';
import { formatCount } from '@/lib/admin/site-analytics';

/** A slow start would read as lag; the figure moves at once and settles. */
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * A count that rolls from the figure it last showed to the new one, written straight into its own
 * text node frame by frame so the parent does not re-render sixty times a second. Without
 * `animate` (reduced motion) the new figure stands at once. The figure for a screen reader is
 * plain text beside it.
 */
export function CountUp({
  value,
  animate,
  duration = 900,
  className,
}: {
  value: number;
  animate: boolean;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const from = shown.current;
    if (from === null || from === value || !animate) {
      shown.current = value;
      element.textContent = formatCount(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const current = Math.round(from + (value - from) * easeOut(t));
      shown.current = current;
      element.textContent = formatCount(current);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, animate, duration]);

  return (
    <>
      {/* No children: React would otherwise own the text node this effect rewrites. */}
      <span ref={ref} aria-hidden="true" className={className} />
      <span className="sr-only">{formatCount(value)}</span>
    </>
  );
}
