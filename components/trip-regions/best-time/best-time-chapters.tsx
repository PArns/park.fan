import { getTranslations } from 'next-intl/server';
import { CalendarPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { buttonLinkProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getDateTimeFormat, getNumberFormat } from '@/lib/utils/intl-format';
import { addDays, formatParkDay } from '@/lib/utils/park-day';
import { translateHolidayName } from '@/lib/utils/holiday-names';
import { PHONE_HIT_AREA } from '@/lib/utils/touch-target';
import { Precip, Temp } from '@/components/common/unit-display';
import { formatWindow } from '@/lib/trip-regions/hub-data';
import {
  isTripRegionMonthInRange,
  tripRegionMonthHref,
  tripRegionPath,
} from '@/lib/trip-regions/paths';
import { plannerHrefOn } from '@/lib/trip-regions/plan-query';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import { regionOrShared } from '@/lib/trip-regions/region-words';
import { requireTripRegion } from '@/lib/trip-regions/registry';
import {
  percentBelowAverage,
  weekInWindow,
  windowReasons,
  windowWarnings,
} from '@/lib/trip-regions/plan-when';
import {
  bestAndWorstWeeks,
  breakRuns,
  cleanBreakName,
  europeanBreaks,
  lastYearFrom,
  monthBreakDays,
  quietWeekInStorm,
  seasonsOn,
  tripLongBreaks,
  weekFacts,
  type BestTimeMonthRow,
  type CountryBreaks,
} from '@/lib/trip-regions/best-time';
import type {
  TripMonth,
  TripSchoolBreakRegion,
  TripSeason,
  TripWeather,
  TripWhenWindow,
  TripWhenWithMonths,
} from '@/lib/trip-regions/types';
import type { PlanSearchRange } from '@/lib/trip-regions/plan-query';
import { stormSignal } from '@/lib/trip-regions/date-facts';
import { stormCodeIn } from '@/lib/trip-regions/hub-facts';
import { STORM_SIGNAL_CLASS } from '@/lib/utils/day-signal-styles';
import { DaySignalChip, DaySignalKey } from '@/components/parks/day-signal-key';

/**
 * The chapters of a region's best-time pages, server-rendered whole: Level 0 is the answer in the
 * head, Level 1 the strip and the month rows, Level 2 the `<details>` under a window or a month,
 * all in the first HTML so nothing mounts on a click. See docs/features/orlando-best-time.md.
 */

/** A season's label: the park's own name, else the label for its kind. */
type SeasonLabel = (season: TripSeason) => string;

/** The labels every chapter needs, read once by the page. */
export async function bestTimeLabels(locale: string) {
  const tSeasons = await getTranslations({ locale, namespace: 'parks.seasons' });
  const seasonLabel: SeasonLabel = (s) => s.name?.trim() || tSeasons(`kind.${s.kind}`);
  const seasonStatus = (s: TripSeason) => tSeasons(`status.${s.status}`);
  return { seasonLabel, seasonStatus };
}

/** A ticketed evening that leaves the day guests' hours alone, as Disney After Hours does. */
function isAfterHours(season: TripSeason): boolean {
  return season.kind === 'special_event' && season.separateTicket === true && !!season.opensAt;
}

/** The climate normal's years as a range, `2015–2024`; the API spells them with a hyphen. */
export function climatePeriod(period: string): string {
  return period.replace('-', '–');
}

const day = (locale: string, date: string) =>
  formatParkDay(locale, date, { day: 'numeric', month: 'long' });

/** A month's last day, as a date's day part. */
const monthEnd = (month: TripMonth) =>
  String(new Date(Date.UTC(month.year, month.month, 0)).getUTCDate());

/** Level 0: the three windows as cards, each with its details and a link into the planner. */
export async function WindowCards({
  regionSlug,
  windows,
  seasons,
  parks,
  year,
  locale,
  seasonLabel,
}: {
  /** The trip region's slug, for its own words and its hub's links. */
  regionSlug: string;
  windows: readonly TripWhenWindow[];
  seasons: readonly TripSeason[];
  parks: readonly string[];
  year: number;
  locale: string;
  seasonLabel: SeasonLabel;
}) {
  const [t, tWhen, tWhenOwn, tHub] = await Promise.all([
    getTranslations({ locale, namespace: 'tripBestTime.answer' }),
    getTranslations({ locale, namespace: 'tripPlanner.when' }),
    getRegionTranslations(regionSlug, 'planner.when', locale),
    getTranslations({ locale, namespace: 'tripHub.when' }),
  ]);
  const hubPath = tripRegionPath(regionSlug, locale);
  return (
    <ol className="grid gap-4 sm:grid-cols-3">
      {windows.map((window) => {
        const below = percentBelowAverage(window);
        const [reason] = windowReasons(window);
        const events = seasons.filter((s) => window.seasons.includes(s.id)).map(seasonLabel);
        const details = windowReasons(window).map((code) =>
          regionOrShared(tWhenOwn, tWhen, `reason.${code}`)
        );
        // What speaks against the dates stands apart from why they were picked.
        const cautions = windowWarnings(window).map((code) =>
          regionOrShared(tWhenOwn, tWhen, `warning.${code}`, { count: window.closesEarlyDays })
        );
        return (
          <li key={window.from} className="flex">
            <Card className="flex w-full flex-col gap-2 p-4">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {tHub('rank', { rank: window.rank })}
              </p>
              {/* An h2: the cards follow the h1 directly, before the first chapter. */}
              <h2 className="text-xl font-bold">
                <time dateTime={window.from}>{formatWindow(window, locale)}</time>
              </h2>
              <p className="text-sm font-semibold tabular-nums">
                {tWhen('wait', { minutes: window.headlinerWait })}
              </p>
              {below !== null && (
                <p className="text-sm tabular-nums">{t('below', { percent: below, year })}</p>
              )}
              {reason && (
                <p className="text-muted-foreground text-sm">
                  {regionOrShared(tWhenOwn, tWhen, `reason.${reason}`)}
                </p>
              )}
              {/* Last year's windows are said once, in the head; only a window across the turn
                  says it here. */}
              {window.basis === 'mixed' && (
                <p className="text-muted-foreground text-xs">{tWhen(`basis.${window.basis}`)}</p>
              )}
              {(details.length > 1 || events.length > 0 || cautions.length > 0) && (
                <details className="text-sm">
                  <summary className="text-primary-ink flex min-h-11 cursor-pointer items-center font-medium sm:min-h-0">
                    {t('why')}
                  </summary>
                  <ul className="text-muted-foreground mt-2 list-disc space-y-1 ps-5">
                    {details.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                    {events.length > 0 && (
                      <li>{t('events', { list: [...new Set(events)].join(', ') })}</li>
                    )}
                  </ul>
                  {cautions.length > 0 && (
                    <>
                      <p className="mt-2 font-medium">{t('cautions')}</p>
                      <ul className="text-muted-foreground mt-1 list-disc space-y-1 ps-5">
                        {cautions.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </details>
              )}
              <Link
                href={plannerHrefOn(hubPath, { from: window.from, to: window.to, parks })}
                rel="nofollow"
                prefetch={false}
                {...buttonLinkProps({
                  variant: 'outline',
                  size: 'sm',
                  withIcon: true,
                  className: 'mt-auto self-start',
                })}
              >
                <CalendarPlus aria-hidden />
                {tWhen('plan')}
              </Link>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Chapter 01: a bar per week over a real `<table>`. The bars are a picture of the table, hidden
 * from assistive technology; the table, with its caption, is what a crawler and a screen reader
 * read, folded under the bars.
 */
export async function YearStrip({
  when,
  windows,
  weather,
  caption,
  locale,
}: {
  when: TripWhenWithMonths;
  windows: readonly TripWhenWindow[];
  /** The region's weather (`weather.storm`): the storm season's weeks get the signal row. */
  weather?: TripWeather;
  caption: string;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'tripBestTime.strip' });
  const tClimate = await getTranslations({ locale, namespace: 'tripPlanner.climate' });
  const stormOf = (start: string) => stormCodeIn(start, addDays(start, 6), weather);
  const stormKinds = [
    ...new Set(when.weeks.map((w) => stormOf(w.start)).filter((c) => c !== null)),
  ];
  const weeks = when.weeks;
  if (weeks.length === 0) return null;
  const max = Math.max(1, ...weeks.map((w) => w.headlinerWait ?? 0));
  const turn = lastYearFrom(when);
  const turnIndex = turn ? weeks.findIndex((w) => w.start >= turn) : -1;
  const monthFormat = getDateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  const monthStarts = weeks.flatMap((w, i) => {
    const key = w.start.slice(0, 7);
    return i === 0 || key !== weeks[i - 1].start.slice(0, 7)
      ? [{ i, label: monthFormat.format(new Date(`${w.start}T12:00:00Z`)), odd: i % 2 === 1 }]
      : [];
  });
  const pct = (i: number) => `${(i / weeks.length) * 100}%`;
  return (
    <figure className="space-y-3">
      <div aria-hidden="true" className="relative pt-6">
        {turnIndex > 0 && (
          <span
            className="text-muted-foreground border-muted-foreground/50 absolute top-0 bottom-0 border-l border-dashed ps-1 text-[11px] whitespace-nowrap"
            style={{ left: pct(turnIndex) }}
          >
            {t('basis.last_year')}
          </span>
        )}
        <div className="flex h-32 items-end gap-px sm:gap-0.5">
          {weeks.map((week) => (
            <div key={week.start} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1">
              {/* One ink: the height is the figure. A crowd-level colour would say "against the
                  park's normal day", which a week's rank in the year is not. */}
              <span
                className={cn(
                  'w-full rounded-t-sm',
                  week.headlinerWait != null ? 'bg-primary/45' : 'bg-muted'
                )}
                style={{ height: `${Math.max(4, ((week.headlinerWait ?? 0) / max) * 112)}px` }}
              />
              <span
                className={cn(
                  'h-1.5 w-full rounded-full',
                  windows.some((w) => weekInWindow(week.start, w)) ? 'bg-primary' : 'bg-transparent'
                )}
              />
              {stormKinds.length > 0 && (
                <span
                  className={cn(
                    'h-[3px] w-full rounded-full',
                    stormOf(week.start) && STORM_SIGNAL_CLASS[stormSignal(stormOf(week.start)!)]
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-muted-foreground relative mt-1 h-4 text-[11px]">
          {monthStarts.map((m) => (
            <span
              key={m.i}
              className={cn('absolute', m.odd && 'max-sm:hidden')}
              style={{ left: pct(m.i) }}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>
      {stormKinds.length > 0 && (
        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
          {stormKinds.map((code) => (
            <DaySignalKey
              key={code}
              className={STORM_SIGNAL_CLASS[stormSignal(code)]}
              label={tClimate(code)}
            />
          ))}
        </div>
      )}
      <details className="group">
        <summary className="text-primary-ink flex min-h-11 cursor-pointer items-center text-sm font-medium sm:min-h-0">
          {t('table')}
        </summary>
        <div className="mt-3 max-h-[28rem] overflow-y-auto rounded-lg border">
          <table className="w-full text-sm tabular-nums">
            <caption className="text-muted-foreground p-2 text-start text-xs">{caption}</caption>
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th scope="col" className="px-3 py-2 text-start font-semibold">
                  {t('colWeek')}
                </th>
                <th scope="col" className="px-3 py-2 text-end font-semibold">
                  {t('colWait')}
                </th>
                <th scope="col" className="px-3 py-2 text-start font-semibold">
                  {t('colBasis')}
                </th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week.start} className="border-t">
                  <th scope="row" className="px-3 py-1.5 text-start font-normal">
                    <time dateTime={week.start}>{day(locale, week.start)}</time>
                  </th>
                  <td className="px-3 py-1.5 text-end">
                    {week.headlinerWait != null
                      ? t('minutes', { minutes: week.headlinerWait })
                      : '–'}
                  </td>
                  <td className="text-muted-foreground px-3 py-1.5">
                    {[
                      t(`basis.${week.basis}`),
                      ...(stormOf(week.start) ? [tClimate(stormOf(week.start)!)] : []),
                    ].join(' · ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

/** A European month cell: "11 of 16 German states · Regio Noord · England". */
function europeanCell(
  cells: readonly CountryBreaks[],
  statesOf: (count: number, total: number) => string,
  unknown: string
): string {
  return cells
    .flatMap((c) => {
      if (c.unknown) return [`${c.country}: ${unknown}`];
      if (c.regions.length === 0) return [];
      return c.country === 'DE' && c.total > 1
        ? [statesOf(c.regions.length, c.total)]
        : [c.regions.map((r) => r.name).join(', ')];
    })
    .join(' · ');
}

/** The one line that says from when a chapter's figures are last year's measured days. */
function LastYearFrom({ text }: { text: string }) {
  return <p className="text-muted-foreground mb-3 max-w-3xl text-sm">{text}</p>;
}

/** Chapter 02: a row per month, each with its facts and a fold with the dates. */
export async function MonthRows({
  regionSlug,
  weather,
  rows,
  when,
  regions,
  countries,
  current,
  locale,
  seasonLabel,
  seasonStatus,
}: {
  /** The trip region's slug, for its own words and its hub's links. */
  regionSlug: string;
  /** The region's weather: a month in its storm season says so, a month in the peak too. */
  weather?: TripWeather;
  rows: readonly BestTimeMonthRow[];
  when: TripWhenWithMonths;
  regions: readonly TripSchoolBreakRegion[];
  countries: readonly string[];
  current: TripMonth;
  locale: string;
  seasonLabel: SeasonLabel;
  seasonStatus: (s: TripSeason) => string;
}) {
  const t = await getTranslations({ locale, namespace: 'tripBestTime.months' });
  const tHub = await getTranslations({ locale, namespace: 'tripHub' });
  const turn = lastYearFrom(when);
  const tOwn = await getRegionTranslations(regionSlug, 'bestTime.months', locale);
  const tClimate = await getTranslations({ locale, namespace: 'tripPlanner.climate' });
  const monthName = getDateTimeFormat(locale, { month: 'long', timeZone: 'UTC' });
  const statesOf = (count: number, total: number) => t('statesOf', { count, total });
  const hourFormat = getNumberFormat(locale, { maximumFractionDigits: 1 });
  // Past the turn every month reads last year; said once above the list, not on each month.
  const said = turn ? (
    <LastYearFrom text={tHub('lastYearFrom', { date: day(locale, turn) })} />
  ) : null;
  return (
    <>
      {said}
      <ol className="divide-border/70 divide-y border-y">
        {rows.map((row) => {
          const name = monthName.format(new Date(Date.UTC(row.month.year, row.month.month - 1, 1)));
          const storm = stormCodeIn(`${row.key}-01`, `${row.key}-${monthEnd(row.month)}`, weather);
          const data = row.data;
          const linkable = isTripRegionMonthInRange(row.month, current);
          const heading = (
            <h3 className="text-lg font-bold capitalize">
              {linkable ? (
                <Link
                  href={tripRegionMonthHref(regionSlug, locale, row.month, current)}
                  prefetch={false}
                  className={cn(
                    'text-primary-ink underline-offset-4 hover:underline',
                    PHONE_HIT_AREA
                  )}
                >
                  {name}
                </Link>
              ) : (
                name
              )}
            </h3>
          );
          if (!data) {
            return (
              <li key={row.key} className="grid gap-2 py-4 lg:grid-cols-[11rem_1fr]">
                {heading}
                <p className="text-muted-foreground text-sm">
                  {t('noFigure')}. {t('beyond', { date: day(locale, when.meta.to) })}
                </p>
              </li>
            );
          }
          const seasons = seasonsOn(
            when.seasons.filter((s) => data.seasons.includes(s.id)),
            { from: `${row.key}-01`, to: `${row.key}-31` }
          );
          const breaks = breakRuns(monthBreakDays(data));
          const eu = europeanBreaks(regions, row.key, countries);
          const euText = europeanCell(eu, statesOf, t('euUnknown'));
          const climate = data.climate;
          const hours = [
            row.hours && data.dayGuestHours != null
              ? t(`hours.${row.hours}`, { hours: hourFormat.format(data.dayGuestHours) })
              : t('hours.unknown'),
            ...(data.partyNights > 0 ? [t('partyNights', { count: data.partyNights })] : []),
          ].join(' · ');
          // A separately ticketed evening after a normal close (Disney After Hours) runs most of the
          // year; the festivals and parties that set a month apart are named first.
          const shownSeasons = [...seasons]
            .sort((a, b) => Number(isAfterHours(a)) - Number(isAfterHours(b)))
            .slice(0, 3);
          return (
            <li
              key={row.key}
              className="grid gap-x-6 gap-y-3 py-5 lg:grid-cols-[11rem_minmax(0,1fr)]"
            >
              <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-start">
                {heading}
                {/* A month in the storm peak is never called the quietest: its short waits come
                    with the storm, and the trips above rank it lower for that. */}
                {row.mark && !(row.mark === 'very_low' && storm?.endsWith('_peak')) && (
                  <span className="border-foreground/30 rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                    {t(`tier.${row.mark}`)}
                  </span>
                )}
                {storm && (
                  <DaySignalChip
                    className={STORM_SIGNAL_CLASS[stormSignal(storm)]}
                    label={tClimate(storm)}
                  />
                )}
                {data.rainySeason && tOwn.has('rainySeason') && (
                  <span className="text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs">
                    {tOwn('rainySeason')}
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <p className="font-semibold tabular-nums">
                  {data.headlinerWait != null
                    ? t('wait', { minutes: data.headlinerWait })
                    : t('noFigure')}
                </p>
                {/* One line per month in the list; events, breaks, weather and hours open on request,
                  so twelve months do not stand as a wall of facts on a phone. */}
                <details className="text-sm">
                  <summary className="text-primary-ink flex min-h-11 cursor-pointer items-center font-medium sm:min-h-0">
                    {t('details')}
                  </summary>
                  <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground text-xs">{t('label.events')}</dt>
                      <dd>
                        {shownSeasons.length
                          ? shownSeasons
                              .map((s) => `${seasonLabel(s)} (${seasonStatus(s)})`)
                              .join(' · ')
                          : t('none')}
                        {seasons.length > 3 ? ` · +${seasons.length - 3}` : ''}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">{tOwn('label.usBreaks')}</dt>
                      <dd>
                        {breaks.length
                          ? breaks
                              .map(
                                (b) =>
                                  `${translateHolidayName(b.name, locale)} ${formatWindow(b, locale)}`
                              )
                              .join(' · ')
                          : t('none')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">{t('label.euBreaks')}</dt>
                      <dd>{euText || t('none')}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">{t('label.weather')}</dt>
                      <dd>
                        {climate
                          ? t.rich('climate', {
                              high: () => <Temp celsius={climate.tempMax} withUnit />,
                              rain: () => <Precip mm={climate.precipitationMm} />,
                            })
                          : t('none')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">{t('label.hours')}</dt>
                      <dd>{hours}</dd>
                    </div>
                  </dl>
                  <div className="text-muted-foreground mt-2 space-y-2">
                    {seasons.length > 0 && (
                      <ul className="list-disc space-y-1 ps-5">
                        {seasons.map((s) => (
                          <li key={s.id}>
                            {seasonLabel(s)}:{' '}
                            {formatWindow({ from: s.startDate, to: s.endDate }, locale)} (
                            {seasonStatus(s)})
                          </li>
                        ))}
                      </ul>
                    )}
                    {eu.some((c) => c.regions.length > 0) && (
                      <ul className="list-disc space-y-1 ps-5">
                        {eu.flatMap((c) =>
                          c.regions.map((r) => (
                            <li key={r.code}>
                              {r.name}:{' '}
                              {r.periods
                                .map(
                                  (p) =>
                                    `${translateHolidayName(cleanBreakName(p.name), locale)} ${formatWindow(p, locale)}`
                                )
                                .join(', ')}
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                    {climate && (
                      <p>
                        {t.rich('climateNote', {
                          period: climate.period,
                          low: () => <Temp celsius={climate.tempMin} withUnit />,
                        })}
                      </p>
                    )}
                  </div>
                </details>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/** Chapter 03: the three quietest and busiest whole weeks, each with one line on why. */
export async function BestWorstWeeks({
  regionSlug,
  when,
  windows,
  range,
  locale,
  seasonLabel,
}: {
  /** The trip region's slug, for its own words and its hub's links. */
  regionSlug: string;
  when: TripWhenWithMonths;
  /** The trips the page names, to say why the quietest week is none of them. */
  windows: readonly TripWhenWindow[];
  range: PlanSearchRange;
  locale: string;
  seasonLabel: SeasonLabel;
}) {
  const [t, tOwn, tStrip, tHub] = await Promise.all([
    getTranslations({ locale, namespace: 'tripBestTime.weeks' }),
    getRegionTranslations(regionSlug, 'bestTime.weeks', locale),
    getTranslations({ locale, namespace: 'tripBestTime.strip' }),
    getTranslations({ locale, namespace: 'tripHub' }),
  ]);
  const { best, worst } = bestAndWorstWeeks(when.weeks, range);
  const list = (weeks: typeof best, title: string) => (
    <Card className="p-5">
      <h3 className="mb-3 text-lg font-bold">{title}</h3>
      <ol className="space-y-3">
        {weeks.map((week) => {
          const facts = weekFacts(week, when.months, when.seasons);
          const reasons = [
            ...facts.breaks.map((b) => translateHolidayName(b.name, locale)),
            ...facts.seasons.map(seasonLabel),
          ];
          return (
            <li key={week.start}>
              <p className="font-semibold">
                <time dateTime={week.start}>{t('week', { date: day(locale, week.start) })}</time>
                <span className="ms-2 tabular-nums">
                  {tStrip('minutes', { minutes: week.headlinerWait! })}
                </span>
              </p>
              {(reasons.length > 0 || tOwn.has('noBreak')) && (
                <p className="text-muted-foreground text-sm">
                  {reasons.length ? [...new Set(reasons)].join(' · ') : tOwn('noBreak')}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
  const stormSeason = requireTripRegion(regionSlug).stormSeason;
  const storm = quietWeekInStorm(when, windows, range, stormSeason);
  const turn = lastYearFrom(when);
  return (
    <div className="space-y-4">
      {turn && <LastYearFrom text={tHub('lastYearFrom', { date: day(locale, turn) })} />}
      <div className="grid gap-4 md:grid-cols-2">
        {list(best, t('best'))}
        {list(worst, t('worst'))}
      </div>
      {storm && stormSeason && (
        <p className="text-muted-foreground max-w-3xl text-sm">
          {t('stormNote', { date: day(locale, storm.start), kind: stormSeason })}
        </p>
      )}
    </div>
  );
}

/**
 * Chapter 04: each school-holiday region the API knows, with every break a trip of `days` fits
 * into, linked to the planner's When mode inside that break. The locale's own country opens.
 */
export async function SchoolHolidayLinks({
  regionSlug,
  regions,
  countries,
  openCountry,
  range,
  days,
  parks,
  year,
  locale,
}: {
  /** The trip region's slug, for its own words and its hub's links. */
  regionSlug: string;
  regions: readonly TripSchoolBreakRegion[];
  countries: readonly string[];
  openCountry: string | undefined;
  range: PlanSearchRange;
  days: number;
  parks: readonly string[];
  year: number;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'tripBestTime.holidays' });
  const hubPath = tripRegionPath(regionSlug, locale);
  const countryName = new Intl.DisplayNames([locale], { type: 'region' });
  return (
    <div className="space-y-3">
      {countries.map((country) => {
        const own = regions.filter((r) => r.country === country);
        if (own.length === 0) return null;
        const through = own.flatMap((r) => r.through ?? []).sort()[0];
        return (
          <details
            key={country}
            open={country === openCountry}
            className="rounded-xl border p-4 [&_summary]:cursor-pointer"
          >
            <summary className="flex min-h-11 items-center text-lg font-semibold">
              <h3 className="inline">{countryName.of(country) ?? country}</h3>
            </summary>
            <ul className="mt-3 divide-y">
              {own.map((region) => {
                const breaks = tripLongBreaks(region, days, range);
                return (
                  <li
                    key={region.code}
                    className="flex flex-col gap-1 py-2 sm:flex-row sm:items-baseline sm:gap-4"
                  >
                    <span className="font-medium sm:w-56 sm:shrink-0">{region.name}</span>
                    {breaks.length ? (
                      <span className="flex flex-wrap gap-x-4 gap-y-1">
                        {breaks.map((b) => (
                          <Link
                            key={b.from}
                            href={plannerHrefOn(hubPath, {
                              when: { from: b.from, to: b.to },
                              days,
                              within: region.code,
                              parks,
                            })}
                            rel="nofollow"
                            prefetch={false}
                            className="text-primary-ink inline-flex min-h-11 items-center underline underline-offset-4 sm:min-h-0"
                          >
                            {translateHolidayName(cleanBreakName(b.name), locale)}{' '}
                            {formatWindow(b, locale)}
                          </Link>
                        ))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        {t('none', { days, year })}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {through && (
              <p className="text-muted-foreground mt-2 text-xs">
                {t('through', { date: formatParkDay(locale, through) })}
              </p>
            )}
          </details>
        );
      })}
    </div>
  );
}
