import { getTranslations } from 'next-intl/server';
import { CalendarRange, Clock, GraduationCap, Timer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { getParkArticleForms } from '@/lib/faq/park-faq';
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
 * What a month page says about its month, in sentences, in the first byte.
 *
 * This block exists because of a diff. `/wartezeiten-kalender/2026/11` and
 * `/wartezeiten-kalender/2026/2` shipped 1.097 words of server HTML each and were **99.5 %
 * identical**: the five passages that differed were five occurrences of the word „November". The
 * grid under this block is a `ssr: false` import, so every fact a visitor came for arrived after
 * a client fetch, behind 149 skeleton elements. Across the route's window and the catalogue that
 * is 212 parks × 25 months × 6 locales — 31.800 URLs a crawler can only tell apart by one word,
 * which is the shape of a page set that gets sampled, discounted and dropped.
 *
 * So the month's own answer is derived on the server from the same payload the grid fetches
 * (`summarizeCalendarMonth`) and written out here. Two consequences are deliberate:
 *
 * **It is cached, not seeded.** The obvious move is to hand this response down to the grid as
 * `initialCalendarData` so the block costs nothing — but the grid sits inside `ParkCalendarPanel`
 * together with the month stepper, and the stepper is the only reason the months are crawlable at
 * all. Putting the panel behind this block's `<Suspense>` would take the prev/next links out of
 * the first byte to save a request, which is the wrong trade. So the fetch stands on its own and
 * pays for itself through the data cache instead: one upstream call per park-month per six hours
 * rather than one per view (`getCalendarMonthSeed`).
 *
 * **Every clause is optional.** `summarizeCalendarMonth` returns `null` for a finding it cannot
 * support: a month with too few rated days names no quiet day, a flat month names neither end, a
 * park whose hours change mid-month gets no „meist" sentence. A sentence assembled from whatever
 * survived is the only kind that can go on 31.800 pages without the grid below it contradicting
 * one of them.
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
  // Only the nominative is used. The headliner sentence used to interpolate `parkLoc`,
  // which `getParkArticleForms` prefixes with a preposition for GERMAN ONLY — the other
  // five locales got the bare park name glued to the end of a clause („at the headline
  // rides Phantasialand"). The park is already named in the first sentence, so the
  // second one does not need it at all.
  const { parkNom } = getParkArticleForms(park, locale);

  /**
   * „Dienstag, 3. und Mittwoch, 11." — weekday plus day of month, joined the way the reader's
   * language joins a list.
   *
   * `Intl.ListFormat` rather than a translated separator: two days join with „und" in German and
   * „en" in Dutch, three take a comma before the conjunction in some locales and not in others,
   * and a `dayJoin` string cannot express that without one key per list length per language.
   *
   * `timeZone: 'UTC'` because the date is a plain `YYYY-MM-DD` calendar day, parsed at midnight
   * UTC — rendering it in any other zone can print the day before.
   */
  const dayList = (days: NamedCalendarDay[]) => {
    const parts = days.map((d) =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${d.date}T00:00:00Z`))
    );
    return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(parts);
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

  // German formats a day number WITH its ordinal dot — `Intl` renders „Freitag, 28." — so a
  // sentence template ending in a full stop produced „am Freitag, 28.." Collapsing the pair at
  // the join is locale-safe in a way that trimming the dot is not: dropping it would render
  // „Freitag, 28", which is wrong German, and only German (and Dutch) need it at all.
  const prose = sentences.join(' ').replace(/\.\.(?=\s|$)/g, '.');

  return (
    <div className="flex flex-col gap-4">
      {/* The month, as a caption in the same shape the panel cells below use.
        Without it the box contradicted itself: the chapter heading says „für die nächsten 3
        Monate", this paragraph is about November, and „Kommende ruhige Tage" underneath lists
        dates in August — three time frames, none of them labelled. The caption names this one,
        and the columns keep the heading's. */}
      <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
        <CalendarRange className="h-3 w-3" aria-hidden="true" />
        {monthLabel}
      </span>

      {/* The type size steps with the MEASURE, not with the device, and it has to: the skeleton
        below reserves this paragraph line by line at exactly these two line heights, and a page
        narrowed by the trip planner wraps the same sentences onto five lines while a reservation
        cut for three sits under them. The two ask one question in one place. */}
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
                {new Intl.DateTimeFormat(locale, {
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
 * The box the summary will fill, at the height it will fill it.
 *
 * The block streams, so this is what stands in the layout until the month lands — and on this
 * page the reservation matters more than usual, because the calendar grid below it is the tallest
 * thing on the page and every pixel missing here moves all of it (CLAUDE.md, „a streamed section
 * owes the page its height").
 *
 * Built from the real card's own box model rather than a round number: same `Card`, same padding,
 * same `gap-4`, and each skeleton line set to the line-height of the text it replaces — `text-sm`
 * at `leading-relaxed` is 22.75 px, `text-base` from 768 px of page is 26 px. The prose runs
 * five to six lines on a phone and three in a wide column, which is where the two paragraph
 * blocks come from.
 *
 * **What it cannot reserve honestly is its own absence.** The summary is `null` for a month with
 * no operating day (a park shut for the season) and for a seed that hit its three-second timeout,
 * and the boundary has already drawn this box by then — so those pages pay a collapse of roughly
 * 185 px from 768 px of page up. It is left that way on purpose, for the reason CLAUDE.md gives
 * for the nearby-parks section: the caller cannot know before the fetch, and reserving for the
 * common outcome costs less in total than reserving for none. A seasonal park in February pays
 * it; a year-round park never does.
 *
 * The fact row's shape is data-dependent (two to four entries), so it reserves the four-entry
 * case: that is one line tall on `sm` and up either way, so the guess costs nothing there.
 *
 * Two things are deliberately NOT reserved, both measured. The quiet-days strip is only rendered
 * for a month that has one, and about half do not — reserving it charged every other month 49 px
 * it never used. And the prose runs two lines from 768 px of page up, not three: `pnpm
 * measure:cls` read **−89 px** on November 2026 against the first attempt, an over-reservation
 * that pulls the whole page up when the summary lands. Below `sm` the same sentences wrap to
 * five lines, which is where the extra collapsing rows come from.
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
        {/* Four from `sm` up, where they are one row either way — below it the grid is two
          columns, so a fourth entry is a whole second row, and only the first fact is
          unconditional. Reserving two rows for a month that renders one is the same
          over-reservation this file spent its other numbers avoiding. */}
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn('flex flex-col gap-1', i >= 2 && 'hidden sm:flex')}>
            <Skeleton className="h-[16px] w-24" />
            <Skeleton className="h-[20px] w-16" />
          </div>
        ))}
      </dl>
    </div>
  );
}
