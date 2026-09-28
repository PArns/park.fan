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
import { drawnBoxPx, heightFor, yFor, type DayGrid } from '@/lib/planner/day-grid';
import { formatDistance } from '@/lib/utils/distance-utils';
import { PLANNER_BLOCK_ICON_COMPONENTS } from './planner-block-icons';
import type { LanePlacement } from '@/lib/planner/day-grid';
import type { PlannerEntry } from '@/lib/planner/types';
import { actualVsEstimate, type PlannerEstimate } from '@/lib/planner/estimate';
import type { PlanDayShowSource, PlanDayTier } from '@/lib/api/types';

/**
 * The bordered div's `border`, doubled — the two pixels the resize edge's touch
 * target may NOT count on.
 *
 * That div is `relative`, so it is the containing block of everything absolute
 * inside it, and an absolute box is laid out against a containing block's
 * PADDING box rather than its border box. The edge is anchored `bottom-0` there
 * and therefore starts a pixel above the block's own bottom edge; a target
 * capped at the block's full height would end a pixel above its top edge, which
 * is exactly the one pixel of the neighbour this cap exists to give back.
 */
const BLOCK_BORDER_PX = 2;

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
   * The party asked to stay dry and this is a water ride — `partyFlags().wet`.
   *
   * A boolean rather than the prefs and the ride's own facts, like `closedNow`
   * and `downYesterday` beside it: the block draws what it is told and the one
   * place that decides is `party.ts`. It is a FLAG and never a filter — the
   * block is drawn exactly as it would be without it, with a mark added.
   */
  wet?: boolean;
  selected?: boolean;
  dragging?: boolean;
  conflict?: boolean;
  /**
   * A preview of where a drag would land, not a block in the plan.
   *
   * Inert, dashed, and the brightest thing on the grid while it exists. It is a
   * whole block rather than an outline because the thing a visitor is deciding
   * is what they GET at the new time: the wait is recomputed for that minute,
   * so the ghost's height and its colour are the answer, and an outline of the
   * old height would be the wrong answer drawn confidently.
   *
   * It was translucent — `opacity-50` — from the days it was painted UNDER the
   * block being dragged and had to peek out from behind it. Now it is on top
   * and everything else steps back; see {@link PlannerBlockProps.dimmed}.
   */
  ghost?: boolean;
  /**
   * A drag is running and this block is not the ghost.
   *
   * Every real block recedes for the length of the gesture, the one under the
   * pointer included. Two boxes of the same ride at the same opacity, three
   * pixels apart, are one smeared box; and the question being asked — how long
   * does this get and where does it land — is asked about the ghost, so the
   * ghost is the only thing that may answer at full strength. The dimming
   * animates for free: a block that is not `dragging` already transitions its
   * opacity over 300 ms.
   */
  dimmed?: boolean;
  onSelect: () => void;
  /**
   * Take this entry out of the day. Drawn on the block itself, phone only.
   *
   * The delete used to live in {@link PlannerGridActions} alone, which is a bar
   * docked at the grid's lower edge — so on a phone the block being deleted and
   * the button deleting it were a screen apart, and the bar states the block's
   * name in `text-sm` truncated. It is the ONE action that moved: ticking off,
   * the ±15-minute nudge and a free block's duration stay in the bar, because
   * a block can legitimately be twenty pixels tall and four 44 px targets do
   * not fit in twenty pixels. One does, capped — see the button.
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
  // The same function the leg chip measures its gap against, so the bottom edge
  // this block draws and the edge a chip is placed under cannot disagree.
  const boxPx = drawnBoxPx(grid, custom ? custom.durationMinutes : wait);

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

  // The shows that fall into this ride (PAR-521: „jetzt sieht man die Shows gar
  // nicht mehr"). The grid's pill lay on the block's name and times, and the
  // mask it was reduced to said nothing about which show, so the block writes
  // them itself: on its second line beside the times where it has one, on its
  // first line between the name and the figure where it does not. Either way
  // it is `flex-1` from a basis of 0, so it gets the room the name, the times
  // and the figure leave and not a pixel of theirs: shrinking it with them,
  // however unevenly, took a pixel off the name, and a pixel is an ellipsis.
  // Each show with its own time, `~` on a projection as in the gutter.
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
        {/* `pr-0.5`: a projection is italic, and an italic's last glyph leans
            past the box `truncate` clips at — „Rock on Ic" without it. */}
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
   * Whether this block starts after the park shuts, and how sure we are.
   *
   * Two answers rather than one, because the axis itself has two lines.
   * `grid.closeMin` is the last minute the park is CERTIFIABLY open and
   * `closeSlackMin` is the hatched hour above it that it might still be running
   * — the API reports a closing HOUR, so a park shutting at 17:30 answers 17,
   * and 86 % of days end on the hour while the rest do not. A block at 17:15 on
   * such a day is not a mistake and may not be told it is one. A block past the
   * feather is out of the day whatever the truncation was.
   *
   * Nothing this app files by itself goes above `closeMin`, so a block out
   * there is either a drag somebody made on purpose — and the person dragging
   * knows their park — or an entry the optimiser could not fit and parked
   * rather than delete. Both want the same note, and neither is an error: the
   * crowd tint, not the destructive one, because the ride is real and the queue
   * figure is real and what is wrong is the hour.
   *
   * It is the report this whole assistant came out of. Taron sat at 18:45 in a
   * park that shuts at 18:00, drawn exactly like the nine blocks above it, with
   * the only mention of the problem a clause in a grey line under the buttons.
   *
   * Rides only. A free block is a decision the visitor made about their own
   * evening, and telling them their dinner is after closing time is the app
   * having an opinion about dinner.
   */
  const closeState =
    custom || done || entry.startMinute < grid.closeMin
      ? null
      : entry.startMinute >= grid.closeMin + grid.closeSlackMin
        ? 'past'
        : 'maybe';

  /**
   * The one thing worth warning about on this block, worst first.
   *
   * Three conditions competing for one icon and one sentence: a ride reporting
   * closed right now beats one that was down all of yesterday, and both beat an
   * hour problem — a ride that is shut is shut whatever time the block says.
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
   * The water mark, beside the warning rather than competing with it.
   *
   * `warnLabel` is one slot that three conditions take turns in, because all
   * three are statements about THIS BLOCK being wrong — shut, down, or after
   * closing. "You said you would rather stay dry" is not one of those: the block
   * is right, the hour is right, and the ride is still a water ride. So it gets
   * a mark of its own and both can show at once.
   *
   * Rides only. A free block stands for nothing in the catalogue and has no
   * facts to flag — `partyFlags` answers `NONE` for it, and this is the same
   * statement said locally, so a future caller cannot hand a lunch break a
   * droplet.
   */
  const showWet = wet && !custom;

  /**
   * Whether this block draws its own ✕ — see {@link PlannerBlockProps.onRemove}.
   *
   * Read twice: once to draw the button, and once by the text column, which
   * gives up 24 px of its right edge for it. Without that the mark lands on the
   * figure — measured on a 30 px block at 360 px, `~5 Min.` came out `~5 M`
   * with the ✕ over the rest.
   */
  const showRemove = Boolean(onRemove) && selected && !ghost;

  const missingLabel =
    custom || estimate.missing === 'custom'
      ? null
      : estimate.missing === 'outside-hours'
        ? t('day.closed')
        : estimate.missing === 'no-curve'
          ? t('entry.noCurve')
          : /* Not the same sentence as `no-curve`, and the difference is the
               point: that one says the model has nothing for THIS ride, this
               one says nobody can read this park's queues at all, so there is
               no number coming for any of them, ever. */
            estimate.missing === 'no-source'
            ? t('entry.noSource')
            : null;

  /**
   * How far the queue came in from the forecast, on a ticked-off block.
   *
   * It takes the slot the `±` band figure has, and the two are the same
   * statement at the two ends of the visit: the band is the spread around a
   * prediction, this is what the prediction turned out to be worth. Neither can
   * be drawn while the other is — a band belongs to a forecast, a delta to a
   * measurement — so the line stays one line.
   */
  const delta = custom ? null : actualVsEstimate(entry, estimate);
  const deltaLabel = !delta
    ? null
    : delta.direction === 'same'
      ? t('entry.deltaAsEstimated')
      : t(delta.direction === 'over' ? 'entry.deltaOver' : 'entry.deltaUnder', {
          minutes: Math.abs(delta.minutes),
        });

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
        dragging && 'shadow-lg',
        // 35 %: far enough back that the ghost reads as the only live block,
        // near enough that the day is still legible as context — a visitor
        // dragging into a gap has to see what the gap is between.
        dimmed && 'opacity-35',
        // A preview, and it may not be mistaken for the plan: a dashed primary
        // ring so it reads as "would land here", and inert —
        // `pointer-events-none` covers the grip, the resize edge and the range
        // input in one place, so the ghost cannot be grabbed, focused or
        // tabbed to while the real block is under the pointer.
        //
        // No z-index HERE: every one of these blocks carries an inline
        // `zIndex`, which wins against a utility class whatever the class says.
        // `z-20` sat in this list and the ghost computed to 10 — see the style
        // block below, which is now the only place a block's layer is decided.
        ghost && 'outline-primary/70 pointer-events-none outline-2 outline-dashed',
        // The tone recomputes on every move — `estimate.wait` is a function of
        // `startMinute` — so the colour DOES follow a block across the day. It
        // just arrived in a single frame, at the instant the eye was on the
        // pointer, which is why it read as "the colour does not change". The
        // dragging branch stays transition-free or the drop fights the transform.
        !dragging &&
          (ghost
            ? // The ghost glides from one snapped minute to the next instead of
              // jumping there (PAR-482 follow-up: „auch für das Verschieben
              // eines Ghosts"), and fades in rather than appearing. Short, so
              // it keeps up with a quick drag, which crosses a step every few
              // frames.
              'transition-[top,height,left,width,box-shadow,opacity,background-color,border-color,color] duration-150 ease-out starting:opacity-0'
            : 'transition-[box-shadow,opacity,background-color,border-color,color] duration-300')
      )}
      style={{
        top,
        height: boxPx,
        left: laneLeft,
        width: laneWidth,
        // The room the resize edge's touch target may take, readable from CSS,
        // so that it cannot reach into the block above. The drawn height LESS
        // the two border pixels the edge cannot reach — see
        // {@link BLOCK_BORDER_PX}. A custom property rather than a second inline
        // style on the edge itself: the edge is two elements down and the value
        // belongs to the box, not to the control. Same shape as `--pl-drag-dy`.
        ['--pl-edge-room' as string]: `${Math.max(0, boxPx - BLOCK_BORDER_PX)}px`,
        /**
         * The ghost is topmost, and that is the whole reason it is drawn.
         *
         * It used to compute to 10 — its `z-20` class lost to this very
         * property — so it was painted UNDER the block being dragged, which is
         * at 30 and 90 % opaque. Measured mid-drag at 1400 px: the two boxes
         * sat 0 px apart, `elementFromPoint` at the ghost's centre answered the
         * dragged block, and the only legible time on screen was the block's
         * OLD one. Every word the ghost prints — the time this lands at, which
         * is the point of the gesture — was behind the thing it is a preview
         * of.
         *
         * The gap between them shrank with PAR-307: at a fifteen-minute step
         * the pointer could be up to 9 px off the step it commits to, at five
         * it is at most 3, so the sliver the ghost used to show past the block
         * is gone as well.
         */
        zIndex: ghost ? 40 : dragging ? 30 : 10 + lane.column,
        transform: dragging ? 'translateY(var(--pl-drag-dy, 0px))' : undefined,
      }}
    >
      {/* No uncertainty band here, and that absence is the point: it is drawn in
          a layer of its own beneath every block and every leg — see
          `PlannerBandLayer` in `planner-day-grid.tsx` and `bandGeometry`. The
          band is the one part of a block that is not IN the block; it hangs
          past the box into the gap the next stop starts in, and a child of a
          block cannot be painted under that stop's chip whatever z-index it
          carries. */}

      {/* The ground, UNDER the bordered box rather than inside it.

          The rule is written out twenty lines down, for the block with no
          figure: a block "still needs a GROUND. Transparent, it let the leg chip
          in the gap below it paint through its own text, which reads as two
          sentences printed on top of each other rather than as two elements at
          different depths." That is just as true of a block WITH a figure, and
          it had none — `CROWD_TILE_CLASS` is 8–18 % alpha, a tint rather than a
          surface. Nothing used to sit behind one, so nothing showed; the band
          layer now reaches down here, and a ride's name was being read through a
          quarter of somebody else's crowd colour.

          A SIBLING, and that placement is the whole of it: put inside the box it
          would paint over the box's own background instead of under it, which
          takes the tile off every block and the fill off the three that draw
          theirs on the box alone — a ticked-off block, a free block and an
          assumption. Behind it, every one of them keeps exactly the colour it
          had, over an opaque surface rather than over whatever the axis is
          holding. `rounded-md` to match the box it stands in for; the border is
          the box's own and stays there. */}
      <div className="bg-background absolute inset-0 rounded-md" aria-hidden="true" />

      {/* NO `overflow-hidden`, and that word is the whole of the first half of
          this bug. The grip and the resize edge grow their 44 px touch target
          with an `after:` pseudo-element that deliberately reaches PAST the
          block — a 20 px box cannot contain a 44 px target and must not grow to
          fit one, because its height is the queue. Clipping the box clipped the
          pseudo-element with it, for hit-testing as much as for paint, so the
          target was 44 × the block's own height: 44 × 20 on the shortest block
          in the day, and 44 × 24 on the 20-minute block in the report.

          What the clip was FOR is the ink — a photo at `inset-0` and a tint that
          would otherwise square off the rounded corners — so the ink is what
          gets clipped now, in its own layer below. The controls are siblings of
          that layer and reach out of the box, which is what they were written to
          do. */}
      <div
        className={cn(
          'relative flex h-full flex-col rounded-md border',
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
        {/* The ink, and the only thing the block clips. `rounded-[inherit]` so
            the corner is the box's own and stays that way if it ever changes;
            `pointer-events-none` because everything in here is decoration and
            the controls below it are not. */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
          aria-hidden="true"
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
            /* See the ✕ below: this is the other control capped at the block's
               room, and `check:planner` knows the exception this comment has
               asked for since PAR-165. It also stands FIRST of the three in the
               document at a shared `z-40`, i.e. lowest of the three ranks — the
               ✕ wins the corner they share, which is the half of the tiling
               described there that this edge pays for. */
            data-planner-block-edge=""
            aria-label={t('entry.resizeHandle')}
            className={cn(
              'group/resize absolute inset-x-0 bottom-0 z-40 flex h-2 cursor-ns-resize touch-none items-end justify-center',
              // From the grip's column to the right edge, NOT `w-full`. Once the
              // box stopped clipping, a full-width 44 px target sat on top of
              // the grip's 44 px target on every block shorter than 44 px — so
              // the shortest free block, the one this whole fix is about, could
              // be resized and not moved. The two targets now tile the block
              // instead of stacking on it.
              //
              // And 44 px OR the room this block has, whichever is smaller. The
              // target is anchored to the bottom edge and grows upward, so on a
              // block shorter than 44 px it used to reach out of the top — 14 px
              // of it on a minimum block (30 px at `PX_PER_MIN_COARSE`),
              // measured. Blocks in the same lane column carry the same
              // `z-index`, so DOM order decides and the later — the lower —
              // one wins: a press on the bottom 14 px of the block ABOVE, right
              // of its grip, resized the short block below instead of selecting
              // the block pressed.
              //
              // The cap costs the shortest free block a target under the 44 px
              // floor — 28 px, the room it has — and that is the honest trade:
              // no arrangement gives a 30 px box a 44 px edge without taking the
              // pixels from its neighbour. The grip keeps its full 44 px; it is
              // centred and overhangs symmetrically, which is what makes the
              // shortest block movable at all, and its own overhang is PAR-165.
              //
              // **This was the one documented exception to the 44 px floor, and
              // `sweepSmallTargets` in `scripts/check-planner.mjs` knows about
              // it since PAR-313**: a control carrying `data-planner-block-edge`
              // is measured against `min(44, the block's room)` rather than
              // against 44. The sweep was green before that only because the
              // phone pass plans three rides and no free blocks; it would have
              // gone red on the first free block seeded onto the minimum box,
              // correctly and for a thing that was decided rather than broken.
              // The ✕ above is the second control on the same trade.
              'planner-phone:after:absolute planner-phone:after:right-0 planner-phone:after:bottom-0 planner-phone:after:left-11 planner-phone:after:h-[min(2.75rem,var(--pl-edge-room))] planner-phone:after:content-[""]'
            )}
          >
            <span className="bg-muted-foreground/40 group-hover/resize:bg-muted-foreground/70 mb-0.5 h-0.5 w-6 rounded-full transition-colors" />
          </button>
        )}

        {/* Delete, on the card. Phone only, and only on the SELECTED block,
            which is what keeps it off the other eleven blocks of a day: a row
            of ✕ down the right edge of every card is a day that looks like a
            delete list, and the gesture that selects is the same tap the block
            already answers.

            **The three controls are ranked, and the rank is document order at
            one z-index.** They tile a box that cannot always hold them: the
            grip takes 44 px from the left edge, the resize edge takes the
            bottom from `left-11` rightwards, and this takes 44 from the right.
            Two pairs of them can overlap, and each pair has a different loser:

            · grip and ✕ meet on a block narrower than 88 px — measured, three
              lanes at 320 px, where `laneWidth` is 86.7. The GRIP wins. It is
              the only pointer path a finger has to a block and has owed its
              full 44 px since PAR-165, while the ✕ is new.
            · resize edge and ✕ meet on a free block shorter than 88 px — at
              `PX_PER_MIN_COARSE` that is every free block under about half an
              hour, down to the 30 px minimum. The ✕ WINS. Losing there means a
              tap on a drawn ✕ starts a resize instead of deleting, and on a
              phone there is no second way: the action bar's own ✕ is
              `planner-phone:hidden`, and Delete is a keyboard.

            So the order is resize edge → ✕ → grip, all three `z-40`, later
            wins. It is the same tiling the resize edge's own note describes
            rather than a fourth stack on the same box, and stating it as an
            order rather than as three numbers is what keeps the two rules
            above from contradicting each other.

            The height is capped at the block's own room, exactly the way the
            resize edge is, and for the same reason: anchored `top-0` a full
            44 px would reach past a 30 px block into the one under it, and that
            block's body is a plain `onClick` that selects — so the top right
            corner of the card below would delete the card above.
            `--pl-edge-room` is the box less its two border pixels and is set on
            the `<li>`; this is its second reader. `planner-wide:hidden`, so a
            fine pointer keeps the ✕ where it has always been, in the action
            bar, and nothing about the desktop moves. */}
        {showRemove && onRemove && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            data-planner-block-remove=""
            /* The opt-in `check:planner`'s 44 px sweep reads: a control
               anchored to a block's edge is capped at the block's room, since
               the block's height is a queue and may not grow to fit a target.
               The resize edge below carries the same attribute for the same
               trade. Nothing else in a block does — the grip overhangs
               symmetrically and owes its full 44 px at every height. */
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

        {/* The grip. A rail on a coarse pointer, the whole body on a fine one —
            `touch-none` never goes on the block, which covers most of the grid's
            area and would make it unscrollable exactly where the plan is read. */}
        <button
          type="button"
          onPointerDown={onDragStart}
          onClick={onSelect}
          aria-label={t('entry.dragHandle')}
          className={cn(
            'planner-phone:w-11 absolute inset-y-0 left-0 z-40 w-6 cursor-grab touch-none active:cursor-grabbing',
            // The target grows and the box does not: on a 20 px block a 44 px
            // pseudo-element reaches past the edges without moving anything.
            // Which only works because the box no longer clips — see the note on
            // the bordered div above.
            'planner-phone:after:absolute planner-phone:after:top-1/2 planner-phone:after:h-11 planner-phone:after:w-11 planner-phone:after:-translate-y-1/2 planner-phone:after:content-[""]'
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
          step={keyboardStep}
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
          className="planner-phone:w-11 pointer-events-none absolute inset-y-0 left-0 z-20 w-6 cursor-pointer appearance-none bg-transparent opacity-0 focus-visible:pointer-events-auto"
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
          /* Its own `overflow-hidden`, which the doc comment on
             {@link WARN_SENTENCE_PX} has always claimed it had: it used to
             borrow the box's, and the box's is gone so the grip can reach out
             of it. This is the one child that can genuinely overflow — a
             sentence in a box measured for two lines. */
          className={cn(
            'pointer-events-none relative min-w-0 flex-1 overflow-hidden px-1.5 py-0.5 pl-2.5',
            // The ✕'s room, and only where there IS one: `showRemove` is the
            // React half of the condition and `planner-phone:` is the CSS half,
            // because the mark itself is `planner-wide:hidden` rather than a
            // branch. Both are needed — the class alone would hold 24 px on
            // every block, the state alone would hold them on a desktop where
            // nothing is drawn there.
            showRemove && 'planner-phone:pr-6'
          )}
          style={photo ? { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.65))' } : undefined}
        >
          {/* A ghost stays on ONE row all the way up to {@link RANGE_MIN_PX},
              where a block switches at 30. Thirty is the box that holds a name
              row; 34 is the box that holds a name row AND a line under it, and
              between the two a ghost's range was drawn and then cut through the
              middle of its glyphs by the column's `overflow-hidden` — measured
              on the phone axis, where `minBlockPxFor` puts the smallest box at
              exactly 30. Its range fits beside the name at that height, and on
              a ghost the wait it displaces is the height and the colour. */}
          {boxPx < (ghost ? RANGE_MIN_PX : 30) ? (
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
              <span className={cn('min-w-0 truncate', !showLabel && 'flex-1')}>
                {custom ? custom.label : entry.attractionName}
              </span>
              {showLabel}
              {/* The warning rides on this row too, and that is not a flourish:
                  the sentence and the triangle both used to start at the
                  two-row branch, so a block under 30 px carried no sign at all
                  that it lands after closing. Raising the ghost's threshold to
                  {@link RANGE_MIN_PX} would have taken the triangle off every
                  ghost between 30 and 34 px as well — on the phone axis, where
                  the smallest box IS 30, that is every ghost with a queue under
                  about eighteen minutes, and a drag into the closing slack is
                  the gesture that needs the warning most. `shrink-0`, so the
                  name gives way to it rather than the other way round. */}
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
                  {/* A ghost spends this row on the RANGE instead, and spends it
                      even where there is no figure at all. The one question a
                      preview answers is when this lands, and the drag steps in
                      fives — so the start alone is the half of the answer that
                      changes under the pointer, and the end is the half that
                      says how far into the next thing it reaches. Nothing is
                      lost by dropping the wait here: on a ghost the wait is the
                      height and the colour, recomputed for this very minute,
                      and both are drawn whatever the box can print. */}
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
                    // `flex-1` hands the name the row before anything else is
                    // sized, which is right until a show shares the row: then
                    // the name keeps its own width and the show gives way.
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

          {/* The reason, spelled out where there is room. The icon above carries
              it on a short block; this is the same statement at full length. */}
          {warnLabel && boxPx >= (boxPx >= 68 ? WARN_SENTENCE_WITH_LAND_PX : WARN_SENTENCE_PX) && (
            <p className={cn('truncate text-[10px]', warnTone)}>{warnLabel}</p>
          )}
        </div>

        {/* Blocks past the lane budget, said out loud.
            `packLanes` caps a cluster at MAX_LANES columns and rides everything
            beyond that in the LAST one — they overlap, and the count came back
            on `LanePlacement.overflow`, which nothing had ever drawn. So four
            rides at one hour rendered as three, with the fourth underneath the
            third and no sign of it anywhere. Three 112 px columns is already
            the floor at which a name and a figure fit on a phone, so a fourth
            column is not the answer; saying how many are under this one is.
            It sits on the block the count is reported on, which is the LAST
            placed in that column and therefore the one on top. */}
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
