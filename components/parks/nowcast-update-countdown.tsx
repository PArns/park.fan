'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
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

  const [internalNow, setInternalNow] = useState(() => Date.now());
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
  if (ms <= 0) return null;

  const totalSec = Math.floor(ms / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');

  return (
    <p className={cn('font-mono text-[11px] opacity-60', className)}>
      {t('updateIn', { countdown: `${mm}:${ss}` })}
    </p>
  );
}
