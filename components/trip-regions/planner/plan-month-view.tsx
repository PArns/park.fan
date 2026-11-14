'use client';

import { useMemo, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { BedDouble, PlaneLanding, PlaneTakeoff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { weekdayLabels } from '@/lib/planner/month-grid';
import { formatGridHours, formatGridTime } from '@/lib/planner/park-time';
import { UNUSABLE_HATCH_IMAGE } from '@/lib/utils/hatch';
import {
  CROWD_DOT_CLASS,
  CROWD_TEXT_CLASS,
  CROWD_TILE_CLASS,
  isColoredCrowdLevel,
  type ColoredCrowdLevel,
} from '@/lib/utils/crowd-level-styles';
import {
  DAY_SIGNAL_CLASS,
  holidaySignals,
  STORM_SIGNAL_CLASS,
} from '@/lib/utils/day-signal-styles';
import { ParkCalendarLegend } from '@/components/parks/park-calendar-legend';
import { formatParkDay } from '@/lib/utils/park-day';
import { dayMarker } from '@/lib/trip-regions/plan-copy';
import {
  dayBandPieces,
  parkCodeKey,
  parkLabel,
  shownDayWait,
  TRIP_DAY_SIGNALS,
  TRIP_FALLBACK_CANVAS,
  tripCanvas,
  tripDaySpans,
  tripMonthWeeks,
  type DayBandPiece,
  type TripCanvas,
} from '@/lib/trip-regions/plan-week';
import type { TripPlan } from '@/lib/trip-regions/plan';
import { stormCodeOn, stormSignal } from '@/lib/trip-regions/date-facts';
import { dayStayBase, monthStayCells, planStays } from '@/lib/trip-regions/plan-stays';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { PlanCodeKey, useStormKeys } from './plan-calendar-keys';
import { useBaseName } from './plan-place-words';
import { MoveIcon, PlanMonthStayBand, StayMarker } from './plan-stay-band';
import {
  PlanDayMarker,
  useDayMarkerText,
  useDayParks,
  useEveningName,
  useTicketDayLabel,
} from './plan-day-bits';

/** The hotel's slot before opening: the Week view's colour, striped so it reads at bar height. */
const EARLY_STRIPES =
  'repeating-linear-gradient(135deg, var(--primary) 0 2px, transparent 2px 4px)';
/** An evening at a venue: a dotted line, as calm as the Week view's dashed venue block. */
const VENUE_DOTS =
  'repeating-linear-gradient(90deg, var(--muted-foreground) 0 3px, transparent 3px 5px)';

/** A band piece's face, the Week view's in miniature: `level` colours a park's hours. */
function pieceFace(
  piece: DayBandPiece,
  levelOf: (slug: string | null) => ColoredCrowdLevel | null
): { className: string; style?: CSSProperties } {
  switch (piece.kind) {
    case 'early':
      return { className: '', style: { backgroundImage: EARLY_STRIPES } };
    case 'park': {
      const level = levelOf(piece.slug);
      return { className: level ? CROWD_DOT_CLASS[level] : 'bg-muted-foreground/40' };
    }
    case 'party':
      return { className: 'bg-muted', style: { backgroundImage: UNUSABLE_HATCH_IMAGE } };
    case 'extended':
      return { className: 'bg-primary/25' };
    case 'hop':
      return { className: 'bg-primary/45' };
    case 'venue':
      return { className: 'inset-y-[35%]', style: { backgroundImage: VENUE_DOTS } };
  }
}

/** The hours a desk cell marks on its band: every third hour inside the canvas. */
function bandTicks(canvas: TripCanvas): number[] {
  const ticks: number[] = [];
  for (let h = Math.ceil(canvas.startMin / 180) * 3; h * 60 < canvas.endMin; h += 3) {
    if (h * 60 > canvas.startMin) ticks.push(h);
  }
  return ticks;
}

/**
 * The Month view: the trip in its calendar, whole weeks from Monday, drawn as a park's crowd
 * calendar (`ParkCalendarDay`, `ParkCalendarLegend`). A park day is a tile in its crowd tint with
 * the park's code (its name on a wide screen) and a band of the day on the trip's shared canvas,
 * the Week view's own spans (`tripDaySpans`, `dayBandPieces`): the hotel's early slot striped, the
 * hours in the crowd colour, a party night hatched, the evening in a second park or at a venue. A
 * phone writes the hours under it, a wide screen the axis and one line: the evening or the ticket
 * day. A rest or travel day is a plain tile with its icon, the date's holidays the bar along the
 * top with the storm season (`stormCodeOn`: dashed, solid at its peak), and a key says what the
 * codes stand for. On a trip across cities each cell's foot is the stay band (`PlanMonthStayBand`,
 * `monthStayCells`): the city slept in, named where its stay begins and at the start of each week
 * row, in the stays' primary tints, never a crowd colour. A press opens the day.
 */
export function PlanMonthView({
  plan,
  calendar,
  onOpenDay,
}: {
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onOpenDay: (date: string) => void;
}) {
  const t = useTranslations('tripPlanner');
  const tCrowd = useTranslations('parks.crowdLevels');
  const tClimate = useTranslations('tripPlanner.climate');
  const stormKeys = useStormKeys();
  const { locale, timeZone, region, config, parkBySlug, parkName } = usePlanContext();
  const parksOf = useDayParks();
  const markerText = useDayMarkerText();
  const ticketLabel = useTicketDayLabel();
  const eveningName = useEveningName();
  const baseName = useBaseName();
  const weeks = useMemo(
    () => tripMonthWeeks(plan.meta.from, plan.meta.to),
    [plan.meta.from, plan.meta.to]
  );
  const dayBy = useMemo(() => new Map(plan.days.map((d) => [d.date, d])), [plan.days]);
  const storms = useMemo(
    () => new Map(plan.days.map((d) => [d.date, stormCodeOn(d.date, region.weather)])),
    [plan.days, region.weather]
  );
  const stayCells = useMemo(() => monthStayCells(plan), [plan]);
  const stays = useMemo(() => planStays(plan), [plan]);
  const calendarBy = useMemo(
    () => new Map((calendar?.days ?? []).map((d) => [d.date, d])),
    [calendar?.days]
  );
  const spans = useMemo(
    () => tripDaySpans(plan.days, calendar, timeZone),
    [plan.days, calendar, timeZone]
  );
  const spanBy = useMemo(() => new Map(spans.map((s) => [s.date, s])), [spans]);
  const canvas = useMemo(() => tripCanvas(spans) ?? TRIP_FALLBACK_CANVAS, [spans]);
  const ticks = useMemo(() => bandTicks(canvas), [canvas]);
  const headers = useMemo(() => weekdayLabels(locale), [locale]);
  const codeKey = useMemo(
    () =>
      parkCodeKey(
        region.parks,
        plan.days.flatMap((d) => d.parks.map((p) => p.slug)),
        (park) => parkName(park.slug),
        (park) => parkLabel(park, config.parkShortNames, 'tight')
      ),
    [region.parks, plan.days, parkName, config.parkShortNames]
  );
  const kinds = new Set(
    spans.flatMap((span) => dayBandPieces(span, canvas).map((piece) => piece.kind))
  );
  const codeOf = (slug: string) => {
    const park = parkBySlug.get(slug);
    return park ? parkLabel(park, config.parkShortNames, 'tight') : slug;
  };
  // The band runs along the foot, out to the cell's edges, so a stay reads as one strip; its tint
  // sits on the page's ground, not on the crowd tile, so it has one colour in every cell.
  const stayFoot = (date: string, rowStart: boolean) => {
    const c = stayCells.get(date);
    return c ? (
      <span className="bg-background -mx-1 mt-auto -mb-1 flex self-stretch lg:-mx-1.5 lg:-mb-1.5">
        <PlanMonthStayBand
          stay={c.stay}
          left={c.left}
          first={c.first || rowStart}
          className="flex-1"
        />
      </span>
    ) : null;
  };

  return (
    <div data-plan-view="month" className="flex flex-col gap-1">
      <div
        className="text-muted-foreground grid grid-cols-7 gap-1 text-center text-[11px]"
        aria-hidden="true"
      >
        {headers.map((h, i) => (
          <span key={i}>{h}</span>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-1">
        {weeks.flat().map((cell, index) => {
          const day = dayBy.get(cell.date);
          const dayNumber = Number(cell.date.slice(8));
          const label =
            dayNumber === 1 || cell === weeks[0][0]
              ? formatParkDay(locale, cell.date, { day: 'numeric', month: 'short' })
              : String(dayNumber);
          if (!cell.inTrip || !day) {
            return (
              <li
                key={cell.date}
                className="text-muted-foreground/50 min-h-[4.5rem] rounded-md p-1 text-[11px] tabular-nums lg:min-h-28"
              >
                {label}
              </li>
            );
          }
          const span = spanBy.get(cell.date);
          const isPark = day.kind === 'park' || day.kind === 'hop';
          const date = formatParkDay(locale, cell.date, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          });
          const base = stayCells.size > 0 ? dayStayBase(day) : null;
          const full = base ? `${date}, ${baseName(base)}` : date;
          const rowStart = index % 7 === 0;
          const toCity = day.move ? t('move.toCity', { city: baseName(day.move.to) }) : null;
          const signals = holidaySignals(calendarBy.get(cell.date) ?? null);
          const storm = storms.get(cell.date) ?? null;
          const signalBar = (signals.length > 0 || storm) && (
            <span aria-hidden="true" className="absolute inset-x-0 top-0 flex h-[3px]">
              {signals.map((signal) => (
                <span key={signal} className={cn('h-full flex-1', DAY_SIGNAL_CLASS[signal])} />
              ))}
              {storm && (
                <span
                  data-plan-storm={stormSignal(storm)}
                  className={cn('h-full flex-1', STORM_SIGNAL_CLASS[stormSignal(storm)])}
                />
              )}
            </span>
          );
          const stormWord = storm ? tClimate(storm) : null;
          if (!isPark) {
            const Icon =
              day.kind === 'rest'
                ? BedDouble
                : day.kind === 'arrival'
                  ? PlaneLanding
                  : PlaneTakeoff;
            const icon =
              day.kind === 'travel' && day.move ? (
                <MoveIcon mode={day.move.mode} className="size-4 shrink-0" />
              ) : (
                <Icon className="size-4 shrink-0" aria-hidden="true" />
              );
            const word = t(`day.${day.kind}`);
            return (
              <li key={cell.date} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onOpenDay(cell.date)}
                  aria-label={`${full}: ${[word, toCity, stormWord].filter(Boolean).join(', ')}`}
                  className={cn(
                    'bg-muted/25 border-border/60 relative flex h-full min-h-[4.5rem] w-full flex-col items-start gap-1 overflow-hidden rounded-md border p-1 text-left transition hover:shadow-sm lg:min-h-28 lg:p-1.5',
                    PLAN_FOCUS
                  )}
                >
                  {signalBar}
                  <span className="text-muted-foreground text-[13px] leading-none font-bold tabular-nums">
                    {label}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    {icon}
                    <span className="hidden lg:inline">{word}</span>
                  </span>
                  {stayFoot(cell.date, rowStart)}
                </button>
              </li>
            );
          }
          const levelOf = (slug: string | null): ColoredCrowdLevel | null => {
            const raw =
              slug === null
                ? day.crowdLevel
                : (day.parks.find((p) => p.slug === slug)?.crowdLevel ??
                  calendarBy.get(cell.date)?.parks[slug]?.crowdLevel ??
                  (day.parks.length === 1 ? day.crowdLevel : undefined));
            return raw && isColoredCrowdLevel(raw) ? raw : null;
          };
          const level = levelOf(null) ?? levelOf(day.parks[0]?.slug ?? null);
          const ink = level ? CROWD_TEXT_CLASS[level] : 'text-muted-foreground';
          const pieces = span ? dayBandPieces(span, canvas) : [];
          const first = span?.blocks[0];
          const lastBlock = span?.blocks.at(-1);
          const hours =
            first && lastBlock ? formatGridHours(first.startMin, lastBlock.endMin) : null;
          const evening = eveningName(day);
          const ticketDay = ticketLabel(day, plan.meta);
          const line = evening ? t('evening.plus', { name: evening }) : ticketDay;
          const wait = shownDayWait(day, calendar);
          const what = `${parksOf(day)}${wait != null ? `, ${t('peakWait', { minutes: wait })}` : ''}`;
          const spoken =
            first && lastBlock
              ? `${formatGridTime(first.startMin)}–${formatGridTime(lastBlock.endMin, true)}`
              : t('week.noHours');
          const marker = dayMarker(day) === 'outside_ticket' ? markerText(day, calendar) : null;
          return (
            <li key={cell.date} className="min-w-0">
              <button
                type="button"
                onClick={() => onOpenDay(cell.date)}
                aria-label={`${full}: ${[what, spoken, evening ? t('evening.plus', { name: evening }) : null, ticketDay, marker, toCity, stormWord].filter(Boolean).join(', ')}`}
                className={cn(
                  'relative flex h-full min-h-[4.5rem] w-full flex-col items-start gap-1 overflow-hidden rounded-md border p-1 text-left transition hover:shadow-sm lg:min-h-28 lg:gap-1.5 lg:p-1.5',
                  level ? CROWD_TILE_CLASS[level] : 'bg-muted/25 border-border/60',
                  PLAN_FOCUS
                )}
              >
                {signalBar}
                <span className="flex w-full items-baseline gap-1">
                  <span className={cn('text-[13px] leading-none font-bold tabular-nums', ink)}>
                    {label}
                  </span>
                  {level && (
                    <span
                      className={cn(
                        'ml-auto hidden truncate text-[10px] font-bold tracking-wider uppercase lg:block',
                        ink
                      )}
                      aria-hidden="true"
                    >
                      {tCrowd(level)}
                    </span>
                  )}
                  {marker && <PlanDayMarker day={day} calendar={calendar} compact />}
                </span>
                <span
                  className={cn('text-[11px] leading-tight font-bold lg:hidden', ink)}
                  aria-hidden="true"
                >
                  {day.parks.map((p) => (
                    <span key={p.slug} title={parkName(p.slug)}>
                      {p !== day.parks[0] && '+'}
                      {codeOf(p.slug)}
                    </span>
                  ))}
                </span>
                <span
                  className={cn(
                    'hidden w-full truncate text-[13px] leading-tight font-bold lg:block',
                    ink
                  )}
                  aria-hidden="true"
                >
                  {parksOf(day)}
                </span>
                <span className="flex w-full flex-col gap-0.5" aria-hidden="true">
                  <span className="bg-foreground/[0.07] relative block h-1.5 w-full overflow-hidden rounded-full lg:h-2.5">
                    {ticks.map((h) => (
                      <span
                        key={h}
                        className="bg-foreground/15 absolute inset-y-0 hidden w-px lg:block"
                        style={{
                          left: `${((h * 60 - canvas.startMin) / (canvas.endMin - canvas.startMin)) * 100}%`,
                        }}
                      />
                    ))}
                    {pieces.map((piece, index) => {
                      const face = pieceFace(piece, levelOf);
                      return (
                        <span
                          key={index}
                          data-plan-band={piece.kind}
                          className={cn('absolute inset-y-0 rounded-full', face.className)}
                          style={{
                            left: `${piece.left}%`,
                            width: `${piece.width}%`,
                            ...face.style,
                          }}
                        />
                      );
                    })}
                  </span>
                  {first && lastBlock && (
                    <span className="text-muted-foreground relative hidden h-3.5 text-[10px] leading-none tabular-nums lg:block">
                      <span
                        className="absolute top-0.5"
                        style={{ left: `${pieces.find((p) => p.kind === 'park')?.left ?? 0}%` }}
                      >
                        {formatGridTime(first.startMin)}
                      </span>
                      <span
                        className="absolute top-0.5 -translate-x-full"
                        style={{
                          left: `${((lastBlock.endMin - canvas.startMin) / (canvas.endMin - canvas.startMin)) * 100}%`,
                        }}
                      >
                        {formatGridTime(lastBlock.endMin, true)}
                      </span>
                    </span>
                  )}
                  <span className="text-foreground/80 text-[10px] leading-tight tabular-nums lg:hidden">
                    {hours ?? t('week.noHours')}
                  </span>
                </span>
                {line && (
                  <span
                    className="text-muted-foreground line-clamp-2 hidden text-[11px] leading-tight lg:block"
                    aria-hidden="true"
                  >
                    {line}
                  </span>
                )}
                {stayFoot(cell.date, rowStart)}
              </button>
            </li>
          );
        })}
      </ol>
      {stayCells.size > 0 && (
        <div className="mt-1 flex flex-col gap-1 text-xs">
          <ul className="flex flex-wrap gap-x-3 gap-y-1" data-plan-stay-key="">
            {stays.map((stay) => (
              <li key={stay.number} className="flex items-center gap-1">
                <StayMarker number={stay.number} className="size-4 text-[10px]" />
                {baseName(stay.base)}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground">{t('month.stayKey')}</p>
        </div>
      )}
      <PlanCodeKey entries={codeKey} className="mt-2 lg:hidden" />
      <ParkCalendarLegend
        signals={TRIP_DAY_SIGNALS}
        signalsLabel={false}
        extraSignals={stormKeys([...storms.values()].filter((code) => code !== null))}
        className="mt-2"
      />
      <ul className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {(
          [
            ['early', t('week.early')],
            ['park', t('month.bandPark')],
            ['party', t('week.party')],
            ['extended', t('week.extendedEvening')],
            ['hop', t('month.bandHop')],
            ['venue', t('month.bandVenue')],
          ] as const
        )
          .filter(([kind]) => kinds.has(kind))
          .map(([kind, word]) => {
            const face = pieceFace({ kind, slug: null, left: 0, width: 100 }, () => 'low');
            return (
              <li key={kind} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="bg-foreground/[0.07] relative block h-2 w-6 overflow-hidden rounded-full"
                >
                  <span
                    className={cn('absolute inset-0 rounded-full', face.className)}
                    style={face.style}
                  />
                </span>
                {word}
              </li>
            );
          })}
        <li>
          {t('month.bandAxis', {
            from: formatGridTime(canvas.startMin),
            to: formatGridTime(canvas.endMin, true),
          })}
        </li>
      </ul>
      <p className="text-muted-foreground text-xs">{t('crowdColour')}</p>
    </div>
  );
}
