'use client';

import {
  Fragment,
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarDayTile, type CalendarDayTileProps } from '@/components/parks/calendar-day-tile';
import { CalendarIcon, CalendarSeasonIcon } from '@/components/parks/calendar-icon-sprite';
import { SEASON_ICON_QUIET_CLASS } from '@/components/parks/season-kind-icon';
import { SignalBar, type SignalSegment } from '@/components/parks/signal-bar';
import { cn } from '@/lib/utils';
import { HubFilterChip as FilterChip } from './hub-filter-chip';
import { useLocationHash } from '@/lib/hooks/use-location-hash';
import { DAY_SIGNAL_CLASS, STORM_SIGNAL_CLASS } from '@/lib/utils/day-signal-styles';
import { formatClockTime, formatHoursRange } from '@/lib/utils/intl-format';
import { addDays } from '@/lib/utils/park-day';
import { translateHolidayName } from '@/lib/utils/holiday-names';
import { cleanBreakName } from '@/lib/trip-regions/break-runs';
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
  parkWeekEvents,
  regionGroups,
  shortGroupName,
  shortParkName,
  tintLevel,
  type EventLane,
  type HubWeek,
  type HubWeekMark,
  type ParkWeekEvents,
  type RegionGroup,
  type WeekTrack,
  splitsWeather,
  weekMarks,
} from '@/lib/trip-regions/hub-data';
import { hubPicks, pickHubDay, type HubPicks } from '@/lib/trip-regions/hub-picks';
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
import {
  EARLY_CLOSE_CORNER,
  HUB_CELL_TAKEN,
  HUB_EVENT_BAR,
  HUB_EVENT_BAR_EXPECTED,
  HUB_WEEK_CELL,
  HUB_WEEK_ITEM,
  HUB_WEEK_LAYER,
} from './hub-cell-styles';
import { clearTripPagePark, HubDaySheet } from './hub-day-sheet';
import { startTripPlanner } from './hub-hero-action';
import { useVisitedParks, VisitedDim, VisitedMark, VisitedRow, VisitedToggle } from './hub-visited';
import { HubPickLine } from './hub-pick-line';
import { DayWeather, WeatherSpan } from '@/components/common/day-weather';
import { weatherRuns } from '@/lib/utils/day-weather';

/** The history state key of an open day sheet, which Back closes. */
const SHEET_ENTRY = 'hubDaySheet';

/** What a park's tile shows on a day; the ring and the star are the week's. */
type HubTile = Pick<
  CalendarDayTileProps,
  'level' | 'closed' | 'wait' | 'status' | 'hours' | 'overlay'
>;

/** Each park's tiles, by its slug, one per day of the window. */
type HubTiles = ReadonlyMap<string, readonly HubTile[]>;

/**
 * Each park's day of each week around the visitor's picks (`weekMarks`), by its slug: its picked
 * day or its quietest free one, or `null`.
 */
type HubQuiet = ReadonlyMap<string, readonly (HubWeekMark | null)[]>;

/** The days a park's ring and star stand on, as `<slug>:<date>`. */
type HubStars = ReadonlySet<string>;

/** How a park's tile stands to the visitor's picks: its own pick, another park's, or neither. */
interface PickState {
  picked: boolean;
  /** The short name of the park picked on the date instead, if another one is. */
  takenBy: string | null;
}

/** A tile's {@link PickState} from the picks and the parks' short names. */
function pickStateOf(
  picks: HubPicks,
  names: ReadonlyMap<string, string>,
  slug: string,
  date: string
): PickState {
  const by = picks[date];
  if (by === slug) return { picked: true, takenBy: null };
  return { picked: false, takenBy: by ? (names.get(by) ?? null) : null };
}

/** Each park's events per week of the calendar (`parkWeekEvents`), by its slug. */
type HubEvents = ReadonlyMap<string, readonly ParkWeekEvents[]>;

/** A park without an entry in {@link HubEvents}: one empty list, so a memoised row keeps its props. */
const NO_EVENTS: readonly ParkWeekEvents[] = [];

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
 * moves nothing below the grid. A press on a park's tile plans that park on that day (`hubPicks`):
 * the tile gets the tick, the other parks' tiles of the date fade, and every other park's star moves
 * to its quietest day still free (`weekMarks`). A press on a date opens the day sheet.
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

  const pickStore = hubPicks(region.slug);
  const picks = useSyncExternalStore(
    pickStore.subscribe,
    pickStore.getSnapshot,
    pickStore.getServerSnapshot
  );
  const names = useMemo(
    () => new Map(region.parks.map((p) => [p.slug, shortParkName(p.name)])),
    [region.parks]
  );
  // What a press changed, for a screen reader; the tiles say it to the eye.
  const [announced, setAnnounced] = useState('');
  const pick = useCallback(
    (slug: string, date: string, layout: 'table' | 'phone') => {
      const store = hubPicks(region.slug);
      const own = weeks.find((w) => w.from <= date && date <= w.to);
      const weekDates = own
        ? days.slice(own.start, own.start + own.length).map((d) => d.date)
        : [date];
      const next = pickHubDay(store.getSnapshot(), slug, date, weekDates, todayIso);
      store.set(next);
      const picked = next[date] === slug;
      trackTripEvent(region.slug, 'trip_hub_day_picked', { layout, picked });
      setAnnounced(
        t(picked ? 'pickedAnnounce' : 'unpickedAnnounce', {
          park: names.get(slug) ?? slug,
          date: formatHubDate(date, locale, 'long'),
        })
      );
    },
    [region.slug, weeks, days, todayIso, t, names, locale]
  );
  const pickFromPhone = useCallback(
    (slug: string, date: string) => pick(slug, date, 'phone'),
    [pick]
  );
  const pickFromTable = useCallback(
    (slug: string, date: string) => pick(slug, date, 'table'),
    [pick]
  );
  // Only the picks this window shows and of parks the region has count.
  const pickedDays = useMemo(
    () => days.filter((d) => names.has(picks[d.date] ?? '')).length,
    [days, picks, names]
  );

  const tileOf = useHubTile(locale, timezone);
  const tiles = useMemo<HubTiles>(
    () =>
      new Map(region.parks.map((park) => [park.slug, days.map((d) => tileOf(d.parks[park.slug]))])),
    [region.parks, days, tileOf]
  );
  const visited = useVisitedParks(region.slug, todayIso);
  const quiet = useMemo<HubQuiet>(
    () =>
      weekMarks(
        days,
        weeks,
        region.parks.map((p) => p.slug),
        picks,
        visited
      ),
    [weeks, region.parks, days, picks, visited]
  );
  // What a star means, per week: the park's quietest day, or in a week with a pick the free day
  // the spread suggests for it.
  const starWords = useMemo(
    () =>
      weeks.map((w) =>
        days.slice(w.start, w.start + w.length).some((d) => picks[d.date])
          ? t('quietestFree')
          : t('quietest')
      ),
    [weeks, days, picks, t]
  );
  const stars = useMemo<HubStars>(
    () =>
      new Set(
        [...quiet].flatMap(([slug, marks]) =>
          marks.flatMap((mark) => (mark && !mark.picked ? [`${slug}:${mark.date}`] : []))
        )
      ),
    [quiet]
  );
  const storm = useStormDays(days, region.weather);
  const lanes = useMemo(
    () =>
      eventLanes(
        calendar,
        region.parks.map((p) => p.slug)
      ),
    [calendar, region.parks]
  );
  const events = useMemo<HubEvents>(
    () =>
      new Map(
        region.parks.map((park) => [
          park.slug,
          weeks.map((w) => parkWeekEvents(lanes, days, w, park.slug)),
        ])
      ),
    [region.parks, weeks, lanes, days]
  );
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

      <HubPickLine
        count={pickedDays}
        announced={announced}
        onReset={() => {
          hubPicks(region.slug).set({});
          trackTripEvent(region.slug, 'trip_hub_picks_cleared');
          setAnnounced('');
        }}
      />

      {weeks.length > 1 && (
        <WeekNav weeks={weeks} week={week} locale={locale} onWeek={showWeek} navRef={navRef} />
      )}

      <div className="lg:hidden">
        <PhoneWeek
          region={region.slug}
          days={days}
          storm={storm}
          groups={visibleGroups}
          lanes={lanes}
          weeks={weeks}
          events={events}
          tiles={tiles}
          stars={stars}
          quiet={quiet}
          picks={picks}
          names={names}
          starWords={starWords}
          week={shownWeek}
          todayIso={todayIso}
          locale={locale}
          timezone={timezone}
          onOpen={openFromPhone}
          onPick={pickFromPhone}
        />
      </div>

      <div className="hidden lg:block">
        <Matrix
          region={region.slug}
          days={days}
          storm={storm}
          groups={visibleGroups}
          lanes={lanes}
          events={events}
          tiles={tiles}
          stars={stars}
          quiet={quiet}
          picks={picks}
          names={names}
          starWords={starWords}
          weeks={weeks}
          week={shownWeek}
          todayIso={todayIso}
          locale={locale}
          timezone={timezone}
          onOpen={openFromTable}
          onPick={pickFromTable}
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
 * under the folded corner, „Zeiten folgen" for a figure without published hours. No season icon:
 * the park's events are bars under its tiles, named there.
 */
function useHubTile(locale: string, timezone: string) {
  const t = useTranslations('tripHub.calendar');
  const tLevel = useTranslations('parks.crowdLevels');
  const tCommon = useTranslations('common');
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
      return {
        level,
        closed: false,
        wait: isRankable(day) ? shownWait(day)! : null,
        // A figure without a level has no word: „Keine Prognose" beside a forecast would be wrong.
        status: level ? tLevel(level) : isRankable(day) ? '' : tLevel('unknown'),
        hours,
        overlay: early ? <span aria-hidden className={EARLY_CLOSE_CORNER} /> : undefined,
      };
    },
    [locale, timezone, t, tLevel, tCommon]
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
  // The park calendar's month step (`Button` outline icon, 44 px on a phone); `aria-disabled`, not
  // `disabled`, so the arrow keys still page from an arrow at either end.
  const arrow =
    'shrink-0 transition-[opacity,background-color] aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-transparent';
  return (
    <div
      ref={navRef}
      role="group"
      aria-label={t('weekNav')}
      onKeyDown={onKeyDown}
      className="flex scroll-mt-24 flex-wrap items-center gap-2"
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        data-hub-week-prev=""
        aria-label={t('weekPrev')}
        aria-disabled={week === 0}
        onClick={() => onWeek(week - 1, 'arrow')}
        className={arrow}
      >
        <ChevronLeft aria-hidden className="h-4 w-4" />
      </Button>
      {/* Centred and fixed-width from `sm`, like the park calendar's month, so the arrows hold
          still while the dates change length. */}
      <p
        aria-live="polite"
        className="min-w-0 flex-1 text-center font-semibold sm:w-56 sm:flex-none"
      >
        {formatDateRange(current.from, current.to, locale, { weekday: true })}
      </p>
      <Button
        type="button"
        variant="outline"
        size="icon"
        data-hub-week-next=""
        aria-label={t('weekNext')}
        aria-disabled={week === last}
        onClick={() => onWeek(week + 1, 'arrow')}
        className={arrow}
      >
        <ChevronRight aria-hidden className="h-4 w-4" />
      </Button>
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
 * The accessible name of a tile: who, when, how long, how busy for that park, the hours, the marks
 * and the park's events that day, which the bars under the tiles show.
 */
function useCellLabel(locale: string, timezone: string, lanes: readonly EventLane[]) {
  const t = useTranslations('tripHub.calendar');
  const tLevel = useTranslations('parks.crowdLevels');
  return useCallback(
    (
      slug: string,
      parkName: string,
      date: string,
      day: TripParkDay | undefined,
      star: string | null,
      pick: PickState
    ) => {
      const when = formatHubDate(date, locale);
      if (day?.status === 'CLOSED') return t('cellClosed', { park: parkName, date: when });
      const picked = pick.picked
        ? [t('picked')]
        : pick.takenBy
          ? [t('cellTaken', { park: pick.takenBy })]
          : [];
      const events = lanes
        .filter((lane) => lane.name && lane.byPark[slug]?.dates.includes(date))
        .sort((a, b) => Number(a.kind !== 'party') - Number(b.kind !== 'party'))
        .map((lane) => lane.name!);
      if (!isRankable(day)) {
        return [
          day?.status === 'OPERATING'
            ? t('cellOpen', { park: parkName, date: when })
            : t('cellUnknown', { park: parkName, date: when }),
          ...picked,
          ...events,
        ].join(', ');
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
      parts.push(...picked);
      if (star) parts.push(star);
      if (closesEarly(day) && close) {
        parts.push(t('cellEarly', { time: formatClockTime(close, locale, timezone) }));
      }
      if (hoursUnpublished(day)) parts.push(t('cellNoHours'));
      if (day.basis === 'last_year') parts.push(t('lastYear'));
      return [...parts, ...events].join(', ');
    },
    [locale, t, tLevel, timezone, lanes]
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
 * A park's day of each week beside its name, one per week, so paging shows the week's: the tick
 * and the day the visitor picked for it, or the star and its quietest free day, each with the wait
 * its tile prints. Nothing in a week without one (no open day with a forecast); a picked day
 * without a forecast still names its date.
 */
function QuietestNote({
  slug,
  marks,
  days,
  locale,
  starWords,
  className,
}: {
  slug: string;
  /** The park's day per week (`HubQuiet`). */
  marks: readonly (HubWeekMark | null)[];
  days: readonly TripCalendarDay[];
  locale: string;
  /** What the star means, per week: the week's quietest day, or the free day suggested. */
  starWords: readonly string[];
  className?: string;
}) {
  const t = useTranslations('tripHub.calendar');
  const tCommon = useTranslations('common');
  return (
    <>
      {marks.map((mark, w) => {
        if (!mark) return null;
        const park = days.find((d) => d.date === mark.date)?.parks[slug];
        const minutes = park ? shownWait(park) : null;
        if (!mark.picked && minutes == null) return null;
        return (
          <span
            key={mark.date}
            className={cn(
              HUB_WEEK_ITEM[w],
              'text-foreground items-center text-[11px] font-semibold whitespace-nowrap tabular-nums',
              className
            )}
          >
            {mark.picked ? (
              <span
                role="img"
                aria-label={t('picked')}
                className="bg-primary text-primary-foreground mr-1 inline-flex size-3.5 items-center justify-center rounded-full align-[-3px]"
              >
                <CalendarIcon name="check" className="size-2.5" strokeWidth={3.5} />
              </span>
            ) : (
              <CalendarIcon
                name="star"
                role="img"
                aria-label={starWords[w]}
                className="text-primary mr-1 inline size-3 fill-current align-[-2px]"
              />
            )}
            {formatHubDate(mark.date, locale, 'weekdayDay')}
            {minutes != null && (
              <>
                {' '}
                · {minutes} {tCommon('min')}
              </>
            )}
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
  lanes,
  weeks,
  ...card
}: Omit<PhoneGroupProps, 'group'> & {
  groups: RegionGroup[];
  week: number;
  weeks: readonly HubWeek[];
}) {
  const t = useTranslations('tripHub.calendar');
  return (
    <div data-week={week} className="group/week space-y-3">
      {storm && <StormKey storm={storm} className="text-muted-foreground text-xs" />}
      <BreakKey lanes={lanes} weeks={weeks} locale={card.locale} />
      <VisitedColumnKey />
      <ul aria-label={t('listLabel')} className="space-y-3">
        {groups.map((group) => (
          <PhoneGroup key={group.key} group={group} storm={storm} lanes={lanes} {...card} />
        ))}
      </ul>
    </div>
  );
}

/** What a resort's card on a phone needs; none of it changes with the week shown. */
interface PhoneGroupProps {
  group: RegionGroup;
  /** The region's slug, whose ticked-off parks fade. */
  region: string;
  days: readonly TripCalendarDay[];
  storm: ReadonlyMap<string, StormCode> | null;
  tiles: HubTiles;
  stars: HubStars;
  quiet: HubQuiet;
  /** The visitor's picks, date → park (`hubPicks`). */
  picks: HubPicks;
  /** Each park's short name by its slug, for the tile that says which park took its date. */
  names: ReadonlyMap<string, string>;
  /** What the star means, per week (`quietest` or `quietestFree`). */
  starWords: readonly string[];
  lanes: readonly EventLane[];
  events: HubEvents;
  todayIso: string;
  locale: string;
  timezone: string;
  onOpen: (date: string) => void;
  /** Plans the park on the date, or takes the pick back (`pickHubDay`). */
  onPick: (slug: string, date: string) => void;
}

/** One resort's card of the phone's week; memoised, so a week press skips it. */
const PhoneGroup = memo(function PhoneGroup({
  group,
  region,
  days,
  storm,
  tiles,
  stars,
  quiet,
  picks,
  names,
  starWords,
  lanes,
  events,
  todayIso,
  locale,
  timezone,
  onOpen,
  onPick,
}: PhoneGroupProps) {
  const t = useTranslations('tripHub.calendar');
  const tClimate = useTranslations('tripPlanner.climate');
  const label = useCellLabel(locale, timezone, lanes);
  const pageOf = (index: number) => HUB_WEEK_ITEM[Math.floor(index / HUB_WEEK_DAYS)];
  const lead = weatherPark(group, days);
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
                <DaySignalLanes day={day} storm={storm} />
              </button>
            </div>
          );
        })}
      </div>
      {lead && <PhoneWeatherRow slug={lead} days={days} className="mt-1" />}
      <div className="mt-2 space-y-2.5">
        {group.parks.map((park) => {
          const name = shortParkName(park.name);
          const state = parkState(days, park.slug);
          const own = tiles.get(park.slug) ?? [];
          return (
            <div key={park.slug}>
              <div className="flex items-center justify-between gap-2">
                <p className="flex min-w-0 items-center gap-2 text-sm font-medium">
                  {!state && (
                    <VisitedToggle region={region} slug={park.slug} name={name} today={todayIso} />
                  )}
                  <span className="truncate">{name}</span>
                </p>
                {!state && (
                  <QuietestNote
                    slug={park.slug}
                    marks={quiet.get(park.slug) ?? []}
                    days={days}
                    locale={locale}
                    starWords={starWords}
                    className="shrink-0"
                  />
                )}
              </div>
              {splitsWeather(group) && !state && (
                <PhoneWeatherRow slug={park.slug} days={days} className="mt-1" />
              )}
              {state ? (
                <p className="border-border/40 bg-muted/20 text-muted-foreground mt-1 flex h-9 items-center rounded-lg border px-3 text-xs">
                  {t(state)}
                </p>
              ) : (
                <VisitedDim region={region} slug={park.slug} today={todayIso}>
                  <div className="mt-1 grid grid-cols-7 gap-1">
                    {days.map((day, index) => {
                      const star = stars.has(`${park.slug}:${day.date}`);
                      const pick = pickStateOf(picks, names, park.slug, day.date);
                      const tile = own[index];
                      return (
                        <div key={day.date} className={pageOf(index)}>
                          <CalendarDayTile
                            density="mini"
                            {...tile}
                            best={star ? starWords[Math.floor(index / HUB_WEEK_DAYS)] : null}
                            picked={pick.picked ? t('picked') : null}
                            className={cn(pick.takenBy && HUB_CELL_TAKEN)}
                            onSelect={tile?.closed ? undefined : () => onPick(park.slug, day.date)}
                            aria-pressed={tile?.closed ? undefined : pick.picked}
                            aria-label={label(
                              park.slug,
                              name,
                              day.date,
                              day.parks[park.slug],
                              star ? starWords[Math.floor(index / HUB_WEEK_DAYS)] : null,
                              pick
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <ParkEvents
                    slug={park.slug}
                    weeks={events.get(park.slug) ?? NO_EVENTS}
                    days={days}
                    locale={locale}
                    timezone={timezone}
                  />
                </VisitedDim>
              )}
            </div>
          );
        })}
      </div>
    </li>
  );
});

/** A phone weather cell's width in the seven-column week, by the days it covers. */
const PHONE_SPAN = [
  '',
  'col-span-1',
  'col-span-2',
  'col-span-3',
  'col-span-4',
  'col-span-5',
  'col-span-6',
  'col-span-7',
] as const;

/**
 * A park's weather on the phone, in the seven columns of its week: a forecast day its icon and
 * high, the days past the forecast one span across them (`weatherRuns`, `WeatherSpan`), as on the
 * desktop. Nothing where the park has no weather in the window.
 */
function PhoneWeatherRow({
  slug,
  days,
  className,
}: {
  slug: string;
  days: readonly TripCalendarDay[];
  className?: string;
}) {
  if (!days.some((d) => d.parks[slug]?.weather?.tempMax != null)) return null;
  const runs = weatherRuns(
    days.map((d) => d.parks[slug]?.weather),
    (i) => i % HUB_WEEK_DAYS === 0
  );
  return (
    <div className={cn('grid grid-cols-7 gap-1 text-center text-[10px]', className)}>
      {runs.map((run) => (
        <div
          key={days[run.start].date}
          className={cn(
            HUB_WEEK_ITEM[Math.floor(run.start / HUB_WEEK_DAYS)],
            PHONE_SPAN[run.length]
          )}
        >
          {run.length > 1 ? (
            <WeatherSpan weather={run.weather} days={run.length} />
          ) : (
            <DayWeather compact weather={run.weather} className="justify-center" />
          )}
        </div>
      ))}
    </div>
  );
}

/** A day's holidays as one line: the signal colour of a public holiday or a school break, the names. */
function HolidayLine({ names }: { names: string }) {
  return <span className="line-clamp-2 block text-[11px] leading-tight">{names}</span>;
}

/**
 * A date's signals under it as the crowd tile's bars (`SignalBar`), one lane each, so a run of days
 * reads as one line along the week: the holidays (a public holiday's red over the school break's
 * yellow, the whole width of its day, since half a day of each looked shifted on a timeline), and
 * in a region with a storm season in the window its own lane under it, dashed before its peak.
 * Wider than the column by the gap and centred on it, so neighbouring days meet. Empty lanes keep
 * their height, so the dates stay level.
 */
function DaySignalLanes({
  day,
  storm,
}: {
  day: TripCalendarDay;
  /** The window's storm days (`useStormDays`), `null` for a region without one in it. */
  storm: ReadonlyMap<string, StormCode> | null;
}) {
  const holiday: SignalSegment[] = day.isHoliday
    ? [{ key: 'holiday', className: DAY_SIGNAL_CLASS.holiday }]
    : day.isSchoolVacation
      ? [{ key: 'school', className: DAY_SIGNAL_CLASS.school }]
      : [];
  const code = storm?.get(day.date);
  return (
    <span className="mt-0.5 flex w-[calc(100%+0.25rem)] flex-col gap-px">
      <SignalBar segments={holiday} />
      {storm && (
        <SignalBar
          segments={
            code ? [{ key: 'storm', className: STORM_SIGNAL_CLASS[stormSignal(code)] }] : []
          }
        />
      )}
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
 * the arrows move between the week's tiles, Enter plans the park on the day (`role="grid"` with a
 * roving `tabIndex`); the dates in the head open the day. Memoised, so the urgent render of a week
 * press skips it.
 */
const Matrix = memo(function Matrix({
  region,
  days,
  storm,
  groups,
  lanes,
  events,
  tiles,
  stars,
  quiet,
  picks,
  names,
  starWords,
  weeks,
  week,
  todayIso,
  locale,
  timezone,
  onOpen,
  onPick,
}: {
  /** The region's slug, whose ticked-off parks fade. */
  region: string;
  days: readonly TripCalendarDay[];
  storm: ReadonlyMap<string, StormCode> | null;
  groups: RegionGroup[];
  lanes: readonly EventLane[];
  events: HubEvents;
  tiles: HubTiles;
  stars: HubStars;
  quiet: HubQuiet;
  /** The visitor's picks, date → park (`hubPicks`). */
  picks: HubPicks;
  /** Each park's short name by its slug. */
  names: ReadonlyMap<string, string>;
  /** What the star means, per week (`quietest` or `quietestFree`). */
  starWords: readonly string[];
  weeks: readonly HubWeek[];
  week: number;
  todayIso: string;
  locale: string;
  timezone: string;
  onOpen: (date: string) => void;
  onPick: (slug: string, date: string) => void;
}) {
  const t = useTranslations('tripHub.calendar');
  const tRegion = useTranslations('tripRegion.hub.calendar');
  const label = useCellLabel(locale, timezone, lanes);
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
    <div>
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
            <GroupHead group={group} days={days} slots={slots} />
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
                <Fragment key={park.slug}>
                  {splitsWeather(group) && (
                    <ParkWeatherRow
                      slug={park.slug}
                      name={shortParkName(park.name)}
                      days={days}
                      slots={slots}
                    />
                  )}
                  <ParkRow
                    region={region}
                    todayIso={todayIso}
                    slug={park.slug}
                    name={shortParkName(park.name)}
                    r={r}
                    days={days}
                    slots={slots}
                    tiles={tiles}
                    stars={stars}
                    quietest={quiet.get(park.slug) ?? []}
                    picks={picks}
                    names={names}
                    starWords={starWords}
                    tabCol={tab.r === r ? tab.c : null}
                    label={label}
                    locale={locale}
                    onPick={onPick}
                    onFocusCell={setFocus}
                  />
                  <ParkEventRows
                    region={region}
                    todayIso={todayIso}
                    slug={park.slug}
                    weeks={weeks}
                    events={events.get(park.slug) ?? NO_EVENTS}
                    slots={slots}
                    days={days}
                    locale={locale}
                    timezone={timezone}
                  />
                </Fragment>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
});

/**
 * The park whose weather a group's heading shows: its first park with weather in the window. A
 * resort is one place, a day trip of one park too, and a region over several cities (Tokyo, Osaka,
 * Fuji) shows each its own. Day trips of several parks have none on the heading: each park shows
 * its own (`ParkWeatherRow`).
 */
function weatherPark(group: RegionGroup, days: readonly TripCalendarDay[]): string | null {
  if (splitsWeather(group)) return null;
  return (
    group.parks.find((park) => days.some((d) => d.parks[park.slug]?.weather?.tempMax != null))
      ?.slug ?? null
  );
}

/**
 * One park's weather along the week's dates: a forecast day its own cell (`DayWeather`), the days of
 * a week past the forecast one cell across them (`weatherRuns`, `WeatherSpan`).
 */
function WeatherCells({
  slug,
  days,
  slots,
  className,
}: {
  slug: string;
  days: readonly TripCalendarDay[];
  slots: readonly Slot[];
  className?: string;
}) {
  const runs = weatherRuns(
    slots.map((slot) => (slot.index === null ? undefined : days[slot.index].parks[slug]?.weather)),
    (i) => i > 0 && (slots[i].week !== slots[i - 1].week || slots[i].index === null)
  );
  return runs.map((run) => {
    const slot = slots[run.start];
    return slot.index === null ? (
      <td key={`pad-${run.start}`} aria-hidden className={HUB_WEEK_CELL[slot.week]} />
    ) : (
      <td
        key={days[slot.index].date}
        colSpan={run.length}
        className={cn('text-center text-[11px]', HUB_WEEK_CELL[slot.week], className)}
      >
        <WeatherSpan weather={run.weather} days={run.length} className="justify-center px-1" />
      </td>
    );
  });
}

/**
 * A group's heading row. A resort's, and a day trip of one park, carries its weather along the dates
 * (`WeatherCells`); day trips of several parks and a group without weather in the window have the
 * heading alone across the row.
 */
function GroupHead({
  group,
  days,
  slots,
}: {
  group: RegionGroup;
  days: readonly TripCalendarDay[];
  slots: readonly Slot[];
}) {
  const lead = weatherPark(group, days);
  const heading =
    'text-muted-foreground px-2 pt-3 pb-1 text-left text-[11px] font-semibold tracking-wider uppercase';
  if (!lead) {
    return (
      <tr>
        <th scope="rowgroup" colSpan={HUB_WEEK_DAYS + 1} className={heading}>
          {group.name}
        </th>
      </tr>
    );
  }
  return (
    <tr>
      <th scope="rowgroup" className={heading}>
        {group.name}
      </th>
      <WeatherCells slug={lead} days={days} slots={slots} className="px-1 pt-3 pb-1" />
    </tr>
  );
}

/**
 * A day trip's weather row, right above its tiles: each day trip lies somewhere else, so each
 * shows its own. Nothing where the park has no weather in the window.
 */
function ParkWeatherRow({
  slug,
  name,
  days,
  slots,
}: {
  slug: string;
  name: string;
  days: readonly TripCalendarDay[];
  slots: readonly Slot[];
}) {
  const t = useTranslations('dayWeather');
  if (!days.some((d) => d.parks[slug]?.weather?.tempMax != null)) return null;
  return (
    <tr>
      <th scope="row" className="p-0">
        <span className="sr-only">{t('rowLabel', { park: name })}</span>
      </th>
      <WeatherCells slug={slug} days={days} slots={slots} className="px-1 pt-3 pb-0" />
    </tr>
  );
}

/**
 * What the ring before a park's name is for, in the ring's own look: „Bereits besucht?“. A tick
 * fades the park's days and moves the day's tip on; it changes no park choice.
 */
function VisitedColumnKey({ className }: { className?: string }) {
  const t = useTranslations('tripHub.visited');
  return (
    <span
      className={cn(
        'text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium',
        className
      )}
    >
      <VisitedMark visited={false} className="size-3.5" />
      {t('column')}
    </span>
  );
}

/**
 * The grid's head: each date, a button that opens the day, with the day's signal bar under it
 * (school break, public holiday, storm season), then the names of the day's holidays. Its props do not change with the week, so paging skips it. The holidays' row
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
          <VisitedColumnKey className="mt-1.5" />
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
                {/* The day's signals on the timeline itself, where a date is picked. */}
                <DaySignalLanes day={day} storm={storm} />
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
                {holidays[slot.index] && <HolidayLine names={holidays[slot.index]} />}
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
  region,
  todayIso,
  slug,
  name,
  r,
  days,
  slots,
  tiles,
  stars,
  quietest,
  picks,
  names,
  starWords,
  tabCol,
  label,
  locale,
  onPick,
  onFocusCell,
}: {
  /** The region's slug, whose ticked-off parks fade. */
  region: string;
  todayIso: string;
  slug: string;
  name: string;
  r: number;
  days: readonly TripCalendarDay[];
  slots: readonly Slot[];
  tiles: HubTiles;
  stars: HubStars;
  /** The park's day per week (`HubQuiet`). */
  quietest: readonly (HubWeekMark | null)[];
  picks: HubPicks;
  names: ReadonlyMap<string, string>;
  starWords: readonly string[];
  /** The column holding the grid's tab stop, when it is in this row. */
  tabCol: number | null;
  label: ReturnType<typeof useCellLabel>;
  locale: string;
  onPick: (slug: string, date: string) => void;
  onFocusCell: (cell: { r: number; c: number }) => void;
}) {
  const t = useTranslations('tripHub.calendar');
  const own = tiles.get(slug) ?? [];
  return (
    <VisitedRow region={region} slug={slug} today={todayIso}>
      <th scope="row" className="px-2 text-left align-middle font-medium">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <VisitedToggle region={region} slug={slug} name={name} today={todayIso} />
          <span className="truncate">{name}</span>
        </span>
        <QuietestNote
          slug={slug}
          marks={quietest}
          days={days}
          locale={locale}
          starWords={starWords}
        />
      </th>
      {slots.map((slot, i) => {
        if (slot.index === null) {
          return <td key={`pad-${i}`} aria-hidden className={HUB_WEEK_CELL[slot.week]} />;
        }
        const c = slot.index;
        const day = days[c];
        const star = stars.has(`${slug}:${day.date}`);
        const pick = pickStateOf(picks, names, slug, day.date);
        const tile = own[c];
        return (
          <td key={day.date} role="gridcell" className={cn('p-0', HUB_WEEK_CELL[slot.week])}>
            <CalendarDayTile
              density="compact"
              {...tile}
              best={star ? starWords[slot.week] : null}
              picked={pick.picked ? t('picked') : null}
              className={cn(pick.takenBy && HUB_CELL_TAKEN)}
              onSelect={tile?.closed ? undefined : () => onPick(slug, day.date)}
              tabIndex={tabCol === c ? 0 : -1}
              data-cell={`${r}:${c}`}
              onFocus={() => onFocusCell({ r, c })}
              aria-pressed={tile?.closed ? undefined : pick.picked}
              aria-label={label(
                slug,
                name,
                day.date,
                day.parks[slug],
                star ? starWords[slot.week] : null,
                pick
              )}
            />
          </td>
        );
      })}
    </VisitedRow>
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
 * How a park's event is named under its bar: its name, then what a visitor plans around. A party
 * says until when the day guests stay (the tile's folded corner on the same column), or that it
 * is a separately ticketed evening where its nights close at different times or have no hours; a
 * festival says on which day it starts or ends inside the week; an expected one says so.
 */
function useTrackWords(days: readonly TripCalendarDay[], locale: string, timezone: string) {
  const t = useTranslations('tripHub.lanes');
  return useCallback(
    (track: WeekTrack, slug: string): string => {
      const parts: string[] = [];
      if (track.lane.kind === 'party') {
        const closes = new Set(
          track.dates.map((date) => {
            const day = days.find((d) => d.date === date)?.parks[slug];
            const close = day?.status === 'OPERATING' ? dayGuestClose(day) : undefined;
            return close ? formatClockTime(close, locale, timezone) : '';
          })
        );
        const [time] = closes;
        parts.push(closes.size === 1 && time ? t('dayGuestsUntil', { time }) : t('separateTicket'));
      } else if (track.startsOn && track.endsOn) {
        parts.push(formatDateRange(track.startsOn, track.endsOn, locale));
      } else if (track.startsOn) {
        parts.push(t('from', { date: formatHubDate(track.startsOn, locale) }));
      } else if (track.endsOn) {
        parts.push(t('until', { date: formatHubDate(track.endsOn, locale) }));
      }
      if (track.lane.status === 'expected') parts.push(t('expected'));
      return parts.join(' · ');
    },
    [days, locale, timezone, t]
  );
}

/**
 * One day's piece of an event's bar: round where the event starts or ends, reaching across the
 * column gap to the next day where it goes on, flat at the week's edge where it ran before or runs
 * after, the way a wall calendar draws a stay.
 */
function TrackCell({ track, index }: { track: WeekTrack; index: number }) {
  const cell = track.cells[index];
  if (!cell) return <span />;
  return (
    <span
      className={cn(
        track.lane.status === 'expected' ? HUB_EVENT_BAR_EXPECTED : HUB_EVENT_BAR,
        'block',
        cell.start && 'rounded-l-full',
        cell.end ? 'rounded-r-full' : 'w-[calc(100%+0.25rem)]'
      )}
    />
  );
}

/** An event's name with its icon, cut before the words after it, which always stay whole. */
function TrackName({ lane, words }: { lane: EventLane; words: string }) {
  return (
    <>
      {lane.seasonKind && <CalendarSeasonIcon kind={lane.seasonKind} className="size-3 shrink-0" />}
      <span className="min-w-0 truncate font-medium">{lane.name}</span>
      {words && <span className="text-muted-foreground shrink-0 whitespace-nowrap">· {words}</span>}
    </>
  );
}

/**
 * A park's events under its tiles on a phone: per week one line for the festivals of every day, then
 * a bar on the days' columns for each party and each festival of some days, its name under it.
 * The weeks stack in one grid cell and only the shown one is visible, so the park is as tall in
 * every week and paging moves nothing below. A reader hears each event with its dates; the bars
 * only repeat them.
 */
function ParkEvents({
  slug,
  weeks,
  days,
  locale,
  timezone,
}: {
  slug: string;
  weeks: readonly ParkWeekEvents[];
  days: readonly TripCalendarDay[];
  locale: string;
  timezone: string;
}) {
  const t = useTranslations('tripHub.lanes');
  const words = useTrackWords(days, locale, timezone);
  if (weeks.every((w) => w.tracks.length === 0 && w.allWeek.length === 0)) return null;
  return (
    <div className="mt-1.5 grid grid-cols-1">
      {weeks.map((week, w) => (
        <div key={w} className={cn('col-start-1 row-start-1 space-y-1.5', HUB_WEEK_LAYER[w])}>
          {week.allWeek.length > 0 && (
            <p className="text-muted-foreground flex h-4 items-center gap-1 text-[11px] leading-4">
              {week.allWeek[0].seasonKind && (
                <CalendarSeasonIcon
                  kind={week.allWeek[0].seasonKind}
                  className={cn('size-3 shrink-0', SEASON_ICON_QUIET_CLASS)}
                />
              )}
              <span className="min-w-0 truncate">
                {t('allWeek', { names: week.allWeek.map((l) => l.name).join(' · ') })}
              </span>
            </p>
          )}
          {week.tracks.map((track) => (
            <div key={track.lane.id}>
              <div aria-hidden className="grid h-1.5 grid-cols-7 gap-1">
                {track.cells.map((_, i) => (
                  <TrackCell key={i} track={track} index={i} />
                ))}
              </div>
              <p className="mt-1 flex h-4 items-center gap-1 text-[11px] leading-4">
                <TrackName lane={track.lane} words={words(track, slug)} />
                <span className="sr-only">: {summarizeDates(track.dates, locale)}</span>
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * A park's events in the desktop grid: under its row of tiles one line across the week for the
 * festivals of every day, then one row per bar of its busiest week, the event's name and words in
 * the first column and the bar on the days' columns. Every week has as many rows, empty where it has
 * fewer events, so turning a week moves no park; the empty ones fall at the end of the park's block,
 * not between its tiles and their line. Hidden from a reader, whose tile already names
 * the day's events: a row without grid cells would break the grid.
 */
const ParkEventRows = memo(function ParkEventRows({
  region,
  todayIso,
  slug,
  weeks,
  events,
  slots,
  days,
  locale,
  timezone,
}: {
  /** The region's slug, whose ticked-off parks fade. */
  region: string;
  todayIso: string;
  slug: string;
  weeks: readonly HubWeek[];
  events: readonly ParkWeekEvents[];
  slots: readonly Slot[];
  days: readonly TripCalendarDay[];
  locale: string;
  timezone: string;
}) {
  const t = useTranslations('tripHub.lanes');
  const words = useTrackWords(days, locale, timezone);
  const rows = Math.max(0, ...events.map((e) => e.tracks.length));
  const allWeek = events.some((e) => e.allWeek.length > 0);
  const label = 'text-[11px] leading-tight';
  return (
    <>
      {allWeek && (
        <VisitedRow region={region} slug={slug} today={todayIso} aria-hidden>
          <td />
          {events.map((week, w) => (
            <td
              key={w}
              colSpan={HUB_WEEK_DAYS}
              className={cn('text-muted-foreground px-1 pb-1', label, HUB_WEEK_CELL[w])}
            >
              {week.allWeek.length > 0 && (
                <span className="flex min-w-0 items-center gap-1">
                  {week.allWeek[0].seasonKind && (
                    <CalendarSeasonIcon
                      kind={week.allWeek[0].seasonKind}
                      className={cn('size-3 shrink-0', SEASON_ICON_QUIET_CLASS)}
                    />
                  )}
                  <span className="truncate">
                    {t('allWeek', { names: week.allWeek.map((l) => l.name).join(' · ') })}
                  </span>
                </span>
              )}
            </td>
          ))}
        </VisitedRow>
      )}
      {Array.from({ length: rows }, (_, k) => (
        <VisitedRow key={k} region={region} slug={slug} today={todayIso} aria-hidden>
          <td className="px-2 pl-4 align-middle">
            {events.map((week, w) => {
              const track = week.tracks[k];
              return track ? (
                <span
                  key={w}
                  title={track.lane.name ?? undefined}
                  className={cn(HUB_WEEK_ITEM[w], label)}
                >
                  <span className="flex min-w-0 items-center gap-1">
                    <TrackName lane={track.lane} words="" />
                  </span>
                  <span className="text-muted-foreground block truncate">{words(track, slug)}</span>
                </span>
              ) : null;
            })}
          </td>
          {slots.map((slot, i) => {
            const track = events[slot.week]?.tracks[k];
            return (
              <td key={i} className={cn('h-8 p-0 align-middle', HUB_WEEK_CELL[slot.week])}>
                {track && slot.index !== null && (
                  <TrackCell track={track} index={slot.index - weeks[slot.week].start} />
                )}
              </td>
            );
          })}
        </VisitedRow>
      ))}
    </>
  );
});

/**
 * The school breaks of the week shown, above the phone's cards, in the region's words („US-Schulferien:
 * Thanksgiving Break, 21.–29. Nov.") beside the yellow of the bar under their dates. They belong to
 * no park, so they have no event bar. Every week's line stacks in one cell, so paging moves nothing.
 */
function BreakKey({
  lanes,
  weeks,
  locale,
}: {
  lanes: readonly EventLane[];
  weeks: readonly HubWeek[];
  locale: string;
}) {
  const tRegion = useTranslations('tripRegion.hub.lanes');
  // A region that has not said whose holidays they are gets no line rather than a key path.
  if (!tRegion.has('break') || !tRegion.has('unnamedBreak')) return null;
  const breaks = lanes.filter((lane) => lane.kind === 'break');
  const perWeek = weeks.map((w) =>
    breaks.filter((lane) => lane.dates.some((date) => date >= w.from && date <= w.to))
  );
  if (perWeek.every((b) => b.length === 0)) return null;
  return (
    <div className="grid grid-cols-1">
      {perWeek.map((list, w) => (
        <p
          key={w}
          className={cn(
            'text-muted-foreground col-start-1 row-start-1 space-y-0.5 text-xs',
            HUB_WEEK_LAYER[w]
          )}
        >
          {list.map((lane) => (
            <span key={lane.id} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className={cn('h-[3px] w-3 shrink-0 rounded-full', DAY_SIGNAL_CLASS.school)}
              />
              {tRegion('break', {
                name: lane.name
                  ? translateHolidayName(cleanBreakName(lane.name), locale)
                  : tRegion('unnamedBreak'),
                dates: formatDateRange(lane.dates[0], lane.dates[lane.dates.length - 1], locale),
              })}
            </span>
          ))}
        </p>
      ))}
    </div>
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
