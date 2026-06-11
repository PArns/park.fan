'use client';

import type { ReactNode } from 'react';
import { Sunrise } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { ParkTime } from '@/components/common/park-time';
import type { RopeDropInfo } from '@/lib/api/types';

/**
 * Compact "Rope drop: save ~X min (until ~HH:MM)" row of an attraction card.
 * Client Component for the same reason as <AttractionCardBestTime>: the
 * concrete until-time renders via <ParkTime> (browser-timezone tooltip).
 */
export function AttractionCardRopeDrop({
  ropeDrop,
  effectiveTimezone,
}: {
  ropeDrop: RopeDropInfo;
  effectiveTimezone?: string;
}) {
  const t = useTranslations('attractions.ropeDrop');
  const locale = useLocale();

  const timeTag = () => (
    <strong className="font-bold">
      {effectiveTimezone ? (
        <ParkTime
          isoTime={ropeDrop.rideByUtc!}
          parkTimezone={effectiveTimezone}
          locale={locale}
          showSuffix
        />
      ) : (
        new Date(ropeDrop.rideByUtc!).toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
        })
      )}
    </strong>
  );

  const node: ReactNode = ropeDrop.rideByUtc
    ? t.rich('cardLineUntil', { savings: ropeDrop.savings, time: timeTag })
    : t('cardLine', { savings: ropeDrop.savings });

  return (
    <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
      <Sunrise className="h-[11px] w-[11px] shrink-0" aria-hidden="true" />
      <span suppressHydrationWarning>{node}</span>
    </div>
  );
}
