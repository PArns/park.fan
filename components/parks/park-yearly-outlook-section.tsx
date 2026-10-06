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
import {
  buildYearlyOutlook,
  outlookBadgeLevel,
  type OutlookMonth,
} from '@/lib/utils/yearly-outlook';

/**
 * How busy the next twelve months look, month by month: past the ninety-day cap of `/best-days`,
 * from the same `/predictions/yearly` forecast the crowd calendar draws.
 *
 * Loaded on the server, not behind `useLoadLast`: that rule keeps best-travel-time data from
 * competing with the live queries for the browser's connections, and a chapter that issues no
 * browser request cannot (docs/rules/park-page-loading-priority.md). The forecast is stable for a
 * day, server HTML reaches crawlers, and the fetch is timeout-bounded inside its own `<Suspense>`.
 *
 * Twelve rows always: the endpoint answers with about six months, and a constant frame lets the
 * placeholder reserve the height exactly. Badges and counts read `ratedDays`, never the number of
 * entries, because the endpoint sends a `recommendation` even for days it could not rate. No colour
 * legend: each row names its tier through `CrowdLevelBadge`.
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
 * How long this chapter may wait for the forecast, the same as the best-days seed: a cold cache
 * falls through to a model rebuild that can take seconds. On timeout the section keeps its frame
 * and says nothing, while `after()` warms the data cache for the next reader.
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
      // `w-full shrink-0` below `sm` and `flex-1` only from `sm` up: the row is a column on a
      // phone, where `flex-1` sets the height basis and collapses `h-5` to nothing.
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
          the same thing. A month the park is shut for says `closed` instead. */}
        <span className="flex sm:w-36">
          <CrowdLevelBadge level={outlookBadgeLevel(month)} className={cn(muted && 'invisible')} />
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
 * The chapter's box: the heading band and the twelve rows under it. The settled section and the
 * `<Suspense>` placeholder both render it, so the reservation is the real geometry
 * (docs/rules/a-streamed-section-owes-the-page-its-height.md).
 *
 * `muted` hides badge and count with `invisible`, since „Keine Prognose" would claim something the
 * page does not know yet, and leaves off `headingId`, since the two states overlap for an instant.
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

/**
 * Park page chapter forecasting the next twelve months: a crowd badge, a day strip and the count of
 * recommended days per month, fetched on the server with a 3 s timeout. On a timeout it renders the
 * empty frame; with no rated day at all, nothing.
 */
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

  // `null` is the timeout or a failed fetch, not "no forecast": returning nothing would collapse
  // the twelve rows the placeholder reserved. So the empty frame stays, claiming nothing, and
  // `after()` warms the data cache.
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

  // No month has a single day the backend could rate: no forecast at all, or one made entirely of
  // `unknown` (too little history). Twelve rows of „Keine Prognose" is not a chapter.
  if (months.every((month) => month.ratedDays === 0)) return null;

  return <YearlyOutlookFrame months={months} locale={locale} className={className} />;
}
