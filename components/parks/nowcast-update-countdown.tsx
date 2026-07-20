'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveOnScreen } from '@/lib/hooks/use-active-on-screen';

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

  // Deterministic pre-mount value on BOTH server and hydration render. The old
  // `typeof window === 'undefined' ? 0 : Date.now()` initializer rendered an epoch-based
  // countdown ("Update in 29738148:20") into any server-rendered nowcast, which never matched
  // the client → hydration text mismatch → React regenerated the subtree on every load.
  const [internalNow, setInternalNow] = useState(0);
  // Standalone mode (no external clock): only tick while the countdown is on
  // screen and the tab is visible — a mm:ss readout nobody can see doesn't need
  // a per-second re-render. The deferred initial stamp re-syncs it on return.
  const { ref: anchorRef, active } = useActiveOnScreen();
  useEffect(() => {
    if (externalNow !== undefined || !active) return;
    // Deferred initial stamp (same pattern as useBrowserNow) — replaces the "--:--"
    // placeholder right after mount without a synchronous set-state-in-effect.
    const init = window.setTimeout(() => setInternalNow(Date.now()), 0);
    const id = window.setInterval(() => setInternalNow(Date.now()), 1_000);
    return () => {
      window.clearTimeout(init);
      window.clearInterval(id);
    };
  }, [externalNow, active]);
  const now = externalNow ?? internalNow;

  if (!nextUpdateAt) return null;
  const target = Date.parse(nextUpdateAt);
  if (Number.isNaN(target)) return null;
  // Clock not mounted yet → render a stable "--:--" placeholder so SSR and hydration agree.
  const pending = now === 0;
  const ms = target - now;

  // The backend update is overdue (its CDN cache can outlive the stated nextUpdateAt by a few
  // minutes). Rather than vanish — which looks broken — show an "updating…" hint; the hook
  // re-polls every 60s in this state and the countdown returns once fresh data arrives.
  if (!pending && ms <= 0) {
    return (
      <p
        ref={anchorRef}
        className={cn('flex items-center gap-1 font-mono text-[11px] opacity-60', className)}
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
      className={cn('font-mono text-[11px] tabular-nums opacity-60', className)}
      title={t('updateIn', { countdown: `${mm}:${ss}` })}
    >
      <span className="sm:hidden">{`${mm}:${ss}`}</span>
      <span className="hidden sm:inline">{t('updateIn', { countdown: `${mm}:${ss}` })}</span>
    </p>
  );
}
