'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, BedDouble, Bus, Car, Footprints, TrainFront } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatShortDuration } from '@/lib/utils/duration';
import { formatClockTime } from '@/lib/utils/intl-format';
import { formatParkDay, formatParkDayRange } from '@/lib/utils/park-day';
import {
  moveMinutes,
  stayBandRuns,
  stayHalves,
  type PlanStayRun,
} from '@/lib/trip-regions/plan-stays';
import type { PlanDay, PlanMove } from '@/lib/trip-regions/plan';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { useBaseName } from './plan-place-words';

/**
 * A trip across cities as the views draw it: a stay is a numbered marker and its city on a band in
 * one of two primary tints, alternating by its number, and never a crowd colour, which is the crowd
 * level's alone; a move wears the leg's ink, a dashed primary border on a faint primary ground.
 */

/** A stay's band tint by its number on the route. */
export function stayTint(number: number): string {
  return number % 2 === 1 ? 'bg-primary/15' : 'bg-primary/8';
}

/** A move's ink, the leg chip's: dashed primary border, faint primary ground. */
export const MOVE_INK = 'border-primary/45 bg-primary/8 border-dashed';

/** A stay's numbered marker: its place on the route, so colour never carries the stay alone. */
export function StayMarker({ number, className }: { number: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'bg-primary text-primary-foreground inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums',
        className
      )}
    >
      {number}
    </span>
  );
}

const MOVE_KIND: Partial<Record<string, 'bus' | 'car' | 'walk'>> = {
  highway_bus: 'bus',
  bus: 'bus',
  shuttle: 'bus',
  drive: 'car',
  walk: 'walk',
};

/** The icon of a move's mode: a bus, a car, on foot, else a train (the Shinkansen, a line). */
export function MoveIcon({ mode, className }: { mode: string; className?: string }) {
  const kind = MOVE_KIND[mode];
  if (kind === 'bus') return <Bus className={className} aria-hidden="true" />;
  if (kind === 'car') return <Car className={className} aria-hidden="true" />;
  if (kind === 'walk') return <Footprints className={className} aria-hidden="true" />;
  return <TrainFront className={className} aria-hidden="true" />;
}

/** How a move reads: its mode, its length, its times, its route, and the label a reader hears. */
export function useMoveWords() {
  const t = useTranslations('tripPlanner.move');
  const { locale, timeZone } = usePlanContext();
  const baseName = useBaseName();
  const mode = (m: string) => (t.has(`mode.${m}`) ? t(`mode.${m}`) : t('mode.other'));
  const duration = (move: PlanMove) => formatShortDuration(moveMinutes(move), locale);
  const time = (iso: string) => formatClockTime(iso, locale, timeZone);
  return {
    mode,
    duration,
    time,
    route: (move: PlanMove) => `${baseName(move.from)} → ${baseName(move.to)}`,
    label: (day: Pick<PlanDay, 'date'>, move: PlanMove) =>
      t('label', {
        date: formatParkDay(locale, day.date, { weekday: 'short', day: 'numeric', month: 'short' }),
        mode: mode(move.mode),
        from: baseName(move.from),
        to: baseName(move.to),
        depart: time(move.departAt),
        arrive: time(move.arriveAt),
        duration: duration(move),
      }),
  };
}

/**
 * The list view's header of a stay: its marker, its city, its nights and its dates, a hairline to
 * the right.
 */
export function PlanStayHeader({ stay }: { stay: PlanStayRun }) {
  const t = useTranslations('tripPlanner.route');
  const tRegion = useTranslations('tripRegion.planner');
  const { locale } = usePlanContext();
  const baseName = useBaseName();
  const note = tRegion.has(`stayNote.${stay.base}`) ? tRegion(`stayNote.${stay.base}`) : null;
  return (
    <div className="flex flex-col pt-3 pb-1">
      <div className="flex items-center gap-2" data-plan-stay={stay.base}>
        <StayMarker number={stay.number} />
        <span className="text-base font-semibold">{baseName(stay.base)}</span>
        <span className="text-muted-foreground text-sm">
          {t('nights', { count: stay.nights })} ·{' '}
          {formatParkDayRange(locale, stay.from, stay.to, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </span>
        <span aria-hidden="true" className="bg-border/70 h-px min-w-4 flex-1" />
      </div>
      {note && (
        <p className="text-muted-foreground flex items-start gap-1.5 pt-0.5 pl-7 text-xs">
          <BedDouble className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {note}
        </p>
      )}
    </div>
  );
}

/**
 * The list view's row of a move: the leg's dashed rail where a day's date stands, the mode and its
 * length as a chip, the route and the typical times. It opens the day it belongs to.
 */
export function PlanMoveRow({
  day,
  onOpenDay,
}: {
  day: PlanDay;
  onOpenDay: (date: string) => void;
}) {
  const words = useMoveWords();
  const move = day.move;
  if (!move) return null;
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpenDay(day.date)}
        aria-label={words.label(day, move)}
        data-plan-move={move.when}
        className={cn(
          'hover:bg-accent/40 flex min-h-11 w-full items-center gap-2 rounded-md py-1 pr-2 text-left text-sm transition-colors',
          PLAN_FOCUS
        )}
      >
        <span
          aria-hidden="true"
          className="border-primary/45 h-9 w-1 shrink-0 border-l-2 border-dashed"
        />
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs tabular-nums',
            MOVE_INK
          )}
        >
          <MoveIcon mode={move.mode} className="text-primary-ink size-3.5" />
          {words.mode(move.mode)} · {words.duration(move)}
        </span>
        <span aria-hidden="true" className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate font-medium">{words.route(move)}</span>
          <span className="text-muted-foreground truncate text-xs tabular-nums">
            {words.time(move.departAt)} → {words.time(move.arriveAt)}
          </span>
        </span>
      </button>
    </li>
  );
}

/**
 * The Week view's stay band, over the day headers and aligned to the columns: two halves a day,
 * the first the city the day starts in, the second the city it ends in, so a stay runs from the
 * second half of its arrival day to the first half of its departure day. Consecutive halves of one
 * city are one rounded run with its marker and city; a run of one half shows the marker alone. It
 * is decoration (`aria-hidden`): each day's label names its city.
 */
export function PlanStayBand({
  days,
  stays,
  columns,
  gapPx,
}: {
  /** The page's days, in order. */
  days: readonly PlanDay[];
  stays: readonly PlanStayRun[];
  /** The page's columns, which a short last page may not fill. */
  columns: number;
  /** The gap between the day columns, in px. */
  gapPx: number;
}) {
  const baseName = useBaseName();
  const runs = stayBandRuns(stayHalves(days));
  const number = (base: string) => stays.find((s) => s.base === base)?.number ?? 0;
  // A half's left edge on the column grid: whole columns with their gaps, plus half a column.
  const edge = (half: number) => {
    const day = Math.floor(half / 2);
    const col = `((100% - ${(columns - 1) * gapPx}px) / ${columns})`;
    return `calc(${day} * (${col} + ${gapPx}px) + ${half % 2} * ${col} / 2)`;
  };
  const right = (half: number) => {
    const day = Math.floor((half - 1) / 2);
    const col = `((100% - ${(columns - 1) * gapPx}px) / ${columns})`;
    return `calc(${day} * (${col} + ${gapPx}px) + ${((half - 1) % 2) + 1} * ${col} / 2)`;
  };
  return (
    <div aria-hidden="true" className="relative h-6" data-plan-stay-band="">
      {runs.map((run) => {
        const n = number(run.base);
        return (
          <span
            key={`${run.base}-${run.start}`}
            className={cn(
              'absolute inset-y-0 flex min-w-0 items-center gap-1 overflow-hidden rounded-full px-1',
              stayTint(n)
            )}
            style={{ left: edge(run.start), width: `calc(${right(run.end)} - ${edge(run.start)})` }}
          >
            <StayMarker number={n} className="size-4 text-[10px]" />
            {run.end - run.start > 1 && (
              <span className="truncate text-[11px] font-medium">{baseName(run.base)}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/**
 * The Month view's stay band for one date's cell, built here for the Month view to place along the
 * cell's foot: the city slept in, its marker and name where a stay begins (`first`), and on a move
 * day the cell split, the city left on the left, an arrow, the marker and the city reached on the
 * right. `stay` is the night's stay, `left` the stay the day starts in when it differs.
 */
export function PlanMonthStayBand({
  stay,
  left,
  first,
  className,
}: {
  stay: PlanStayRun;
  left?: PlanStayRun | null;
  /** The stay begins here, or the week row does: the band names its city. */
  first: boolean;
  className?: string;
}) {
  const baseName = useBaseName();
  if (left && left.base !== stay.base) {
    return (
      <span
        aria-hidden="true"
        className={cn('flex h-5 min-w-0 items-stretch overflow-hidden text-[10px]', className)}
        data-plan-month-stay={`${left.base}>${stay.base}`}
      >
        <span className={cn('w-1/2', stayTint(left.number))} />
        <span
          className={cn('flex w-1/2 min-w-0 items-center gap-0.5 px-0.5', stayTint(stay.number))}
        >
          <ArrowRight className="text-primary-ink size-3 shrink-0" />
          <StayMarker number={stay.number} className="size-3.5 text-[9px]" />
        </span>
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-5 min-w-0 items-center gap-0.5 overflow-hidden px-0.5 text-[10px]',
        stayTint(stay.number),
        className
      )}
      data-plan-month-stay={stay.base}
    >
      {first && (
        <>
          <StayMarker number={stay.number} className="size-3.5 text-[9px]" />
          <span className="truncate font-medium">{baseName(stay.base)}</span>
        </>
      )}
    </span>
  );
}
