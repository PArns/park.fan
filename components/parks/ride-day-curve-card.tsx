'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useParkHourlyProfile } from '@/lib/hooks/use-park-hourly-profile';
import { RideDayCurve, type DayCurveWindow } from '@/components/parks/ride-day-curve';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { quietWindows } from '@/lib/utils/ride-day-curve-geometry';
import type { HourlyProfileAttraction } from '@/lib/api/types';

/**
 * The chart's quiet windows, labelled.
 *
 * The geometry — which hours count as quiet, where the two runs start and end,
 * what each run averages — lives in `lib/utils/ride-day-curve-geometry.ts` and
 * is covered by `pnpm test:ride-day-curve`. What is left here is the part that
 * is i18n rather than maths.
 *
 * The first version got the labelling wrong twice over. It called the evening
 * window "Letzte Runde", which is not what a three-hour stretch from 15:00 is,
 * and it printed "ca. 30 Min." — which reads as a DURATION ("for about thirty
 * minutes") next to a time range, when the number is the wait you can expect.
 * The range and the wait are separate fields now, and the wait says what it is.
 */
function labelledWindows(
  hours: number[],
  p50: Array<number | null>,
  labels: {
    opening: string;
    closing: string;
    waitFormat: (minutes: number) => string;
  }
): DayCurveWindow[] {
  return quietWindows(hours, p50).map((w) => ({
    label: w.which === 'opening' ? labels.opening : labels.closing,
    range: `${fmt(w.fromHour)}\u2013${fmt(w.toHour)}`,
    // Parks post wait times in fives and every surface here renders them that
    // way; an average over the median curve is exactly the arithmetic that
    // breaks it, so it is rounded back on the way out.
    wait: labels.waitFormat(roundWaitTo5(w.averageWait)),
    fromHour: w.fromHour,
    toHour: w.toHour,
    which: w.which,
  }));
}

function fmt(hour: number): string {
  return `${String(Math.floor(hour)).padStart(2, '0')}:${hour % 1 ? '30' : '00'}`;
}

export interface RideDayCurveCardProps {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /**
   * Ride to draw. Omitted → the park's busiest ride, which is what the profile
   * already ranks first.
   */
  rideSlug?: string;
  /** Today's measured series, when the caller already holds an attraction payload. */
  today?: Array<{ hour: number; waitTime: number }> | null;
  className?: string;
}

/**
 * The day-curve chart, fed from the park's hourly profile.
 *
 * Reads `/stats/hourly` through the shared `useParkHourlyProfile` — a ~2 KB
 * projection behind the same `useLoadLast` gate every historical aggregate on
 * this site sits behind, so it never races the live status queries. It renders
 * for one ride out of a table the app already fetches elsewhere, so a page
 * showing both pays for one request.
 *
 * Reserves its own height while loading: the chart is 200/260 px plus its
 * caption and window row, and a section that appears out of nothing after the
 * idle window is the CLS this codebase measures with `pnpm measure:cls --late`.
 */
export function RideDayCurveCard({
  continent,
  country,
  city,
  parkSlug,
  rideSlug,
  today,
  className,
}: RideDayCurveCardProps) {
  const t = useTranslations('homeStory.bestTime');
  const tOverview = useTranslations('parks.overview');

  const { data, isPending } = useParkHourlyProfile({
    continent,
    country,
    city,
    parkSlug,
    topN: 6,
  });

  if (isPending) {
    // A `<figure>`, not a `<div>`: a first-paint/settled diff pairs children by
    // tag once their classes differ, so a div standing in for the figure reports
    // the whole card as an insertion rather than a swap. Same padding, same
    // aspect box, same window row — the outcome most rides actually get.
    return (
      <figure
        className={cn('border-border bg-card/55 m-0 rounded-2xl border p-4 sm:p-5', className)}
      >
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-2 h-3 w-40" />
        <Skeleton className="mt-4 aspect-[720/200] w-full" />
        <Skeleton className="mt-1 h-4 w-full" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-[62px]" />
          <Skeleton className="h-[62px]" />
        </div>
      </figure>
    );
  }

  if (!data?.meta.displayable) return null;

  const ride: HourlyProfileAttraction | undefined = rideSlug
    ? data.attractions.find((a) => a.attractionSlug === rideSlug)
    : data.attractions[0];
  if (!ride) return null;

  const windows = labelledWindows(data.hours, ride.p50, {
    opening: t('windowOpening'),
    closing: t('windowClosing'),
    waitFormat: (minutes) => t('windowWait', { minutes }),
  });

  return (
    <RideDayCurve
      className={className}
      title={ride.attractionName}
      subtitle={t('chartSubtitle', { days: ride.sampleDays })}
      hours={data.hours}
      p25={ride.p25 ?? null}
      p50={ride.p50}
      p90={ride.p90}
      today={today}
      windows={windows}
      labels={{
        today: t('legendToday'),
        median: t('legendMedian'),
        band: t('legendBand'),
        bandUpperOnly: t('legendBandUpper'),
        peakAt: t('peakAt'),
        minutes: tOverview('minutesUnit'),
      }}
    />
  );
}
