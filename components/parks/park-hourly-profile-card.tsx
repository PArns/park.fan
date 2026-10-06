'use client';

import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { Link } from '@/i18n/navigation';
import { Clock } from 'lucide-react';
import { GlassCard } from '@/components/common/glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getDateTimeFormat, getNumberFormat } from '@/lib/utils/intl-format';
import { CROWD_TEXT_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { useParkHourlyProfile } from '@/lib/hooks/use-park-hourly-profile';
import { hasReadableHourlyProfile } from '@/lib/parks/park-stats-derive';
import type { ParkHourlyProfile } from '@/lib/api/types';

/** The card's translated strings, passed in by the caller. */
export interface HourlyProfileLabels {
  title: string;
  /** Header over the ride column. */
  ride: string;
  /** Screen-reader unit for the hour headers, e.g. "Uhrzeit". */
  hour: string;
  /** Localized minutes unit, for the caption and the cell titles. */
  minutes: string;
  /** "Die stärkste Stunde jeder Bahn ist hervorgehoben." */
  peakNote: string;
  /** Caption with a `{days}` placeholder, e.g. "Aus {days} Messtagen." */
  footnote: string;
}

interface ParkHourlyProfileCardProps {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** `/parks/<continent>/<country>/<city>/<parkSlug>`, the prefix a ride href is built on. */
  basePath: string;
  labels: HourlyProfileLabels;
  locale: string;
  /** Rides to show. Clamped to 1–12 at the route handler; 8 fills a table without scrolling far. */
  topN?: number;
  /**
   * Server-fetched profile (`getParkHourlyProfileSeed`), fetched with the SAME `topN`. Present →
   * the table is drawn in the first HTML instead of the skeleton grid. Only the statically
   * prerendered blog widget passes one; the guide page keeps its client fetch.
   */
  initialProfile?: ParkHourlyProfile | null;
}

/**
 * Hour columns a skeleton reserves. The row count is `topN` itself, since a fixed count left the
 * card short under everything below it. `measure:cls --late` cannot see this one: it is a
 * client-query swap, not a streamed-tail resolve.
 */
const SKELETON_HOURS = 10;

/**
 * The park's day shape as a matrix: one row per ride, one column per open hour. Readers ask when to
 * walk to a ride, not how long its queue is, so each row's peak is marked and the rows are ranked
 * by their busiest hour.
 *
 * Colour is the app-wide wait-time scale (`waitTimeCrowdTier`), so 30 minutes looks the same here
 * as on a ride card; a per-row scale would give a quiet ride's afternoon a headliner's colour. Both
 * axes come from the payload, so nothing assumes a nine-to-six day.
 */
export function ParkHourlyProfileCard({
  continent,
  country,
  city,
  parkSlug,
  basePath,
  labels,
  locale,
  topN = 8,
  initialProfile,
}: ParkHourlyProfileCardProps) {
  const { data, isPending, isSuccess } = useParkHourlyProfile({
    continent,
    country,
    city,
    parkSlug,
    topN,
  });

  // `isSuccess`, not `data ?? seed`: a 404 here is the settled answer "no readable profile", and a
  // nullish fallback would put the seed back on top of it.
  const profile = isSuccess ? data : (initialProfile ?? null);

  // Hour headers through Intl rather than a translated list: "9 Uhr" / "9 a.m." / "ore 9" are the
  // runtime's job, and the weekday names on the comparison table are already sourced this way.
  const hourFormat = getDateTimeFormat(locale, { hour: 'numeric', timeZone: 'UTC' });
  const hourLabel = (h: number) => hourFormat.format(new Date(Date.UTC(2023, 0, 1, h)));

  if (isPending && !initialProfile) {
    return (
      <GlassCard variant="medium" className="space-y-2 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="text-primary h-4 w-4" aria-hidden="true" />
          {labels.title}
        </h3>
        {/* The table's own rows: a 28 px header over its 1 px rule, then 32 px per ride (`py-1.5`
            around a `text-sm` line), so the card does not grow when the query lands. */}
        <div>
          <div className="border-border/40 flex h-[29px] items-center gap-2 border-b">
            <Skeleton className="h-3 w-16 shrink-0" />
            <div className="flex flex-1 gap-1">
              {Array.from({ length: SKELETON_HOURS }).map((_, c) => (
                <Skeleton key={c} className="h-3 flex-1" />
              ))}
            </div>
          </div>
          {Array.from({ length: topN }).map((_, r) => (
            <div key={r} className="flex h-8 items-center gap-2">
              <Skeleton className="h-4 w-28 shrink-0" />
              <div className="flex flex-1 gap-1">
                {Array.from({ length: SKELETON_HOURS }).map((_, c) => (
                  <Skeleton key={c} className="h-4 flex-1" />
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* The note under the table, held at the lines it wraps to. The day count is the one
            figure in it only the query knows; three digits stand in for it. */}
        <p className="text-muted-foreground/70 invisible text-xs" aria-hidden="true">
          {labels.peakNote} {labels.footnote.replace('{days}', '000')}
        </p>
      </GlassCard>
    );
  }

  // Nothing to draw: too few measured days, or hours too ragged for any hour to be a column. An
  // empty grid would claim the park has no queues. The predicate is shared, because the wait-time
  // record's heading and method paragraph must draw exactly when this table does.
  if (!hasReadableHourlyProfile(profile)) return null;

  return (
    <GlassCard variant="medium" className="space-y-2 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Clock className="text-primary h-4 w-4" aria-hidden="true" />
        {labels.title}
      </h3>
      {/* A ten-hour matrix does not fit a phone at a readable size, so it scrolls, with the ride
          column fixed. `relative` keeps the scrolling inside this box: the hour headers' `sr-only`
          labels are `position: absolute`, and without a positioned ancestor here they widened the
          whole document. */}
      <div className="relative -mx-1 overflow-x-auto px-1">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-border/40 border-b">
              <th
                scope="col"
                className="text-muted-foreground/70 bg-card sticky left-0 z-10 py-1.5 pr-3 text-left text-xs font-medium"
              >
                {labels.ride}
              </th>
              {profile.hours.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="text-muted-foreground/70 px-1.5 py-1.5 text-right text-xs font-medium whitespace-nowrap"
                  /*
                   * Node's and Chromium's ICU disagree here: `hour: 'numeric'` for `it` pads to two
                   * digits in the browser („08") and not in Node („8"), so the server's answer is
                   * kept rather than hydrated over.
                   */
                  suppressHydrationWarning
                >
                  <span className="sr-only">{labels.hour} </span>
                  {hourLabel(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profile.attractions.map((ride) => (
              <tr key={ride.attractionSlug} className="hover:bg-primary/5 transition-colors">
                <th
                  scope="row"
                  className="bg-card sticky left-0 z-10 max-w-[10rem] py-1.5 pr-3 text-left font-medium"
                >
                  <Link
                    href={`${basePath}/${ride.attractionSlug}`}
                    prefetch={false}
                    className="hover:text-primary block truncate transition-colors"
                  >
                    {ride.attractionName}
                  </Link>
                </th>
                {profile.hours.map((h, i) => {
                  // Displayed in five-minute steps whatever the payload says:
                  // an older API build hands back interpolated percentiles.
                  const raw = ride.p50[i];
                  const value = raw == null ? null : roundWaitTo5(raw);
                  const isPeak = ride.peakHour === h;
                  return (
                    <td
                      key={h}
                      className={cn(
                        'px-1.5 py-1.5 text-right tabular-nums',
                        // Not "no queue" but "not watched": a zero would be a claim about the ride,
                        // not about the measurements. The tier comes off the raw value, so the
                        // colour follows the measurement and not the display rounding (41.5 is
                        // "very high", 40 is "high").
                        raw == null
                          ? 'text-muted-foreground/30'
                          : CROWD_TEXT_CLASS[waitTimeCrowdTier(raw)],
                        isPeak && 'font-bold'
                      )}
                      title={value == null ? undefined : `${value} ${labels.minutes}`}
                    >
                      {value ?? '–'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-muted-foreground/70 text-xs">
        {labels.peakNote}{' '}
        {labels.footnote.replace(
          '{days}',
          getNumberFormat(locale).format(profile.meta.totalSampleDays)
        )}
      </p>
    </GlassCard>
  );
}
