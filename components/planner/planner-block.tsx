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
import {
  MIN_BAND_PX,
  MIN_BLOCK_PX,
  blockBoxFor,
  heightFor,
  yFor,
  type DayGrid,
} from '@/lib/planner/day-grid';
import { formatDistance } from '@/lib/utils/distance-utils';
import { PLANNER_BLOCK_ICON_COMPONENTS } from './planner-block-icons';
import type { LanePlacement } from '@/lib/planner/day-grid';
import type { PlannerEntry } from '@/lib/planner/types';
import type { PlannerEstimate } from '@/lib/planner/estimate';
import type { PlanDayTier } from '@/lib/api/types';

/** A block with no figure gets a stated box rather than a height it cannot back. */
const NO_FIGURE_PX = 40;

/**
 * The box a block needs before the warning SENTENCE fits under the rows above it.
 *
 * 48 and 68 below are design thresholds — the height at which a photo stops
 * being a smear, the height at which the land line earns its room. This is not
 * one of those. The text column is `overflow-hidden` and the sentence is an
 * extra LINE, so hanging it on 48 (the threshold that admits the time range)
 * puts a third row in a box measured for two: name 20 px + range 15 px +
 * sentence 15 px + the column's `py-0.5` is 54, and the sentence was cut through
 * the middle of its glyphs on every block between 48 and 54 px. The land line
 * pushes the same stack to 69.
 *
 * The icon is unaffected and still rides on the name row at any height — it is
 * what carries the warning where the sentence cannot go.
 */
/**
 * How much of the photo shows through.
 *
 * EVERY ride block gets one now, whatever it is tall. There used to be a floor
 * — 48 px first, which at 1.2 px per minute is a forty-minute queue, then 28 —
 * and both were the same mistake in two sizes: a plan is mostly made of twenty-
 * to thirty-five-minute blocks, so the picture appeared on a headliner's worst
 * hour and nowhere else. A day of four rides with four photographs in the
 * payload drew zero of them. A ten-minute block is a thin band of a picture,
 * which is a small thing rather than a wrong one, and the block beside it
 * having none was the actual inconsistency.
 *
 * Which is also why it is 0.20 and not the 0.30 it shipped at. Those two
 * decisions are one decision: a photo that appears on ONE block in a column of
 * six reads as an accent and can afford to be strong, while a photo on all six
 * is the column's texture and 0.30 made a lit wooden track the loudest thing in
 * a panel whose subject is a number. The floor under it is the text, not the
 * picture — the name and the wait are `text-crowd-*`, a thin orange on a busy
 * hour, and they keep the drop shadow below at every height.
 */
const PHOTO_OPACITY = 'opacity-[0.2]';

/**
 * The box a block needs before it can print its own times.
 *
 * It was 48, which is the height at which the NAME grows to `text-sm` — two
 * unrelated decisions on one number, and the taller of the two won. A block is
 * two lines of 14 px and 13 px inside `py-0.5`, so 34 is what the second line
 * actually costs. At 48 a 30-minute queue (36 px) showed a ride's name and its
 * wait and never said when it was, on a grid whose whole subject is when.
 */
const RANGE_MIN_PX = 34;
const WARN_SENTENCE_PX = 54;
const WARN_SENTENCE_WITH_LAND_PX = 69;

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
  /**
   * A preview of where a drag would land, not a block in the plan.
   *
   * Translucent and inert. It is a whole block rather than an outline because
   * the thing a visitor is deciding is what they GET at the new time: the wait
   * is recomputed for that minute, so the ghost's height and its colour are the
   * answer, and an outline of the old height would be the wrong answer drawn
   * confidently.
   */
  ghost?: boolean;
  onSelect: () => void;
  onDragStart: (event: React.PointerEvent<HTMLElement>) => void;
  /** Free blocks only: dragging the bottom edge sets the duration. */
  onResizeStart?: (event: React.PointerEvent<HTMLElement>) => void;
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
  ghost = false,
  onSelect,
  onDragStart,
  onResizeStart,
  onMove,
  minMinute,
  maxMinute,
  snapStep,
}: PlannerBlockProps) {
  const t = useTranslations('planner');
  const done = Boolean(entry.done);

  // A free block is measured in the one unit the visitor set themselves. Its
  // height is a DURATION, not a queue, so it carries no figure, no uncertainty
  // band and no crowd tint — there is nothing predicted about it to be wrong.
  const custom = entry.custom ?? null;
  const CustomIcon = custom ? PLANNER_BLOCK_ICON_COMPONENTS[custom.icon] : null;

  const wait = custom ? null : done ? (entry.actualWait ?? null) : estimate.wait;
  const hasFigure = wait !== null;

  const top = yFor(grid, entry.startMinute);
  const fillPx = custom
    ? heightFor(grid, custom.durationMinutes)
    : hasFigure
      ? heightFor(grid, wait)
      : 0;
  const boxPx = custom
    ? Math.max(MIN_BLOCK_PX, fillPx)
    : hasFigure
      ? blockBoxFor(grid, wait)
      : NO_FIGURE_PX;

  const bandMinutes = custom || done || live ? null : estimate.uncertaintyMinutes;
  const bandPx = bandMinutes === null ? 0 : heightFor(grid, bandMinutes);
  const drawBand = bandPx >= MIN_BAND_PX;

  /** An assumed figure has no colour: a tint is a claim about how busy it is. */
  const assumed = estimate.missing === 'assumed';
  const tone = !custom && hasFigure && !assumed ? waitTimeCrowdTier(wait) : null;

  // The tier's soft edge rotates from "to right" to "to bottom", and improves in
  // the rotation: a soft LOWER edge says "this may end later than we say", which
  // is a statement about the clock rather than about a bar's length. The old
  // 88 %/72 % were fractions of a fixed-width track and are meaningless as
  // fractions of a variable height — 12 % of a 20 px block is an antialiasing
  // artefact — so they are restated in pixels with a ceiling.
  const fadePx =
    custom || done || live || tier === 'measured'
      ? 0
      : Math.min(tier === 'composed' ? 10 : 22, fillPx * 0.5);
  const mask =
    fadePx === 0 || fillPx < 16
      ? undefined
      : `linear-gradient(to bottom, black calc(100% - ${fadePx}px), transparent 100%)`;
  const softBorder = fadePx > 0 && fillPx < 16;

  const endMinute = entry.startMinute + (custom ? custom.durationMinutes : (wait ?? 0));
  const range = `${formatGridTime(entry.startMinute)}–${formatGridTime(endMinute)}`;

  const missingLabel =
    custom || estimate.missing === 'custom'
      ? null
      : estimate.missing === 'outside-hours'
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
      // And dragging anywhere on it MOVES it, on a fine pointer only. The grip's
      // own comment has claimed "a rail on a coarse pointer, the whole body on a
      // fine one" since it was written, and the body half of that was never
      // wired: a mouse drag anywhere but the 24 px rail did nothing.
      //
      // Fine pointers only, and that is not a preference. `touch-none` is what
      // lets a drag win over the browser's own scrolling, and a block covers most
      // of the grid's area — putting it on the body would make the plan
      // unscrollable with a finger exactly where it is read. So a touch device
      // keeps the 44 px rail, which is why the rail exists.
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        if (!matchMedia('(pointer: fine)').matches) return;
        // The rail and the resize edge start their own drags; a press that began
        // on one of those has already been handled.
        if ((event.target as HTMLElement).closest('button, input')) return;
        onDragStart(event);
      }}
      className={cn(
        'group absolute',
        dragging && 'z-30 opacity-90 shadow-lg',
        // A preview, and it may not be mistaken for the plan: half opacity, a
        // dashed primary ring so it reads as "would land here", and inert —
        // `pointer-events-none` covers the grip, the resize edge and the range
        // input in one place, so the ghost cannot be grabbed, focused or
        // tabbed to while the real block is under the pointer.
        ghost && 'outline-primary/70 pointer-events-none z-20 opacity-50 outline-2 outline-dashed',
        // The tone recomputes on every move — `estimate.wait` is a function of
        // `startMinute` — so the colour DOES follow a block across the day. It
        // just arrived in a single frame, at the instant the eye was on the
        // pointer, which is why it read as "the colour does not change". The
        // dragging branch stays transition-free or the drop fights the transform.
        !dragging &&
          'transition-[box-shadow,opacity,background-color,border-color,color] duration-300'
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
          // A free block: solid and neutral. Its height IS a claim — the one the
          // visitor made — so it may not wear the dashed outline that means "no
          // number here", and it may not wear a crowd tint either, because
          // nothing predicted it.
          custom && !done && 'bg-muted/50 border-border/70',
          // No figure and not a free block: an outline, never a tint. A
          // crowd-coloured box asserts a queue length, and this one has none —
          // but it still needs a GROUND. Transparent, it let the leg chip in the
          // gap below it (`zIndex: 5`, under the block's own 10) paint through
          // its own text, which reads as two sentences printed on top of each
          // other rather than as two elements at different depths.
          !hasFigure && !custom && 'bg-background/70 border-border/70 border-dashed',
          // Same for an assumption: a ground, so nothing shows through, and no
          // crowd colour, because nothing measured it.
          assumed && !done && 'bg-muted/40 border-border/70',
          softBorder && 'border-b-dashed border-b-2',
          selected && 'ring-primary/60 ring-2',
          conflict && 'ring-destructive/45 ring-1',
          lane.column > 0 && 'ring-background ring-1'
        )}
      >
        {/* The ride's photo, behind everything, on every block that has one.
            `background-image` and not `next/image`, because a block is 130–400
            px wide, its size changes with the plan, and the crop is already the
            right one. No height floor — see {@link PHOTO_OPACITY}. */}
        {photo && (
          <div
            className={cn('absolute inset-0', PHOTO_OPACITY)}
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

        {/* The bottom edge, and only on a free block. A ride's height is the
            queue the model predicts and is not the visitor's to drag; this one
            is a duration they set, so its edge is the control that sets it.
            `touch-none` sits on an 8 px strip rather than on the block, which
            covers most of the grid and would stop the plan scrolling. */}
        {custom && onResizeStart && (
          <button
            type="button"
            onPointerDown={onResizeStart}
            onClick={(event) => event.stopPropagation()}
            aria-label={t('entry.resizeHandle')}
            className={cn(
              'group/resize absolute inset-x-0 bottom-0 z-20 flex h-2 cursor-ns-resize touch-none items-end justify-center',
              'max-sm:after:absolute max-sm:after:bottom-0 max-sm:after:h-11 max-sm:after:w-full max-sm:after:content-[""]'
            )}
          >
            <span className="bg-muted-foreground/40 group-hover/resize:bg-muted-foreground/70 mb-0.5 h-0.5 w-6 rounded-full transition-colors" />
          </button>
        )}

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
          aria-label={`${custom ? custom.label : entry.attractionName} — ${range}`}
          onChange={(event) => onMove(Number(event.target.value))}
          /* `pointer-events-none`, and that one word is the whole reason blocks
             could not be dragged. This input is invisible (`opacity-0`) and sits
             at z-20 over the grip button at z-10 in the SAME column, so every
             pointer press in the grip landed on a slider instead of on
             `onPointerDown={onDragStart}`. Measured: on a phone a 90 px drag
             moved the block from 600 to 600 on both the grip and the body; on a
             desktop it moved 600 to 840, which is not a success either — 90 px
             at 1.2 px/min is 75 minutes, so the honest answer was 675, and 840
             is a horizontal slider whose whole day-long range is mapped across
             24 px of width.

             The input STAYS, because it is the keyboard path and its `min`/`max`
             are the opening clamp enforced by the platform rather than by a
             handler. `pointer-events: none` removes it from hit-testing only:
             it keeps its place in the tab order, and arrow keys still move the
             block by `step`. */
          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-6 cursor-pointer appearance-none bg-transparent opacity-0 focus-visible:pointer-events-auto max-sm:w-11"
        />

        {/* The text, and a shadow under it wherever a photograph is. A block's
            name and its figure are coloured by the crowd tier — `text-crowd-*`,
            a thin orange on a busy hour — and at `opacity-[0.3]` a ride photo
            still carries enough light behind them to swallow the strokes. The
            recipe is `WaitTimeValue`'s, which every park and ride card already
            uses for exactly this: a wait time over a picture.
            Only where there IS a photo, so a block on the panel's flat ground
            pays nothing for it — which is now the same condition the picture
            itself is drawn under, at every height. */}
        <div
          className="pointer-events-none relative min-w-0 flex-1 px-1.5 py-0.5 pl-2.5"
          style={photo ? { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.65))' } : undefined}
        >
          {boxPx < 30 ? (
            /* One row, and the figure sits IN it. It used to escape past the
               block's right edge (`left: 100%`) so a 20 px box would not have to
               hold two things — which works only while something is beside the
               block. A block in a lane of its own is the full width of the
               canvas, so the escape landed outside the scroller and was clipped:
               Chiapas at a ten-minute queue drew a bar reading "Chiapas" and
               nothing else, on a grid whose subject is when. Inside there is
               room for both — the name truncates the way it does in every taller
               block, and the figure is `shrink-0`. */
            <p
              className={cn(
                'flex items-center gap-1 text-[11px] leading-none',
                done && 'line-through',
                tone && !done && CROWD_TEXT_CLASS[tone]
              )}
            >
              {CustomIcon && <CustomIcon className="size-3 shrink-0" />}
              <span className="min-w-0 flex-1 truncate">
                {custom ? custom.label : entry.attractionName}
              </span>
              {hasFigure && (
                <span
                  data-figure=""
                  className="text-muted-foreground shrink-0 font-mono text-[10px] tabular-nums"
                >
                  {formatGridTime(entry.startMinute)} · {assumed && '~'}
                  {wait} {t('unit.min')}
                </span>
              )}
            </p>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-1">
                <span
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-1.5 truncate',
                    boxPx >= 48 ? 'text-sm' : 'text-[11px]',
                    done && 'line-through',
                    tone && !done && CROWD_TEXT_CLASS[tone]
                  )}
                >
                  {CustomIcon && <CustomIcon className="size-3.5 shrink-0" />}
                  <span className="truncate">{custom ? custom.label : entry.attractionName}</span>
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
                    {/* `~` on an assumed figure and nowhere else. Five minutes
                        for a ride nobody measured is the smallest claim that is
                        still a claim, and it may not read like a reading. */}
                    {assumed && '~'}
                    {wait}
                    {/* The unit, always. A bare `50` on a block next to a block
                        reading `40` is a pair of numbers with no dimension —
                        this grid also carries distances, durations and a ± band,
                        so nothing about the position says which one it is. It
                        stays a size down and unemphasised so the figure is still
                        what the eye lands on. */}
                    <span className="ml-0.5 text-[9px] font-normal opacity-70">
                      {t('unit.min')}
                    </span>
                  </span>
                )}
              </div>

              {boxPx >= RANGE_MIN_PX && (
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
          {(closedNow || downYesterday) &&
            boxPx >= (boxPx >= 68 ? WARN_SENTENCE_WITH_LAND_PX : WARN_SENTENCE_PX) && (
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
    </li>
  );
}
