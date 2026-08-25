'use client';

import { roundWaitTo5 } from '@/lib/utils/wait-time';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { GlassCard } from '@/components/common/glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CROWD_TEXT_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { useParkHourlyProfile } from '@/lib/hooks/use-park-hourly-profile';

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
}

/**
 * Hour columns a skeleton reserves. The row count is `topN` itself — the guide page and the
 * `hourly-profile-widget` fence both ask for six, and a fixed eight collapsed ~44 px under
 * everything below the card when the data landed. `measure:cls --late` cannot see that one: it is
 * a client-query swap, not a streamed-tail resolve.
 */
const SKELETON_HOURS = 10;

/**
 * The park's day shape as a matrix: one row per ride, one column per hour it is open.
 *
 * This replaced a hand-typed 8 × 10 markdown table in the Europa-Park post — eighty numbers, in
 * six languages, that nothing could bring forward. It is the one table on the site where the
 * ANSWER is a position rather than a value: readers come to it asking when to walk to Voletarium,
 * not how long its queue is, which is why each row's own peak is marked and why the rows are
 * ranked by their busiest hour rather than by their daily average.
 *
 * Colour is the app-wide wait-time scale (`waitTimeCrowdTier`), so 30 minutes is the same colour
 * here as on a ride card. A per-row relative scale would read better in isolation and would make
 * a quiet ride's afternoon look like a headliner's — the two claims must not share a colour.
 *
 * Both axes come from the payload. A park that opens at 11 starts at 11; nothing here assumes a
 * nine-to-six day.
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
}: ParkHourlyProfileCardProps) {
  const { data, isPending } = useParkHourlyProfile({ continent, country, city, parkSlug, topN });

  // Hour headers through Intl rather than a translated list: "9 Uhr" / "9 a.m." / "ore 9" are the
  // runtime's job, and the weekday names on the comparison table are already sourced this way.
  const hourFormat = new Intl.DateTimeFormat(locale, { hour: 'numeric' });
  const hourLabel = (h: number) => hourFormat.format(new Date(Date.UTC(2023, 0, 1, h)));

  if (isPending) {
    return (
      <GlassCard variant="medium" className="space-y-2 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="text-primary h-4 w-4" aria-hidden="true" />
          {labels.title}
        </h3>
        <div className="space-y-1.5">
          {Array.from({ length: topN }).map((_, r) => (
            <div key={r} className="flex items-center gap-2">
              <Skeleton className="h-4 w-28 shrink-0" />
              <div className="flex flex-1 gap-1">
                {Array.from({ length: SKELETON_HOURS }).map((_, c) => (
                  <Skeleton key={c} className="h-4 flex-1" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  // Nothing to draw: too few measured days, or the park's hours are so ragged that no single hour
  // was measured often enough to be a column. Rendering an empty grid would claim the park has no
  // queues rather than that we cannot describe its day.
  if (!data || !data.meta.displayable || data.hours.length === 0) return null;

  return (
    <GlassCard variant="medium" className="space-y-2 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Clock className="text-primary h-4 w-4" aria-hidden="true" />
        {labels.title}
      </h3>
      {/* A ten-hour matrix does not fit a phone at a readable size, and shrinking the type is
          worse than scrolling it. The ride column stays put so a scrolled row keeps its subject. */}
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-border/40 border-b">
              <th
                scope="col"
                className="text-muted-foreground/70 bg-card sticky left-0 z-10 py-1.5 pr-3 text-left text-xs font-medium"
              >
                {labels.ride}
              </th>
              {data.hours.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="text-muted-foreground/70 px-1.5 py-1.5 text-right text-xs font-medium whitespace-nowrap"
                >
                  <span className="sr-only">{labels.hour} </span>
                  {hourLabel(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.attractions.map((ride) => (
              <tr key={ride.attractionSlug} className="hover:bg-primary/5 transition-colors">
                <th
                  scope="row"
                  className="bg-card sticky left-0 z-10 max-w-[10rem] py-1.5 pr-3 text-left font-medium"
                >
                  <Link
                    href={`${basePath}/attractions/${ride.attractionSlug}`}
                    prefetch={false}
                    className="hover:text-primary block truncate transition-colors"
                  >
                    {ride.attractionName}
                  </Link>
                </th>
                {data.hours.map((h, i) => {
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
                        // Not "no queue" but "not watched" — a zero here would be a claim about
                        // the ride rather than about the measurements.
                        //
                        // Tier off the RAW value: the boundaries sit at 5/15/30/40/60, so a p50 of
                        // 41.5 rounded to 40 first would drop from "very high" to "high" and the
                        // colour would follow the display rounding instead of the measurement.
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
          new Intl.NumberFormat(locale).format(data.meta.totalSampleDays)
        )}
      </p>
    </GlassCard>
  );
}
