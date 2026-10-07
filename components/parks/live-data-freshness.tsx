'use client';

import { memo } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LocalTime } from '@/components/ui/local-time';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { liveDataHint, newestQueueUpdate } from '@/lib/utils/live-data-freshness';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';
import { parkDayOf } from '@/lib/utils/park-day';

interface LiveDataFreshnessProps {
  /** The park as `TabsWithHash` has it. Only read before the first poll answers. */
  park: ParkWithAttractions;
  /** Today in the park's timezone from the server render — see `LiveParkData`. */
  todayIso: string;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

const TIME_ONLY: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
const DAY_AND_TIME: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
};

/**
 * "As of 14:35" above the ride list, and a warning with a retry button when that is no longer
 * current. Below `sm` only the warning shows: on a phone the bare time sat on the hero photo,
 * unreadable, between the filters and the rides, and a reader there needs to hear only when the
 * numbers are off. The price is that a warning pushes the list down by the row on a phone.
 *
 * From `sm` up, one line, one height, in every state: the warning and the button sit on the same
 * `h-7` row the time does, so a failed poll moves nothing below it. It subscribes to the park's
 * live query itself (same key as `LiveParkData`, so no extra fetch) because `TabsWithHash` is
 * memoised so the ride grid does not re-render on every `isFetching` flip; only this row does.
 * Memoised itself for the same reason as `ParkTabsList`: its props hold still while the filters
 * move.
 */
export const LiveDataFreshness = memo(function LiveDataFreshness({
  park,
  todayIso,
  continent,
  country,
  city,
  parkSlug,
}: LiveDataFreshnessProps) {
  const t = useTranslations('parks.liveFreshness');
  const now = useMinuteNow();

  const { dataUpdatedAt, isError, fetchStatus, isFetching, refetch } = useLiveParkData({
    continent,
    country,
    city,
    parkSlug,
  });

  // A park without a wait-time source has no live numbers to date — see
  // docs/rules/parks-we-cannot-read.md. Day-stable, so both sides of hydration agree.
  if (!hasReadableWaitTimes(park)) return null;

  const asOf = dataUpdatedAt > 0 ? dataUpdatedAt : newestQueueUpdate(park.attractions);
  const hint = liveDataHint({
    now,
    dataUpdatedAt,
    failed: isError,
    paused: fetchStatus === 'paused',
  });

  // The date joins the time once the value is from another day in the park: the seed of a page
  // cached overnight, or a park shut for the season whose queues last moved in April.
  const today = now === null ? todayIso : (parkDayOrNull(now, park.timezone) ?? todayIso);
  const format =
    asOf !== null && parkDayOrNull(asOf, park.timezone) !== today ? DAY_AND_TIME : TIME_ONLY;

  return (
    <div
      className={cn(
        'mb-4 flex h-7 min-w-0 items-center gap-2 text-xs max-sm:mb-2',
        hint ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground max-sm:hidden'
      )}
    >
      <p className="shrink-0 whitespace-nowrap tabular-nums" aria-live="polite">
        {t('asOf')}{' '}
        {asOf !== null ? (
          <LocalTime time={new Date(asOf).toISOString()} timeZone={park.timezone} format={format} />
        ) : (
          '—'
        )}
      </p>
      {hint && (
        <>
          <p className="flex min-w-0 items-center gap-1 font-medium" role="status">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{t(hint)}</span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            // Drawn at the row's 28 px so the row keeps its height; the `after:` box widens the
            // tap target to 44 px without taking layout space.
            className="relative ml-auto h-7 shrink-0 px-2 text-xs after:absolute after:inset-x-0 after:-inset-y-2 max-sm:h-7"
          >
            <RotateCw
              className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')}
              aria-hidden="true"
            />
            {t('retry')}
          </Button>
        </>
      )}
    </div>
  );
});

/** {@link parkDayOf}, or `null` for an unusable timezone. */
function parkDayOrNull(ms: number, timeZone: string): string | null {
  try {
    return parkDayOf(ms, timeZone);
  } catch {
    return null;
  }
}
