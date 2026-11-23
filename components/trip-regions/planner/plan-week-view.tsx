'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Lock,
  PlaneLanding,
  PlaneTakeoff,
  Plus,
  Sun,
  ThermometerSun,
  Ticket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { formatGridHours, formatGridTime } from '@/lib/planner/park-time';
import { heightFor, yFor } from '@/lib/planner/day-grid';
import { PLANNER_PHONE_QUERY } from '@/lib/planner/use-grid-scale';
import { TRANSFER_CHIP_CLASS, TRANSFER_RAIL_CLASS } from '@/lib/planner/leg-styles';
import { UNUSABLE_HATCH_IMAGE } from '@/lib/utils/hatch';
import {
  CROWD_DOT_CLASS,
  CROWD_TILE_CLASS,
  isColoredCrowdLevel,
  type ColoredCrowdLevel,
} from '@/lib/utils/crowd-level-styles';
import { formatParkDay, formatParkDayRange } from '@/lib/utils/park-day';
import { sentenceCase } from '@/lib/utils/sentence-case';
import { HEAT_CHIP_CLASS, STORM_SIGNAL_CLASS } from '@/lib/utils/day-signal-styles';
import { dayHeat, dayWeatherOf, isHotDay } from '@/lib/trip-regions/plan-copy';
import { DayWeather } from '@/components/common/day-weather';
import { stormCodeOn, stormSignal, type StormCode } from '@/lib/trip-regions/date-facts';
import {
  TRIP_WEEK_PX_PER_MIN,
  TRIP_WEEK_PX_PER_MIN_COARSE,
  tripCanvas,
  tripColumnGrid,
  planTimeMinute,
  shownWaitOn,
  tripDaySpans,
  TRIP_FALLBACK_CANVAS,
  weekColumns,
  weekPages,
  weekTemplate,
  WEEK_COLUMNS_PHONE,
  WEEK_COLUMNS_WIDE,
  type SpareSuggestion,
  type TripCanvas,
  type TripDaySpan,
  type WeekColumn as WeekColumnGroup,
} from '@/lib/trip-regions/plan-week';
import type { PlanDay, TripPlan } from '@/lib/trip-regions/plan';
import { dayStayBase, planStays } from '@/lib/trip-regions/plan-stays';
import type { TripCalendar } from '@/lib/trip-regions/types';
import {
  ParkCalendarLegend,
  type CalendarLegendKey,
} from '@/components/parks/park-calendar-legend';
import { PlannerGridGround } from '@/components/planner/planner-grid-ground';
import { PlannerBlockBar, PlannerBlockPhoto } from '@/components/planner/planner-block-ink';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { usePartyName } from './use-day-facts';
import { HeatFigure, useEveningName, useTicketDayLabel } from './plan-day-bits';
import { useStormKeys } from './plan-calendar-keys';
import { MOVE_INK, MoveIcon, PlanStayBand, useMoveWords } from './plan-stay-band';
import { useBaseName } from './plan-place-words';
import { PlanSpareRun } from './plan-spare-run';
import { PlanDayGlow } from './plan-day-glow';

/** The gap between two day columns, which the stay band above them keeps to. */
const COLUMN_GAP_PX = 4;

/** The hotel's own hours, before opening and after the close: the stripes and their keys. */
const PERK_INK = 'border-primary/50 bg-primary/25 border-dashed';

/** One line of a stripe's 10 px type, which decides how much of its label a stripe can hold. */
const STRIPE_LINE_PX = 12;

/**
 * A one-line early stripe holds its time beside the label („Früher Einlass ab 08:30“) only in a wide
 * day column; in a narrower one the park block gives the time. The two halves of one threshold,
 * spelled out because Tailwind reads only literal classes.
 */
const EARLY_TIME_ON_STRIPE = 'hidden @min-[9.5rem]:block';
/** {@link EARLY_TIME_ON_STRIPE}'s other half, on the park block. */
const EARLY_TIME_ON_BLOCK = '@min-[9.5rem]:hidden';

/** A key's mark: a block of the grid at legend size. */
const KEY_MARK = 'block h-2.5 w-4 border';

/**
 * A column header's height and the hour gutter's matching top: a line more for an owned ticket's
 * day, a weather row more where heat or a storm season touches the page. Spelled out because
 * Tailwind reads only literal classes.
 */
const HEADER = {
  plain: { h: 'h-12', pt: 'pt-12' },
  ticket: { h: 'h-16', pt: 'pt-16' },
  weather: { h: 'h-[4.5rem]', pt: 'pt-[4.5rem]' },
  both: { h: 'h-[5.5rem]', pt: 'pt-[5.5rem]' },
} as const;

/** {@link HEADER}'s row for a page with or without a ticket line and a weather row. */
function headerOf(ticket: boolean, weather: boolean): (typeof HEADER)[keyof typeof HEADER] {
  if (ticket) return weather ? HEADER.both : HEADER.ticket;
  return weather ? HEADER.weather : HEADER.plain;
}

/**
 * After a morning move, the park's hours before the guest gets in: open, but spent on the way.
 * `null` on any other day.
 */
function lostMorning(
  span: TripDaySpan,
  day: PlanDay | undefined,
  timeZone: string
): { startMin: number; endMin: number } | null {
  const block = span.blocks[0];
  if (!block || day?.move?.when !== 'morning' || !day.startAt) return null;
  const startAt = planTimeMinute(day.startAt, span.date, timeZone);
  return startAt !== null && startAt > block.startMin
    ? { startMin: block.startMin, endMin: Math.min(startAt, block.endMin) }
    : null;
}

/** A block's crowd colour: the day's level, on a hop day each park's own. */
function blockTone(
  span: TripDaySpan,
  day: PlanDay | undefined,
  slug: string
): ColoredCrowdLevel | null {
  const level =
    span.kind === 'hop' ? day?.parks.find((p) => p.slug === slug)?.crowdLevel : day?.crowdLevel;
  return level && isColoredCrowdLevel(level) ? level : null;
}

/**
 * The Week view, the Outlook view of the trip: one column per day, up to a week a page (three on a
 * phone, by swipe or the arrows), on one hour axis from the earliest early slot to the latest close.
 * Each column stands on the day planner's own ground (`PlannerGridGround`: the day's band, its
 * early slot, the hour rules) and its blocks use the planner's ink. A park day is one block from
 * opening to the day guests' close with the park, its peak wait and its hours; a party night is
 * hatched after it with its name, Early Entry and Extended Evening Hours stripes where the hotel
 * gets them, each saying what it is where it is tall enough, a hop day two blocks with the leg chip
 * between them. A free day gets no hour grid: alone it is a narrow column with its sun, and a run of
 * them is one panel with the parks it could take (`weekColumns`, `PlanSpareRun`). A press opens the
 * day, whose sheet says the rest; the key under the grid names what the page draws (`WeekKey`).
 */
export function PlanWeekView({
  plan,
  calendar,
  onOpenDay,
  onFill,
}: {
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onOpenDay: (date: string) => void;
  onFill: (suggestion: SpareSuggestion) => void;
}) {
  const t = useTranslations('tripPlanner');
  const { timeZone, locale, region } = usePlanContext();
  const phone = useMediaQuery(PLANNER_PHONE_QUERY);
  const pxPerMin = phone ? TRIP_WEEK_PX_PER_MIN_COARSE : TRIP_WEEK_PX_PER_MIN;
  const perPage = phone ? WEEK_COLUMNS_PHONE : WEEK_COLUMNS_WIDE;

  const spans = useMemo(
    () => tripDaySpans(plan.days, calendar, timeZone),
    [plan.days, calendar, timeZone]
  );
  const canvas = useMemo(() => tripCanvas(spans) ?? TRIP_FALLBACK_CANVAS, [spans]);
  const pages = useMemo(() => weekPages(spans, perPage), [spans, perPage]);
  const [page, setPage] = useState(0);
  const current = Math.min(page, pages.length - 1);
  const shown = pages[current] ?? [];
  const dayBy = useMemo(() => new Map(plan.days.map((d) => [d.date, d])), [plan.days]);
  const spanBy = useMemo(() => new Map(spans.map((s) => [s.date, s])), [spans]);
  const columns = weekColumns(shown.flatMap((span) => dayBy.get(span.date) ?? []));
  const empty = perPage - shown.length;
  const stays = useMemo(() => planStays(plan), [plan]);
  const baseName = useBaseName();
  const stayCity = (day: PlanDay | undefined) => {
    const base = day ? dayStayBase(day) : null;
    return stays.length > 1 && base ? baseName(base) : null;
  };

  const height = (canvas.endMin - canvas.startMin) * pxPerMin;
  const hours: number[] = [];
  for (let h = Math.ceil(canvas.startMin / 60); h * 60 <= canvas.endMin; h++) hours.push(h);
  const axis = shown[0] ? tripColumnGrid(shown[0], canvas, pxPerMin) : null;
  // Owned tickets add a line under each column's date, the header grows by it on every column.
  const ticketLine = (plan.meta.tickets ?? []).length > 0;
  // So does the weather row, where a day of the page has weather, is hot or in the storm season.
  const weatherRow = shown.some((span) => {
    const day = dayBy.get(span.date);
    return (
      (day !== undefined && (isHotDay(day) || dayWeatherOf(day) !== null)) ||
      stormCodeOn(span.date, region.weather) !== null
    );
  });
  const header = headerOf(ticketLine, weatherRow);

  const touch = useRef<number | null>(null);
  const go = (delta: number) => setPage(Math.max(0, Math.min(pages.length - 1, current + delta)));

  return (
    <div className="flex flex-col gap-2" data-plan-view="week">
      {pages.length > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={current === 0}
            aria-label={t('week.previous')}
            className={cn(
              'hover:bg-accent flex size-11 items-center justify-center rounded-md disabled:opacity-30 lg:size-9',
              PLAN_FOCUS
            )}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <span className="min-w-0 flex-1 text-center text-sm font-medium" aria-live="polite">
            {shown.length > 0 &&
              formatParkDayRange(locale, shown[0].date, shown.at(-1)!.date, {
                day: 'numeric',
                month: 'short',
              })}
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={current === pages.length - 1}
            aria-label={t('week.next')}
            className={cn(
              'hover:bg-accent flex size-11 items-center justify-center rounded-md disabled:opacity-30 lg:size-9',
              PLAN_FOCUS
            )}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {stays.length > 1 && (
        <div className="flex">
          <div className="w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <PlanStayBand columns={columns} stays={stays} empty={empty} gapPx={COLUMN_GAP_PX} />
          </div>
        </div>
      )}

      <div
        className="flex touch-pan-y"
        onTouchStart={(e) => (touch.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const start = touch.current;
          const end = e.changedTouches[0]?.clientX;
          touch.current = null;
          if (start == null || end == null || Math.abs(end - start) < 48) return;
          go(end < start ? 1 : -1);
        }}
      >
        {/* The planner's hour gutter. */}
        <div className={cn('w-10 shrink-0', header.pt)} aria-hidden="true">
          <div className="relative" style={{ height }}>
            {axis &&
              hours.map((hour) => (
                <span
                  key={hour}
                  className="text-muted-foreground absolute right-1 -translate-y-1/2 text-[11px] tabular-nums"
                  style={{ top: yFor(axis, hour * 60) }}
                >
                  {formatGridTime(hour * 60)}
                </span>
              ))}
          </div>
        </div>

        <ol
          className="grid min-w-0 flex-1"
          style={{ gridTemplateColumns: weekTemplate(columns, empty), columnGap: COLUMN_GAP_PX }}
        >
          {columns.map((column, i) => {
            const date = column.days[0].date;
            const span = spanBy.get(date);
            const weather = weatherRow ? { last: i === columns.length - 1 } : null;
            return column.width === 'day' && span ? (
              <WeekColumn
                key={date}
                span={span}
                day={column.days[0]}
                meta={ticketLine ? plan.meta : null}
                header={header.h}
                weather={weather}
                phone={phone}
                canvas={canvas}
                pxPerMin={pxPerMin}
                calendar={calendar}
                city={stayCity(column.days[0])}
                onOpen={() => onOpenDay(date)}
              />
            ) : (
              <SpareColumn
                key={date}
                column={column}
                header={header.h}
                weather={weather}
                height={height}
                plan={plan}
                calendar={calendar}
                onOpenDay={onOpenDay}
                onFill={onFill}
              />
            );
          })}
        </ol>
      </div>

      <WeekKey spans={shown} dayBy={dayBy} />
    </div>
  );
}

/**
 * The key under the Week view: the crowd scale where a block on the page is coloured, then one
 * entry for each thing the page draws without words of its own, and only those. One list, so a new
 * mark on the grid is one more entry here.
 */
function WeekKey({
  spans,
  dayBy,
}: {
  spans: readonly TripDaySpan[];
  dayBy: ReadonlyMap<string, PlanDay>;
}) {
  const t = useTranslations('tripPlanner');
  const { timeZone, region } = usePlanContext();
  const stormKeys = useStormKeys();
  const hot = spans.flatMap((span) => {
    const day = dayBy.get(span.date);
    return day && isHotDay(day) ? [day] : [];
  });
  const storms = spans.flatMap((span) => stormCodeOn(span.date, region.weather) ?? []);
  const entries: Array<CalendarLegendKey & { shown: boolean }> = [
    {
      key: 'early',
      shown: spans.some((span) => span.early !== null),
      label: t('week.early'),
      mark: <span className={cn(KEY_MARK, PERK_INK, 'rounded-t-sm border-b-0')} />,
    },
    {
      key: 'extended',
      shown: spans.some((span) => span.evening?.kind === 'extended_evening'),
      label: t('week.extendedEvening'),
      mark: <span className={cn(KEY_MARK, PERK_INK, 'rounded-b-sm border-t-0')} />,
    },
    {
      key: 'lost',
      shown: spans.some((span) => lostMorning(span, dayBy.get(span.date), timeZone) !== null),
      label: sentenceCase(t('move.lost')),
      mark: (
        <span
          className={cn(KEY_MARK, 'border-border/60 rounded-sm border-dashed')}
          style={{ backgroundImage: UNUSABLE_HATCH_IMAGE }}
        />
      ),
    },
    ...stormKeys(storms).map((key) => ({ ...key, shown: true })),
    {
      key: 'heat',
      shown: hot.length > 0,
      label: hot.some((day) => dayHeat(day)?.basis === 'climate_normal')
        ? t('weather.keyHeatNormal')
        : t('weather.keyHeat'),
      mark: (
        <span className={cn('inline-flex rounded-full px-1', HEAT_CHIP_CLASS)}>
          <ThermometerSun className="size-3" />
        </span>
      ),
    },
  ];
  const keys = entries.filter((entry) => entry.shown);
  const coloured = spans.some((span) =>
    span.blocks.some((block) => blockTone(span, dayBy.get(span.date), block.slug) !== null)
  );
  if (!coloured && keys.length === 0) return null;
  return (
    <div className="mt-1 sm:pl-10" data-plan-week-key="">
      <ParkCalendarLegend
        showCrowd={coloured}
        signals={[]}
        signalsLabel={false}
        extraSignals={keys}
      />
    </div>
  );
}

/**
 * Free days in the Week view, with no hour grid: one alone is a narrow column with its sun,
 * „freier Tag · Ideen“ and a plus, which opens the day's sheet with what it could take; a run of
 * them is one panel holding the free-day card (`PlanSpareRun`).
 */
function SpareColumn({
  column,
  header,
  weather,
  height,
  plan,
  calendar,
  onOpenDay,
  onFill,
}: {
  column: WeekColumnGroup<PlanDay>;
  /** The header's height class, every column's ({@link headerOf}). */
  header: string;
  /** The page's weather row, where it has one: the band runs on, no heat pill. */
  weather: { last: boolean } | null;
  height: number;
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onOpenDay: (date: string) => void;
  onFill: (suggestion: SpareSuggestion) => void;
}) {
  const t = useTranslations('tripPlanner');
  const tClimate = useTranslations('tripPlanner.climate');
  const { locale, region } = usePlanContext();
  const first = column.days[0];
  const last = column.days.at(-1) ?? first;
  const narrow = column.width === 'narrow';
  const storms = column.days.map((d) => stormCodeOn(d.date, region.weather));
  return (
    <li className="flex min-w-0 flex-col" data-plan-spare-column={column.width}>
      <div
        className={cn(
          'flex flex-col items-center justify-center text-center leading-tight',
          header
        )}
      >
        <span className="text-muted-foreground text-[11px] uppercase">
          {narrow ? formatParkDay(locale, first.date, { weekday: 'short' }) : t('spare.day')}
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {narrow
            ? formatParkDay(locale, first.date, { day: 'numeric' })
            : formatParkDayRange(locale, first.date, last.date, { day: 'numeric', month: 'short' })}
        </span>
        {weather && (
          <WeatherRow heat={null} hot={false} storms={storms} last={weather.last} phone />
        )}
      </div>
      <div
        className="border-border/60 bg-muted/20 relative overflow-hidden rounded-md border border-dashed"
        style={{ height }}
      >
        {narrow ? (
          <button
            type="button"
            onClick={() => onOpenDay(first.date)}
            aria-label={`${formatParkDay(locale, first.date, { weekday: 'short', day: 'numeric', month: 'short' })}: ${[t('spare.day'), t('spare.ideas'), storms[0] ? tClimate(storms[0]) : null].filter(Boolean).join(', ')}`}
            className={cn(
              'hover:bg-muted/50 absolute inset-0 flex flex-col items-center justify-center gap-2 transition-colors',
              PLAN_FOCUS
            )}
          >
            <Sun className="text-muted-foreground size-4" aria-hidden="true" />
            <span
              aria-hidden="true"
              className="text-muted-foreground text-xs [writing-mode:vertical-rl]"
            >
              {t('spare.day')} · {t('spare.ideas')}
            </span>
            <Plus className="text-primary-ink size-4" aria-hidden="true" />
          </button>
        ) : (
          <PlanSpareRun
            days={column.days}
            plan={plan}
            calendar={calendar}
            onOpenDay={onOpenDay}
            onFill={onFill}
            compact
          />
        )}
        <PlanDayGlow date={column.days.map((d) => d.date)} />
      </div>
    </li>
  );
}

function WeekColumn({
  span,
  day,
  meta,
  header,
  weather,
  phone,
  canvas,
  pxPerMin,
  calendar,
  city,
  onOpen,
}: {
  span: TripDaySpan;
  day: PlanDay | undefined;
  /** The city the day is spent in, on a trip across cities. */
  city: string | null;
  /** The plan's meta where it has owned tickets, whose day each column names. */
  meta: TripPlan['meta'] | null;
  /** The header's height class, every column's ({@link headerOf}). */
  header: string;
  /** The page's weather row, where it has one. */
  weather: { last: boolean } | null;
  phone: boolean;
  canvas: TripCanvas;
  pxPerMin: number;
  calendar: TripCalendar | undefined;
  onOpen: () => void;
}) {
  const t = useTranslations('tripPlanner');
  const tClimate = useTranslations('tripPlanner.climate');
  const { locale, parkName, photos, timeZone, state, region } = usePlanContext();
  const grid = tripColumnGrid(span, canvas, pxPerMin);
  const hot = day !== undefined && isHotDay(day);
  const storm = stormCodeOn(span.date, region.weather);
  const pinned = state.locks.some((lock) => lock.date === span.date);
  const partyName = usePartyName(calendar, day);
  const eveningOf = useEveningName();
  const eveningName = day ? eveningOf(day) : null;
  const weekday = formatParkDay(locale, span.date, { weekday: 'short' });
  const date = formatParkDay(locale, span.date, { day: 'numeric', month: 'short' });
  // Across cities, each day's label names where it is spent; the band above says it only in ink.
  const dayLabel = [
    `${weekday} ${date}`,
    city,
    pinned ? t('marker.pinned') : null,
    hot ? tClimate('extreme_heat') : null,
    storm ? tClimate(storm) : null,
  ]
    .filter(Boolean)
    .join(', ');
  const ticketLabel = useTicketDayLabel();
  const ticketDay = meta && day ? ticketLabel(day, meta, phone) : null;

  const isPark = span.kind === 'park' || span.kind === 'hop';
  const move = day?.move ?? null;
  const moveWords = useMoveWords();
  const baseName = useBaseName();
  const clamp = (minute: number) => Math.max(canvas.startMin, Math.min(canvas.endMin, minute));
  const moveSpan = move
    ? (() => {
        const start = planTimeMinute(move.departAt, span.date, timeZone);
        const end = planTimeMinute(move.arriveAt, span.date, timeZone);
        return start !== null && end !== null && end > start
          ? { startMin: clamp(start), endMin: clamp(end) }
          : null;
      })()
    : null;
  const lost = lostMorning(span, day, timeZone);
  // What the stripe is comes first: two lines hold the label and the time, one holds the label and
  // the time only in a wide column (`EARLY_TIME_ON_STRIPE`), otherwise the block under it gives the
  // time; a stripe too low for a line leaves both to the block.
  const earlyLines = span.early
    ? Math.floor((heightFor(grid, span.early.endMin - span.early.startMin) - 1) / STRIPE_LINE_PX)
    : 0;
  const earlyTime = span.early ? formatGridTime(span.early.startMin) : null;
  const earlyLine = (
    label: (chunks: React.ReactNode) => React.ReactNode,
    at: (chunks: React.ReactNode) => React.ReactNode
  ) => (earlyTime ? t.rich('week.earlyAt', { time: earlyTime, label, at }) : null);
  const fullDay = (label: string, icon: React.ReactNode, tone: 'rest' | 'travel' | 'move') => (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${dayLabel}: ${label}`}
      className={cn(
        'absolute inset-x-0.5 flex flex-col items-center justify-center gap-1 rounded-md border px-1 text-center text-xs transition-colors',
        tone === 'rest'
          ? 'border-border/70 bg-muted/50 hover:bg-muted/70 top-1 bottom-1'
          : tone === 'move'
            ? `${MOVE_INK} hover:bg-primary/15 top-1 bottom-1`
            : 'border-border/40 bg-muted/20 hover:bg-muted/40 top-1 bottom-1 border-dashed',
        PLAN_FOCUS
      )}
    >
      {icon}
      <span className="text-muted-foreground font-medium">{label}</span>
    </button>
  );

  return (
    <li className="flex min-w-0 flex-col">
      <div
        className={cn(
          'flex flex-col items-center justify-center text-center leading-tight',
          header
        )}
      >
        <span className="text-muted-foreground text-[11px] uppercase">{weekday}</span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums">
          {date}
          {pinned && (
            <Lock
              className="text-primary-ink size-3 shrink-0"
              aria-hidden="true"
              data-plan-pinned=""
            />
          )}
        </span>
        {meta && (
          <span
            className="text-foreground/75 mt-0.5 flex min-h-4 items-center gap-1 text-[11px] tabular-nums"
            data-plan-ticket-day={ticketDay ?? undefined}
          >
            {ticketDay && (
              <>
                <Ticket className="size-3 shrink-0" aria-hidden="true" />
                {ticketDay}
              </>
            )}
          </span>
        )}
        {weather && (
          <WeatherRow
            heat={day ? dayHeat(day) : null}
            hot={hot}
            dayWeather={day ? dayWeatherOf(day) : null}
            storms={[storm]}
            last={weather.last}
            phone={phone}
          />
        )}
      </div>
      <div
        className="bg-muted/10 @container relative overflow-hidden rounded-md"
        style={{ height: grid.heightPx }}
      >
        {isPark && span.blocks.length > 0 && <PlannerGridGround grid={grid} />}

        {span.kind === 'rest' &&
          fullDay(
            t('day.rest'),
            <BedDouble className="text-muted-foreground size-5" aria-hidden="true" />,
            'rest'
          )}
        {span.kind === 'arrival' &&
          fullDay(
            t('day.arrival'),
            <PlaneLanding className="text-muted-foreground size-4" aria-hidden="true" />,
            'travel'
          )}
        {span.kind === 'departure' &&
          fullDay(
            t('day.departure'),
            <PlaneTakeoff className="text-muted-foreground size-4" aria-hidden="true" />,
            'travel'
          )}
        {span.kind === 'travel' &&
          move &&
          fullDay(
            `${moveWords.mode(move.mode)} · ${moveWords.duration(move)} · ${t('move.toCity', { city: baseName(move.to) })}`,
            <MoveIcon mode={move.mode} className="text-primary-ink size-4" />,
            'move'
          )}

        {isPark &&
          span.blocks.length === 0 &&
          day &&
          // A park day without published hours: no axis to stand on, so a block without a time.
          fullDay(
            `${day.parks.map((p) => parkName(p.slug)).join(' + ')} · ${t('week.noHours')}`,
            null,
            'travel'
          )}

        {span.early && earlyTime && (
          // A button like the block under it: a tap on a phone, which has no tooltip, opens the
          // day, whose sheet names the hotel's slot.
          <button
            type="button"
            onClick={onOpen}
            data-plan-early=""
            title={t('week.early')}
            aria-label={`${dayLabel}: ${t.markup('week.earlyAt', { time: earlyTime, label: (chunks) => chunks, at: (chunks) => chunks })}`}
            className={cn(
              'absolute inset-x-2 flex items-center overflow-hidden rounded-t-sm border border-b-0 px-1 text-left text-[10px] leading-[12px] tabular-nums transition-colors hover:brightness-125',
              PERK_INK,
              PLAN_FOCUS
            )}
            style={{
              top: yFor(grid, span.early.startMin),
              height: heightFor(grid, span.early.endMin - span.early.startMin),
            }}
          >
            {earlyLines > 0 && (
              <span
                className={cn('min-w-0', earlyLines > 1 ? 'block' : 'flex gap-1 whitespace-nowrap')}
              >
                {earlyLine(
                  (chunks) => (
                    <span className="block min-w-0 truncate font-semibold">{chunks}</span>
                  ),
                  (chunks) => (
                    <span className={cn('shrink-0', earlyLines < 2 && EARLY_TIME_ON_STRIPE)}>
                      {chunks}
                    </span>
                  )
                )}
              </span>
            )}
          </button>
        )}

        {span.blocks.map((block, index) => {
          const visit = day?.parks.find((p) => p.slug === block.slug);
          const wait = shownWaitOn(
            calendar,
            block.slug,
            span.date,
            span.kind === 'hop' ? visit?.headlinerWait : day?.headlinerWait
          );
          const tone = blockTone(span, day, block.slug);
          const photo = photos[block.slug];
          const name = parkName(block.slug);
          const hours = t('details.hours', {
            range: `${formatGridTime(block.openMin)}–${formatGridTime(block.closeMin, true)}`,
          });
          const start = index === 0 && lost ? lost.endMin : block.startMin;
          const top = yFor(grid, start) + (index > 0 ? 2 : 0);
          const blockHeight = Math.max(
            0,
            heightFor(grid, block.endMin - start) - (index > 0 ? 2 : 0)
          );
          return (
            <button
              key={block.slug}
              type="button"
              onClick={onOpen}
              data-plan-block={block.slug}
              aria-label={`${dayLabel}: ${[name, ticketDay, wait != null ? t('peakWait', { minutes: wait }) : t('week.noFigure'), hours].filter(Boolean).join(', ')}`}
              className={cn('absolute inset-x-0.5 rounded-md text-left', PLAN_FOCUS)}
              style={{ top, height: blockHeight }}
            >
              <span className="bg-background absolute inset-0 rounded-md" aria-hidden="true" />
              <span
                className={cn(
                  'relative flex h-full flex-col gap-0.5 overflow-hidden rounded-md border py-1 pr-1 pl-2 transition-colors',
                  tone ? CROWD_TILE_CLASS[tone] : 'bg-background/70 border-border/70 border-dashed',
                  'hover:brightness-110'
                )}
              >
                <span
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
                  aria-hidden="true"
                >
                  {photo && <PlannerBlockPhoto src={photo.src} position={photo.position} />}
                  <PlannerBlockBar
                    className={tone ? CROWD_DOT_CLASS[tone] : 'bg-muted-foreground/40'}
                  />
                </span>
                <span className="relative line-clamp-3 text-xs leading-tight font-semibold break-words">
                  {pinned && index === 0 && (
                    <Lock className="mr-1 inline size-3 align-[-1px]" aria-hidden="true" />
                  )}
                  {name}
                </span>
                <span className="relative text-xs tabular-nums">
                  {wait != null
                    ? t.rich('result.card.peak', {
                        minutes: wait,
                        strong: (chunks) => (
                          <strong className="font-semibold whitespace-nowrap">{chunks}</strong>
                        ),
                      })
                    : t('week.noFigure')}
                </span>
                <span className="text-foreground/80 relative flex items-center gap-1 text-[11px] tabular-nums">
                  <Clock3 className="size-3 shrink-0" aria-hidden="true" />
                  {formatGridHours(block.openMin, block.closeMin)}
                </span>
                {index === 0 && earlyTime && earlyLines < 2 && (
                  <span
                    className={cn(
                      'text-primary-ink relative text-[11px] leading-tight tabular-nums',
                      earlyLines === 1 && EARLY_TIME_ON_BLOCK
                    )}
                  >
                    {earlyLine(
                      (chunks) => (earlyLines === 1 ? null : chunks),
                      (chunks) => chunks
                    )}
                  </span>
                )}
              </span>
            </button>
          );
        })}

        {lost && (
          <div
            data-plan-move-lost=""
            title={t('move.lost')}
            className="border-border/60 absolute inset-x-0.5 rounded-md border border-dashed"
            style={{
              top: yFor(grid, lost.startMin),
              height: heightFor(grid, lost.endMin - lost.startMin),
              backgroundImage: UNUSABLE_HATCH_IMAGE,
            }}
          />
        )}

        {moveSpan && move && span.kind !== 'travel' && (
          <button
            type="button"
            onClick={onOpen}
            data-plan-move-block={move.when}
            aria-label={moveWords.label(span, move)}
            className={cn(
              'bg-background absolute inset-x-0.5 z-10 overflow-hidden rounded-md text-left',
              PLAN_FOCUS
            )}
            style={{
              top: yFor(grid, moveSpan.startMin),
              height: Math.max(18, heightFor(grid, moveSpan.endMin - moveSpan.startMin)),
            }}
          >
            <span
              className={cn(
                'flex h-full flex-col gap-0.5 overflow-hidden rounded-md border px-1 py-0.5 text-[10px] leading-tight',
                MOVE_INK
              )}
            >
              <span className="text-primary-ink flex items-center gap-1 font-semibold">
                <MoveIcon mode={move.mode} className="size-3 shrink-0" />
                <span className="truncate">{moveWords.duration(move)}</span>
              </span>
              <span className="truncate">{t('move.toCity', { city: baseName(move.to) })}</span>
            </span>
          </button>
        )}

        {span.hopAt !== null && day?.between && (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 flex justify-center"
            style={{ top: yFor(grid, span.hopAt) - 9 }}
          >
            <span
              className={cn('absolute top-0 bottom-0 left-1/2 w-0.5', TRANSFER_RAIL_CLASS.unknown)}
              aria-hidden="true"
            />
            <span
              className={cn(
                'relative inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] whitespace-nowrap tabular-nums',
                TRANSFER_CHIP_CLASS.unknown
              )}
            >
              {t.has(`week.leg.${day.between.mode}`)
                ? t(`week.leg.${day.between.mode}`, { minutes: day.between.minutes })
                : t('week.legOther', { minutes: day.between.minutes })}
            </span>
          </div>
        )}

        {span.night && (
          <>
            {/* The evening after the park: a second park in the park's colours, a venue calm and
                dashed. It sits to the right, so a party night's hatch stays readable beside it. */}
            <button
              type="button"
              onClick={onOpen}
              data-plan-night={span.night.kind}
              aria-label={`${dayLabel}: ${t('evening.plus', { name: eveningName ?? '' })}`}
              className={cn(
                'absolute right-0.5 left-1/3 z-10 overflow-hidden rounded-md border px-1 py-0.5 text-left text-[10px] leading-tight transition-colors',
                span.night.kind === 'hop'
                  ? 'border-primary/40 bg-primary/15 hover:bg-primary/25'
                  : 'border-border bg-muted/70 hover:bg-muted border-dashed',
                PLAN_FOCUS
              )}
              style={{
                top: yFor(grid, span.night.startMin),
                height: heightFor(grid, span.night.endMin - span.night.startMin),
              }}
            >
              <span className="line-clamp-3 font-semibold">
                {eveningName ?? t('evening.title')}
              </span>
            </button>
            {span.night.travelMinutes !== null && (
              <span
                className={cn(
                  'pointer-events-none absolute left-1/3 z-20 inline-flex -translate-y-full items-center rounded-full border px-1 text-[10px] whitespace-nowrap tabular-nums',
                  TRANSFER_CHIP_CLASS.unknown
                )}
                style={{ top: yFor(grid, span.night.startMin) }}
              >
                {t('evening.leg', { minutes: span.night.travelMinutes })}
              </span>
            )}
          </>
        )}

        {span.evening && (
          <div
            data-plan-evening={span.evening.kind}
            className={cn(
              'absolute inset-x-0.5 overflow-hidden px-1 py-0.5 text-[10px] leading-tight',
              span.evening.kind === 'ticketed_event'
                ? 'border-border/70 text-muted-foreground rounded-b-md border border-t-0'
                : cn(PERK_INK, 'inset-x-2 rounded-b-sm border border-t-0')
            )}
            style={{
              top: yFor(grid, span.evening.startMin),
              height: heightFor(grid, span.evening.endMin - span.evening.startMin),
              ...(span.evening.kind === 'ticketed_event'
                ? { backgroundImage: UNUSABLE_HATCH_IMAGE }
                : {}),
            }}
            title={
              span.evening.kind === 'ticketed_event'
                ? (partyName ?? t('week.party'))
                : t('week.extendedEvening')
            }
          >
            {span.evening.kind === 'ticketed_event' ? (
              <span className="bg-background/80 line-clamp-3 rounded-sm px-0.5">
                {t('week.partyNamed', { name: partyName ?? t('week.party') })}
              </span>
            ) : (
              <span className="line-clamp-3 font-semibold">{t('week.extendedEvening')}</span>
            )}
          </div>
        )}
        <PlanDayGlow date={span.date} />
      </div>
    </li>
  );
}

/**
 * A column header's weather row, a picture of the day label's words and so hidden from a screen
 * reader: a hot park day's pill („Ø 32°“, the icon alone on a phone), any other day's weather
 * (`DayWeather`, compact on a phone: the forecast's high, past its reach the date's usual range),
 * and under it the storm season's band, a segment per date, run through the gap to the next column
 * so the page reads as one band.
 */
function WeatherRow({
  heat,
  hot,
  dayWeather = null,
  storms,
  last,
  phone,
}: {
  heat: ReturnType<typeof dayHeat>;
  hot: boolean;
  dayWeather?: ReturnType<typeof dayWeatherOf>;
  storms: ReadonlyArray<StormCode | null>;
  last: boolean;
  phone: boolean;
}) {
  return (
    <span aria-hidden="true" className="mt-auto flex flex-col self-stretch">
      <span className="flex h-5 items-center justify-center">
        {!hot && dayWeather && (
          <DayWeather weather={dayWeather} compact={phone} className="text-[10px]" />
        )}
        {hot && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 text-[10px] font-medium tabular-nums',
              HEAT_CHIP_CLASS
            )}
          >
            <ThermometerSun className="size-3" />
            {heat && !phone && <HeatFigure weather={heat} />}
          </span>
        )}
      </span>
      <span className={cn('mb-1 flex h-1', !last && '-mr-1')}>
        {storms.map((code, i) => (
          <span key={i} className={cn('flex-1', code && STORM_SIGNAL_CLASS[stormSignal(code)])} />
        ))}
      </span>
    </span>
  );
}
