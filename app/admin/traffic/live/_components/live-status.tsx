'use client';

import { cn } from '@/lib/utils';
import { formatLiveClock } from '@/lib/admin/live-traffic';

/**
 * The live view's heartbeat: a green dot that sends one ring out when an answer arrives, grey when
 * the last ask failed, and the time of the counters on screen. The dot is still between answers,
 * so a page left open does not blink forever.
 */
export function LiveStatus({
  ok,
  at,
  receivedAt,
  animate,
  error,
}: {
  /** Whether the last ask came back. */
  ok: boolean;
  /** The `at` of the answer on screen. */
  at: string;
  /** When that answer arrived, which restarts the ring. */
  receivedAt: number;
  animate: boolean;
  /** Why the last ask failed, for the tooltip. */
  error?: string;
}) {
  const clock = formatLiveClock(at);
  return (
    <p
      className="flex flex-col items-end gap-0.5 text-xs whitespace-nowrap sm:flex-row sm:items-center sm:gap-2"
      title={ok ? `Stand ${clock}, alle 5 Sekunden neu` : `Letzte Abfrage gescheitert: ${error}`}
    >
      <span className="flex items-center gap-2">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          {ok && animate && (
            <span
              key={receivedAt}
              className="live-ping absolute inset-0 rounded-full bg-emerald-400"
            />
          )}
          <span
            className={cn(
              'relative h-2 w-2 rounded-full transition-colors duration-300',
              ok
                ? 'bg-emerald-400 shadow-[0_0_8px_var(--color-emerald-400)]'
                : 'bg-muted-foreground/60'
            )}
          />
        </span>
        <span className={cn('font-semibold', ok ? 'text-emerald-300' : 'text-muted-foreground')}>
          {ok ? 'Live' : 'Unterbrochen'}
        </span>
      </span>
      <span className="text-muted-foreground tabular-nums">Stand {clock}</span>
    </p>
  );
}
