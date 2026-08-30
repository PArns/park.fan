'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { useParkHourlyProfile } from '@/lib/hooks/use-park-hourly-profile';
import { RideDayCurve, type DayCurveWindow } from '@/components/parks/ride-day-curve';
import type { HourlyProfileAttraction } from '@/lib/api/types';

/**
 * A quiet hour is one whose median sits at or under this share of the ride's own
 * peak hour.
 *
 * Relative to the ride, never an absolute number of minutes: 25 minutes is a
 * quiet hour on a headliner and the busiest hour of the day on a carousel, and
 * one threshold in minutes would mark the whole day quiet on half a park's
 * catalogue and none of it on the other half.
 */
const QUIET_RATIO = 0.55;

/**
 * The two windows the chart highlights: the quiet run the day opens with, and
 * the quiet run it ends with.
 *
 * Derived from the median curve rather than from `ropeDrop`, deliberately. The
 * curve is what a reader is looking at, so a marked window that came from a
 * different computation would sooner or later contradict the line it sits on —
 * a rope-drop badge saying "ride within 45 minutes" over a curve that is still
 * climbing at 11:00. Both windows are simply where this curve is low.
 *
 * Either can be absent, and that is a real answer: a ride that is busy from
 * opening has no morning window, and one that never calms down has neither.
 */
function quietWindows(
  hours: number[],
  p50: Array<number | null>,
  labels: { ropeDrop: string; lastRound: string; approx: string; minutes: string }
): DayCurveWindow[] {
  const known = p50
    .map((v, i) => ({ hour: hours[i], value: v }))
    .filter((e): e is { hour: number; value: number } => e.value != null);
  if (known.length < 3) return [];

  const peak = Math.max(...known.map((e) => e.value));
  if (peak <= 0) return [];
  const quiet = (v: number) => v <= peak * QUIET_RATIO;

  const windows: DayCurveWindow[] = [];

  // Leading run.
  let lead = 0;
  while (lead < known.length && quiet(known[lead].value)) lead++;
  if (lead >= 2) {
    const slice = known.slice(0, lead);
    const avg = Math.round(slice.reduce((s, e) => s + e.value, 0) / slice.length);
    windows.push({
      label: labels.ropeDrop,
      detail: `${fmt(slice[0].hour)}–${fmt(slice[slice.length - 1].hour + 1)} · ${labels.approx} ${avg} ${labels.minutes}`,
      fromHour: slice[0].hour,
      toHour: slice[slice.length - 1].hour + 1,
    });
  }

  // Trailing run — never allowed to overlap the leading one.
  let tail = known.length - 1;
  while (tail >= 0 && quiet(known[tail].value)) tail--;
  const tailStart = tail + 1;
  if (known.length - tailStart >= 2 && tailStart > lead) {
    const slice = known.slice(tailStart);
    const avg = Math.round(slice.reduce((s, e) => s + e.value, 0) / slice.length);
    windows.push({
      label: labels.lastRound,
      detail: `${labels.approx} ${fmt(slice[0].hour)} · ${avg} ${labels.minutes}`,
      fromHour: slice[0].hour,
      toHour: slice[slice.length - 1].hour + 1,
    });
  }

  return windows;
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
    return (
      <div className={className}>
        <div className="border-border bg-card/55 rounded-2xl border p-4 sm:p-5">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-2 h-3 w-40" />
          <Skeleton className="mt-4 h-[200px] w-full sm:h-[260px]" />
          <Skeleton className="mt-1 h-3 w-full" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-[62px]" />
            <Skeleton className="h-[62px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!data?.meta.displayable) return null;

  const ride: HourlyProfileAttraction | undefined = rideSlug
    ? data.attractions.find((a) => a.attractionSlug === rideSlug)
    : data.attractions[0];
  if (!ride) return null;

  const windows = quietWindows(data.hours, ride.p50, {
    ropeDrop: t('ropeDrop'),
    lastRound: t('lastRound'),
    approx: t('approx'),
    minutes: tOverview('minutesUnit'),
  });

  return (
    <div className={className}>
      <RideDayCurve
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
          minutes: tOverview('minutesUnit'),
        }}
      />
    </div>
  );
}
