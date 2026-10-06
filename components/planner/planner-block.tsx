'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, Droplets, Theater, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CROWD_DOT_CLASS,
  CROWD_TEXT_CLASS,
  CROWD_TILE_CLASS,
  waitTimeCrowdTier,
} from '@/lib/utils/crowd-level-styles';
import { formatGridTime } from '@/lib/planner/park-time';
import { drawnBoxPx, heightFor, laneBox, yFor, type DayGrid } from '@/lib/planner/day-grid';
import { formatDistance } from '@/lib/utils/distance-utils';
import { PLANNER_BLOCK_ICON_COMPONENTS } from './planner-block-icons';
import type { LanePlacement } from '@/lib/planner/day-grid';
import type { PlannerEntry } from '@/lib/planner/types';
import { actualVsEstimate, isAssumedWait, type PlannerEstimate } from '@/lib/planner/estimate';
import { backgroundPhotoUrl } from '@/lib/utils/image-loader';
import type { PlanDayShowSource, PlanDayTier } from '@/lib/api/types';

/**
 * The bordered div's border, doubled: the two pixels the resize edge's touch target may not count
 * on. An absolute box is laid out against the containing block's padding box, so a target capped at
 * the full height would reach one pixel into the neighbour.
 */
const BLOCK_BORDER_PX = 2;

/**
 * How much of the photo shows through. Every ride block gets one, whatever its height, so the
 * photo is the column's texture rather than an accent, and 0.2 keeps it quieter than the numbers.
 */
const PHOTO_OPACITY = 'opacity-[0.2]';

/**
 * The box a block needs before it can print its own times: two lines of 14 px and 13 px inside
 * `py-0.5`.
 */
const RANGE_MIN_PX = 34;
/**
 * The box a block needs before the warning sentence fits under the rows above it: name 20 px +
 * range 15 px + sentence 15 px + padding, and 69 with the land line. The text column clips, so a
 * lower threshold cuts the sentence through its glyphs; the icon carries the warning below this.
 */
const WARN_SENTENCE_PX = 54;
const WARN_SENTENCE_WITH_LAND_PX = 69;

/** A show line that falls into a block, as the block writes it. */
export interface PlannerBlockShow {
  minute: number;
  names: readonly string[];
  source: PlanDayShowSource;
}

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
  /**
   * The shows that fall into this block, written on its second line (see
   * `showLineHost`). Empty or absent where none do.
   */
  shows?: readonly PlannerBlockShow[];
  /** The shows switch is off: the line's show fades out with the grid's. */
  showsHidden?: boolean;
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
  /**
   * The party asked to stay dry and this is a water ride (`partyFlags().wet`). Decided in
   * `party.ts`; the block only draws a mark, never hides anything.
   */
  wet?: boolean;
  selected?: boolean;
  dragging?: boolean;
  conflict?: boolean;
  /**
   * A preview of where a drag would land, not a block in the plan: inert, dashed and on top. A
   * whole block rather than an outline, because its height and colour are the wait at the new
   * minute.
   */
  ghost?: boolean;
  /**
   * A drag is running and this block is not the ghost, so it recedes and the ghost is the only
   * thing at full strength.
   */
  dimmed?: boolean;
  onSelect: () => void;
  /**
   * Take this entry out of the day. Drawn on the block itself, phone only, so the block and the
   * button deleting it are not a screen apart; the other actions stay in
   * {@link PlannerGridActions}.
   */
  onRemove?: () => void;
  onDragStart: (event: React.PointerEvent<HTMLElement>) => void;
  /** Free blocks only: dragging the bottom edge sets the duration. */
  onResizeStart?: (event: React.PointerEvent<HTMLElement>) => void;
  onMove: (startMinute: number) => void;
  /** Bounds for the keyboard control — the same clamp the drag obeys. */
  minMinute: number;
  maxMinute: number;
  /** The arrow-key step of the range input below. NOT the drag's step. */
  keyboardStep: number;
}

/**
 * One planned ride, as a block in the day grid.
 *
 * Its height is the queue and only the queue: `PlanDayRide` carries no duration, and a ride segment
 * would make two identical queues draw at different heights. The box may be taller than the fill,
 * but the tinted fill is always drawn to the true height.
 */
export function PlannerBlock({
  entry,
  estimate,
  grid,
  tier,
  lane,
  land,
  metresFromPrevious,
  shows,
  showsHidden = false,
  showBandFigure,
  live = false,
  photo = null,
  closedNow = false,
  downYesterday = false,
  wet = false,
  selected = false,
  dragging = false,
  conflict = false,
  ghost = false,
  dimmed = false,
  onSelect,
  onRemove,
  onDragStart,
  onResizeStart,
  onMove,
  minMinute,
  maxMinute,
  keyboardStep,
}: PlannerBlockProps) {
  const t = useTranslations('planner');
  const done = Boolean(entry.done);

  // A free block's height is a duration the visitor set: no figure, no band, no crowd tint.
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
  // The function the leg chip measures its gap against, so the two cannot disagree on this edge.
  const boxPx = drawnBoxPx(grid, custom ? custom.durationMinutes : wait);

  /** An assumed figure has no colour: a tint is a claim about how busy it is. */
  const assumed = isAssumedWait(estimate);
  const tone = !custom && hasFigure && !assumed ? waitTimeCrowdTier(wait) : null;

  // A soft lower edge says "this may end later than we say", restated in pixels with a ceiling,
  // since a fraction of a variable height is meaningless on a short block.
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

  // The shows that fall into this ride, written by the block itself (see `showLineHost`): beside
  // the times, or on the name row where there are none. `flex-1` from a basis of 0, so it takes
  // only the room the name, times and figure leave. `~` on a projection, as in the gutter.
  const showLabel =
    shows && shows.length > 0 ? (
      <span
        data-planner-show=""
        data-planner-show-in-block=""
        data-planner-show-source={
          shows.some((show) => show.source === 'projected') ? 'projected' : 'scheduled'
        }
        className={cn(
          'text-muted-foreground flex min-w-0 flex-1 items-center justify-end gap-1 text-[10px] font-normal transition-[opacity,visibility] duration-200',
          shows.every((show) => show.source === 'projected') && 'italic',
          showsHidden && 'invisible opacity-0'
        )}
      >
        <Theater className="size-2.5 shrink-0" aria-hidden="true" />
        {/* `pr-0.5`: an italic's last glyph leans past the box `truncate` clips at. */}
        <span className="truncate pr-0.5">
          {shows
            .map(
              (show) =>
                `${show.source === 'projected' ? '~' : ''}${formatGridTime(show.minute)} ${show.names.join(', ')}`
            )
            .join(' · ')}
        </span>
      </span>
    ) : null;

  /**
   * Whether this block starts after the park shuts, and how sure we are: past `closeMin` it may be
   * after closing, past the slack it certainly is. Nothing the app files itself goes there, so this
   * is a note in the crowd tint, not an error. Rides only: a free block is the visitor's own
   * evening. See docs/rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md.
   */
  const closeState =
    custom || done || entry.startMinute < grid.closeMin
      ? null
      : entry.startMinute >= grid.closeMin + grid.closeSlackMin
        ? 'past'
        : 'maybe';

  /**
   * The one thing worth warning about on this block, worst first: closed now, then down all
   * yesterday, then the hour.
   */
  const warnLabel = closedNow
    ? t('warn.closedNow')
    : downYesterday
      ? t('warn.downYesterday')
      : closeState === 'past'
        ? t('warn.afterClose')
        : closeState === 'maybe'
          ? t('warn.maybeAfterClose')
          : null;
  const warnTone = closedNow ? 'text-destructive' : 'text-crowd-high';

  /**
   * The water mark, beside the warning rather than in its slot: the warnings say this block is
   * wrong, and a water ride for a party that wants to stay dry is not wrong. Rides only.
   */
  const showWet = wet && !custom;

  /**
   * Whether this block draws its own ✕ (see {@link PlannerBlockProps.onRemove}). Also read by the
   * text column, which gives up 24 px for it so the mark does not land on the figure.
   */
  const showRemove = Boolean(onRemove) && selected && !ghost;

  const missingLabel =
    custom || estimate.missing === 'custom'
      ? null
      : estimate.missing === 'outside-hours'
        ? t('day.closed')
        : estimate.missing === 'no-curve'
          ? t('entry.noCurve')
          : /* Not `no-curve`: this park's queues cannot be read at all, so no number is coming for
               any ride. */
            estimate.missing === 'no-source'
            ? t('entry.noSource')
            : null;

  /**
   * How far the queue came in from the forecast, on a ticked-off block. It takes the slot of the
   * `±` band figure: a band belongs to a forecast, a delta to a measurement, so only one is drawn.
   */
  const delta = custom ? null : actualVsEstimate(entry, estimate);
  const deltaLabel = !delta
    ? null
    : delta.direction === 'same'
      ? t('entry.deltaAsEstimated')
      : t(delta.direction === 'over' ? 'entry.deltaOver' : 'entry.deltaUnder', {
          minutes: Math.abs(delta.minutes),
        });

  const { left: laneLeft, width: laneWidth } = laneBox(lane);

  return (
    <li
      data-planner-entry={entry.id}
      data-planner-block=""
      data-planner-ghost={ghost ? '' : undefined}
      data-verdict-block={conflict ? 'broken' : undefined}
      // Clicking anywhere on the block selects it; the grip alone is too small a target for a
      // mouse.
      onClick={onSelect}
      // Dragging anywhere on it moves it, on a fine pointer only: `touch-none` on a body that
      // covers most of the grid would stop a finger scrolling the plan, so touch keeps the rail.
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        if (!matchMedia('(pointer: fine)').matches) return;
        // The rail and the resize edge start their own drags.
        if ((event.target as HTMLElement).closest('button, input')) return;
        onDragStart(event);
      }}
      className={cn(
        'group absolute',
        dragging && 'shadow-lg',
        // 35 %: far enough back that the ghost is the only live block, near enough to read the gap.
        dimmed && 'opacity-35',
        // A dashed ring so the preview reads as "would land here", and inert, so it cannot be
        // grabbed or focused. No z-index class here: the inline `zIndex` below decides every
        // block's layer.
        ghost && 'outline-primary/70 pointer-events-none outline-2 outline-dashed',
        // The tone follows a block across the day on every move. The dragging branch stays
        // transition-free, or the drop fights the transform.
        !dragging &&
          (ghost
            ? // The ghost glides from one snapped minute to the next instead of
              // jumping there, and fades in. Short, so it keeps up with a quick drag.
              'transition-[top,height,left,width,box-shadow,opacity,background-color,border-color,color] duration-150 ease-out starting:opacity-0'
            : 'transition-[box-shadow,opacity,background-color,border-color,color] duration-300')
      )}
      style={{
        top,
        height: boxPx,
        left: laneLeft,
        width: laneWidth,
        // The room the resize edge's touch target may take, so it cannot reach into the block
        // above: the drawn height less {@link BLOCK_BORDER_PX}. A custom property, because the
        // value belongs to the box and the edge is two elements down.
        ['--pl-edge-room' as string]: `${Math.max(0, boxPx - BLOCK_BORDER_PX)}px`,
        // The ghost is topmost, or the time it lands at is hidden behind the block being dragged.
        zIndex: ghost ? 40 : dragging ? 30 : 10 + lane.column,
        transform: dragging ? 'translateY(var(--pl-drag-dy, 0px))' : undefined,
      }}
    >
      {/* No uncertainty band here: `planner-day-grid.tsx` draws it in its own layer beneath every
          block and leg, since it hangs into the gap where the next stop's chip sits. */}

      {/* The ground, a sibling under the bordered box: the crowd tile is a translucent tint, and
          without an opaque surface behind it the band layer showed through a ride's name. Inside
          the box it would paint over the box's own background. */}
      <div className="bg-background absolute inset-0 rounded-md" aria-hidden="true" />

      {/* No `overflow-hidden`: the grip and the resize edge grow their 44 px target with an
          `after:` that reaches past the block, and clipping the box clips hit-testing too. Only the
          ink is clipped, in its own layer below. */}
      <div
        className={cn(
          'relative flex h-full flex-col rounded-md border',
          done && 'bg-foreground/10 border-foreground/30',
          !done && hasFigure && tone && CROWD_TILE_CLASS[tone],
          // A free block: solid and neutral. Its height is the visitor's claim, so neither the
          // dashed "no number" outline nor a crowd tint.
          custom && !done && 'bg-muted/50 border-border/70',
          // No figure and not a free block: an outline, never a tint, but with a ground, or the leg
          // chip below shows through its text.
          !hasFigure && !custom && 'bg-background/70 border-border/70 border-dashed',
          // An assumption: a ground, and no crowd colour, because nothing measured it.
          assumed && !done && 'bg-muted/40 border-border/70',
          softBorder && 'border-b-dashed border-b-2',
          selected && 'ring-primary/60 ring-2',
          conflict && 'ring-destructive/45 ring-1',
          lane.column > 0 && 'ring-background ring-1'
        )}
      >
        {/* The ink, and the only thing the block clips; `pointer-events-none` because it is all
            decoration. */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
          aria-hidden="true"
        >
          {/* The ride's photo, on every block that has one. `background-image`, not `next/image`:
              the block's size changes with the plan and the crop is already right. */}
          {photo && (
            <div
              className={cn('absolute inset-0', PHOTO_OPACITY)}
              style={{
                backgroundImage: `url(${backgroundPhotoUrl(photo.src)})`,
                backgroundSize: 'cover',
                backgroundPosition: photo.position,
              }}
            />
          )}

          {/* The fill, masked by the tier, separate from the box so a taller box does not claim
              extra ink. */}
          {hasFigure && tone && !done && (
            <div
              className={cn('absolute inset-x-0 top-0', CROWD_DOT_CLASS[tone], 'opacity-[0.18]')}
              style={{
                height: fillPx,
                ...(mask ? { maskImage: mask, WebkitMaskImage: mask } : {}),
              }}
            />
          )}

          {/* Outlook's category bar. */}
          <div
            className={cn(
              'absolute inset-y-0 left-0 w-[3px] rounded-l',
              done ? 'bg-foreground/40' : tone ? CROWD_DOT_CLASS[tone] : 'bg-muted-foreground/40'
            )}
          />
        </div>

        {/* The bottom edge, free blocks only: their height is a duration the visitor sets. A ride's
            height is the queue and not theirs to drag. `touch-none` on an 8 px strip only. */}
        {custom && onResizeStart && (
          <button
            type="button"
            onPointerDown={onResizeStart}
            onClick={(event) => event.stopPropagation()}
            /* Capped at the block's room like the ✕ below; `check:planner` knows this exception.
               First of the three controls at `z-40`, so the ✕ wins the corner they share. */
            data-planner-block-edge=""
            aria-label={t('entry.resizeHandle')}
            className={cn(
              'group/resize absolute inset-x-0 bottom-0 z-40 flex h-2 cursor-ns-resize touch-none items-end justify-center',
              // From the grip's column to the right edge, so the grip's target and this one tile
              // the block instead of stacking. 44 px or the block's room, whichever is smaller:
              // grown upward past a short block it would steal presses from the block above. The
              // shortest free block's edge is under 44 px as a result, and `sweepSmallTargets` in
              // `scripts/check-planner.mjs` measures `data-planner-block-edge` against that room.
              'planner-phone:after:absolute planner-phone:after:right-0 planner-phone:after:bottom-0 planner-phone:after:left-11 planner-phone:after:h-[min(2.75rem,var(--pl-edge-room))] planner-phone:after:content-[""]'
            )}
          >
            <span className="bg-muted-foreground/40 group-hover/resize:bg-muted-foreground/70 mb-0.5 h-0.5 w-6 rounded-full transition-colors" />
          </button>
        )}

        {/* Delete, on the card: phone only, and only on the selected block, or every card reads as
            a delete list.

            The three controls tile a box that cannot always hold them, ranked by document order at
            one `z-40` (later wins): resize edge, ✕, grip. The grip beats the ✕ on a very narrow
            block, as it is a finger's only way to move a block; the ✕ beats the resize edge, as a
            phone has no other delete. The height is capped at `--pl-edge-room` like the resize
            edge, or its corner would reach into the card below. */}
        {showRemove && onRemove && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            data-planner-block-remove=""
            /* The opt-in for `check:planner`'s 44 px sweep: a control anchored to a block's edge is
               capped at the block's room, since the block's height is a queue. */
            data-planner-block-edge=""
            aria-label={t('removeRide')}
            title={t('removeRide')}
            className={cn(
              'text-muted-foreground hover:text-destructive hover:bg-destructive/15 bg-background/80 planner-wide:hidden absolute top-0 right-0 z-40 flex size-5 items-center justify-center rounded transition-colors',
              'after:absolute after:top-0 after:right-0 after:h-[min(2.75rem,var(--pl-edge-room))] after:w-11 after:content-[""]'
            )}
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}

        {/* The grip: a rail on a coarse pointer, the whole body on a fine one. */}
        <button
          type="button"
          onPointerDown={onDragStart}
          onClick={onSelect}
          aria-label={t('entry.dragHandle')}
          className={cn(
            'planner-phone:w-11 absolute inset-y-0 left-0 z-40 w-6 touch-none',
            entry.showSlug ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
            // The target grows and the box does not, so it reaches past a 20 px block. Centred
            // rather than capped: on the 30 px minimum block it overhangs 7 px each way, a few of
            // them into the block above, which is the price of the shortest block's only control
            // (a wrong drag is visible and reversible; the ✕'s corner deletes). `after:left-0` pins
            // the target onto the 44 px button.
            'planner-phone:after:absolute planner-phone:after:top-1/2 planner-phone:after:left-0 planner-phone:after:h-11 planner-phone:after:w-11 planner-phone:after:-translate-y-1/2 planner-phone:after:content-[""]'
          )}
        />

        {/* The keyboard equivalent, through the same code path the drag commits through; `min` is
            the ride-opening clamp, enforced by the platform. */}
        <input
          type="range"
          min={minMinute}
          max={maxMinute}
          step={keyboardStep}
          value={entry.startMinute}
          aria-label={`${custom ? custom.label : entry.attractionName} — ${range}`}
          onChange={(event) => onMove(Number(event.target.value))}
          /* A show's time is its performance's: the slider is not offered. */
          disabled={Boolean(entry.showSlug)}
          tabIndex={entry.showSlug ? -1 : undefined}
          /* `pointer-events-none`: the input is invisible and sits over the grip, and catching
             presses it made blocks undraggable. It stays for the keyboard: still in the tab order,
             and arrow keys move the block by `step`. */
          className="planner-phone:w-11 pointer-events-none absolute inset-y-0 left-0 z-20 w-6 cursor-pointer appearance-none bg-transparent opacity-0 focus-visible:pointer-events-auto"
        />

        {/* The text, with `WaitTimeValue`'s shadow wherever a photo is, so crowd-tinted text stays
            legible over a picture. */}
        <div
          /* Its own `overflow-hidden`: the box no longer clips, and this is the one child that can
             overflow, a sentence in a box measured for two lines. */
          className={cn(
            'pointer-events-none relative min-w-0 flex-1 overflow-hidden px-1.5 py-0.5 pl-2.5',
            // The ✕'s room, only where there is one: `showRemove` is the React half and
            // `planner-phone:` the CSS half, since the mark is `planner-wide:hidden`.
            showRemove && 'planner-phone:pr-6'
          )}
          style={photo ? { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.65))' } : undefined}
        >
          {/* A ghost stays on one row up to {@link RANGE_MIN_PX}, where a block switches at 30: its
              range would otherwise be cut by the column's `overflow-hidden`. */}
          {boxPx < (ghost ? RANGE_MIN_PX : 30) ? (
            /* One row with the figure in it, not escaping past the block's edge, where a block
               alone in its lane would have it clipped by the scroller. */
            <p
              className={cn(
                'flex items-center gap-1 text-[11px] leading-none',
                done && 'line-through',
                tone && !done && CROWD_TEXT_CLASS[tone]
              )}
            >
              {CustomIcon && <CustomIcon className="size-3 shrink-0" />}
              <span className={cn('min-w-0 truncate', !showLabel && 'flex-1')}>
                {custom ? custom.label : entry.attractionName}
              </span>
              {showLabel}
              {/* The warning rides on this row too, or a short block carries no sign that it lands
                  after closing. `shrink-0`, so the name gives way. */}
              {warnLabel && (
                <AlertTriangle className={cn('size-3 shrink-0', warnTone)} aria-label={warnLabel} />
              )}
              {showWet && (
                <Droplets
                  className="text-crowd-moderate size-3 shrink-0"
                  aria-label={t('party.wet')}
                />
              )}
              {(ghost || hasFigure) && (
                <span
                  data-figure=""
                  className="text-muted-foreground shrink-0 font-mono text-[10px] tabular-nums"
                >
                  {/* A ghost spends this row on the range instead: when it lands is the question a
                      preview answers, and its height and colour already show the wait. */}
                  {ghost ? (
                    range
                  ) : (
                    <>
                      {formatGridTime(entry.startMinute)} · {assumed && '~'}
                      {wait} {t('unit.min')}
                    </>
                  )}
                </span>
              )}
            </p>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-1">
                <span
                  className={cn(
                    'flex min-w-0 items-center gap-1.5 truncate',
                    // `flex-1` gives the name the row, until a show shares it: then the show gives
                    // way.
                    !(boxPx < RANGE_MIN_PX && showLabel) && 'flex-1',
                    boxPx >= 48 ? 'text-sm' : 'text-[11px]',
                    done && 'line-through',
                    tone && !done && CROWD_TEXT_CLASS[tone]
                  )}
                >
                  {CustomIcon && <CustomIcon className="size-3.5 shrink-0" />}
                  <span className="truncate">{custom ? custom.label : entry.attractionName}</span>
                </span>
                {boxPx < RANGE_MIN_PX && showLabel}
                {warnLabel && (
                  <AlertTriangle
                    className={cn('size-3 shrink-0', warnTone)}
                    aria-label={warnLabel}
                  />
                )}
                {showWet && (
                  <Droplets
                    className="text-crowd-moderate size-3 shrink-0"
                    aria-label={t('party.wet')}
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
                    {/* `~` on an assumed figure only, so an assumption does not read like a
                        reading. */}
                    {assumed && '~'}
                    {wait}
                    {/* The unit, always: this grid also carries distances, durations and a ±
                        band. */}
                    <span className="ml-0.5 text-[9px] font-normal opacity-70">
                      {t('unit.min')}
                    </span>
                  </span>
                )}
              </div>

              {boxPx >= RANGE_MIN_PX && (
                <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] tabular-nums">
                  <span className="min-w-0 truncate">
                    {range}
                    {typeof metresFromPrevious === 'number' && (
                      <span className="ml-1.5">↑ {formatDistance(metresFromPrevious)}</span>
                    )}
                  </span>
                  {showLabel}
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
                  {deltaLabel && <span className="ml-1.5">{deltaLabel}</span>}
                </p>
              )}
            </>
          )}

          {!hasFigure && missingLabel && boxPx >= 30 && (
            <p className="text-muted-foreground truncate text-[10px]">{missingLabel}</p>
          )}

          {/* The reason in full where there is room; the icon carries it on a short block. */}
          {warnLabel && boxPx >= (boxPx >= 68 ? WARN_SENTENCE_WITH_LAND_PX : WARN_SENTENCE_PX) && (
            <p className={cn('truncate text-[10px]', warnTone)}>{warnLabel}</p>
          )}
        </div>

        {/* Blocks past the lane budget, said out loud: `packLanes` stacks them in the last column,
            so the count sits on the last block placed there, the one on top. */}
        {lane.overflow > 0 && (
          <span
            className="bg-foreground/75 text-background pointer-events-none absolute right-0.5 bottom-0.5 rounded px-1 font-mono text-[9px] tabular-nums"
            title={t('entry.laneOverflow', { count: lane.overflow })}
          >
            +{lane.overflow}
          </span>
        )}
      </div>
    </li>
  );
}
