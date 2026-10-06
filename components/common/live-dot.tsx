/*
 * These dots carry `will-change` because they animate forever inside cards with
 * `backdrop-filter`: with its own layer the compositor animates `opacity` and `transform` without
 * repainting the blurred region. Not `contain: paint`, which would clip the ping ring. Inside a
 * card with `backdrop-filter`, prefer `variant="ping"` with `showPing={false}`. Under
 * `prefers-reduced-motion` the ping ring is hidden rather than frozen, since a frozen ring is a
 * second, larger dot.
 */

import { cn } from '@/lib/utils';

interface LiveDotProps {
  /**
   * `ping` (default) — a solid dot with an expanding "radar" ring behind it
   * (the live-nowcast / training indicator). `pulse` — a single dot that fades
   * in/out via `animate-pulse` (the live-ticker / ML badge indicator).
   */
  variant?: 'ping' | 'pulse';
  /** Tailwind size utilities for the dot, e.g. `size-1.5` or `h-2 w-2`. */
  size?: string;
  /** Solid-dot colour class, e.g. `bg-emerald-500`. */
  color: string;
  /**
   * Ping-ring colour class (ping variant only). Defaults to `color`; pass a
   * translucent/opacity variant (e.g. `bg-emerald-500/50` or `opacity-75`
   * alongside a colour) to soften the ring.
   */
  pingColor?: string;
  /** Ping variant only: render the expanding ring. Defaults to true. */
  showPing?: boolean;
  /** Extra classes on the outer element (e.g. `shrink-0`, or `flex` to override display). */
  className?: string;
}

/** Small animated "live" indicator in two shapes; see `variant`. */
export function LiveDot({
  variant = 'ping',
  size = 'h-2 w-2',
  color,
  pingColor,
  showPing = true,
  className,
}: LiveDotProps) {
  if (variant === 'pulse') {
    return (
      <span
        className={cn(
          size,
          'animate-pulse rounded-full [will-change:opacity] motion-reduce:animate-none',
          color,
          className
        )}
      />
    );
  }

  return (
    <span className={cn('relative inline-flex', size, className)}>
      {showPing && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full motion-reduce:hidden',
            '[will-change:transform,opacity]',
            pingColor ?? color
          )}
          aria-hidden="true"
        />
      )}
      <span className={cn('relative inline-flex rounded-full', size, color)} />
    </span>
  );
}
