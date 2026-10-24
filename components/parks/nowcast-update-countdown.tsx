'use client';

import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveOnScreen } from '@/lib/hooks/use-active-on-screen';
import { useSecondNow } from '@/lib/hooks/use-second-now';

interface NowcastUpdateCountdownProps {
  nextUpdateAt: string | null | undefined;
  /**
   * Optional externally-provided "now" timestamp (ms). When omitted, the
   * component runs its own 1-second ticker. Pass this from a parent that
   * already has a ticker to avoid duplicated intervals.
   */
  now?: number;
  className?: string;
}

/**
 * Small monospaced "Update in mm:ss" countdown until the next backend refresh
 * of the weather nowcast. Renders nothing once the countdown reaches zero.
 */
export function NowcastUpdateCountdown({
  nextUpdateAt,
  now: externalNow,
  className,
}: NowcastUpdateCountdownProps) {
  const t = useTranslations('parks.weatherNowcast');

  // Standalone mode (no external clock): only tick while the countdown is on screen and the tab
  // is visible, since a mm:ss readout nobody can see doesn't need a per-second re-render. `null`
  // renders the "--:--" placeholder, which the server and the hydration render agree on.
  const { ref: anchorRef, active } = useActiveOnScreen();
  const ownNow = useSecondNow(externalNow === undefined && active);
  const now = externalNow ?? ownNow;

  if (!nextUpdateAt) return null;
  const target = Date.parse(nextUpdateAt);
  if (Number.isNaN(target)) return null;
  const pending = now == null;
  const ms = pending ? 0 : target - now;

  // The backend update is overdue (its CDN cache can outlive the stated nextUpdateAt by a few
  // minutes). Rather than vanish — which looks broken — show an "updating…" hint; the hook
  // re-polls every 60s in this state and the countdown returns once fresh data arrives.
  if (!pending && ms <= 0) {
    return (
      <p
        ref={anchorRef}
        className={cn(
          'flex items-center gap-1 font-mono text-[11px] opacity-60 [contain:paint]',
          className
        )}
        aria-live="polite"
      >
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        {t('updating')}
      </p>
    );
  }

  const totalSec = Math.floor(ms / 1000);
  const mm = pending ? '--' : String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = pending ? '--' : String(totalSec % 60).padStart(2, '0');

  // Below `sm` the full sentence wraps the card header — show the bare timer there.
  return (
    <p
      ref={anchorRef}
      // `contain: paint` on the one element that repaints every second: inside a `backdrop-blur`
      // card, an uncontained tick makes the backdrop re-read every second, and a dropped frame
      // shows the card unblurred. See docs/rules/work-nobody-can-see-is-still-work.md.
      className={cn('font-mono text-[11px] tabular-nums opacity-60 [contain:paint]', className)}
      title={t('updateIn', { countdown: `${mm}:${ss}` })}
    >
      <span className="sm:hidden">{`${mm}:${ss}`}</span>
      <span className="hidden sm:inline">{t('updateIn', { countdown: `${mm}:${ss}` })}</span>
    </p>
  );
}
