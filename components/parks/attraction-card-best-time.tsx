'use client';

import type { ReactNode } from 'react';
import { Star } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { ParkTime } from '@/components/common/park-time';
import type { BestVisitSlot } from '@/lib/api/types';

function minutesUntil(isoStr: string): number {
  return Math.round((new Date(isoStr).getTime() - Date.now()) / 60_000);
}

/**
 * "Best time to visit in X min" row of an attraction card. Client Component because the
 * relative minutes depend on the current time — under Cache Components a server render
 * can't read Date.now(); a client render can, and that's the value the user should see.
 */
export function AttractionCardBestTime({
  bestSlot,
  effectiveTimezone,
}: {
  bestSlot: BestVisitSlot;
  effectiveTimezone?: string;
}) {
  const t = useTranslations('attractions');
  const locale = useLocale();

  const mins = minutesUntil(bestSlot.time);

  const timeTag = () => (
    <strong className="font-bold">
      {effectiveTimezone ? (
        <ParkTime
          isoTime={bestSlot.time}
          parkTimezone={effectiveTimezone}
          locale={locale}
          showSuffix
        />
      ) : (
        new Date(bestSlot.time).toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
        })
      )}
    </strong>
  );

  let node: ReactNode;
  if (mins <= 0) {
    node = bestSlot.rating === 'optimal' ? t('bestVisitNow') : t('bestVisitGoodNow');
  } else if (mins < 60) {
    node = t.rich('cardBestTimeInMinutesOnly', { time: timeTag, minutes: mins });
  } else {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    node =
      m === 0
        ? t.rich('cardBestTimeInHoursOnly', { time: timeTag, hours: h })
        : t.rich('cardBestTimeIn', { time: timeTag, hours: h, minutes: m });
  }

  return (
    <div className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
      <Star className="h-[11px] w-[11px] shrink-0 fill-current" aria-hidden="true" />
      <span suppressHydrationWarning>{node}</span>
    </div>
  );
}
