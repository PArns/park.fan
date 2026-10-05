'use client';

import { useTranslations } from 'next-intl';
import { History } from 'lucide-react';
import type { NotRunToday } from '@/lib/api/types';
import { RideStatusBlock, useWeekdayTime } from './ride-status-block';

/**
 * „Heute noch nicht in Betrieb" — and when the ride last ran.
 *
 * For a ride that reads CLOSED in an open park and has not run at all since the
 * park last closed. The closure line („Steht seit … still") refuses that ride on
 * purpose, because a ride that never opened today might be shut for the cold,
 * for maintenance or until its own later opening time, and the feed does not say
 * which. This line says the part that is true of all of them, in the same block
 * as the outage line so the two read as one family — but in a neutral tone, since
 * it claims no fault.
 *
 * The instant is named by weekday and clock time in the park's zone, like the
 * outage line's start („Sonntag, 18:00 Uhr"), and never as „gestern": which day
 * is yesterday cannot be decided identically on both sides of hydration. See
 * `useWeekdayTime`.
 *
 * Rendered only for a CLOSED ride. The API only sends the field then, but a
 * line saying the ride has not run under a badge saying it is open is the exact
 * contradiction a stale outage line once put on Crazy Bats, so the caller
 * checks the status too.
 */
export function NotRunTodayNote({
  notRunToday,
  timezone,
  variant = 'compact',
  className,
}: {
  notRunToday: NotRunToday | null | undefined;
  /** The park's IANA timezone. The last run is stated in the park's own clock. */
  timezone: string | undefined;
  variant?: 'compact' | 'full';
  className?: string;
}) {
  const t = useTranslations('parks.notRunToday');
  const weekdayTime = useWeekdayTime(timezone);

  if (!notRunToday) return null;
  const when = weekdayTime(notRunToday.lastRunAt);

  return (
    <RideStatusBlock
      icon={History}
      tone="idle"
      title={t('title')}
      detail={when !== null ? t('lastRun', { when }) : null}
      variant={variant}
      className={className}
    />
  );
}
