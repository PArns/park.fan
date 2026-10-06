'use client';

import { Activity, Clock, Calendar } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { ParkTime } from '@/components/common/park-time';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { getScheduleMessage } from '@/lib/utils/schedule-utils';
import { formatDurationShort } from '@/lib/i18n/time';
import type { ScheduleSummary } from '@/lib/api/types';
import { cn } from '@/lib/utils';

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
  /**
   * The one-line form of `ParkCard`'s phone row: an open park shows only its closing time (or the
   * attraction count without one), and a closed park's line ends in an ellipsis instead of
   * wrapping.
   */
  compact?: boolean;
}

/**
 * Schedule and countdown footer of a park card. A Client Component because it reads the current
 * time, which a server render under Cache Components cannot.
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
  compact = false,
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

  // Remaining duration only; <ParkTime> renders the absolute time.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const closingRemaining =
    isOpen && todaySchedule?.closingTime
      ? (() => {
          try {
            const diff = new Date(todaySchedule.closingTime).getTime() - nowMs;
            if (diff <= 0) return null;
            return formatDurationShort(diff, tCommon);
          } catch {
            return null;
          }
        })()
      : null;

  const hasClosingTime = !!(todaySchedule?.closingTime && timezone && closingRemaining);
  const hasStats = (operatingAttractions != null && totalAttractions != null) || hasClosingTime;
  // The compact line shows the closing time OR the attraction count, never both.
  const showCount =
    operatingAttractions != null && totalAttractions != null && !(compact && hasClosingTime);

  return isOpen ? (
    hasStats ? (
      <div
        className={cn(
          'relative flex items-center gap-[10px] overflow-hidden font-medium',
          compact ? 'min-w-0 text-xs' : 'text-[11.5px]'
        )}
        style={{
          color: 'var(--pk-text-2)',
          whiteSpace: 'nowrap',
        }}
      >
        {showCount && (
          <span className="flex items-center gap-1">
            <Activity
              className="h-[11px] w-[11px] shrink-0"
              style={{ color: 'var(--pk-text-3)' }}
              aria-hidden="true"
            />
            {/* One element, so the bold count and "/total" stay one flex item; the parent's `gap-1`
                would render "36 /44". */}
            <span>
              <b className="font-bold" style={{ color: 'var(--pk-text-1)' }}>
                {operatingAttractions}
              </b>
              /{totalAttractions} {tCommon('operating')}
            </span>
          </span>
        )}

        {showCount && hasClosingTime && (
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
            {!compact && (
              <span style={{ color: 'var(--pk-text-3)' }} suppressHydrationWarning>
                ({tCard('closingIn')} {closingRemaining})
              </span>
            )}
          </span>
        )}
      </div>
    ) : null
  ) : (
    <div
      className={cn(
        'relative flex items-center gap-[6px] text-[12px]',
        compact && 'min-w-0 leading-4'
      )}
      style={{ color: 'var(--pk-text-2)' }}
    >
      <Calendar
        className="h-[13px] w-[13px] shrink-0"
        style={{ color: 'var(--pk-text-3)' }}
        aria-hidden="true"
      />
      <span className={cn(compact && 'truncate')}>
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
            {scheduleInfo.remainingText && !compact && (
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
