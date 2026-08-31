'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useRideDayCurve } from '@/lib/hooks/use-ride-day-curve';
import type { RideDayCurve as RideDayCurveData } from '@/lib/api/types';
import { RideDayCurve, type DayCurveWindow } from '@/components/parks/ride-day-curve';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { quietWindows } from '@/lib/utils/ride-day-curve-geometry';

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

/** One park to try, in the order the caller wants them tried. */
export interface DayCurveCandidate {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

export interface RideDayCurveCardProps {
  /**
   * Parks to try, in order. The first that answers is drawn.
   *
   * A list rather than one park because a park closes for the winter, has a
   * maintenance day, or is simply too thinly measured to have a readable curve —
   * and the answer to all three is the next park, not an empty card. Each entry
   * costs a request ONLY if every earlier one 404s, which on a normal day means
   * exactly one.
   */
  candidates: DayCurveCandidate[];
  className?: string;
}

/**
 * Try one park; report whether it answered.
 *
 * Its own component so each candidate gets its own hook instance — hooks cannot
 * be called in a loop, and a single hook with a changing park would refetch on
 * every re-render as the index moved.
 */
function Candidate({
  park,
  onResolved,
  fallback,
  children,
}: {
  park: DayCurveCandidate;
  onResolved: (state: 'pending' | 'hit' | 'miss') => void;
  /** Held while this candidate is in flight, so the walk costs no layout shift. */
  fallback: React.ReactNode;
  children: (data: RideDayCurveData) => React.ReactNode;
}) {
  const { data, isPending } = useRideDayCurve(park);

  useEffect(() => {
    if (isPending) return;
    onResolved(data ? 'hit' : 'miss');
  }, [isPending, data, onResolved]);

  if (isPending) return <>{fallback}</>;
  // A miss keeps the fallback up rather than blinking to nothing: the parent is
  // about to mount the next candidate into the same box.
  if (!data) return <>{fallback}</>;
  return <>{children(data)}</>;
}

/**
 * The day-curve chart, fed from `/stats/day`.
 *
 * A ~1 KB projection carrying all three series the chart draws — the historical
 * percentiles, today's measured hours and the forecast for the rest — behind the
 * same `useLoadLast` gate every historical aggregate on this site sits behind,
 * so it never races the live status queries.
 *
 * It is NOT `/stats/hourly`, which the first version read: that route has no
 * forecast, and it cannot carry today either, because the hourly rollup behind
 * it is computed for the completed day and holds no row for today at all.
 *
 * Reserves its own height while loading: the chart is 200/260 px plus its
 * caption and window row, and a section that appears out of nothing after the
 * idle window is the CLS this codebase measures with `pnpm measure:cls --late`.
 */
export function RideDayCurveCard({ candidates, className }: RideDayCurveCardProps) {
  const t = useTranslations('homeStory.bestTime');
  const tOverview = useTranslations('parks.overview');

  /** How far down the candidate list we have had to walk. */
  const [index, setIndex] = useState(0);
  const park = candidates[index];

  const onResolved = useCallback((state: 'pending' | 'hit' | 'miss') => {
    // Only a miss moves the cursor, and only forward. A hit stays put, and a
    // pending state is not an answer. The functional update is what keeps this
    // from advancing twice when the effect re-runs on the same result.
    if (state === 'miss') setIndex((i) => i + 1);
  }, []);

  // Every candidate exhausted: nothing to draw, and that IS an answer — a whole
  // locale's featured list can be out of season at the same time.
  if (!park) return null;

  return (
    <Candidate
      // Re-keyed per park so the previous candidate's state does not leak into
      // the next one's mount.
      key={park.parkSlug}
      park={park}
      onResolved={onResolved}
      fallback={
        // A `<figure>`, not a `<div>`: a first-paint/settled diff pairs children
        // by tag once their classes differ, so a div standing in for the figure
        // reports the whole card as an insertion rather than a swap. Same
        // padding, same aspect box, same window row — the outcome most rides get.
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
      }
    >
      {(data) => (
        <RideDayCurve
          className={className}
          title={data.attractionName}
          subtitle={t('chartSubtitle', { days: data.sampleDays })}
          hours={data.hours}
          p25={data.p25 ?? null}
          p50={data.p50}
          p90={data.p90}
          today={data.today}
          forecast={data.forecast}
          forecastError={data.forecastError}
          windows={labelledWindows(data.hours, data.p50, {
            opening: t('windowOpening'),
            closing: t('windowClosing'),
            waitFormat: (minutes) => t('windowWait', { minutes }),
          })}
          labels={{
            today: t('legendToday'),
            median: t('legendMedian'),
            band: t('legendBand'),
            bandUpperOnly: t('legendBandUpper'),
            forecast: t('legendForecast'),
            forecastBand: t('legendForecastBand', {
              minutes: Math.round(data.forecastError ?? 0),
            }),
            peakAt: t('peakAt'),
            minutes: tOverview('minutesUnit'),
          }}
        />
      )}
    </Candidate>
  );
}
