/*
 * Why these dots carry `will-change`.
 *
 * They animate forever inside a card that carries `backdrop-filter`, and a backdrop filter is
 * re-read whenever its region is dirtied. A runtime audit over the park, calendar, ride and home
 * pages found six such elements — every one of them a live-status dot or its ping ring — sitting
 * inside 50 to 70 blurred elements per page. `opacity` and `transform` are the two properties a
 * compositor can animate without the main thread painting at all, but only once the element has
 * its own layer; `will-change` is what promises that. A 6 px dot costs nothing to promote.
 *
 * NOT `contain: paint`, which is the right tool one file over for the countdowns: containment
 * clips to the box, and `animate-ping` scales a ring beyond its own bounds on purpose.
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

/**
 * Small animated "live" indicator, previously copy-pasted across the live
 * ticker, ML badge, weather nowcast pill and training-status badge. See the
 * `variant` doc for the two shapes.
 */
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
        className={cn(size, 'animate-pulse rounded-full [will-change:opacity]', color, className)}
      />
    );
  }

  return (
    <span className={cn('relative inline-flex', size, className)}>
      {showPing && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full',
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
