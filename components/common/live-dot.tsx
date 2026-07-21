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
    return <span className={cn(size, 'animate-pulse rounded-full', color, className)} />;
  }

  return (
    <span className={cn('relative inline-flex', size, className)}>
      {showPing && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full',
            pingColor ?? color
          )}
          aria-hidden="true"
        />
      )}
      <span className={cn('relative inline-flex rounded-full', size, color)} />
    </span>
  );
}
