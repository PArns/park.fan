'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const [internalNow, setInternalNow] = useState(() =>
    typeof window === 'undefined' ? 0 : Date.now()
  );
  useEffect(() => {
    if (externalNow !== undefined) return;
    const id = window.setInterval(() => setInternalNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, [externalNow]);
  const now = externalNow ?? internalNow;

  if (!nextUpdateAt) return null;
  const target = Date.parse(nextUpdateAt);
  if (Number.isNaN(target)) return null;
  const ms = target - now;

  // The backend update is overdue (its CDN cache can outlive the stated nextUpdateAt by a few
  // minutes). Rather than vanish — which looks broken — show an "updating…" hint; the hook
  // re-polls every 60s in this state and the countdown returns once fresh data arrives.
  if (ms <= 0) {
    return (
      <p
        className={cn('flex items-center gap-1 font-mono text-[11px] opacity-60', className)}
        aria-live="polite"
      >
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        {t('updating')}
      </p>
    );
  }

  const totalSec = Math.floor(ms / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');

  // Below `sm` the full sentence wraps the card header — show the bare timer there.
  return (
    <p
      className={cn('font-mono text-[11px] tabular-nums opacity-60', className)}
      title={t('updateIn', { countdown: `${mm}:${ss}` })}
    >
      <span className="sm:hidden">{`${mm}:${ss}`}</span>
      <span className="hidden sm:inline">{t('updateIn', { countdown: `${mm}:${ss}` })}</span>
    </p>
  );
}
