'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useRideDayCurve } from '@/lib/hooks/use-ride-day-curve';
import type { RideDayCurve as RideDayCurveData } from '@/lib/api/types';
import { RideDayCurve, type DayCurveWindow } from '@/components/parks/ride-day-curve';
import { CountryFlag } from '@/components/common/icons/flags';
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
  /** Park name, for the switcher. */
  name: string;
  /** ISO country code — the flag in front of the name. */
  countryCode: string;
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
  /**
   * Called once the last candidate has missed and this card has nothing left to
   * draw. The caller owns the surrounding layout and is the only one that can
   * take the column back — this component can do no better than render nothing
   * into it.
   */
  onExhausted?: () => void;
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
  index,
  park,
  onResolved,
  fallback,
  children,
}: {
  index: number;
  park: DayCurveCandidate;
  /**
   * `open`  — answered AND reported wait times today. What the walk is after.
   * `quiet` — answered, but nothing measured today: the park is shut, out of
   *           season, or it is the middle of its night. Kept as a fallback,
   *           because a curve with no today line still shows the shape.
   * `miss`  — no readable curve at all.
   */
  onResolved: (index: number, state: 'open' | 'quiet' | 'miss') => void;
  /** Held while this candidate is in flight, so the walk costs no layout shift. */
  fallback: React.ReactNode;
  children: (data: RideDayCurveData) => React.ReactNode;
}) {
  const { data, isPending } = useRideDayCurve(park);

  useEffect(() => {
    if (isPending) return;
    onResolved(index, !data ? 'miss' : data.measuredToday ? 'open' : 'quiet');
  }, [isPending, data, onResolved, index]);

  if (isPending) return <>{fallback}</>;
  // A miss keeps the fallback up rather than blinking to nothing: the parent is
  // about to mount the next candidate into the same box.
  if (!data) return <>{fallback}</>;
  return <>{children(data)}</>;
}

/**
 * Nothing left to try.
 *
 * Its own component so the notice reaches the parent from an effect rather than
 * from a render — a `setState` in the parent during this component's render is
 * the "cannot update a component while rendering a different component" warning,
 * and the parent's answer is to unmount this one.
 */
function Exhausted({ onExhausted }: { onExhausted?: () => void }) {
  useEffect(() => {
    onExhausted?.();
  }, [onExhausted]);
  return null;
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
export function RideDayCurveCard({ candidates, onExhausted, className }: RideDayCurveCardProps) {
  const t = useTranslations('homeStory.bestTime');
  const tOverview = useTranslations('parks.overview');

  /**
   * Where the automatic walk stands.
   *
   * `at` is the candidate being tried, `quiet` the first one that answered
   * without having measured anything today (kept as the fallback), and `done`
   * closes the walk so a settled choice cannot be walked past by a late effect.
   * `at: -1` with `done` means every candidate missed.
   */
  const [walk, setWalk] = useState<{ at: number; quiet: number | null; done: boolean }>({
    at: 0,
    quiet: null,
    done: false,
  });
  /** The reader's own pick, which outranks the walk from the moment it exists. */
  const [pinned, setPinned] = useState<number | null>(null);

  const onResolved = useCallback(
    (i: number, state: 'open' | 'quiet' | 'miss') => {
      setWalk((prev) => {
        // A settled walk ignores everything: the effect re-runs on every render
        // of the mounted candidate, and without this the cursor would crawl on.
        if (prev.done || i !== prev.at) return prev;
        // A park that is open right now is what this exhibit is for. Stop here.
        if (state === 'open') return { ...prev, done: true };
        const quiet = prev.quiet ?? (state === 'quiet' ? i : null);
        const next = i + 1;
        if (next < candidates.length) return { at: next, quiet, done: false };
        // List exhausted. A park that answered but is shut beats nothing at all:
        // the historical curve is still the chapter's claim, it just has no line
        // for today.
        return { at: quiet ?? -1, quiet, done: true };
      });
    },
    [candidates.length]
  );

  const active = pinned ?? walk.at;
  const park = candidates[active];

  // Every candidate missed: nothing to draw, and that IS an answer — a whole
  // locale's featured list can be out of season at the same time.
  if (!park) return <Exhausted onExhausted={onExhausted} />;

  const picker =
    candidates.length > 1 ? (
      // A row of parks rather than of rides: the endpoint picks the ride, and
      // picking it here would mean naming a headliner per park in this repo and
      // keeping that list true.
      <div className="mt-3 flex flex-wrap gap-1.5">
        {candidates.map((c, i) => (
          <button
            key={c.parkSlug}
            type="button"
            onClick={() => setPinned(i)}
            aria-pressed={i === active}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              i === active
                ? 'border-primary/50 bg-primary/10 text-foreground'
                : 'border-border bg-card/55 text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            {/* Decorative: the park name beside it already says where this is,
                and a screen reader reading "Flagge Deutschland Europa-Park"
                gains nothing. */}
            <CountryFlag code={c.countryCode} />
            {c.name}
          </button>
        ))}
      </div>
    ) : null;

  return (
    // The picker sits OUTSIDE the candidate, so it is in the DOM at the same
    // height whether the chart is still loading or already drawn — switching
    // parks then swaps the chart above a row that never moves.
    <div>
      <Candidate
        // Re-keyed per park so the previous candidate's state does not leak into
        // the next one's mount.
        key={park.parkSlug}
        index={active}
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
            predicted={data.predicted ?? null}
            timezone={data.timezone}
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
              predicted: t('legendPredicted'),
              axisLabel: t('axisLabel'),
              nowMarker: t('nowMarker'),
              vsMedian: t('vsMedian'),
              localTime: t('localTime'),
              stateLive: t('stateLive'),
              stateQuiet: t('stateQuiet'),
              stateClosed: t('stateClosed'),
              minutes: tOverview('minutesUnit'),
            }}
          />
        )}
      </Candidate>
      {picker}
    </div>
  );
}
