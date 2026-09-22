import { getTranslations } from 'next-intl/server';
import { CalendarRange } from 'lucide-react';

import { ChapterHeading } from '@/components/common/chapter-heading';
import { TILE_GLASS } from '@/components/common/glass-card';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { getParkYearlyPredictions } from '@/lib/api/parks';
import { withSeedTimeout } from '@/lib/api/seed-timeout';
import { CROWD_DOT_CLASS, isColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import { buildYearlyOutlook, type OutlookMonth } from '@/lib/utils/yearly-outlook';

/**
 * How busy the next twelve months look, month by month.
 *
 * The gap it fills is a hard edge: `/best-days` is capped at a rolling ninety days, so a visitor
 * booking next Easter in October left the park's own numbers behind and got the editorial
 * `/best-time-to-visit` text instead. `/predictions/yearly` is the same forecast the crowd
 * calendar draws, computed day by day and already recomputed nightly, and until now nothing in
 * this app asked for it.
 *
 * **It loads on the SERVER, not behind `useLoadLast`.** The loads-last rule exists so the
 * best-travel-time data can never compete with the live status, wait-time and weather queries for
 * the browser's connections — and a chapter that issues no browser request at all cannot. The
 * forecast is stable for a day (`CACHE_TTL.predictions`), so a client query would spend a second
 * download on bytes the first render already had, and it would put this chapter out of reach of
 * every crawler. What it borrows from the client path instead is the posture: the fetch is
 * timeout-bounded and consumed inside its own `<Suspense>` boundary, so a cold forecast holds up
 * a chunk eight screens down and never first byte.
 *
 * **Twelve rows always.** The endpoint answers with about six months, not twelve (measured
 * 2026-09-22 across fifteen parks: fourteen answered, all of them stopping on today + 182), and
 * Sesame Place San Diego's forecast does not start until March. Drawing only the months that came
 * back would make the chapter a different height on every park and leave the reader guessing
 * whether April is quiet or merely unknown. The frame is constant, the months past the horizon
 * say „no forecast", and the `<Suspense>` placeholder can reserve the height exactly.
 *
 * **A month says something only where the backend could rate it.** `/predictions/yearly` sends a
 * `recommendation` even for days it could not rate at all, so eight of forty sampled parks would
 * have shown „no forecast" and „181/181 recommended" on the same row. Every badge and every count
 * reads `ratedDays`, never the number of entries that came back.
 *
 * **No colour legend.** Each row names its own tier in words through `CrowdLevelBadge`, which is
 * the same badge and the same palette the calendar and the header card use, so the strip beside it
 * needs no second key. `ParkCalendarLegend` would have brought four calendar-only signal keys with
 * it that mean nothing here.
 */

interface ParkYearlyOutlookSectionProps {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** Today in the PARK's timezone, `YYYY-MM-DD` — the frame starts at this month. */
  todayIso: string;
  locale: string;
  className?: string;
}

/** Height of one month's day strip. Read by the placeholder too, which reserves the same box. */
const STRIP_HEIGHT = 'h-5';

/**
 * How long this chapter may wait for the forecast before the page gives up on it.
 *
 * Same posture and the same number as the best-days seed: the response is a Redis read on a warm
 * cache, but a cold one falls through to a CatBoost rebuild that can take seconds, and this
 * chapter sits eight screens down. On timeout the section keeps its frame and says nothing, while
 * `after()` keeps the fetch alive so the next reader finds the data cache warm.
 */
const FORECAST_TIMEOUT_MS = 3000;

/** The list's own box — the band above it squares off its bottom edge, so it drops its top one. */
const OUTLOOK_LIST_CLASS = cn(
  TILE_GLASS,
  'border-border/50 divide-border/50 divide-y rounded-b-xl border'
);

function outlookMonthLabel(locale: string, year: number, month: number): string {
  // Noon UTC and `timeZone: 'UTC'`: the label names a month, and a date built at local midnight
  // can fall into the previous one for any reader west of Greenwich.
  return getDateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 12))
  );
}

/**
 * One month as a ribbon of days, one slot per calendar day.
 *
 * Slots the forecast does not cover stay muted rather than closing up, so a gap in the middle of
 * November reads as a gap. `closed` and `unknown` land in the same muted slot as a missing day:
 * they carry no tier in the palette, and three shades of grey at 10 px wide is a distinction
 * nobody can read.
 */
function MonthStrip({ month }: { month: OutlookMonth }) {
  return (
    <div
      // `w-full shrink-0` below `sm` and `flex-1` only from `sm` up: the row is a COLUMN on a
      // phone, where `flex-1` would put the basis on the height instead of the width and collapse
      // `h-5` to nothing — which is exactly what it did, and the strip was invisible at 360 px
      // while every other part of the row rendered.
      className={cn(
        'flex w-full min-w-0 shrink-0 gap-px overflow-hidden rounded-[3px] sm:flex-1',
        STRIP_HEIGHT
      )}
      aria-hidden="true"
    >
      {month.days.map((level, index) => (
        <span
          key={index}
          className={cn(
            'flex-1',
            level && isColoredCrowdLevel(level) ? CROWD_DOT_CLASS[level] : 'bg-muted/60'
          )}
        />
      ))}
    </div>
  );
}

function OutlookMonthRow({
  month,
  locale,
  recommendedLabel,
  muted = false,
}: {
  month: OutlookMonth;
  locale: string;
  /** Pre-formatted „12/31 recommended", or `null` for a month with no rated day. */
  recommendedLabel: string | null;
  muted?: boolean;
}) {
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <span className="truncate text-sm font-medium sm:w-36 sm:shrink-0">
        {outlookMonthLabel(locale, month.year, month.month)}
      </span>

      <MonthStrip month={month} />

      {/* Two fixed slots rather than one right-aligned pair: the badge's width follows its word,
        so „Sehr niedrig" and „Hoch" put the count beside them at two different x positions and
        twelve rows of that read as a ragged edge. */}
      <span className="flex items-center gap-2 sm:shrink-0">
        {/* `unknown` is the palette's own „no forecast" badge — a park with too little history
          gets it from this same component on the calendar, and a month past the horizon means
          the same thing. */}
        <span className="flex sm:w-36">
          <CrowdLevelBadge
            level={month.dominant ?? 'unknown'}
            className={cn(muted && 'invisible')}
          />
        </span>
        <span
          className={cn(
            'text-muted-foreground text-xs whitespace-nowrap sm:w-28 sm:text-right',
            muted && 'invisible'
          )}
        >
          {recommendedLabel ?? '—'}
        </span>
      </span>
    </li>
  );
}

/**
 * The chapter's box: the heading band and the twelve rows under it.
 *
 * Both states of the boundary go through here — the settled section and the `<Suspense>`
 * placeholder — which is what makes the reservation the real geometry at every breakpoint rather
 * than a number somebody typed (docs/rules/a-streamed-section-owes-the-page-its-height.md).
 *
 * `muted` keeps every box and hides the badge and the count with `invisible`. A row that already
 * read „Keine Prognose" would be making a claim the page cannot make while the fetch is in
 * flight — or, on a timeout, one it never got to check.
 *
 * `headingId` is left off in the muted state on purpose: the two states overlap for the instant
 * React swaps them, and two elements with one id is one id too many.
 */
export async function YearlyOutlookFrame({
  months,
  locale,
  muted = false,
  className,
}: {
  months: OutlookMonth[];
  locale: string;
  muted?: boolean;
  className?: string;
}) {
  const t = await getTranslations('parks.yearlyOutlook');

  return (
    <section
      {...(muted ? { 'aria-hidden': true } : { 'aria-labelledby': 'yearly-outlook-heading' })}
      className={cn('mt-8', className)}
    >
      {/* Header and the rows are one box, the way the best-days chapter is: the band squares off
        its bottom edge and the list underneath drops its top border. */}
      <ChapterHeading
        id={muted ? undefined : 'yearly-outlook-heading'}
        icon={CalendarRange}
        title={t('title')}
        hint={t('hint')}
        frosted
        className="mb-0 rounded-b-none"
      />

      <ul className={OUTLOOK_LIST_CLASS}>
        {months.map((month) => (
          <OutlookMonthRow
            key={month.key}
            month={month}
            locale={locale}
            muted={muted}
            recommendedLabel={
              month.ratedDays > 0
                ? t('recommendedDays', {
                    count: month.recommendedDays,
                    total: month.ratedDays,
                  })
                : null
            }
          />
        ))}
      </ul>
    </section>
  );
}

export async function ParkYearlyOutlookSection({
  continent,
  country,
  city,
  parkSlug,
  todayIso,
  locale,
  className,
}: ParkYearlyOutlookSectionProps) {
  const forecast = await withSeedTimeout(
    getParkYearlyPredictions(continent, country, city, parkSlug),
    FORECAST_TIMEOUT_MS
  );

  // `null` is the timeout or a failed fetch — the case the three seconds exist for. It is NOT
  // „this park has no forecast", and returning nothing here would collapse the twelve rows the
  // placeholder just reserved. So the empty frame stays, claiming nothing, and `after()` warms
  // the data cache for the next reader.
  if (!forecast) {
    return (
      <YearlyOutlookFrame
        months={buildYearlyOutlook([], todayIso)}
        locale={locale}
        muted
        className={className}
      />
    );
  }

  const months = buildYearlyOutlook(forecast.predictions, todayIso);

  // No month carries a single day the backend could RATE — either the park has no forecast at
  // all, or it has one made entirely of `unknown` (Aquatica Orlando and seven more of forty
  // sampled on 2026-09-22: a park with too little history for a typical-day peak). Twelve rows of
  // „Keine Prognose" is not a chapter.
  if (months.every((month) => month.ratedDays === 0)) return null;

  return <YearlyOutlookFrame months={months} locale={locale} className={className} />;
}
