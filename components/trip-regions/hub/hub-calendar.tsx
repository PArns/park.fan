'use client';

import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { CalendarDayTile, type CalendarDayTileProps } from '@/components/parks/calendar-day-tile';
import { useSeasonLabel } from '@/components/parks/season-headline';
import { cn } from '@/lib/utils';
import { HubFilterChip as FilterChip } from './hub-filter-chip';
import { useLocationHash } from '@/lib/hooks/use-location-hash';
import { DAY_SIGNAL_CLASS, STORM_SIGNAL_CLASS } from '@/lib/utils/day-signal-styles';
import { formatClockTime, formatHoursRange } from '@/lib/utils/intl-format';
import { addDays } from '@/lib/utils/park-day';
import { translateHolidayName } from '@/lib/utils/holiday-names';
import { isSeasonEvent, seasonMarks } from '@/lib/parks/park-season-days';
import { cleanBreakName } from '@/lib/trip-regions/best-time';
import {
  closesEarly,
  dayBasis,
  dayGuestClose,
  eventLanes,
  formatDateRange,
  formatHubDate,
  hoursUnpublished,
  HUB_WEEK_DAYS,
  hubWeekFragment,
  hubWeekFromFragment,
  hubWeeks,
  isRankable,
  isWeekend,
  quietestDay,
  quietSeasons,
  regionGroups,
  shortGroupName,
  shortParkName,
  tintLevel,
  type EventLane,
  type HubWeek,
  type RegionGroup,
} from '@/lib/trip-regions/hub-data';
import { shownWait } from '@/lib/trip-regions/plan-week';
import { stormCodeOn, stormSignal, type StormCode } from '@/lib/trip-regions/date-facts';
import type { HubWeekPaging } from '@/lib/analytics/site-analytics';
import { trackTripEvent } from '@/lib/trip-regions/plan-analytics';
import { TRIP_CALENDAR_ID } from '@/lib/trip-regions/paths';
import { requireTripRegion } from '@/lib/trip-regions/registry';
import type {
  TripCalendar,
  TripCalendarDay,
  TripParkDay,
  TripRegion,
} from '@/lib/trip-regions/types';
import { EARLY_CLOSE_CORNER, HUB_CELL_BEST, HUB_WEEK_CELL, HUB_WEEK_ITEM } from './hub-cell-styles';
import { clearTripPagePark, HubDaySheet } from './hub-day-sheet';
import { startTripPlanner } from './hub-hero-action';

/** The history state key of an open day sheet, which Back closes. */
const SHEET_ENTRY = 'hubDaySheet';

/** What a park's tile shows on a day; the ring and the star are the week's. */
type HubTile = Pick<
  CalendarDayTileProps,
  'level' | 'closed' | 'wait' | 'status' | 'seasons' | 'hours' | 'overlay'
>;

/** Each park's tiles, by its slug, one per day of the window. */
type HubTiles = ReadonlyMap<string, readonly HubTile[]>;

/** Each park's quietest day of each week (`quietestDay`), by its slug: a date or `null` per week. */
type HubQuiet = ReadonlyMap<string, readonly (string | null)[]>;

/** The days a park's ring and star stand on, as `<slug>:<date>`. */
type HubStars = ReadonlySet<string>;

/** The hub's calendar section: the props the server hands over. */
export interface HubCalendarProps {
  region: TripRegion;
  /** The whole window, server-rendered: 30 days on the hub, the month on a month page. */
  calendar: TripCalendar;
  /** The region's today, for the "today" mark. */
  todayIso: string;
  locale: string;
  /** How to read a tile (`HubLegend`, server-rendered), between the filter and the days. */
  legend?: React.ReactNode;
}

/**
 * The calendar chapter's body: which day of the week is each park's quietest, a week at a time.
 * The parks by resort down the side and seven days across, each park's quietest day ringed and
 * starred (`quietestDay`) and named beside it: on a desktop a compact tile of the crowd calendar
 * (`CalendarDayTile`) per day with the holidays above, on a phone a 44 px tile per day under the
 * park's name. Every day of the window is in the served HTML; the week buttons and the fragment
 * (`#calendar-2026-11-21`) only change which seven a `data-week` shows, so paging asks nothing and
 * moves nothing below the grid. A tap on a day opens the day sheet.
 */
export function HubCalendar({ region, calendar, todayIso, locale, legend }: HubCalendarProps) {
  const t = useTranslations('tripHub.calendar');
  const groups = useMemo(() => regionGroups(region), [region]);
  const [only, setOnly] = useState<string | null>(null);
  // The filter and the week are urgent; the grid they rebuild is not (an interaction may not
  // rebuild the grid in its own commit).
  const deferredOnly = useDeferredValue(only);
  const [openDate, setOpenDate] = useState<string | null>(null);
  // The control that opened the sheet, so closing it puts focus back where the reader was.
  const opener = useRef<HTMLElement | null>(null);
  // The open sheet holds a history entry of its own, so a phone's Back closes it and a second Back
  // leaves the page, the way a visitor expects a sheet to behave.
  const openDay = useCallback(
    (date: string, layout: 'table' | 'phone') => {
      opener.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpenDate(date);
      if (!globalThis.history.state?.[SHEET_ENTRY]) {
        globalThis.history.pushState({ ...globalThis.history.state, [SHEET_ENTRY]: true }, '');
      }
      trackTripEvent(region.slug, 'trip_hub_day_opened', { layout });
    },
    [region.slug]
  );
  const openFromPhone = useCallback((date: string) => openDay(date, 'phone'), [openDay]);
  const openFromTable = useCallback((date: string) => openDay(date, 'table'), [openDay]);
  const closeDay = useCallback(() => {
    setOpenDate(null);
    if (globalThis.history.state?.[SHEET_ENTRY]) globalThis.history.back();
  }, []);
  // The sheet's Back lands before the planner starts: the assistant pushes an entry of its own,
  // which that Back would otherwise take away, closing it again. The focus stays with the
  // assistant, not the day that opened the sheet.
  const planFrom = useCallback(
    (date: string) => {
      const start = () => startTripPlanner(region.slug, 'day', date);
      const sheetEntry = Boolean(globalThis.history.state?.[SHEET_ENTRY]);
      if (sheetEntry) globalThis.addEventListener('popstate', start, { once: true });
      opener.current = null;
      closeDay();
      if (!sheetEntry) start();
    },
    [closeDay, region.slug]
  );
  useEffect(() => {
    const onPop = () => {
      if (!globalThis.history.state?.[SHEET_ENTRY]) setOpenDate(null);
    };
    globalThis.addEventListener('popstate', onPop);
    return () => globalThis.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => clearTripPagePark, []);

  const days = calendar.days;
  const timezone = requireTripRegion(region.slug).timezone;
  const weeks = useMemo(() => hubWeeks(days), [days]);
  // The fragment is read as a store: the served HTML is the first week, and a shared link's week
  // follows after hydration in the same box.
  const fragmentWeek = hubWeekFromFragment(useLocationHash(), weeks);
  const [chosen, setChosen] = useState<number | null>(null);
  const week = Math.min(chosen ?? fragmentWeek ?? 0, Math.max(0, weeks.length - 1));
  const shownWeek = useDeferredValue(week);
  const navRef = useRef<HTMLDivElement>(null);

  // A shared link to a week lands on the calendar, not on the head; a reload keeps its own place.
  useEffect(() => {
    const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (entry?.type !== 'navigate') return;
    if (hubWeekFromFragment(window.location.hash, weeks) === null) return;
    document.getElementById(TRIP_CALENDAR_ID)?.scrollIntoView({ block: 'start' });
  }, [weeks]);

  /** Shows a week and names it in the address bar, so a reload or a shared link keeps it. */
  const showWeek = (next: number, how: HubWeekPaging): number => {
    const to = Math.max(0, Math.min(weeks.length - 1, next));
    if (to === week) return to;
    setChosen(to);
    trackTripEvent(region.slug, 'trip_hub_week_paged', { how, week: to + 1 });
    const { pathname, search } = window.location;
    // `null` state, so Next's patched `replaceState` carries its own entry over and moves the
    // router's URL along (as the park calendar's day fragment does).
    window.history.replaceState(
      null,
      '',
      `${pathname}${search}${to === 0 ? '' : `#${hubWeekFragment(weeks[to])}`}`
    );
    return to;
  };

  const tileOf = useHubTile(calendar, locale, timezone);
  const tiles = useMemo<HubTiles>(
    () =>
      new Map(region.parks.map((park) => [park.slug, days.map((d) => tileOf(d.parks[park.slug]))])),
    [region.parks, days, tileOf]
  );
  const quiet = useMemo<HubQuiet>(
    () =>
      new Map(
        region.parks.map((park) => [
          park.slug,
          weeks.map((w) => quietestDay(days.slice(w.start, w.start + w.length), park.slug)),
        ])
      ),
    [weeks, region.parks, days]
  );
  const stars = useMemo<HubStars>(
    () =>
      new Set(
        [...quiet].flatMap(([slug, dates]) =>
          dates.flatMap((date) => (date ? [`${slug}:${date}`] : []))
        )
      ),
    [quiet]
  );
  const storm = useStormDays(days, region.weather);
  const visibleGroups = useMemo(
    () => (deferredOnly ? groups.filter((g) => g.key === deferredOnly) : groups),
    [groups, deferredOnly]
  );
  // A chip that changes the selection counts; pressing the one already chosen does not.
  const filter = (next: string | null) => {
    if (next === only) return;
    setOnly(next);
    trackTripEvent(region.slug, 'trip_hub_filter', { resort: next ?? 'all' });
  };
  const sheetDay = days.find((d) => d.date === openDate) ?? null;
  const nextWeek = weeks[week + 1];

  return (
    <div className="space-y-4">
      {/* One row that scrolls sideways on a phone, so the days start higher up the screen. */}
      <div
        role="group"
        aria-label={t('filterLabel')}
        className="-mr-4 flex [scrollbar-width:none] items-center gap-2 overflow-x-auto pr-4 sm:mr-0 sm:flex-wrap sm:overflow-visible sm:pr-0"
      >
        <FilterChip pressed={only === null} onClick={() => filter(null)}>
          {t('filterAll')}
        </FilterChip>
        {groups.map((group) => (
          <FilterChip
            key={group.key}
            pressed={only === group.key}
            onClick={() => filter(only === group.key ? null : group.key)}
          >
            {shortGroupName(group.name)}
          </FilterChip>
        ))}
      </div>

      {legend}

      {weeks.length > 1 && (
        <WeekNav weeks={weeks} week={week} locale={locale} onWeek={showWeek} navRef={navRef} />
      )}

      <div className="lg:hidden">
        <PhoneWeek
          days={days}
          storm={storm}
          groups={visibleGroups}
          tiles={tiles}
          stars={stars}
          quiet={quiet}
          week={shownWeek}
          todayIso={todayIso}
          locale={locale}
          timezone={timezone}
          onOpen={openFromPhone}
        />
      </div>

      <div className="hidden lg:block">
        <Matrix
          days={days}
          storm={storm}
          groups={visibleGroups}
          tiles={tiles}
          stars={stars}
          quiet={quiet}
          weeks={weeks}
          week={shownWeek}
          todayIso={todayIso}
          locale={locale}
          timezone={timezone}
          onOpen={openFromTable}
        />
      </div>

      {/* At the end of a long week, the next one, then back up to its first day. */}
      {nextWeek && (
        <button
          type="button"
          onClick={() => {
            showWeek(week + 1, 'next_link');
            navRef.current?.scrollIntoView({ block: 'start' });
          }}
          className="border-border/60 hover:bg-muted/50 text-foreground flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border text-sm font-medium"
        >
          {t('weekNextDates', { dates: formatDateRange(nextWeek.from, nextWeek.to, locale) })}
          <ChevronRight aria-hidden className="size-4" />
        </button>
      )}

      <EventLanes calendar={calendar} region={region} locale={locale} />

      <HubDaySheet
        day={sheetDay}
        returnFocus={opener}
        region={region}
        calendar={calendar}
        locale={locale}
        todayIso={todayIso}
        onClose={closeDay}
        onPlanTrip={planFrom}
      />
    </div>
  );
}

/**
 * A park's day as the crowd calendar's compact tile: the tint and the level in words where the day
 * has a figure, the wait it prints (`shownWait`), the day guest's hours with an early close in bold
 * under the folded corner, „Zeiten folgen" for a figure without published hours, and the season
 * icons, quiet for a season most of the window runs in (`quietSeasons`).
 */
function useHubTile(calendar: TripCalendar, locale: string, timezone: string) {
  const t = useTranslations('tripHub.calendar');
  const tLevel = useTranslations('parks.crowdLevels');
  const tCommon = useTranslations('common');
  const seasonLabel = useSeasonLabel();
  const seasons = useMemo(
    () => new Map(calendar.seasons.map((season) => [season.id, season])),
    [calendar.seasons]
  );
  const quiet = useMemo(() => quietSeasons(calendar), [calendar]);
  return useCallback(
    (day: TripParkDay | undefined): HubTile => {
      if (day?.status === 'CLOSED') {
        return { level: null, closed: true, wait: null, status: tCommon('closed') };
      }
      const level = isRankable(day) ? tintLevel(day.crowdLevel) : null;
      const close = dayGuestClose(day);
      const early = isRankable(day) && closesEarly(day);
      const hours =
        day?.status === 'OPERATING' && day.opensAt && close ? (
          <span className="truncate tabular-nums">
            {formatClockTime(day.opensAt, locale, timezone)}–
            <span className={early ? 'text-foreground font-semibold' : undefined}>
              {formatClockTime(close, locale, timezone)}
            </span>
          </span>
        ) : !day || day.status === 'UNKNOWN' ? (
          <span className="truncate">{t('hoursLater')}</span>
        ) : null;
      const marks = seasonMarks(
        (day?.seasons ?? []).flatMap((id) => {
          const season = seasons.get(id);
          return season && isSeasonEvent(season)
            ? [{ ...season, name: season.name ?? null, quiet: quiet.has(id) }]
            : [];
        })
      ).map((mark) => ({
        kind: mark.kind,
        quiet: mark.quiet,
        label: mark.seasons.map((s) => seasonLabel(s, true)).join(', '),
      }));
      return {
        level,
        closed: false,
        wait: isRankable(day) ? shownWait(day)! : null,
        // A figure without a level has no word: „Keine Prognose" beside a forecast would be wrong.
        status: level ? tLevel(level) : isRankable(day) ? '' : tLevel('unknown'),
        seasons: marks,
        hours,
        overlay: early ? <span aria-hidden className={EARLY_CLOSE_CORNER} /> : undefined,
      };
    },
    [locale, timezone, t, tLevel, tCommon, seasonLabel, seasons, quiet]
  );
}

/** The week shown: its dates between the two arrows, and from `sm` every week as a chip. */
function WeekNav({
  weeks,
  week,
  locale,
  onWeek,
  navRef,
}: {
  weeks: readonly HubWeek[];
  week: number;
  locale: string;
  /** Shows a week, clamped to the window, and returns the one it showed. */
  onWeek: (week: number, how: HubWeekPaging) => number;
  navRef: RefObject<HTMLDivElement | null>;
}) {
  const t = useTranslations('tripHub.calendar');
  const current = weeks[week];
  const last = weeks.length - 1;
  // The arrow keys page from any of the controls, Home and End go to the ends; on a chip the
  // focus follows the chip of the week shown.
  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowLeft: week - 1,
      ArrowRight: week + 1,
      Home: 0,
      End: last,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const shown = onWeek(keys[event.key], 'keys');
    if (event.target instanceof HTMLElement && event.target.dataset.hubWeekChip !== undefined) {
      navRef.current?.querySelector<HTMLElement>(`[data-hub-week-chip="${shown}"]`)?.focus();
    }
  };
  const arrow =
    'border-border/60 hover:bg-muted/50 focus-visible:ring-ring inline-flex size-11 shrink-0 items-center justify-center rounded-full border transition-[opacity,background-color] focus-visible:ring-2 focus-visible:outline-none aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-transparent sm:size-9';
  return (
    <div
      ref={navRef}
      role="group"
      aria-label={t('weekNav')}
      onKeyDown={onKeyDown}
      className="flex scroll-mt-24 flex-wrap items-center gap-2"
    >
      <button
        type="button"
        data-hub-week-prev=""
        aria-label={t('weekPrev')}
        aria-disabled={week === 0}
        onClick={() => onWeek(week - 1, 'arrow')}
        className={arrow}
      >
        <ChevronLeft aria-hidden className="size-5" />
      </button>
      <p
        aria-live="polite"
        className="min-w-0 flex-1 text-center text-base font-semibold sm:min-w-56 sm:flex-none"
      >
        {formatDateRange(current.from, current.to, locale, { weekday: true })}
      </p>
      <button
        type="button"
        data-hub-week-next=""
        aria-label={t('weekNext')}
        aria-disabled={week === last}
        onClick={() => onWeek(week + 1, 'arrow')}
        className={arrow}
      >
        <ChevronRight aria-hidden className="size-5" />
      </button>
      <div className="hidden flex-wrap items-center gap-2 sm:ml-auto sm:flex">
        {weeks.map((w, i) => (
          <FilterChip
            key={w.from}
            pressed={i === week}
            onClick={() => onWeek(i, 'chip')}
            data-hub-week-chip={i}
          >
            {formatDateRange(w.from, w.to, locale)}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

/**
 * The accessible name of a tile: who, when, how long, how busy for that park, the hours and the
 * marks.
 */
function useCellLabel(locale: string, timezone: string) {
  const t = useTranslations('tripHub.calendar');
  const tLevel = useTranslations('parks.crowdLevels');
  return useCallback(
    (parkName: string, date: string, day: TripParkDay | undefined, quietest: boolean) => {
      const when = formatHubDate(date, locale);
      if (day?.status === 'CLOSED') return t('cellClosed', { park: parkName, date: when });
      if (!isRankable(day)) {
        return day?.status === 'OPERATING'
          ? t('cellOpen', { park: parkName, date: when })
          : t('cellUnknown', { park: parkName, date: when });
      }
      const level = tintLevel(day.crowdLevel);
      const parts = [
        t('cell', {
          park: parkName,
          date: when,
          minutes: shownWait(day)!,
          level: level ? tLevel(level) : tLevel('unknown'),
        }),
      ];
      const close = dayGuestClose(day);
      if (day.status === 'OPERATING' && day.opensAt && close) {
        parts.push(formatHoursRange(day.opensAt, close, locale, timezone));
      }
      if (quietest) parts.push(t('quietest'));
      if (closesEarly(day) && close) {
        parts.push(t('cellEarly', { time: formatClockTime(close, locale, timezone) }));
      }
      if (hoursUnpublished(day)) parts.push(t('cellNoHours'));
      if (day.basis === 'last_year') parts.push(t('lastYear'));
      return parts.join(', ');
    },
    [locale, t, tLevel, timezone]
  );
}

/** A day's holidays and school breaks, each name once, in the reader's language. */
function holidayNames(day: TripCalendarDay, locale: string): string {
  return [
    ...new Set((day.holidays ?? []).map((h) => translateHolidayName(cleanBreakName(h), locale))),
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * A park's quietest day of each week beside its name: the star, the date and the wait its tile
 * prints, one per week, so paging shows the week's. Nothing in a week without one (no open day
 * with a forecast).
 */
function QuietestNote({
  slug,
  dates,
  days,
  locale,
  className,
}: {
  slug: string;
  /** The park's quietest day per week (`HubQuiet`). */
  dates: readonly (string | null)[];
  days: readonly TripCalendarDay[];
  locale: string;
  className?: string;
}) {
  const t = useTranslations('tripHub.calendar');
  const tCommon = useTranslations('common');
  return (
    <>
      {dates.map((date, w) => {
        const park = date ? days.find((d) => d.date === date)?.parks[slug] : undefined;
        const minutes = park ? shownWait(park) : null;
        if (!date || minutes == null) return null;
        return (
          <span
            key={date}
            className={cn(
              HUB_WEEK_ITEM[w],
              'text-foreground text-[11px] font-semibold whitespace-nowrap tabular-nums',
              className
            )}
          >
            <Star
              role="img"
              aria-label={t('quietest')}
              className="mr-1 inline size-3 fill-current align-[-2px]"
            />
            {formatHubDate(date, locale, 'weekdayDay')} · {minutes} {tCommon('min')}
          </span>
        );
      })}
    </>
  );
}

/**
 * The phone's week, the desktop grid at a phone's width: per resort a card with the week's dates
 * (each a button to the day's sheet, with the storm bar and a dot for a holiday), then each park's
 * name with its quietest day of the week (`QuietestNote`) and its seven days as 44 px tiles
 * (`CalendarDayTile` `mini`), that day ringed and starred. A park whose whole window says one thing
 * is one line. Every day is in the served HTML; `data-week` shows a week of them, and the cards
 * do not take the week, so paging re-renders none of them.
 */
function PhoneWeek({
  storm,
  groups,
  week,
  ...card
}: Omit<PhoneGroupProps, 'group'> & { groups: RegionGroup[]; week: number }) {
  const t = useTranslations('tripHub.calendar');
  return (
    <div data-week={week} className="group/week space-y-3">
      {storm && <StormKey storm={storm} className="text-muted-foreground text-xs" />}
      <ul aria-label={t('listLabel')} className="space-y-3">
        {groups.map((group) => (
          <PhoneGroup key={group.key} group={group} storm={storm} {...card} />
        ))}
      </ul>
    </div>
  );
}

/** What a resort's card on a phone needs; none of it changes with the week shown. */
interface PhoneGroupProps {
  group: RegionGroup;
  days: readonly TripCalendarDay[];
  storm: ReadonlyMap<string, StormCode> | null;
  tiles: HubTiles;
  stars: HubStars;
  quiet: HubQuiet;
  todayIso: string;
  locale: string;
  timezone: string;
  onOpen: (date: string) => void;
}

/** One resort's card of the phone's week; memoised, so a week press skips it. */
const PhoneGroup = memo(function PhoneGroup({
  group,
  days,
  storm,
  tiles,
  stars,
  quiet,
  todayIso,
  locale,
  timezone,
  onOpen,
}: PhoneGroupProps) {
  const t = useTranslations('tripHub.calendar');
  const tClimate = useTranslations('tripPlanner.climate');
  const label = useCellLabel(locale, timezone);
  const pageOf = (index: number) => HUB_WEEK_ITEM[Math.floor(index / HUB_WEEK_DAYS)];
  return (
    <li className="border-border/60 bg-card/60 rounded-xl border p-3">
      <h3 className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
        {group.name}
      </h3>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const stormCode = storm?.get(day.date);
          const holidays = holidayNames(day, locale);
          return (
            <div key={day.date} className={pageOf(index)}>
              <button
                type="button"
                onClick={() => onOpen(day.date)}
                aria-haspopup="dialog"
                aria-label={[
                  t('openDay', { date: formatHubDate(day.date, locale, 'long') }),
                  ...(stormCode ? [tClimate(stormCode)] : []),
                  ...(holidays ? [holidays] : []),
                ].join(', ')}
                className={cn(
                  'focus-visible:ring-ring relative flex min-h-11 w-full flex-col items-center justify-center rounded-md text-[11px] leading-tight focus-visible:ring-2 focus-visible:outline-none',
                  isWeekend(day.date) && 'bg-muted/40'
                )}
              >
                <span className="text-muted-foreground font-medium">
                  {formatHubDate(day.date, locale, 'weekday')}
                </span>
                <time
                  dateTime={day.date}
                  className={cn(
                    'text-sm font-bold tabular-nums',
                    day.date === todayIso &&
                      'bg-primary text-primary-foreground rounded-full px-1.5'
                  )}
                >
                  {formatHubDate(day.date, locale, 'day')}
                </time>
                {holidays && (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute top-1 right-1 size-1.5 rounded-full',
                      DAY_SIGNAL_CLASS[day.isHoliday ? 'holiday' : 'school']
                    )}
                  />
                )}
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 h-1 w-full rounded-full',
                    stormCode && STORM_SIGNAL_CLASS[stormSignal(stormCode)]
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-2 space-y-2.5">
        {group.parks.map((park) => {
          const name = shortParkName(park.name);
          const state = parkState(days, park.slug);
          const own = tiles.get(park.slug) ?? [];
          return (
            <div key={park.slug}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="min-w-0 truncate text-sm font-medium">{name}</p>
                {!state && (
                  <QuietestNote
                    slug={park.slug}
                    dates={quiet.get(park.slug) ?? []}
                    days={days}
                    locale={locale}
                    className="shrink-0"
                  />
                )}
              </div>
              {state ? (
                <p className="border-border/40 bg-muted/20 text-muted-foreground mt-1 flex h-9 items-center rounded-lg border px-3 text-xs">
                  {t(state)}
                </p>
              ) : (
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    const star = stars.has(`${park.slug}:${day.date}`);
                    return (
                      <div key={day.date} className={pageOf(index)}>
                        <CalendarDayTile
                          density="mini"
                          {...own[index]}
                          best={star ? t('quietest') : null}
                          className={cn(star && HUB_CELL_BEST)}
                          onSelect={() => onOpen(day.date)}
                          aria-haspopup="dialog"
                          aria-label={label(name, day.date, day.parks[park.slug], star)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </li>
  );
});

/** A day's holidays as one line: the signal colour of a public holiday or a school break, the names. */
function HolidayLine({ day, names }: { day: TripCalendarDay; names: string }) {
  return (
    <span className="flex items-start gap-1.5 text-[11px] leading-tight">
      <span
        aria-hidden
        className={cn(
          'mt-[3px] size-1.5 shrink-0 rounded-full',
          DAY_SIGNAL_CLASS[day.isHoliday ? 'holiday' : 'school']
        )}
      />
      <span className="line-clamp-2">{names}</span>
    </span>
  );
}

/**
 * The storm season by the planner's own rule (`stormCodeOn`), per day of the window, so the hub's
 * timeline and the date grid mark the same days; `null` when none of them is in it.
 */
function useStormDays(days: readonly TripCalendarDay[], weather: TripRegion['weather']) {
  return useMemo(() => {
    const marked = days.flatMap((d) => {
      const code = stormCodeOn(d.date, weather);
      return code ? [[d.date, code] as const] : [];
    });
    return marked.length > 0 ? new Map<string, StormCode>(marked) : null;
  }, [days, weather]);
}

/**
 * What the bar under the dates means, the season before its peak as the planner names them
 * (`tripPlanner.climate`), in the signal violet, never a crowd tint.
 */
function StormKey({
  storm,
  className,
}: {
  storm: ReadonlyMap<string, StormCode>;
  className?: string;
}) {
  const tClimate = useTranslations('tripPlanner.climate');
  const codes = [...new Set(storm.values())].sort((a) => (a.endsWith('_season') ? -1 : 1));
  return (
    <span className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', className)}>
      {codes.map((code) => (
        <span key={code} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn('h-1.5 w-5 rounded-full', STORM_SIGNAL_CLASS[stormSignal(code)])}
          />
          {tClimate(code)}
        </span>
      ))}
    </span>
  );
}

/** One column of the grid: a day of the window, or a slot that fills the last week to seven. */
interface Slot {
  week: number;
  /** The day's place in the window; `null` for a filler. */
  index: number | null;
}

/**
 * The desktop grid: a real `<table>` with a caption and `scope`d headers, parks by resort down the
 * side and seven days across, each park's quietest day of the week ringed and starred and named
 * under the park (`QuietestNote`). Above the tiles each day's holidays; a park whose whole window
 * says one thing (closed for the season, no hours yet) is one line instead of tiles. One tab stop for the grid:
 * the arrows move between the week's tiles, Enter opens the day (`role="grid"` with a roving
 * `tabIndex`). Memoised, so the urgent render of a week press skips it.
 */
const Matrix = memo(function Matrix({
  days,
  storm,
  groups,
  tiles,
  stars,
  quiet,
  weeks,
  week,
  todayIso,
  locale,
  timezone,
  onOpen,
}: {
  days: readonly TripCalendarDay[];
  storm: ReadonlyMap<string, StormCode> | null;
  groups: RegionGroup[];
  tiles: HubTiles;
  stars: HubStars;
  quiet: HubQuiet;
  weeks: readonly HubWeek[];
  week: number;
  todayIso: string;
  locale: string;
  timezone: string;
  onOpen: (date: string) => void;
}) {
  const t = useTranslations('tripHub.calendar');
  const tRegion = useTranslations('tripRegion.hub.calendar');
  const label = useCellLabel(locale, timezone);
  const tableRef = useRef<HTMLTableElement>(null);
  const [focus, setFocus] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const slots = useMemo<Slot[]>(
    () =>
      weeks.flatMap((w, wi) =>
        Array.from({ length: HUB_WEEK_DAYS }, (_, k) => ({
          week: wi,
          index: k < w.length ? w.start + k : null,
        }))
      ),
    [weeks]
  );
  const states = useMemo(
    () => new Map(groups.flatMap((g) => g.parks.map((p) => [p.slug, parkState(days, p.slug)]))),
    [groups, days]
  );
  const rows = useMemo(
    () => groups.flatMap((g) => g.parks.filter((p) => !states.get(p.slug)).map((p) => p.slug)),
    [groups, states]
  );
  const current = weeks[week] ?? { from: '', to: '', start: 0, length: 0 };
  const lastCol = current.start + current.length - 1;
  // The tab stop stays in the week shown: a week turned under it moves it to that week's first day.
  const tab = {
    r: Math.min(focus.r, rows.length - 1),
    c: focus.c >= current.start && focus.c <= lastCol ? focus.c : current.start,
  };

  const move = (r: number, c: number) => {
    const next = {
      r: Math.max(0, Math.min(rows.length - 1, r)),
      c: Math.max(current.start, Math.min(lastCol, c)),
    };
    setFocus(next);
    tableRef.current?.querySelector<HTMLElement>(`[data-cell="${next.r}:${next.c}"]`)?.focus();
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, [number, number]> = {
      ArrowRight: [0, 1],
      ArrowLeft: [0, -1],
      ArrowDown: [1, 0],
      ArrowUp: [-1, 0],
    };
    if (event.key in keys) {
      event.preventDefault();
      const [dr, dc] = keys[event.key];
      move(tab.r + dr, tab.c + dc);
    } else if (event.key === 'Home') {
      event.preventDefault();
      move(tab.r, current.start);
    } else if (event.key === 'End') {
      event.preventDefault();
      move(tab.r, lastCol);
    }
  };

  const rowOf = new Map(rows.map((slug, i) => [slug, i]));
  return (
    <div className="border-border/60 bg-card/40 rounded-xl border">
      <table
        ref={tableRef}
        role="grid"
        data-week={week}
        onKeyDown={onKeyDown}
        className="group/week w-full table-fixed border-separate border-spacing-1 text-sm"
      >
        <caption className="sr-only">
          {current.from && tRegion.has('caption')
            ? tRegion('caption', {
                from: formatHubDate(current.from, locale),
                to: formatHubDate(current.to, locale),
              })
            : t('listLabel')}
        </caption>
        <MatrixHead
          days={days}
          storm={storm}
          slots={slots}
          todayIso={todayIso}
          locale={locale}
          onOpen={onOpen}
        />
        {groups.map((group) => (
          <tbody key={group.key}>
            <tr>
              <th
                scope="rowgroup"
                colSpan={HUB_WEEK_DAYS + 1}
                className="text-muted-foreground px-2 pt-3 pb-1 text-left text-[11px] font-semibold tracking-wider uppercase"
              >
                {group.name}
              </th>
            </tr>
            {group.parks.map((park) => {
              const state = states.get(park.slug);
              const r = rowOf.get(park.slug) ?? 0;
              return state ? (
                <QuietRow
                  key={park.slug}
                  name={shortParkName(park.name)}
                  state={t(state)}
                  weeks={weeks}
                />
              ) : (
                <ParkRow
                  key={park.slug}
                  slug={park.slug}
                  name={shortParkName(park.name)}
                  r={r}
                  days={days}
                  slots={slots}
                  tiles={tiles}
                  stars={stars}
                  quietest={quiet.get(park.slug) ?? []}
                  tabCol={tab.r === r ? tab.c : null}
                  label={label}
                  locale={locale}
                  onOpen={onOpen}
                  onFocusCell={setFocus}
                />
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
});

/**
 * The grid's head: each date, a button that opens the day, with the storm season under it, then
 * the day's holidays. Its props do not change with the week, so paging skips it. The holidays' row
 * is drawn when a day of the window fills it, so turning a week never adds a row.
 */
const MatrixHead = memo(function MatrixHead({
  days,
  storm,
  slots,
  todayIso,
  locale,
  onOpen,
}: {
  days: readonly TripCalendarDay[];
  storm: ReadonlyMap<string, StormCode> | null;
  slots: readonly Slot[];
  todayIso: string;
  locale: string;
  onOpen: (date: string) => void;
}) {
  const t = useTranslations('tripHub.calendar');
  const tClimate = useTranslations('tripPlanner.climate');
  const holidays = useMemo(() => days.map((d) => holidayNames(d, locale)), [days, locale]);
  const filler = (slot: Slot, i: number) => (
    <td key={`pad-${i}`} aria-hidden className={HUB_WEEK_CELL[slot.week]} />
  );
  const rowLabel = 'text-muted-foreground px-2 text-left align-top text-[11px] font-medium';
  return (
    <thead>
      <tr>
        <th
          scope="col"
          className="w-40 px-2 pb-1 text-left align-bottom text-[11px] font-medium xl:w-44"
        >
          <span className="sr-only">{t('parkColumn')}</span>
          {storm && <StormKey storm={storm} className="text-muted-foreground" />}
        </th>
        {slots.map((slot, i) => {
          if (slot.index === null) return filler(slot, i);
          const day = days[slot.index];
          const stormCode = storm?.get(day.date);
          return (
            <th
              key={day.date}
              scope="col"
              className={cn('p-0 align-bottom', HUB_WEEK_CELL[slot.week])}
            >
              <button
                type="button"
                tabIndex={-1}
                onClick={() => onOpen(day.date)}
                aria-label={[
                  t('openDay', { date: formatHubDate(day.date, locale, 'long') }),
                  ...(stormCode ? [tClimate(stormCode)] : []),
                ].join(', ')}
                className={cn(
                  'hover:bg-muted/60 flex w-full flex-col items-center rounded-md py-1 text-[11px] leading-tight',
                  isWeekend(day.date) && 'bg-muted/40'
                )}
              >
                <span className="text-muted-foreground font-medium">
                  {formatHubDate(day.date, locale, 'weekday')}
                </span>
                <time
                  dateTime={day.date}
                  className={cn(
                    'text-sm font-bold tabular-nums',
                    day.date === todayIso &&
                      'bg-primary text-primary-foreground rounded-full px-1.5'
                  )}
                >
                  {formatHubDate(day.date, locale, 'dayMonth')}
                </time>
                <span className="text-muted-foreground h-3 text-[9px]">
                  {dayBasis(day) === 'long_range' ? t('outlook') : ''}
                </span>
                {/* The storm season on the timeline itself, where a date is picked, not in a
                    lane under the calendar; the empty bar keeps every date the same height. */}
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 h-1.5 w-[calc(100%+0.25rem)]',
                    stormCode && STORM_SIGNAL_CLASS[stormSignal(stormCode)]
                  )}
                />
              </button>
            </th>
          );
        })}
      </tr>
      {holidays.some(Boolean) && (
        <tr>
          <th scope="row" className={rowLabel}>
            {t('holidayRow')}
          </th>
          {slots.map((slot, i) => {
            if (slot.index === null) return filler(slot, i);
            const day = days[slot.index];
            return (
              <td key={day.date} className={cn('h-8 px-1 align-top', HUB_WEEK_CELL[slot.week])}>
                {holidays[slot.index] && <HolidayLine day={day} names={holidays[slot.index]} />}
              </td>
            );
          })}
        </tr>
      )}
    </thead>
  );
});

/**
 * A park's row of tiles, its quietest day of the week under its name; memoised on everything but
 * the tab stop, so paging skips it.
 */
const ParkRow = memo(function ParkRow({
  slug,
  name,
  r,
  days,
  slots,
  tiles,
  stars,
  quietest,
  tabCol,
  label,
  locale,
  onOpen,
  onFocusCell,
}: {
  slug: string;
  name: string;
  r: number;
  days: readonly TripCalendarDay[];
  slots: readonly Slot[];
  tiles: HubTiles;
  stars: HubStars;
  /** The park's quietest day per week (`HubQuiet`). */
  quietest: readonly (string | null)[];
  /** The column holding the grid's tab stop, when it is in this row. */
  tabCol: number | null;
  label: ReturnType<typeof useCellLabel>;
  locale: string;
  onOpen: (date: string) => void;
  onFocusCell: (cell: { r: number; c: number }) => void;
}) {
  const t = useTranslations('tripHub.calendar');
  const own = tiles.get(slug) ?? [];
  return (
    <tr>
      <th scope="row" className="px-2 text-left align-middle font-medium">
        <span className="block truncate text-sm">{name}</span>
        <QuietestNote slug={slug} dates={quietest} days={days} locale={locale} />
      </th>
      {slots.map((slot, i) => {
        if (slot.index === null) {
          return <td key={`pad-${i}`} aria-hidden className={HUB_WEEK_CELL[slot.week]} />;
        }
        const c = slot.index;
        const day = days[c];
        const star = stars.has(`${slug}:${day.date}`);
        return (
          <td key={day.date} role="gridcell" className={cn('p-0', HUB_WEEK_CELL[slot.week])}>
            <CalendarDayTile
              density="compact"
              {...own[c]}
              best={star ? t('quietest') : null}
              className={cn(star && HUB_CELL_BEST)}
              onSelect={() => onOpen(day.date)}
              tabIndex={tabCol === c ? 0 : -1}
              data-cell={`${r}:${c}`}
              onFocus={() => onFocusCell({ r, c })}
              aria-haspopup="dialog"
              aria-label={label(name, day.date, day.parks[slug], star)}
            />
          </td>
        );
      })}
    </tr>
  );
});

/**
 * A park whose whole window says one thing (closed for the season, no hours yet, open without a
 * forecast): one line across the week instead of seven tiles that repeat it.
 */
function QuietRow({
  name,
  state,
  weeks,
}: {
  name: string;
  state: string;
  weeks: readonly HubWeek[];
}) {
  return (
    <tr>
      <th scope="row" className="px-2 text-left align-middle font-medium">
        <span className="block truncate text-sm">{name}</span>
      </th>
      {weeks.map((w, i) => (
        <td key={w.from} colSpan={HUB_WEEK_DAYS} className={cn('p-0', HUB_WEEK_CELL[i])}>
          <span className="border-border/40 bg-muted/20 text-muted-foreground flex h-9 items-center rounded-lg border px-3 text-xs">
            {state}
          </span>
        </td>
      ))}
    </tr>
  );
}

/**
 * A park's state for the whole window, where every day says the same: closed for the season, no
 * hours yet, open without a forecast. `null` when its days differ.
 */
function parkState(
  days: readonly TripCalendarDay[],
  slug: string
): 'stateClosed' | 'stateUnknown' | 'stateOpen' | null {
  if (days.length === 0) return null;
  const all = (test: (d: TripParkDay | undefined) => boolean) =>
    days.every((day) => test(day.parks[slug]));
  if (all((d) => d?.status === 'CLOSED')) return 'stateClosed';
  if (all((d) => !isRankable(d) && (!d || d.status === 'UNKNOWN'))) return 'stateUnknown';
  if (all((d) => d?.status === 'OPERATING' && !isRankable(d))) return 'stateOpen';
  return null;
}

/**
 * The events under the calendar, closed to one summary row ("Mickey's Very Merry Christmas Party:
 * 12 nights · Festival of the Holidays · Thanksgiving break 21–29 Nov"); opened, a lane per event
 * with the days it runs on. A `<details>`, so the lanes are in the served HTML.
 */
function EventLanes({
  calendar,
  region,
  locale,
}: {
  calendar: TripCalendar;
  region: TripRegion;
  locale: string;
}) {
  const t = useTranslations('tripHub.lanes');
  const tRegion = useTranslations('tripRegion.hub.lanes');
  // A school-holiday lane says whose holidays they are in the region's own words; a region that
  // has not written them gets no such lane rather than a key path.
  const breaksNamed = tRegion.has('break') && tRegion.has('unnamedBreak');
  // The storm season is on the timeline above (`StormKey`), where a date is picked.
  const lanes = useMemo<EventLane[]>(
    () =>
      eventLanes(
        calendar,
        region.parks.map((p) => p.slug)
      ).filter((lane) => lane.kind !== 'break' || breaksNamed),
    [calendar, region, breaksNamed]
  );
  const nameOf = (lane: EventLane) =>
    lane.kind === 'break'
      ? lane.name
        ? translateHolidayName(cleanBreakName(lane.name), locale)
        : tRegion('unnamedBreak')
      : (lane.name ?? '');
  const parkNames = (lane: EventLane) =>
    lane.parkSlugs
      .map((slug) => region.parks.find((p) => p.slug === slug))
      .filter((p) => p !== undefined)
      .map((p) => shortParkName(p.name))
      .join(', ');
  const summary = (lane: EventLane) =>
    lane.kind === 'party'
      ? t('nights', { name: nameOf(lane), count: lane.dates.length })
      : lane.kind === 'break'
        ? tRegion('break', {
            name: nameOf(lane),
            dates: formatDateRange(lane.dates[0], lane.dates[lane.dates.length - 1], locale),
          })
        : nameOf(lane);
  if (lanes.length === 0) {
    return tRegion.has('none') ? (
      <p className="text-muted-foreground text-sm">{tRegion('none')}</p>
    ) : null;
  }
  const first = calendar.days[0]?.date;
  const span = calendar.days.length;
  return (
    <details className="group border-border/60 rounded-xl border">
      <summary className="hover:bg-muted/40 flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2 text-sm">
        <span className="text-muted-foreground shrink-0 text-xs font-semibold tracking-wide uppercase">
          {t('summaryLabel')}
        </span>
        <span className="min-w-0 flex-1 truncate">{lanes.map(summary).join(' · ')}</span>
        <ChevronDown
          aria-hidden
          className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <ul className="space-y-2 px-3 pb-3">
        {lanes.map((lane) => (
          <li
            key={lane.id}
            className="grid gap-1 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-center"
          >
            <span className="text-sm">
              <span className="font-medium">{nameOf(lane)}</span>
              {(lane.parkSlugs.length > 0 || lane.status === 'expected') && (
                <span className="text-muted-foreground block text-xs">
                  {[parkNames(lane), lane.status === 'expected' ? t('expected') : null]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              )}
            </span>
            {/* The lane: one notch per day of the window, filled where the event runs. Read as the
                dates beside it by a screen reader, which the notches would only repeat. */}
            <span className="flex flex-col gap-1">
              <span aria-hidden className="flex h-2.5 gap-px overflow-hidden rounded-full">
                {calendar.days.map((day) => (
                  <span
                    key={day.date}
                    className={cn(
                      'flex-1',
                      lane.dates.includes(day.date)
                        ? lane.kind === 'break'
                          ? 'bg-amber-500/70'
                          : lane.status === 'expected'
                            ? 'bg-primary/30'
                            : 'bg-primary/70'
                        : 'bg-muted/40'
                    )}
                  />
                ))}
              </span>
              <span className="text-muted-foreground text-xs">
                {lane.kind === 'party' || lane.dates.length < span
                  ? summarizeDates(lane.dates, locale)
                  : first
                    ? t('allDays')
                    : ''}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Dates as runs, "Nov 12 – 14, Nov 17, Nov 19 – 21", for a lane's line of text. */
function summarizeDates(dates: string[], locale: string): string {
  const runs: Array<[string, string]> = [];
  for (const date of dates) {
    const last = runs[runs.length - 1];
    if (last && addDays(last[1], 1) === date) last[1] = date;
    else runs.push([date, date]);
  }
  return runs.map(([a, b]) => formatDateRange(a, b, locale)).join(', ');
}
