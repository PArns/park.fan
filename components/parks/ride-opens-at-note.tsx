'use client';

import { useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';
import type { NotRunToday } from '@/lib/api/types';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { isOpeningAhead, type RideOpening } from '@/lib/parks/ride-openings';
import { parkMinuteNow } from '@/lib/planner/park-time';
import { NotRunTodayNote } from './not-run-today-note';
import { useParkOpenings } from './park-openings-context';
import { RideStatusBlock } from './ride-status-block';

function OpensAtBlock({
  opening,
  timezone,
  variant,
  className,
  fallback,
}: {
  opening: RideOpening;
  timezone: string | undefined;
  variant: 'compact' | 'full';
  className?: string;
  fallback: React.ReactNode;
}) {
  const t = useTranslations('parks.rideOpensAt');
  const nowMs = useMinuteNow();
  // Before the clock mounts there is no „now" to compare with, and the line must not appear for a
  // frame that the next one retracts.
  if (nowMs === null || !timezone || !isOpeningAhead(opening, parkMinuteNow(timezone, nowMs))) {
    return fallback;
  }
  return (
    <RideStatusBlock
      icon={Clock}
      tone="idle"
      title={t(opening.firm ? 'firm' : 'approx', { time: opening.time })}
      detail={t('detail')}
      variant={variant}
      className={className}
    />
  );
}

/**
 * „Öffnet ca. 10:00 Uhr" for a CLOSED ride that starts later than its park, and only until that
 * minute has passed. It takes the place of {@link NotRunTodayNote}, which it makes redundant: both
 * say the ride has not run yet, and this one says when it will. Everywhere else, and for a ride
 * the plan says nothing about, it draws `NotRunTodayNote` unchanged, so a ride without `opensAt`
 * never reads „opens with the park".
 *
 * Reads the park page's {@link ParkOpeningsProvider}; outside it the context is `null` and this is
 * `NotRunTodayNote` alone.
 */
export function RideOpensAtNote({
  slug,
  notRunToday,
  timezone,
  variant = 'compact',
  className,
}: {
  slug: string;
  notRunToday: NotRunToday | null | undefined;
  timezone: string | undefined;
  variant?: 'compact' | 'full';
  className?: string;
}) {
  const opening = useParkOpenings()?.rides.get(slug);
  const fallback = (
    <NotRunTodayNote
      notRunToday={notRunToday}
      timezone={timezone}
      variant={variant}
      className={className}
    />
  );
  if (!opening) return fallback;
  return (
    <OpensAtBlock
      opening={opening}
      timezone={timezone}
      variant={variant}
      className={className}
      fallback={fallback}
    />
  );
}
