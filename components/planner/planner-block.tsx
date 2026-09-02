'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CROWD_DOT_CLASS,
  CROWD_TEXT_CLASS,
  CROWD_TILE_CLASS,
  waitTimeCrowdTier,
} from '@/lib/utils/crowd-level-styles';
import { formatGridTime } from '@/lib/planner/park-time';
import { MIN_BAND_PX, blockBoxFor, heightFor, yFor, type DayGrid } from '@/lib/planner/day-grid';
import { formatDistance } from '@/lib/utils/distance-utils';
import type { LanePlacement } from '@/lib/planner/day-grid';
import type { PlannerEntry } from '@/lib/planner/types';
import type { PlannerEstimate } from '@/lib/planner/estimate';
import type { PlanDayTier } from '@/lib/api/types';

/** A block with no figure gets a stated box rather than a height it cannot back. */
const NO_FIGURE_PX = 40;

interface PlannerBlockProps {
  entry: PlannerEntry;
  estimate: PlannerEstimate;
  grid: DayGrid;
  tier: PlanDayTier;
  lane: LanePlacement;
  /** Land of the ride, for the meta line. */
  land?: string | null;
  /** Straight-line metres from the previous entry, for the "auf den Karten" reading. */
  metresFromPrevious?: number | null;
  /** Whether the band may carry a figure at this distance. */
  showBandFigure: boolean;
  /** A live standby reading replacing the forecast, when one applies. */
  live?: boolean;
  /** The ride's photo, resolved server-side. */
  photo?: { src: string; position: string } | null;
  /** The ride is reporting closed right now. Only ever set for today. */
  closedNow?: boolean;
  /** The ride was down all of the previous operating day. */
  downYesterday?: boolean;
  selected?: boolean;
  dragging?: boolean;
  conflict?: boolean;
  onSelect: () => void;
  onDragStart: (event: React.PointerEvent<HTMLElement>) => void;
  onMove: (startMinute: number) => void;
  /** Bounds for the keyboard control — the same clamp the drag obeys. */
  minMinute: number;
  maxMinute: number;
  snapStep: number;
}

/**
 * One planned ride, as a block in the day grid.
 *
 * **Its height is the queue, and only the queue.** Not "queue plus the ride":
 * `PlanDayRide` carries no duration, the curated `durationSeconds` covers about
 * one ride in eight, and its median is 117 seconds — 2.3 px here. A ride segment
 * would be a sub-three-pixel decoration standing in for a measurement, and it
 * would make two identical 45-minute queues draw at different heights for a
 * reason no legend could explain. The ride's own minutes live in the leg below,
 * where minutes are compared rather than drawn.
 *
 * The box may be taller than the fill — twenty pixels is the smallest box a line
 * of text sits in — but the tinted fill inside is always drawn to the true
 * height, so the box grows and the ink does not lie.
 */
export function PlannerBlock({
  entry,
  estimate,
  grid,
  tier,
  lane,
  land,
  metresFromPrevious,
  showBandFigure,
  live = false,
  photo = null,
  closedNow = false,
  downYesterday = false,
  selected = false,
  dragging = false,
  conflict = false,
  onSelect,
  onDragStart,
  onMove,
  minMinute,
  maxMinute,
  snapStep,
}: PlannerBlockProps) {
  const t = useTranslations('planner');
  const done = Boolean(entry.done);

  const wait = done ? (entry.actualWait ?? null) : estimate.wait;
  const hasFigure = wait !== null;

  const top = yFor(grid, entry.startMinute);
  const fillPx = hasFigure ? heightFor(grid, wait) : 0;
  const boxPx = hasFigure ? blockBoxFor(grid, wait) : NO_FIGURE_PX;

  const bandMinutes = done || live ? null : estimate.uncertaintyMinutes;
  const bandPx = bandMinutes === null ? 0 : heightFor(grid, bandMinutes);
  const drawBand = bandPx >= MIN_BAND_PX;

  const tone = hasFigure ? waitTimeCrowdTier(wait) : null;

  // The tier's soft edge rotates from "to right" to "to bottom", and improves in
  // the rotation: a soft LOWER edge says "this may end later than we say", which
  // is a statement about the clock rather than about a bar's length. The old
  // 88 %/72 % were fractions of a fixed-width track and are meaningless as
  // fractions of a variable height — 12 % of a 20 px block is an antialiasing
  // artefact — so they are restated in pixels with a ceiling.
  const fadePx =
    done || live || tier === 'measured' ? 0 : Math.min(tier === 'composed' ? 10 : 22, fillPx * 0.5);
  const mask =
    fadePx === 0 || fillPx < 16
      ? undefined
      : `linear-gradient(to bottom, black calc(100% - ${fadePx}px), transparent 100%)`;
  const softBorder = fadePx > 0 && fillPx < 16;

  const endMinute = entry.startMinute + (wait ?? 0);
  const range = `${formatGridTime(entry.startMinute)}–${formatGridTime(endMinute)}`;

  const missingLabel =
    estimate.missing === 'outside-hours'
      ? t('day.closed')
      : estimate.missing === 'no-curve'
        ? t('entry.noCurve')
        : null;

  const laneWidth = `calc((100% - ${(lane.columns - 1) * 2}px) / ${lane.columns})`;
  const laneLeft = `calc((${laneWidth} + 2px) * ${lane.column})`;

  return (
    <li
      data-planner-entry={entry.id}
      data-planner-block=""
      data-verdict-block={conflict ? 'broken' : undefined}
      // Clicking anywhere on the block selects it. The grip is 24 px on a fine
      // pointer, and requiring a hit on that strip to reach a block's own
      // actions would make them practically unreachable with a mouse. The
      // keyboard path is the range input, which is a real control; this is the
      // pointer affordance for the same thing.
      onClick={onSelect}
      className={cn(
        'group absolute',
        dragging && 'z-30 opacity-90 shadow-lg',
        !dragging && 'transition-[box-shadow,opacity] duration-150'
      )}
      style={{
        top,
        height: boxPx,
        left: laneLeft,
        width: laneWidth,
        zIndex: dragging ? 30 : 10 + lane.column,
        transform: dragging ? 'translateY(var(--pl-drag-dy, 0px))' : undefined,
      }}
    >
      {/* The uncertainty band, drawn FIRST so the solid fill sits on it, and
          deliberately outside the block's clipping so it reaches down into the
          gap — the leg's verdict is computed from this same spread, so a reader
          can see the thing the verdict is about. One-sided downward, which is
          what a one-sided-upward wait band means once it is a duration. */}
      {drawBand && hasFigure && tone && (
        <div
          className={cn('absolute inset-x-0 top-0 rounded-b-md opacity-25', CROWD_DOT_CLASS[tone])}
          style={{ height: fillPx + bandPx }}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-md border',
          done && 'bg-foreground/10 border-foreground/30',
          !done && hasFigure && tone && CROWD_TILE_CLASS[tone],
          // No figure: an outline, never a tint. A crowd-coloured box asserts a
          // queue length, and this one has none.
          !hasFigure && 'border-border/70 border-dashed',
          softBorder && 'border-b-dashed border-b-2',
          selected && 'ring-primary/60 ring-2',
          conflict && 'ring-destructive/45 ring-1',
          lane.column > 0 && 'ring-background ring-1'
        )}
      >
        {/* The ride's photo, behind everything, and only where there is enough
            block to see any of it — under 48 px it is a smear behind text and
            costs a request for nothing. Heavily dimmed: this is a data surface
            and the tint carries the queue, so the picture is recognition rather
            than decoration. `background-image` and not `next/image`, because a
            block is 130–400 px wide, its size changes with the plan, and the
            crop is already the right one. */}
        {photo && boxPx >= 48 && (
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage: `url(${photo.src})`,
              backgroundSize: 'cover',
              backgroundPosition: photo.position,
            }}
            aria-hidden="true"
          />
        )}

        {/* The fill, masked by the tier. Separate from the box so the box can be
            taller without the ink claiming the extra pixels. */}
        {hasFigure && tone && !done && (
          <div
            className={cn('absolute inset-x-0 top-0', CROWD_DOT_CLASS[tone], 'opacity-[0.18]')}
            style={{
              height: fillPx,
              ...(mask ? { maskImage: mask, WebkitMaskImage: mask } : {}),
            }}
            aria-hidden="true"
          />
        )}

        {/* Outlook's category bar. */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-[3px] rounded-l',
            done ? 'bg-foreground/40' : tone ? CROWD_DOT_CLASS[tone] : 'bg-muted-foreground/40'
          )}
          aria-hidden="true"
        />

        {/* The grip. A rail on a coarse pointer, the whole body on a fine one —
            `touch-none` never goes on the block, which covers most of the grid's
            area and would make it unscrollable exactly where the plan is read. */}
        <button
          type="button"
          onPointerDown={onDragStart}
          onClick={onSelect}
          aria-label={t('entry.dragHandle')}
          className={cn(
            'absolute inset-y-0 left-0 z-10 w-6 cursor-grab touch-none active:cursor-grabbing max-sm:w-11',
            // The target grows and the box does not: on a 20 px block a 44 px
            // pseudo-element reaches past the edges without moving anything.
            'max-sm:after:absolute max-sm:after:top-1/2 max-sm:after:h-11 max-sm:after:w-11 max-sm:after:-translate-y-1/2 max-sm:after:content-[""]'
          )}
        />

        {/* The keyboard equivalent, and the same code path the drag commits
            through. A range input is what this repo already reaches for when a
            continuous value has to be draggable; `min` IS the ride-opening
            clamp, enforced by the platform rather than by a handler. */}
        <input
          type="range"
          min={minMinute}
          max={maxMinute}
          step={snapStep}
          value={entry.startMinute}
          aria-label={`${entry.attractionName} — ${range}`}
          onChange={(event) => onMove(Number(event.target.value))}
          className="absolute inset-y-0 left-0 z-20 w-6 cursor-pointer appearance-none bg-transparent opacity-0 max-sm:w-11"
        />

        <div className="pointer-events-none relative min-w-0 flex-1 px-1.5 py-0.5 pl-2.5">
          {boxPx < 30 ? (
            <p
              className={cn(
                'truncate text-[11px] leading-none',
                done && 'line-through',
                tone && !done && CROWD_TEXT_CLASS[tone]
              )}
            >
              {entry.attractionName}
            </p>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-1">
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate',
                    boxPx >= 48 ? 'text-sm' : 'text-[11px]',
                    done && 'line-through',
                    tone && !done && CROWD_TEXT_CLASS[tone]
                  )}
                >
                  {entry.attractionName}
                </span>
                {(closedNow || downYesterday) && (
                  <AlertTriangle
                    className={cn(
                      'size-3 shrink-0',
                      closedNow ? 'text-destructive' : 'text-crowd-high'
                    )}
                    aria-label={closedNow ? t('warn.closedNow') : t('warn.downYesterday')}
                  />
                )}
                {hasFigure && (
                  <span
                    data-figure=""
                    className={cn(
                      'shrink-0 font-mono text-[11px] tabular-nums',
                      tone && !done && CROWD_TEXT_CLASS[tone]
                    )}
                  >
                    {live && (
                      <span
                        className="bg-status-operating mr-1 inline-block size-1.5 rounded-full align-middle"
                        aria-hidden="true"
                      />
                    )}
                    {wait}
                  </span>
                )}
              </div>

              {boxPx >= 48 && (
                <p className="text-muted-foreground truncate text-[10px] tabular-nums">
                  {range}
                  {typeof metresFromPrevious === 'number' && (
                    <span className="ml-1.5">↑ {formatDistance(metresFromPrevious)}</span>
                  )}
                </p>
              )}

              {boxPx >= 68 && (
                <p className="text-muted-foreground truncate text-[10px]">
                  {land}
                  {showBandFigure && estimate.uncertaintyMinutes !== null && !done && (
                    <span className="ml-1.5 font-mono tabular-nums">
                      {t('band.plusMinus', { minutes: estimate.uncertaintyMinutes })}
                    </span>
                  )}
                </p>
              )}
            </>
          )}

          {!hasFigure && missingLabel && boxPx >= 30 && (
            <p className="text-muted-foreground truncate text-[10px]">{missingLabel}</p>
          )}

          {/* The reason, spelled out where there is room. The icon above carries
              it on a short block; this is the same statement at full length. */}
          {(closedNow || downYesterday) && boxPx >= 48 && (
            <p
              className={cn(
                'truncate text-[10px]',
                closedNow ? 'text-destructive' : 'text-crowd-high'
              )}
            >
              {closedNow ? t('warn.closedNow') : t('warn.downYesterday')}
            </p>
          )}
        </div>
      </div>

      {/* A short block's figure escapes rather than being dropped: the box is
          20 px and the number still has to be readable. */}
      {boxPx < 30 && hasFigure && (
        <span
          data-figure=""
          className="text-muted-foreground pointer-events-none absolute top-1/2 z-20 -translate-y-1/2 pl-1 font-mono text-[10px] whitespace-nowrap tabular-nums"
          style={{ left: '100%' }}
        >
          {wait} {t('unit.min')}
        </span>
      )}
    </li>
  );
}
