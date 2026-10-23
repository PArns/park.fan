import { getTranslations } from 'next-intl/server';
import { CalendarRange } from 'lucide-react';

import { ChapterHeading } from '@/components/common/chapter-heading';
import { TILE_GLASS } from '@/components/common/glass-card';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { DaySignalKey } from '@/components/parks/day-signal-key';
import { OutlookMonthStrip } from '@/components/parks/outlook-month-strip';
import { Link } from '@/i18n/navigation';
import { getParkYearlyPredictions } from '@/lib/api/parks';
import { withSeedTimeout } from '@/lib/api/seed-timeout';
import {
  isParkCalendarMonthInRange,
  parkCalendarMonthHref,
  type ParkCalendarMonth,
} from '@/lib/parks/calendar-segments';
import { DAY_SIGNAL_CLASS } from '@/lib/utils/day-signal-styles';
import { translateHolidayName } from '@/lib/utils/holiday-names';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import {
  buildYearlyOutlook,
  outlookBadgeLevel,
  type OutlookHoliday,
  type OutlookMonth,
} from '@/lib/utils/yearly-outlook';
import { OUTLOOK_CLOSED_STYLE, OUTLOOK_PENDING_FILL } from '@/lib/utils/yearly-outlook-styles';

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
 * entries, because the endpoint sends a `recommendation` even for days it could not rate. No crowd
 * legend, since each row names its tier through `CrowdLevelBadge`; the legend under the rows is for
 * the marks the badge cannot explain, the hatch and the holiday track.
 */

/** Where the park's wait-time calendar lives, so a month and a day can link into it. */
interface OutlookCalendar {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** `scheduleCoverage.to` from the park payload; months past it are not linked. */
  coverageTo?: string | null;
}

interface ParkYearlyOutlookSectionProps extends OutlookCalendar {
  /** Today in the PARK's timezone, `YYYY-MM-DD` — the frame starts at this month. */
  todayIso: string;
  locale: string;
  className?: string;
}

/**
 * How long this chapter may wait for the forecast, the same as the best-days seed: a cold cache
 * falls through to a model rebuild that can take seconds. On timeout the section keeps its frame
 * and says nothing, while `after()` warms the data cache for the next reader.
 */
const FORECAST_TIMEOUT_MS = 3000;

/** The list's own box — the band above it squares off its bottom edge, so it drops its top one. */
const OUTLOOK_BOX_CLASS = cn(TILE_GLASS, 'border-border/50 rounded-b-xl border');

function outlookMonthLabel(locale: string, year: number, month: number): string {
  // Noon UTC and `timeZone: 'UTC'`: the label names a month, and a date built at local midnight
  // can fall into the previous one for any reader west of Greenwich.
  return getDateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 12))
  );
}

/** A day's holiday names in the reader's language; the API sends them in English. */
function localizeHoliday(holiday: OutlookHoliday | null, locale: string): OutlookHoliday | null {
  if (!holiday || (!holiday.holidayName && !holiday.schoolVacationName)) return holiday;
  return {
    ...holiday,
    ...(holiday.holidayName && { holidayName: translateHolidayName(holiday.holidayName, locale) }),
    ...(holiday.schoolVacationName && {
      schoolVacationName: translateHolidayName(holiday.schoolVacationName, locale),
    }),
  };
}

function OutlookMonthRow({
  month,
  locale,
  recommendedLabel,
  calendarHref,
  muted = false,
}: {
  month: OutlookMonth;
  locale: string;
  /** Pre-formatted „12/31 recommended", or `null` for a month with no rated day. */
  recommendedLabel: string | null;
  /** The month in the wait-time calendar, or `null` where the calendar does not serve it. */
  calendarHref: string | null;
  muted?: boolean;
}) {
  const label = outlookMonthLabel(locale, month.year, month.month);

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      {calendarHref ? (
        <Link
          href={calendarHref}
          className="truncate text-sm font-medium underline-offset-4 hover:underline sm:w-36 sm:shrink-0"
        >
          {label}
        </Link>
      ) : (
        <span className="truncate text-sm font-medium sm:w-36 sm:shrink-0">{label}</span>
      )}

      <OutlookMonthStrip
        monthKey={month.key}
        days={month.days}
        holidays={month.holidays.map((holiday) => localizeHoliday(holiday, locale))}
        firstWeekday={month.firstWeekday}
        pastDays={month.pastDays}
        calendarHref={calendarHref}
        interactive={!muted}
      />

      {/* Two fixed slots rather than one right-aligned pair: the badge's width follows its word,
        so „Sehr niedrig" and „Hoch" put the count beside them at two different x positions and
        twelve rows of that read as a ragged edge. */}
      <span className="flex items-center gap-2 sm:shrink-0">
        {/* `unknown` is the palette's own „no forecast" badge — a park with too little history
          gets it from this same component on the calendar, and a month past the horizon means
          the same thing. A month the park is shut for says `closed` instead. */}
        {/* While the forecast is in flight both slots are blank bars of the same height: text,
          even `invisible`, is in the HTML a crawler reads, and „Keine Prognose" twelve times over
          is a claim about the park. */}
        <span className="flex sm:w-36">
          {muted ? (
            <span className={cn('h-[22px] w-24 rounded-full', OUTLOOK_PENDING_FILL)} />
          ) : (
            <CrowdLevelBadge
              level={outlookBadgeLevel(month)}
              className="transition-opacity duration-300 starting:opacity-0"
            />
          )}
        </span>
        <span className="text-muted-foreground flex text-xs whitespace-nowrap sm:w-28 sm:justify-end">
          {muted ? (
            <span className={cn('my-0.5 h-3 w-14 rounded-sm', OUTLOOK_PENDING_FILL)} />
          ) : (
            <span className="transition-opacity duration-300 starting:opacity-0">
              {recommendedLabel ?? '—'}
            </span>
          )}
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
 * `muted` draws blank bars in place of badge and count, since „Keine Prognose" would claim something
 * the page does not know yet, and leaves off `headingId`, since the two states overlap for an instant.
 * Without `calendar` nothing links; the placeholder passes none.
 */
export async function YearlyOutlookFrame({
  months,
  locale,
  muted = false,
  calendar,
  className,
}: {
  months: OutlookMonth[];
  locale: string;
  muted?: boolean;
  calendar?: OutlookCalendar;
  className?: string;
}) {
  const t = await getTranslations('parks.yearlyOutlook');
  const tLegend = await getTranslations('attractions.historyLegend');

  // The calendar's window is counted from the park's month, which is the first row's.
  const now: ParkCalendarMonth | null = months[0]
    ? { year: months[0].year, month: months[0].month }
    : null;
  const calendarHref = (month: OutlookMonth): string | null =>
    calendar && now && isParkCalendarMonthInRange(month, now, calendar.coverageTo)
      ? parkCalendarMonthHref(
          locale,
          calendar.continent,
          calendar.country,
          calendar.city,
          calendar.parkSlug,
          month,
          now
        )
      : null;

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

      <div className={OUTLOOK_BOX_CLASS}>
        <ul className="divide-border/50 divide-y">
          {months.map((month) => (
            <OutlookMonthRow
              key={month.key}
              month={month}
              locale={locale}
              muted={muted}
              calendarHref={calendarHref(month)}
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

        {/* All four keys in both states and on every park, so the placeholder reserves the same
          line and the keys never claim a holiday the forecast below does not show. */}
        <div className="border-border/50 text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 border-t px-4 py-2.5">
          {/* A day's slot in small, since the hatch needs the height a 3 px bar does not have. */}
          <DaySignalKey
            className={cn(OUTLOOK_PENDING_FILL, 'h-3 w-3 rounded-[2px]')}
            style={OUTLOOK_CLOSED_STYLE}
            label={tLegend('closed')}
          />
          <DaySignalKey className={DAY_SIGNAL_CLASS.school} label={tLegend('schoolVacation')} />
          <DaySignalKey className={DAY_SIGNAL_CLASS.holiday} label={tLegend('holiday')} />
          <DaySignalKey className={DAY_SIGNAL_CLASS.bridge} label={tLegend('bridgeDay')} />
        </div>
      </div>
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
  coverageTo,
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

  const months = buildYearlyOutlook(forecast.predictions, todayIso, forecast.holidays);

  // No month has a single day the backend could rate: no forecast at all, or one made entirely of
  // `unknown` (too little history). Twelve rows of „Keine Prognose" is not a chapter.
  if (months.every((month) => month.ratedDays === 0)) return null;

  return (
    <YearlyOutlookFrame
      months={months}
      locale={locale}
      calendar={{ continent, country, city, parkSlug, coverageTo }}
      className={className}
    />
  );
}
