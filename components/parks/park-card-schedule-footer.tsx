'use client';

import { Activity, Clock, Calendar } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { ParkTime } from '@/components/common/park-time';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { getScheduleMessage } from '@/lib/utils/schedule-utils';
import type { ScheduleSummary } from '@/lib/api/types';

interface ParkCardScheduleFooterProps {
  isOpen: boolean;
  operatingAttractions?: number;
  totalAttractions?: number;
  timezone?: string;
  status?: string;
  isInMaintenance: boolean;
  todaySchedule?: ScheduleSummary;
  nextSchedule?: ScheduleSummary;
  hasOperatingSchedule?: boolean;
}

/**
 * Schedule/countdown footer of a park card. Extracted into a Client Component because it
 * reads the current time ("closes in X", "opens in Y") — under Cache Components a server
 * render can't read `Date.now()`, but a client render can, and the live value is what the
 * user should see (the absolute time is rendered by <ParkTime>, the relative text carries
 * suppressHydrationWarning). Behaviour is identical to the previous inline server version.
 */
export function ParkCardScheduleFooter({
  isOpen,
  operatingAttractions,
  totalAttractions,
  timezone,
  status,
  isInMaintenance,
  todaySchedule,
  nextSchedule,
  hasOperatingSchedule = true,
}: ParkCardScheduleFooterProps) {
  const tCommon = useTranslations('common');
  const tNearby = useTranslations('nearby');
  const tCard = useTranslations('parkCard');
  const locale = useLocale();

  const scheduleInfo = getScheduleMessage(
    todaySchedule,
    nextSchedule,
    timezone,
    status,
    isInMaintenance,
    locale,
    tNearby,
    tCommon,
    hasOperatingSchedule
  );

  // Closing time for open parks: remaining duration only (absolute time rendered by
  // ParkTime). Client render → Date.now() is the real client time.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const closingRemaining =
    isOpen && todaySchedule?.closingTime
      ? (() => {
          try {
            const diff = new Date(todaySchedule.closingTime).getTime() - nowMs;
            if (diff <= 0) return null;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return hours > 0 ? `${hours} ${tCommon('hours')}. ${minutes} min.` : `${minutes} min.`;
          } catch {
            return null;
          }
        })()
      : null;

  const hasClosingTime = !!(todaySchedule?.closingTime && timezone && closingRemaining);
  const hasStats = (operatingAttractions != null && totalAttractions != null) || hasClosingTime;

  return isOpen ? (
    /* Open footer — stats strip only */
    hasStats ? (
      <div
        className="relative flex items-center gap-[10px] overflow-hidden text-[11.5px] font-medium"
        style={{
          color: 'var(--pk-text-2)',
          whiteSpace: 'nowrap',
        }}
      >
        {operatingAttractions != null && totalAttractions != null && (
          <span className="flex items-center gap-1">
            <Activity
              className="h-[11px] w-[11px] shrink-0"
              style={{ color: 'var(--pk-text-3)' }}
              aria-hidden="true"
            />
            <b className="font-bold" style={{ color: 'var(--pk-text-1)' }}>
              {operatingAttractions}
            </b>
            /{totalAttractions} {tCommon('operating')}
          </span>
        )}

        {operatingAttractions != null && hasClosingTime && (
          <span style={{ color: 'var(--pk-text-3)' }} aria-hidden="true">
            ·
          </span>
        )}

        {hasClosingTime && todaySchedule?.closingTime && timezone && (
          <span className="flex items-center gap-1">
            <Clock
              className="h-[11px] w-[11px] shrink-0"
              style={{ color: 'var(--pk-text-3)' }}
              aria-hidden="true"
            />
            {tCard('until')}{' '}
            <b className="font-bold" style={{ color: 'var(--pk-text-1)' }}>
              <ParkTime
                isoTime={todaySchedule.closingTime}
                parkTimezone={timezone}
                locale={locale}
                showSuffix
              />
            </b>
            <span style={{ color: 'var(--pk-text-3)' }} suppressHydrationWarning>
              ({tCard('closingIn')} {closingRemaining})
            </span>
          </span>
        )}
      </div>
    ) : null
  ) : (
    /* Closed footer */
    <div
      className="relative flex items-center gap-[6px] text-[12px]"
      style={{ color: 'var(--pk-text-2)' }}
    >
      <Calendar
        className="h-[13px] w-[13px] shrink-0"
        style={{ color: 'var(--pk-text-3)' }}
        aria-hidden="true"
      />
      <span>
        {scheduleInfo?.icon === 'opening' ? `${tNearby('opens')}: ` : ''}
        {scheduleInfo?.icon === 'offseason' ? (
          <>
            <GlossaryTermLink termId="offseason" tooltipOnly>
              {tNearby('offseason')}
            </GlossaryTermLink>
            {scheduleInfo.offseasonDetails}
          </>
        ) : scheduleInfo?.icon === 'opening' && scheduleInfo.openingTimeISO && timezone ? (
          <>
            {scheduleInfo.dayPrefix}
            <strong className="font-bold" style={{ color: 'var(--pk-text-1)' }}>
              <ParkTime
                isoTime={scheduleInfo.openingTimeISO}
                parkTimezone={timezone}
                locale={locale}
                showSuffix
              />
            </strong>
            {scheduleInfo.remainingText && (
              <span style={{ color: 'var(--pk-text-3)' }} suppressHydrationWarning>
                {' '}
                ({scheduleInfo.remainingText})
              </span>
            )}
          </>
        ) : (
          (scheduleInfo?.message ?? tCommon('closed'))
        )}
      </span>
    </div>
  );
}
