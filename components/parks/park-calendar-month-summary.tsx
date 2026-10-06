import { getTranslations } from 'next-intl/server';
import { CalendarRange, Clock, GraduationCap, Timer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { getParkArticleForms } from '@/lib/faq/park-faq';
import { getDateTimeFormat, getListFormat } from '@/lib/utils/intl-format';
import type { CalendarMonthSummary, NamedCalendarDay } from '@/lib/parks/calendar-month-summary';
import type { ParkWithAttractions } from '@/lib/api/types';

/** One entry of the scannable fact row. Named so the optional entries below can be filtered
 *  into it — an inline `NonNullable<typeof f>` resolves to `false | {...}` and narrows nothing. */
interface Fact {
  key: string;
  icon: LucideIcon;
  label: string;
  value: string;
}

/**
 * What a month page says about its month, in sentences, in the first byte. The grid below is
 * `ssr: false`, and without this block the month pages differed by little more than the month's
 * name.
 *
 * Cached, not seeded: handing this response to the grid would put the stepper's prev/next links
 * behind this block's `<Suspense>`, so the fetch stands alone and the data cache pays for it
 * (`getCalendarMonthSeed`). Every clause is optional: `summarizeCalendarMonth` returns `null` for a
 * finding it cannot support, so no sentence contradicts the grid.
 */
export async function ParkCalendarMonthSummary({
  summary,
  park,
  locale,
  monthLabel,
}: {
  summary: CalendarMonthSummary;
  park: ParkWithAttractions;
  locale: string;
  /** The month already formatted in the reader's language, e.g. „November 2026". */
  monthLabel: string;
}) {
  const t = await getTranslations('parks.calendarPage.summary');
  // Only the nominative: `parkLoc` carries a German-only preposition, and the park is already named
  // in the first sentence.
  const { parkNom } = getParkArticleForms(park, locale);

  /**
   * „Dienstag, 3. und Mittwoch, 11.", joined the way the reader's language joins a list.
   * `Intl.ListFormat` rather than a translated separator, which cannot get conjunctions and commas
   * right per list length. `timeZone: 'UTC'` because the date is a plain calendar day parsed at UTC
   * midnight; any other zone can print the day before.
   */
  const dayList = (days: NamedCalendarDay[]) => {
    const parts = days.map((d) =>
      getDateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${d.date}T00:00:00Z`))
    );
    return getListFormat(locale, { style: 'long', type: 'conjunction' }).format(parts);
  };

  // Past months are a record, future months a forecast, and the verb has to say which — „am
  // ruhigsten wird es" over August 2025 is a prediction about a month that is over.
  const tense = summary.isPast ? 'Past' : 'Future';

  const sentences: string[] = [
    t(`opening${tense}`, {
      park: parkNom,
      month: monthLabel,
      open: summary.openDays,
      total: summary.totalDays,
    }),
  ];

  if (summary.quietest) {
    sentences.push(
      t(`quietest${tense}`, { days: dayList(summary.quietest), count: summary.quietest.length })
    );
  }
  if (summary.busiest) {
    sentences.push(
      t(`busiest${tense}`, { days: dayList(summary.busiest), count: summary.busiest.length })
    );
  }
  if (summary.hours) {
    sentences.push(t('hours', { from: summary.hours.openingTime, to: summary.hours.closingTime }));
  }
  if (summary.schoolVacationDays > 0) {
    sentences.push(t('schoolVacation', { days: summary.schoolVacationDays }));
  }
  if (summary.avgHeadlinerWait !== null) {
    sentences.push(t(`headliner${tense}`, { minutes: summary.avgHeadlinerWait }));
  }

  const factCandidates: Array<Fact | false | null> = [
    {
      key: 'open',
      icon: CalendarRange,
      label: t('factOpenDays'),
      value: t('factOpenDaysValue', { open: summary.openDays, total: summary.totalDays }),
    },
    summary.hours && {
      key: 'hours',
      icon: Clock,
      label: t('factHours'),
      value: t('factHoursValue', {
        from: summary.hours.openingTime,
        to: summary.hours.closingTime,
      }),
    },
    summary.avgHeadlinerWait !== null && {
      key: 'wait',
      icon: Timer,
      label: t('factWait'),
      value: t('factWaitValue', { minutes: summary.avgHeadlinerWait }),
    },
    summary.schoolVacationDays > 0 && {
      key: 'vacation',
      icon: GraduationCap,
      label: t('factSchoolVacation'),
      value: t('factSchoolVacationValue', { days: summary.schoolVacationDays }),
    },
  ];
  const facts = factCandidates.filter((f): f is Fact => Boolean(f));

  // German formats a day number with its ordinal dot („Freitag, 28."), so a sentence ending in a
  // full stop gave „28..". Collapsing the pair at the join is locale-safe; dropping the dot would
  // be wrong German.
  const prose = sentences.join(' ').replace(/\.\.(?=\s|$)/g, '.');

  return (
    <div className="flex flex-col gap-4">
      {/* The month as a caption, shaped like the panel cells below: the chapter heading and the
          columns cover other time frames, so this paragraph names its own. */}
      <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
        <CalendarRange className="h-3 w-3" aria-hidden="true" />
        {monthLabel}
      </span>

      {/* The type size steps with the measure, not the device: the skeleton reserves this paragraph
          line by line at these two line heights, and a page narrowed by the trip planner wraps the
          same words differently. */}
      <p className="text-sm leading-relaxed text-pretty @min-[768px]/page:text-base">{prose}</p>

      {/* The same numbers again, scannable. Not decoration: the prose above is what an answer
        engine quotes, this row is what a person skims before deciding to read it. */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {facts.map(({ key, icon: Icon, label, value }) => (
          <div key={key} className="flex flex-col gap-1">
            <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {label}
            </dt>
            <dd className="text-sm font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {/* The quiet days once more as the badge the grid uses for them, so the claim in the
        sentence and the colour in the cells below are visibly the same statement. */}
      {summary.quietest && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <span className="text-muted-foreground text-xs">
            {t('factQuietest', { count: summary.quietest.length })}
          </span>
          {summary.quietest.map((day) => (
            <span key={day.date} className="flex items-center gap-1.5">
              <span className="text-sm font-medium">
                {getDateTimeFormat(locale, {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  timeZone: 'UTC',
                }).format(new Date(`${day.date}T00:00:00Z`))}
              </span>
              <CrowdLevelBadge level={day.crowdLevel} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The box the summary will fill, at the height it will fill it: the calendar grid below is the
 * tallest thing on the page, so every missing pixel moves all of it. Built from the real card's box
 * model, each line at the line height of the text it replaces.
 *
 * It cannot reserve its own absence: a month with no operating day or a timed-out seed collapses,
 * and reserving for the common outcome costs less in total. The quiet-days strip is not reserved,
 * since about half the months have none. See
 * docs/rules/a-streamed-section-owes-the-page-its-height.md.
 */
export function ParkCalendarMonthSummarySkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <Skeleton className="h-[15px] w-32" />
      <div className="flex flex-col gap-[6px]">
        {/* Five lines below `sm`, three from 768 px of page — the last two collapse away where
          the wider measure fits the same words on fewer lines. */}
        <Skeleton className="h-[22.75px] w-full @min-[768px]/page:h-[26px]" />
        <Skeleton className="h-[22.75px] w-full @min-[768px]/page:h-[26px]" />
        <Skeleton className="h-[22.75px] w-[88%] @min-[768px]/page:hidden" />
        <Skeleton className="h-[22.75px] w-full @min-[768px]/page:hidden" />
        <Skeleton className="h-[22.75px] w-[54%] @min-[768px]/page:hidden" />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {/* Four entries at every width: one row from `sm` up, two in the phone's two-column grid,
            which is what the real row almost always takes. Only `factOpenDays` is unconditional, so
            a month can come back with a single row, but rarely does. */}
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-1">
            <Skeleton className="h-[16px] w-24" />
            <Skeleton className="h-[20px] w-16" />
          </div>
        ))}
      </dl>
    </div>
  );
}
