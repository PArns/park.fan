'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BedDouble,
  ChevronLeft,
  ChevronRight,
  PlaneLanding,
  PlaneTakeoff,
  Ticket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { formatGridTime } from '@/lib/planner/park-time';
import { heightFor, yFor } from '@/lib/planner/day-grid';
import { PLANNER_PHONE_QUERY } from '@/lib/planner/use-grid-scale';
import { TRANSFER_CHIP_CLASS, TRANSFER_RAIL_CLASS } from '@/lib/planner/leg-styles';
import { UNUSABLE_HATCH_IMAGE } from '@/lib/utils/hatch';
import {
  CROWD_DOT_CLASS,
  CROWD_TILE_CLASS,
  isColoredCrowdLevel,
} from '@/lib/utils/crowd-level-styles';
import { formatParkDay, formatParkDayRange } from '@/lib/utils/park-day';
import {
  TRIP_WEEK_PX_PER_MIN,
  TRIP_WEEK_PX_PER_MIN_COARSE,
  tripCanvas,
  tripColumnGrid,
  planTimeMinute,
  tripDaySpans,
  TRIP_FALLBACK_CANVAS,
  weekPages,
  WEEK_COLUMNS_PHONE,
  WEEK_COLUMNS_WIDE,
  type TripCanvas,
  type TripDaySpan,
} from '@/lib/trip-regions/plan-week';
import type { PlanDay, TripPlan } from '@/lib/trip-regions/plan';
import { dayStayBase, planStays } from '@/lib/trip-regions/plan-stays';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { PlannerGridGround } from '@/components/planner/planner-grid-ground';
import { PlannerBlockBar, PlannerBlockPhoto } from '@/components/planner/planner-block-ink';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { usePartyName } from './use-day-facts';
import { useEveningName, useTicketDayLabel } from './plan-day-bits';
import { MOVE_INK, MoveIcon, PlanStayBand, useMoveWords } from './plan-stay-band';
import { useBaseName } from './plan-place-words';

/** The gap between two day columns, which the stay band above them keeps to. */
const COLUMN_GAP_PX = 4;

/**
 * The Week view, the Outlook view of the trip: one column per day, up to a week a page (three on a
 * phone, by swipe or the arrows), on one hour axis from the earliest early slot to the latest close.
 * Each column stands on the day planner's own ground (`PlannerGridGround`: the day's band, its
 * early slot, the hour rules) and its blocks use the planner's ink. A park day is one block from
 * opening to the day guests' close with the park and its minutes and nothing else; a party night
 * is hatched after it with its name, Early Entry and Extended Evening Hours thin stripes where the
 * hotel gets them, a hop day two blocks with the leg chip between them. A press opens the day.
 */
export function PlanWeekView({
  plan,
  calendar,
  onOpenDay,
}: {
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onOpenDay: (date: string) => void;
}) {
  const t = useTranslations('tripPlanner');
  const { timeZone, locale } = usePlanContext();
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
            <PlanStayBand
              days={shown.flatMap((span) => dayBy.get(span.date) ?? [])}
              stays={stays}
              columns={perPage}
              gapPx={COLUMN_GAP_PX}
            />
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
        <div className={cn('w-10 shrink-0', ticketLine ? 'pt-16' : 'pt-12')} aria-hidden="true">
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
          style={{
            gridTemplateColumns: `repeat(${perPage}, minmax(0, 1fr))`,
            columnGap: COLUMN_GAP_PX,
          }}
        >
          {shown.map((span) => (
            <WeekColumn
              key={span.date}
              span={span}
              day={dayBy.get(span.date)}
              meta={ticketLine ? plan.meta : null}
              phone={phone}
              canvas={canvas}
              pxPerMin={pxPerMin}
              calendar={calendar}
              city={stayCity(dayBy.get(span.date))}
              onOpen={() => onOpenDay(span.date)}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}

function WeekColumn({
  span,
  day,
  meta,
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
  phone: boolean;
  canvas: TripCanvas;
  pxPerMin: number;
  calendar: TripCalendar | undefined;
  onOpen: () => void;
}) {
  const t = useTranslations('tripPlanner');
  const { locale, parkName, photos, timeZone } = usePlanContext();
  const grid = tripColumnGrid(span, canvas, pxPerMin);
  const partyName = usePartyName(calendar, day);
  const eveningOf = useEveningName();
  const eveningName = day ? eveningOf(day) : null;
  const weekday = formatParkDay(locale, span.date, { weekday: 'short' });
  const date = formatParkDay(locale, span.date, { day: 'numeric', month: 'short' });
  // Across cities, each day's label names where it is spent; the band above says it only in ink.
  const dayLabel = city ? `${weekday} ${date}, ${city}` : `${weekday} ${date}`;
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
  // After a morning move the park's hours until the guest gets in are open but lost.
  const startAtMin =
    move?.when === 'morning' && day?.startAt
      ? planTimeMinute(day.startAt, span.date, timeZone)
      : null;
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
          meta ? 'h-16' : 'h-12'
        )}
      >
        <span className="text-muted-foreground text-[11px] uppercase">{weekday}</span>
        <span className="text-sm font-semibold tabular-nums">{date}</span>
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
      </div>
      <div
        className="bg-muted/10 relative overflow-hidden rounded-md"
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

        {span.early && (
          <div
            data-plan-early=""
            title={t('week.early')}
            className="border-primary/50 bg-primary/25 absolute inset-x-2 rounded-t-sm border border-b-0 border-dashed"
            style={{
              top: yFor(grid, span.early.startMin),
              height: heightFor(grid, span.early.endMin - span.early.startMin),
            }}
          />
        )}

        {span.blocks.map((block, index) => {
          const visit = day?.parks.find((p) => p.slug === block.slug);
          const wait = span.kind === 'hop' ? visit?.headlinerWait : day?.headlinerWait;
          const level = span.kind === 'hop' ? visit?.crowdLevel : day?.crowdLevel;
          const tone = level && isColoredCrowdLevel(level) ? level : null;
          const photo = photos[block.slug];
          const name = parkName(block.slug);
          const minutes = wait != null ? t('week.minutes', { minutes: wait }) : t('week.noFigure');
          const start =
            index === 0 && startAtMin !== null && startAtMin > block.startMin
              ? Math.min(startAtMin, block.endMin)
              : block.startMin;
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
              aria-label={`${dayLabel}: ${[name, ticketDay, wait != null ? t('peakWait', { minutes: wait }) : minutes].filter(Boolean).join(', ')}`}
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
                  {name}
                </span>
                <span className="relative text-xs tabular-nums">{minutes}</span>
              </span>
            </button>
          );
        })}

        {startAtMin !== null && span.blocks[0] && startAtMin > span.blocks[0].startMin && (
          <div
            data-plan-move-lost=""
            title={t('move.lost')}
            className="border-border/60 absolute inset-x-0.5 rounded-md border border-dashed"
            style={{
              top: yFor(grid, span.blocks[0].startMin),
              height: heightFor(
                grid,
                Math.min(startAtMin, span.blocks[0].endMin) - span.blocks[0].startMin
              ),
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
                : 'border-primary/50 bg-primary/25 inset-x-2 rounded-b-sm border border-t-0 border-dashed'
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
            {span.evening.kind === 'ticketed_event' && (
              <span className="bg-background/80 line-clamp-3 rounded-sm px-0.5">
                {t('week.partyNamed', { name: partyName ?? t('week.party') })}
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
