'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, BedDouble, Bus, Car, Footprints, TrainFront } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatShortDuration } from '@/lib/utils/duration';
import { formatClockTime } from '@/lib/utils/intl-format';
import { formatParkDay, formatParkDayRange } from '@/lib/utils/park-day';
import {
  baseLeg,
  moveMinutes,
  stayBandRuns,
  stayHalves,
  type PlanStayRun,
} from '@/lib/trip-regions/plan-stays';
import { setBaseNights, tripDates, type PlanDay, type PlanMove } from '@/lib/trip-regions/plan';
import { weekHalfTracks, type WeekColumn } from '@/lib/trip-regions/plan-week';
import { usePlanContext } from './plan-context';
import { PlanStepper } from './plan-controls';
import { useAreaName, useBaseName } from './plan-place-words';

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
 * The Days view's head of a stay: its marker, its city, its dates and the hotel area, the region's
 * stay note, and its nights as the Route's stepper, so a city gets a night more or less where its
 * days are read.
 */
export function PlanStayHeader({ stay }: { stay: PlanStayRun }) {
  const t = useTranslations('tripPlanner');
  const tRegion = useTranslations('tripRegion.planner');
  const { locale, state, update, region, live } = usePlanContext();
  const baseName = useBaseName();
  const areaName = useAreaName();
  const city = baseName(stay.base);
  const note = tRegion.has(`stayNote.${stay.base}`) ? tRegion(`stayNote.${stay.base}`) : null;
  const order = (region.bases ?? []).map((b) => b.key);
  const nights = Math.max(0, tripDates(state).length - 1);
  const set = (count: number) =>
    update((s) => setBaseNights(s, stay.base, Math.max(0, Math.min(nights, count)), order));
  return (
    <div className="flex flex-col gap-1 pt-2" data-plan-stay={stay.base}>
      <div className="flex items-center gap-3">
        <StayMarker number={stay.number} className="size-7 text-sm" />
        <div className="flex min-w-0 flex-1 flex-col">
          <h4 className="text-lg leading-tight font-semibold">{city}</h4>
          <p className="text-muted-foreground text-xs">
            {[
              formatParkDayRange(locale, stay.from, stay.to, { day: 'numeric', month: 'short' }),
              stay.area ? t('result.stay.hotel', { area: areaName(stay.area) }) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <PlanStepper
          value={t('route.nights', { count: stay.nights })}
          valueClassName="w-20"
          disabled={!live}
          canDecrement={stay.nights > 0}
          canIncrement={stay.nights < nights}
          onDecrement={() => set(stay.nights - 1)}
          onIncrement={() => set(stay.nights + 1)}
          decrementLabel={t('route.fewer', { city })}
          incrementLabel={t('route.more', { city })}
        />
      </div>
      {note && (
        <p className="text-muted-foreground flex items-start gap-1.5 pl-10 text-xs">
          <BedDouble className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {note}
        </p>
      )}
    </div>
  );
}

/**
 * The notes of the leg a move takes, in words: the region's own (`moveNote.<code>`) first, else
 * the shared ones; a note this client has no words for is left out.
 */
export function useMoveNotes(): (move: Pick<PlanMove, 'from' | 'to'>) => string[] {
  const t = useTranslations('tripPlanner.move');
  const tRegion = useTranslations('tripRegion.planner');
  const { region } = usePlanContext();
  return (move) =>
    (baseLeg(region.baseLegs, move.from, move.to)?.notes ?? []).flatMap((code) =>
      tRegion.has(`moveNote.${code}`)
        ? [tRegion(`moveNote.${code}`)]
        : t.has(`note.${code}`)
          ? [t(`note.${code}`)]
          : []
    );
}

/**
 * The Week view's stay band, over the day headers and on the columns' own grid
 * (`weekHalfTracks`): two halves a day, the first the city the day starts in, the second the city
 * it ends in, so a stay runs from the second half of its arrival day to the first half of its
 * departure day, whatever width a free day's column has. Consecutive halves of one city are one
 * rounded run with its marker and city; a run of one half shows the marker alone. It is decoration
 * (`aria-hidden`): each day's label names its city.
 */
export function PlanStayBand({
  columns,
  stays,
  empty,
  gapPx,
}: {
  /** The page's columns, in order. */
  columns: readonly WeekColumn<PlanDay>[];
  stays: readonly PlanStayRun[];
  /** Day slots a short last page leaves empty. */
  empty: number;
  /** The gap between the day columns, in px. */
  gapPx: number;
}) {
  const baseName = useBaseName();
  const runs = stayBandRuns(stayHalves(columns.flatMap((c) => c.days)));
  const grid = weekHalfTracks(columns, gapPx, empty);
  const number = (base: string) => stays.find((s) => s.base === base)?.number ?? 0;
  return (
    <div
      aria-hidden="true"
      className="grid h-6"
      style={{ gridTemplateColumns: grid.template }}
      data-plan-stay-band=""
    >
      {runs.map((run) => {
        const n = number(run.base);
        return (
          <span
            key={`${run.base}-${run.start}`}
            className={cn(
              'row-start-1 flex min-w-0 items-center gap-1 overflow-hidden rounded-full px-1',
              stayTint(n)
            )}
            style={{ gridColumn: `${grid.starts[run.start]} / ${grid.ends[run.end - 1]}` }}
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
        {/* A phone's cell is too narrow for the arrow and the marker in half of it. */}
        <span className={cn('w-1/4 shrink-0 lg:w-1/2', stayTint(left.number))} />
        <span
          className={cn('flex min-w-0 flex-1 items-center gap-0.5 px-0.5', stayTint(stay.number))}
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
