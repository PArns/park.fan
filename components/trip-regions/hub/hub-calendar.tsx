'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { CROWD_TEXT_CLASS, CROWD_TILE_CLASS } from '@/lib/utils/crowd-level-styles';
import { UNUSABLE_HATCH_IMAGE } from '@/lib/utils/hatch';
import { formatClockTime } from '@/lib/utils/intl-format';
import { addDays } from '@/lib/utils/park-day';
import { translateHolidayName } from '@/lib/utils/holiday-names';
import { cleanBreakName } from '@/lib/trip-regions/best-time';
import {
  closesEarly,
  dayBasis,
  formatDateRange,
  hoursUnpublished,
  dayGuestClose,
  earlyCloseBehind,
  eventLanes,
  formatHubDate,
  HUB_FIRST_DAYS,
  isRankable,
  rankGroupParks,
  regionGroups,
  shortGroupName,
  shortParkName,
  tintLevel,
  type EventLane,
  type RegionGroup,
} from '@/lib/trip-regions/hub-data';
import { tripRegionRelayUrl } from '@/lib/trip-regions/paths';
import { requireTripRegion } from '@/lib/trip-regions/registry';
import type {
  TripCalendar,
  TripCalendarDay,
  TripParkDay,
  TripRegion,
} from '@/lib/trip-regions/types';
import {
  EARLY_CLOSE_CORNER,
  HUB_CELL,
  HUB_CELL_BEST,
  HUB_CELL_LAST_YEAR,
  NO_HOURS_DOT,
} from './hub-cell-styles';
import { clearTripPagePark, HubDaySheet } from './hub-day-sheet';

/** How long a window stays fresh in the browser: the API's hour. */
const CALENDAR_STALE_MS = 60 * 60 * 1000;

/** The breakpoint where the matrix replaces the day list, the site's `lg`. */
const DESKTOP_QUERY = '(min-width: 1024px)';

/** What a square shows and how it is drawn, for one park on one day. */
interface CellLook {
  text: string;
  className: string;
  hatch: boolean;
  early: boolean;
  /** A figure without published hours: the dot the legend names. */
  noHours: boolean;
}

/**
 * The square for a park on a day: the minutes in the level's tint, hatching for closed, a muted
 * box for no figure, a dash for open without a forecast, a dashed edge for last year, and a small
 * dot where the figure stands without published hours. Nothing else: hours, events and icons are
 * the day sheet's.
 */
function cellLook(day: TripParkDay | undefined, best: boolean): CellLook {
  if (day?.status === 'CLOSED') {
    return {
      text: '',
      className: 'bg-muted/10 border-border/40',
      hatch: true,
      early: false,
      noHours: false,
    };
  }
  if (!isRankable(day)) {
    return day?.status === 'OPERATING'
      ? {
          text: '–',
          className: 'bg-muted/40 border-border/60 text-muted-foreground',
          hatch: false,
          early: false,
          noHours: false,
        }
      : {
          text: '',
          className: 'bg-muted/20 border-border/40',
          hatch: false,
          early: false,
          noHours: false,
        };
  }
  const level = tintLevel(day.crowdLevel);
  return {
    text: String(day.headlinerWait),
    className: cn(
      level ? cn(CROWD_TILE_CLASS[level], CROWD_TEXT_CLASS[level]) : 'bg-muted/40 border-border/60',
      day.basis === 'last_year' && HUB_CELL_LAST_YEAR,
      best && HUB_CELL_BEST
    ),
    hatch: false,
    early: closesEarly(day),
    noHours: hoursUnpublished(day),
  };
}

/** The history state key of an open day sheet, which Back closes. */
const SHEET_ENTRY = 'hubDaySheet';

/** The hub's calendar section: the props the server hands over. */
export interface HubCalendarProps {
  region: TripRegion;
  /** The first days, server-rendered on every viewport: the first answer and the crawlers' copy. */
  initial: TripCalendar;
  /** The whole window the section shows once it has loaded: 30 days, or the month. */
  window: { from: string; to: string };
  /** The region's today, for the "today" mark. */
  todayIso: string;
  locale: string;
  /** How to read a square (`HubLegend`, server-rendered), between the filter and the days. */
  legend?: React.ReactNode;
}

/**
 * The calendar chapter's body: which park on which day, at the depth a visitor asks for. A phone gets a list
 * of days with each resort's shortest line and "+n more"; a desktop gets the matrix, parks by
 * resort down the side and the days across, with only the minutes in each square. Both are
 * server-rendered for the first seven days; the rest of the window loads through the relay once a
 * desktop shows the matrix or a phone asks for every day. Rows never change with the data, so the
 * reserved height is the rendered one. A tap on a day opens the day sheet.
 */
export function HubCalendar({
  region,
  initial,
  window,
  todayIso,
  locale,
  legend,
}: HubCalendarProps) {
  const t = useTranslations('tripHub.calendar');
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [expanded, setExpanded] = useState(false);
  const groups = useMemo(() => regionGroups(region), [region]);
  const [only, setOnly] = useState<string | null>(null);
  // The filter is urgent; the grid it rebuilds is not (an interaction may not rebuild the grid in
  // its own commit).
  const deferredOnly = useDeferredValue(only);
  const [openDate, setOpenDate] = useState<string | null>(null);
  // The control that opened the sheet, so closing it puts focus back where the reader was.
  const opener = useRef<HTMLElement | null>(null);
  // The open sheet holds a history entry of its own, so a phone's Back closes it and a second Back
  // leaves the page, the way a visitor expects a sheet to behave. (`window` is a prop here.)
  const openDay = useCallback((date: string) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpenDate(date);
    if (!globalThis.history.state?.[SHEET_ENTRY]) {
      globalThis.history.pushState({ ...globalThis.history.state, [SHEET_ENTRY]: true }, '');
    }
  }, []);
  const closeDay = useCallback(() => {
    setOpenDate(null);
    if (globalThis.history.state?.[SHEET_ENTRY]) globalThis.history.back();
  }, []);
  useEffect(() => {
    const onPop = () => {
      if (!globalThis.history.state?.[SHEET_ENTRY]) setOpenDate(null);
    };
    globalThis.addEventListener('popstate', onPop);
    return () => globalThis.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => clearTripPagePark, []);

  // A month page hands over its whole window; only the hub's first week needs the rest.
  const complete = (initial.days[initial.days.length - 1]?.date ?? '') >= window.to;
  const { data, isError, isFetching } = useQuery<TripCalendar>({
    queryKey: ['trip-calendar', region.slug, window.from, window.to],
    queryFn: async () => {
      const response = await fetch(tripRegionRelayUrl(region.slug, 'calendar', window));
      if (!response.ok) throw new Error(`Trip region calendar ${response.status}`);
      return response.json();
    },
    enabled: !complete && (isDesktop || expanded),
    staleTime: CALENDAR_STALE_MS,
    retry: 1,
  });
  const calendar = data ?? initial;
  const visibleGroups = useMemo(
    () => (deferredOnly ? groups.filter((g) => g.key === deferredOnly) : groups),
    [groups, deferredOnly]
  );
  const listDays = expanded ? calendar.days : calendar.days.slice(0, HUB_FIRST_DAYS);
  const sheetDay = calendar.days.find((d) => d.date === openDate) ?? null;

  return (
    <div className="space-y-4">
      {/* One row that scrolls sideways on a phone, so the days start higher up the screen. */}
      <div
        role="group"
        aria-label={t('filterLabel')}
        className="-mr-4 flex [scrollbar-width:none] items-center gap-2 overflow-x-auto pr-4 sm:mr-0 sm:flex-wrap sm:overflow-visible sm:pr-0"
      >
        <FilterChip pressed={only === null} onClick={() => setOnly(null)}>
          {t('filterAll')}
        </FilterChip>
        {groups.map((group) => (
          <FilterChip
            key={group.key}
            pressed={only === group.key}
            onClick={() => setOnly(only === group.key ? null : group.key)}
          >
            {shortGroupName(group.name)}
          </FilterChip>
        ))}
      </div>

      {legend}

      {/* Phone: the days as a list, each resort's shortest line and how many other parks it has. */}
      <div className="lg:hidden">
        <DayList
          days={listDays}
          groups={visibleGroups}
          todayIso={todayIso}
          locale={locale}
          timezone={requireTripRegion(region.slug).timezone}
          onOpen={openDay}
        />
        {calendar.days.length > HUB_FIRST_DAYS || !complete ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="border-border/60 hover:bg-muted/50 text-foreground mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border text-sm font-medium"
            aria-expanded={expanded}
          >
            {expanded && (data || complete) ? t('showWeek') : t('showAll')}
            <ChevronDown
              aria-hidden
              className={cn('size-4 transition-transform', expanded && 'rotate-180')}
            />
          </button>
        ) : null}
        {expanded && !data && !complete && (
          <p className="text-muted-foreground mt-2 text-sm" role="status">
            {isError ? t('failed') : t('loading')}
          </p>
        )}
      </div>

      {/* Desktop: the matrix. */}
      <div className="hidden lg:block">
        <Matrix
          region={region.slug}
          calendar={calendar}
          groups={visibleGroups}
          todayIso={todayIso}
          locale={locale}
          onOpen={openDay}
        />
        {isDesktop && isFetching && !data && (
          <p className="text-muted-foreground mt-2 text-xs" role="status">
            {t('loading')}
          </p>
        )}
        {isDesktop && isError && !data && (
          <p className="text-muted-foreground mt-2 text-xs" role="status">
            {t('failed')}
          </p>
        )}
      </div>

      <EventLanes calendar={calendar} region={region} locale={locale} />

      <HubDaySheet
        day={sheetDay}
        returnFocus={opener}
        region={region}
        calendar={calendar}
        locale={locale}
        todayIso={todayIso}
        onClose={closeDay}
      />
    </div>
  );
}

/** A filter toggle, 44 px on a phone. */
function FilterChip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'focus-visible:ring-ring inline-flex min-h-11 shrink-0 items-center rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none sm:min-h-9',
        pressed
          ? 'border-primary/50 bg-primary/15 text-foreground'
          : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
    >
      {children}
    </button>
  );
}

/** The accessible name of a square: who, when, how long, how busy for that park, and the marks. */
function useCellLabel(locale: string, timezone: string) {
  const t = useTranslations('tripHub.calendar');
  const tLevel = useTranslations('parks.crowdLevels');
  return useCallback(
    (parkName: string, date: string, day: TripParkDay | undefined, bestAt: string | null) => {
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
          minutes: day.headlinerWait,
          level: level ? tLevel(level) : tLevel('unknown'),
        }),
      ];
      if (bestAt) parts.push(t('cellBest', { resort: bestAt }));
      const close = dayGuestClose(day);
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

/**
 * The resort a park is the day's pick of, or `null`. A resort with one park that has a figure that
 * day (SeaWorld beside two parks nobody queues at) has nothing to choose between and gets no ring.
 */
function bestAtResort(day: TripCalendarDay, group: RegionGroup, slug: string): string | null {
  if (group.kind !== 'resort' || day.best?.[group.key] !== slug) return null;
  const choices = group.parks.filter((p) => isRankable(day.parks[p.slug])).length;
  return choices > 1 ? shortGroupName(group.name) : null;
}

/**
 * The phone's list: one row per day, a button that opens the day sheet. Per resort only its
 * shortest line and how many more parks it has; the ranking is the sheet's.
 */
function DayList({
  days,
  groups,
  todayIso,
  locale,
  timezone,
  onOpen,
}: {
  days: TripCalendarDay[];
  groups: RegionGroup[];
  todayIso: string;
  locale: string;
  /** The region's zone, for the closing time of a park the pick beat. */
  timezone: string;
  onOpen: (date: string) => void;
}) {
  const t = useTranslations('tripHub.calendar');
  return (
    <ol aria-label={t('listLabel')} className="space-y-2">
      {days.map((day) => {
        const basis = dayBasis(day);
        return (
          <li key={day.date}>
            <button
              type="button"
              onClick={() => onOpen(day.date)}
              aria-haspopup="dialog"
              className="border-border/60 bg-card/60 hover:bg-muted/40 focus-visible:ring-ring flex w-full items-start gap-3 rounded-xl border p-3 text-left focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="flex w-12 shrink-0 flex-col items-center">
                <span className="text-muted-foreground text-[11px] font-semibold uppercase">
                  {day.date === todayIso ? t('today') : formatHubDate(day.date, locale, 'weekday')}
                </span>
                <time dateTime={day.date} className="text-xl font-bold tabular-nums">
                  {formatHubDate(day.date, locale, 'day')}
                </time>
                {(basis === 'last_year' || basis === 'long_range') && (
                  <span className="text-muted-foreground text-[10px]">
                    {basis === 'last_year' ? t('lastYear') : t('outlook')}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1 space-y-1.5">
                {groups.map((group) => {
                  const ranked = rankGroupParks(day, group.parks, group.key);
                  const top = ranked[0];
                  const others = ranked.slice(1).filter((r) => isRankable(r.day)).length;
                  if (!top) return null;
                  const look = cellLook(top.day, false);
                  const early = earlyCloseBehind(day, group, top.park.slug);
                  const earlyClose = early ? dayGuestClose(early.day) : undefined;
                  return (
                    <span key={group.key} className="flex items-start gap-2 text-sm">
                      {/* The park says which resort it is; its short name wraps rather than
                          truncating. */}
                      <span className="min-w-0 flex-1 font-medium break-words">
                        {isRankable(top.day) || top.day?.status === 'OPERATING'
                          ? shortParkName(top.park.name)
                          : top.day?.status === 'CLOSED'
                            ? t('stateClosed')
                            : t('stateUnknown')}
                        {early && earlyClose && (
                          <span className="text-muted-foreground block text-xs font-normal">
                            {t('earlyElsewhere', {
                              park: shortParkName(early.park.name),
                              time: formatClockTime(earlyClose, locale, timezone),
                            })}
                          </span>
                        )}
                      </span>
                      {look.text && (
                        <span
                          className={cn(
                            HUB_CELL,
                            'relative h-7 w-10 shrink-0 text-sm',
                            look.className
                          )}
                        >
                          {look.text}
                          {look.early && <span aria-hidden className={EARLY_CLOSE_CORNER} />}
                          {look.noHours && <span aria-hidden className={NO_HOURS_DOT} />}
                        </span>
                      )}
                      {/* The column stays when it is empty, so every chip stands in one line. */}
                      <span className="text-muted-foreground w-14 shrink-0 pt-1 text-right text-xs">
                        {others > 0 ? t('more', { count: others }) : null}
                      </span>
                    </span>
                  );
                })}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The desktop matrix: a real `<table>` with a caption and `scope`d headers, parks by resort down
 * the side, the days across. One tab stop for the whole grid: the arrows move between squares,
 * Enter opens the day (`role="grid"` with a roving `tabIndex`).
 */
function Matrix({
  region,
  calendar,
  groups,
  todayIso,
  locale,
  onOpen,
}: {
  region: string;
  calendar: TripCalendar;
  groups: RegionGroup[];
  todayIso: string;
  locale: string;
  onOpen: (date: string) => void;
}) {
  const t = useTranslations('tripHub.calendar');
  const tRegion = useTranslations('tripRegion.hub.calendar');
  const label = useCellLabel(locale, requireTripRegion(region).timezone);
  const tableRef = useRef<HTMLTableElement>(null);
  const [focus, setFocus] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const days = calendar.days;
  const rows = useMemo(
    () => groups.flatMap((g) => g.parks.map((park) => ({ group: g, park }))),
    [groups]
  );
  const first = days[0]?.date;
  const last = days[days.length - 1]?.date;

  const move = (r: number, c: number) => {
    const next = {
      r: Math.max(0, Math.min(rows.length - 1, r)),
      c: Math.max(0, Math.min(days.length - 1, c)),
    };
    setFocus(next);
    tableRef.current
      ?.querySelector<HTMLButtonElement>(`[data-cell="${next.r}:${next.c}"]`)
      ?.focus();
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
      move(focus.r + dr, focus.c + dc);
    } else if (event.key === 'Home') {
      event.preventDefault();
      move(focus.r, 0);
    } else if (event.key === 'End') {
      event.preventDefault();
      move(focus.r, days.length - 1);
    }
  };

  // Each park's row number in the grid, across the resort groups, for the roving focus.
  const rowOf = new Map(rows.map((row, i) => [row.park.slug, i]));
  return (
    <div className="border-border/60 bg-card/40 overflow-x-auto rounded-xl border">
      <table
        ref={tableRef}
        role="grid"
        onKeyDown={onKeyDown}
        className="w-max min-w-full border-separate border-spacing-1 text-sm"
      >
        <caption className="sr-only">
          {first && last && tRegion.has('caption')
            ? tRegion('caption', {
                from: formatHubDate(first, locale),
                to: formatHubDate(last, locale),
              })
            : t('listLabel')}
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="bg-card sticky left-0 z-10 w-44 min-w-44 px-2 text-left text-xs font-medium"
            >
              <span className="sr-only">{t('parkColumn')}</span>
            </th>
            {days.map((day) => {
              const basis = dayBasis(day);
              const weekend = [0, 6].includes(new Date(`${day.date}T12:00:00Z`).getUTCDay());
              return (
                <th key={day.date} scope="col" className="w-11 min-w-11 p-0 align-bottom">
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => onOpen(day.date)}
                    aria-label={t('openDay', { date: formatHubDate(day.date, locale, 'long') })}
                    className={cn(
                      'hover:bg-muted/60 flex w-full flex-col items-center rounded-md py-1 text-[11px] leading-tight',
                      weekend && 'bg-muted/40'
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
                    <span className="text-muted-foreground h-3 text-[9px]">
                      {basis === 'last_year'
                        ? t('lastYear')
                        : basis === 'long_range'
                          ? t('outlook')
                          : ''}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.key}>
            <tr>
              <th
                scope="rowgroup"
                colSpan={days.length + 1}
                className="text-muted-foreground bg-card sticky left-0 px-2 pt-3 pb-1 text-left text-[11px] font-semibold tracking-wider uppercase"
              >
                {group.name}
              </th>
            </tr>
            {group.parks.map((park) => {
              const r = rowOf.get(park.slug) ?? 0;
              const state = parkState(days, park.slug);
              return (
                <tr key={park.slug}>
                  <th
                    scope="row"
                    className="bg-card sticky left-0 z-10 px-2 text-left align-middle font-medium"
                  >
                    <span className="block truncate text-sm">{shortParkName(park.name)}</span>
                    {state && (
                      <span className="text-muted-foreground block truncate text-[11px] font-normal">
                        {t(state)}
                      </span>
                    )}
                  </th>
                  {days.map((day, c) => {
                    const parkDay = day.parks[park.slug];
                    const bestAt = bestAtResort(day, group, park.slug);
                    const look = cellLook(parkDay, bestAt !== null);
                    const focused = focus.r === r && focus.c === c;
                    return (
                      <td key={day.date} className="p-0" role="gridcell">
                        <button
                          type="button"
                          data-cell={`${r}:${c}`}
                          tabIndex={focused ? 0 : -1}
                          onFocus={() => setFocus({ r, c })}
                          onClick={() => onOpen(day.date)}
                          aria-label={label(shortParkName(park.name), day.date, parkDay, bestAt)}
                          aria-haspopup="dialog"
                          style={look.hatch ? { backgroundImage: UNUSABLE_HATCH_IMAGE } : undefined}
                          className={cn(
                            HUB_CELL,
                            'focus-visible:ring-primary relative h-9 w-11 text-sm focus-visible:ring-2 focus-visible:outline-none',
                            look.className
                          )}
                        >
                          {look.text}
                          {look.early && <span aria-hidden className={EARLY_CLOSE_CORNER} />}
                          {look.noHours && <span aria-hidden className={NO_HOURS_DOT} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}

/**
 * A park's state for the whole window, under its name, where every day says the same: closed for
 * the season, no hours yet, open without a forecast. `null` when its days differ.
 */
function parkState(
  days: TripCalendarDay[],
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
  const lanes = useMemo(
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
