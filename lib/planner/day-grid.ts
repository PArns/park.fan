import type { PlanDay, PlanDayContext, PlanDayRide } from '@/lib/api/types';
import type { DayClock } from './park-time';

/**
 * The day grid's geometry. Pure: no React, no DOM, no clock.
 *
 * The axis is uniform and linear, unlike `lib/utils/weather-chart-axis.ts`: a plan only covers the
 * park's hours, and on a piecewise axis two identical 40-minute queues would draw at different
 * heights. `heightFor` takes a duration and no start position so that cannot happen. See
 * docs/features/trip-planner.md#the-axis-is-the-parks-day-and-the-canvas-is-not.
 */

/**
 * Pixels per minute, 72 px per hour. Chosen from content: a 40-minute queue is 48 px, two lines of
 * `text-sm` plus a meta line. A constant per pointer class rather than derived from the box, which
 * would be a measurement after paint and a resize of the grid on every open.
 */
export const PX_PER_MIN = 1.2;

/**
 * The same axis on a phone, 108 px per hour: a 20-minute queue gets 36 px, enough for a name.
 * Every derived figure reads `grid.pxPerMin`, never this constant, and the one place it is read is
 * {@link usePlannerPxPerMin}. See
 * docs/features/trip-planner.md#the-axis-has-a-phone-scale-and-it-comes-from-one-place.
 */
export const PX_PER_MIN_COARSE = 1.8;

/** Arrival and rope drop happen before opening, so the axis starts before it. */
export const PRE_PAD_MIN = 30;

/**
 * A queue joined near closing overruns it. The pad is where the overrun is
 * drawn, rather than being clipped into a claim that the day ends on time.
 */
export const POST_PAD_MIN = 30;

/**
 * How much later than {@link DayGrid.closeMin} the park might really shut.
 *
 * The API reports `closeHour` as the hour the closing time falls in, so `closeMin` is the
 * certifiable end and this is the slack above it: drawn, draggable, never planned into. Sixty
 * because that is the width of the API's rounding; it goes to zero once the backend sends a real
 * minute. See docs/rules/the-planners-day-ends-when-the-park-closes-and-a-headliner-is.md.
 */
export const CLOSE_SLACK_MIN = 60;

/**
 * How long one ride takes, boarding to the platform, for every ride alike: an assumption, since
 * `PlanDayRide` carries no duration. Spent in the transfer (`transferBetween` in `leg.ts`) and once
 * more after the last stop, never drawn. See
 * docs/features/trip-planner.md#a-ride-takes-five-minutes-and-that-is-an-assumption-par-12.
 */
export const RIDE_DURATION_MIN = 5;

/**
 * The quarter hour this app's own arithmetic sits on, 18 px here. Every start the app files lands
 * on it (`nowFloor`, `rideFloor`, the optimiser's search step, {@link latestStart}); a drag uses
 * {@link DRAG_SNAP_MIN} instead.
 */
export const SNAP_MIN_FINE = 15;

/**
 * The default a placement falls back to when nothing measured says otherwise.
 *
 * Not a claim about any ride — the number the grid itself uses for a block whose
 * wait is unknown, kept in one place so the search and the panel agree.
 */
export const DEFAULT_OCCUPIED_MINUTES = 45;

/** The arrow-key step of a block on a coarse pointer, 54 px on the phone's axis. */
export const SNAP_MIN_COARSE = 30;

/**
 * What a drag commits to, under a mouse and under a finger: five minutes, 6 px here and 9 px on
 * the phone's axis. Five because every displayed wait is already a multiple of five, so a dropped
 * block lands on a minute the panel can say. Only the drag's step: computed minutes still round to
 * {@link SNAP_MIN_FINE}. See
 * docs/features/trip-planner.md#a-plan-may-not-depend-on-a-gesture-landing.
 */
export const DRAG_SNAP_MIN = 5;

/**
 * The smallest box a block may occupy, not a claim about its height: 20 px is the smallest box a
 * `text-[11px]` line sits in. The tinted fill inside is still drawn to the true height, and
 * `heightFor` never consults this. Stated at {@link PX_PER_MIN} and scaled in
 * {@link minBlockPxFor}, so the floor stays the same number of minutes at every scale.
 */
export const MIN_BLOCK_PX = 20;

/**
 * The same floor as {@link MIN_BLOCK_PX}, in minutes (16.7), for a caller that needs it as a
 * duration, such as lane packing, without depending on the axis.
 */
export const MIN_BLOCK_MIN = MIN_BLOCK_PX / PX_PER_MIN;

/** Below this the uncertainty band is not drawn: under 3 px a band is an antialiasing artefact. */
export const MIN_BAND_PX = 3;

/** Three 112 px columns still fit a truncated name and a figure on a phone. */
export const MAX_LANES = 3;

/** Outlook's own gap between concurrent columns. */
export const LANE_GUTTER_PX = 2;

/** One `text-[10px]` line. Show pills closer than this collapse into one. */
export const SHOW_LABEL_MIN_GAP_PX = 14;

/**
 * The most show lines an axis may carry, however many the park runs: a park with 33 shows a day
 * otherwise covers the planned blocks with dashed rules. The extra times fold into the nearest
 * line and are counted in its "+n", so this limits density without dropping anything.
 */
export const MAX_SHOW_LINES = 12;

/**
 * Days of measurement below which a missing early hour says more about our
 * sampling than about the ride.
 */
export const SOFT_FLOOR_MIN_SAMPLE_DAYS = 30;

/** The day's axis: the park's hours in park-local minutes, and how they map to pixels. */
export interface DayGrid {
  /** Park-local minutes since midnight. */
  openMin: number;
  /**
   * The minute the park is known to be open until; may exceed 1440 on a past-midnight close.
   * Nothing the app files by itself may start past it. The hour above is {@link closeSlackMin}.
   */
  closeMin: number;
  /**
   * How much later the park might really shut. See {@link CLOSE_SLACK_MIN}.
   *
   * Drawn as uncertain and reachable by a drag; never planned into.
   */
  closeSlackMin: number;
  gridStartMin: number;
  gridEndMin: number;
  heightPx: number;
  pxPerMin: number;
  /**
   * Whether {@link closeMin} is the hour the API rounded to rather than a real
   * closing minute — i.e. whether {@link closeSlackMin} is anything at all.
   * True until the backend sends minutes.
   */
  closeIsTruncated: boolean;
  /**
   * The minute the early-entry rides open, below {@link openMin}, or `null` on a day without early
   * entry (see {@link earlyEntryOpenMin}). A hard start, but only for the rides {@link opensEarly}
   * names; the rest of the park still opens at `openMin`.
   */
  earlyEntryOpenMin: number | null;
}

/**
 * The first minute anything on this day may be filed at: the early-entry
 * opening where there is one, the park's opening otherwise.
 *
 * Only a LOWER bound for the helpers that clamp to the day. Whether a given ride
 * may start there is {@link rideFloor}'s question, and for every ride but the
 * headliners on an early-entry day the answer is still `openMin`.
 */
export function dayStartMin(grid: DayGrid): number {
  return grid.earlyEntryOpenMin ?? grid.openMin;
}

/**
 * Where the early-entry rides open on this day, in park-local minutes, or `null`.
 *
 * Three facts must agree: the park offers early entry (`hasEarlyEntry`), says how early
 * (`earlyEntryMinutesPeak`), and the visitor holds it on this day (`earlyEntry`, their own answer).
 * A day-ticket holder queues with everyone else, so a park flag alone never moves anybody's
 * morning. `null` builds exactly the grid there was without early entry.
 */
export function earlyEntryOpenMin(
  context:
    | Pick<PlanDayContext, 'openHour' | 'hasEarlyEntry' | 'earlyEntryMinutesPeak' | 'earlyEntry'>
    | null
    | undefined
): number | null {
  if (!context || context.earlyEntry !== true || context.hasEarlyEntry !== true) return null;
  if (context.openHour === null || context.openHour === undefined) return null;
  const minutes = context.earlyEntryMinutesPeak;
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) return null;
  return context.openHour * 60 - Math.round(minutes);
}

/**
 * The day payload with the visitor's early-entry answer folded into its
 * context, so every reader of `day.context` sees the same day.
 *
 * Returns the SAME object when nothing changes, so a memo keyed on the day does
 * not recompute for a park without early entry.
 */
export function withEarlyEntry<T extends PlanDay | null | undefined>(
  day: T,
  confirmed: boolean | undefined
): T {
  if (!day) return day;
  const next = confirmed === true;
  if ((day.context.earlyEntry === true) === next) return day;
  return { ...day, context: { ...day.context, earlyEntry: next } };
}

/**
 * Whether this ride opens before the park on an early-entry day: the park's headliners, minus any
 * whose own `opensAt` is later than the park's opening. Takes `openMin` rather than a grid so
 * `estimate.ts` asks the same question from the payload alone.
 */
export function opensEarly(
  ride: Pick<PlanDayRide, 'isHeadliner' | 'opensAt'> | undefined | null,
  openMin: number
): boolean {
  if (ride?.isHeadliner !== true) return false;
  const opens = opensAtMinute(ride.opensAt);
  return opens === null || opens <= openMin;
}

/**
 * The closing hour on the day's own axis: a park running 16:00–01:00 reports `closeHour: 1`, which
 * unfolds to 25. Exported so the axis and `estimate.ts` cannot unfold it differently.
 *
 * Like the field it reads, this is the hour the closing time falls in, not the last open hour;
 * {@link CLOSE_SLACK_MIN} covers the minutes the API truncates. `estimateFor` still answers for
 * that hour, because a block a visitor drags there deserves a figure.
 */
export function unfoldedCloseHour(openHour: number, closeHour: number): number {
  return closeHour < openHour ? closeHour + 24 : closeHour;
}

/**
 * The day's axis, or `null` when the park's hours are unknown.
 *
 * `null` is the honest answer and the caller must handle it: inventing
 * 00:00–24:00 asserts a park that never closes, and inventing 09:00–18:00
 * invents a schedule. The panel falls back to its flat list there.
 */
export function buildDayGrid(
  openHour: number | null | undefined,
  closeHour: number | null | undefined,
  pxPerMin: number = PX_PER_MIN,
  earlyOpenMin: number | null = null
): DayGrid | null {
  if (openHour === null || openHour === undefined) return null;
  if (closeHour === null || closeHour === undefined) return null;

  const openMin = openHour * 60;
  // `closeHour` is the hour the closing time falls in, so this is the closing minute wherever the
  // park closes on the hour. See {@link unfoldedCloseHour} and {@link CLOSE_SLACK_MIN}.
  const closeMin = unfoldedCloseHour(openHour, closeHour) * 60;

  // An early-entry window only counts where it is really earlier. A value at or
  // past the opening is not early entry, and keeping it would draw a band of
  // zero height or a negative one.
  const early = earlyOpenMin !== null && earlyOpenMin < openMin ? earlyOpenMin : null;

  // The pad is for the walk to the gate, and on an early-entry day that walk
  // happens before the EARLY opening, so the axis starts that much sooner.
  const gridStartMin = (early ?? openMin) - PRE_PAD_MIN;
  // The canvas is unchanged: it holds the slack the park might still be open
  // for AND the overrun of a queue joined at the end of it.
  const gridEndMin = closeMin + CLOSE_SLACK_MIN + POST_PAD_MIN;

  return {
    openMin,
    closeMin,
    closeSlackMin: CLOSE_SLACK_MIN,
    gridStartMin,
    gridEndMin,
    heightPx: (gridEndMin - gridStartMin) * pxPerMin,
    pxPerMin,
    closeIsTruncated: true,
    earlyEntryOpenMin: early,
  };
}

/**
 * The axis, widened until it contains the plan drawn on it. Only the canvas grows: `openMin` and
 * `closeMin` stay the park's, so the extra room is hatched as outside opening hours. Fed from the
 * committed entries, never from a drag in flight, or every other block would move under the
 * pointer. See docs/features/trip-planner.md#the-axis-is-the-parks-day-and-the-canvas-is-not.
 */
export function growGridForSpans(
  grid: DayGrid | null,
  spans: readonly { startMinute: number; spanMinutes: number }[]
): DayGrid | null {
  if (!grid || spans.length === 0) return grid;

  let earliest = grid.gridStartMin;
  let latest = grid.gridEndMin;
  for (const span of spans) {
    if (!Number.isFinite(span.startMinute)) continue;
    const end = span.startMinute + Math.max(0, span.spanMinutes || 0);
    if (span.startMinute - PRE_PAD_MIN < earliest) earliest = span.startMinute - PRE_PAD_MIN;
    if (end + POST_PAD_MIN > latest) latest = end + POST_PAD_MIN;
  }

  // Rounded only where it actually moved. The base canvas already carries a
  // deliberate half-hour pad at each end — rounding that to the hour would add
  // thirty minutes of empty axis to every plan that fits comfortably.
  const gridStartMin =
    earliest < grid.gridStartMin ? Math.floor(earliest / 60) * 60 : grid.gridStartMin;
  const gridEndMin = latest > grid.gridEndMin ? Math.ceil(latest / 60) * 60 : grid.gridEndMin;
  if (gridStartMin === grid.gridStartMin && gridEndMin === grid.gridEndMin) return grid;

  return {
    ...grid,
    gridStartMin,
    gridEndMin,
    heightPx: (gridEndMin - gridStartMin) * grid.pxPerMin,
  };
}

/** Pixels from the canvas top for a park-local minute. */
export function yFor(grid: DayGrid, minute: number): number {
  return (minute - grid.gridStartMin) * grid.pxPerMin;
}

/** The exact inverse of {@link yFor}. This is the half of a drag that can be wrong without looking wrong. */
export function minuteAt(grid: DayGrid, y: number): number {
  return grid.gridStartMin + y / grid.pxPerMin;
}

/**
 * A duration in pixels.
 *
 * Takes minutes and NOT a start, which is the whole point: forty minutes is the
 * same height wherever it sits, and a future change that gives this function a
 * position would break the invariant loudly instead of quietly.
 */
export function heightFor(grid: DayGrid, minutes: number): number {
  return minutes * grid.pxPerMin;
}

/**
 * The floor under a block's box on this axis: {@link MIN_BLOCK_PX} scaled so it keeps its minutes,
 * not its pixels.
 */
export function minBlockPxFor(grid: DayGrid): number {
  // `(MIN_BLOCK_PX * pxPerMin) / PX_PER_MIN`, in that order, and not the
  // `MIN_BLOCK_MIN * pxPerMin` the constant below reads as: the same value in
  // binary floating point comes out 30.000000000000004 one way round and 30 the
  // other, and this number is a pixel height a test compares exactly.
  return (MIN_BLOCK_PX * grid.pxPerMin) / PX_PER_MIN;
}

/** The drawn box: never below {@link minBlockPxFor}. The fill inside stays exact. */
export function blockBoxFor(grid: DayGrid, minutes: number): number {
  return Math.max(heightFor(grid, minutes), minBlockPxFor(grid));
}

/**
 * A block with no figure gets a stated box rather than a height it cannot back.
 *
 * Stated at {@link PX_PER_MIN} and scaled by the axis in {@link noFigurePxFor},
 * like {@link MIN_BLOCK_PX}: 40 px is 33.3 minutes, and a flat 40 px would be
 * 22.2 of them on the phone's {@link PX_PER_MIN_COARSE} axis.
 */
export const NO_FIGURE_PX = 40;

/** {@link NO_FIGURE_PX} in minutes, 33.3 of them: the span lane packing counts for a block with no figure. */
export const NO_FIGURE_MIN = NO_FIGURE_PX / PX_PER_MIN;

/** The box of a block with no figure, on THIS axis: {@link NO_FIGURE_MIN} minutes tall. */
export function noFigurePxFor(grid: DayGrid): number {
  // Same multiplication order as `minBlockPxFor`, for the same reason.
  return (NO_FIGURE_PX * grid.pxPerMin) / PX_PER_MIN;
}

/**
 * How many minutes a block occupies for LANE PACKING, given its occupancy.
 *
 * This is the twin of {@link drawnBoxPx} in minutes, and the two have to agree
 * for every block: a packing that counts less than the box is drawn at lets two
 * blocks share a lane and overlap on screen, and a leg chip measured against
 * the drawn edge then finds a negative gap. `minutes` is what {@link drawnBoxPx}
 * takes: a custom block's duration, a planned block's wait, `null` for no figure.
 */
export function packedSpanMinutes(minutes: number | null): number {
  return minutes === null ? NO_FIGURE_MIN : Math.max(minutes, MIN_BLOCK_MIN);
}

/**
 * How tall a block is drawn, for the one caller that is not the block: the leg chip measures its
 * gap from the bottom edge of the box above, so it needs the answer the block gives itself, not a
 * second copy. `minutes` is a custom block's duration, a planned block's wait, or `null` for none.
 */
export function drawnBoxPx(grid: DayGrid, minutes: number | null): number {
  return minutes === null ? noFigurePxFor(grid) : blockBoxFor(grid, minutes);
}

/** Rounds a minute to the nearest multiple of the step. */
export function snapTo(minute: number, step: number): number {
  return Math.round(minute / step) * step;
}

/**
 * Where a block a visitor places may start. The bound is on the start, not the end: a queue joined
 * just before closing is a real plan that overruns.
 *
 * The ceiling includes {@link DayGrid.closeSlackMin}, because the person dragging knows whether
 * their park is still open; `nextFreeStart` and the optimiser stop at {@link DayGrid.closeMin}.
 */
export function clampStart(grid: DayGrid, minute: number, floorMin: number): number {
  return Math.min(Math.max(minute, floorMin), latestStart(grid));
}

/**
 * {@link clampStart}'s ceiling as a number, for call sites that hand a `maxMinute` to a block.
 * Exported so the drag, the keyboard nudge and the clamp cannot drift apart.
 */
export function latestStart(grid: DayGrid): number {
  return grid.closeMin + grid.closeSlackMin - SNAP_MIN_FINE;
}

/** The two floors under a ride; see {@link rideFloor}. */
export interface RideFloor {
  /** The drag stops here. A published fact, never a statistic. */
  hardMin: number;
  /** Advisory. Equal to `hardMin` unless there is a measured reason to raise it. */
  softMin: number;
  reason: 'park' | 'ride';
}

/**
 * `HH:mm` in the park's own clock, as minutes since midnight. `null` on
 * anything that is not that shape — the field is optional and comes from an
 * API, so a bad value must degrade to "not known" rather than to minute zero.
 */
export function opensAtMinute(opensAt: string | null | undefined): number | null {
  if (!opensAt) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(opensAt.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * How long after the gates open somebody can actually be queueing: turnstile, bag check and walk.
 * An allowance, not a measurement, so it belongs to the soft floor and never the hard one.
 */
export const GATE_TO_FIRST_RIDE_MIN = 15;

/**
 * The earliest minute a block may be filed at today, and `startMin` on every other date.
 *
 * It raises the soft floor and never the hard one (see {@link rideFloor}), so a drag into the
 * recorded morning stays legal. It is not capped at the end of the day: past the last slot the
 * honest answer is a minute the day has no room for, and a cap would file a queue before the
 * press. See docs/rules/the-planners-day-ends-when-the-park-closes-and-a-headliner-is.md.
 */
export function nowFloor(grid: DayGrid, clock?: DayClock, startMin: number = grid.openMin): number {
  // `startMin` is the day's start for the ride asking: `openMin`, or the
  // early-entry opening for a ride that opens early (see {@link rideFloor}).
  if (clock?.phase !== 'today') return startMin;
  // Snapped UP, not to the nearest: every start in this app sits on a quarter
  // hour, and rounding 14:03 down to 14:00 would file a block three minutes
  // into a past nobody can act on.
  return Math.max(startMin, Math.ceil(clock.nowMinute / SNAP_MIN_FINE) * SNAP_MIN_FINE);
}

/**
 * The two floors under a ride.
 *
 * The hard floor is a fact and is what a drag is clamped to: the ride's own `opensAt` where the API
 * has one, the park's published opening otherwise.
 *
 * The soft floor is where a new block is filed, and adds three things the hard floor may not: the
 * first hour this ride has a curve for (only with a month of data and an hour past the floor, or a
 * quiet morning becomes a wall), {@link GATE_TO_FIRST_RIDE_MIN}, and today's clock through
 * {@link nowFloor}.
 *
 * On an early-entry day a ride {@link opensEarly} names takes the early opening as its park
 * opening, and the curve may not lift it back, because the curve starts at `openHour` by
 * construction.
 */
export function rideFloor(
  grid: DayGrid,
  ride: PlanDayRide | undefined | null,
  clock?: DayClock
): RideFloor {
  const opens = opensAtMinute(ride?.opensAt);
  const knowsOpening = opens !== null && opens > grid.openMin;
  const early = grid.earlyEntryOpenMin !== null && opensEarly(ride, grid.openMin);
  const startMin = early ? (grid.earlyEntryOpenMin as number) : grid.openMin;
  const hardMin = Math.min(knowsOpening ? opens : startMin, grid.closeMin - SNAP_MIN_FINE);

  const first = ride?.hours?.[0]?.hour;
  const measuredEnough = (ride?.sampleDays ?? 0) >= SOFT_FLOOR_MIN_SAMPLE_DAYS;
  // Measured against the park's own opening for an early ride, not against the
  // early one: its curve starts at `openHour` whatever happens before it.
  const measuredFrom = early ? grid.openMin : hardMin;
  const raised =
    ride && first !== undefined && measuredEnough && first * 60 >= measuredFrom + 60
      ? first * 60
      : hardMin;

  // The walk applies to a ride that opens WITH the park and to nothing else: a
  // ride whose own opening is later is already a statement about when somebody
  // can queue, and adding a turnstile to it would push the block past the first
  // hour anybody could ride it.
  const withEntry = knowsOpening ? raised : Math.max(raised, hardMin + GATE_TO_FIRST_RIDE_MIN);

  return {
    hardMin,
    // The ride's own reasons are capped at the last slot of the day; the clock may raise it past
    // that, to a minute that is no slot at all. See {@link nowFloor}.
    softMin: Math.max(
      Math.min(withEntry, grid.closeMin - SNAP_MIN_FINE),
      nowFloor(grid, clock, startMin)
    ),
    reason: raised > hardMin || knowsOpening || early ? 'ride' : 'park',
  };
}

/** A block's drawn span, as {@link packLanes} takes it. */
export interface LaneInput {
  id: string;
  topMin: number;
  /** Already includes the uncertainty band and the minimum box. */
  bottomMin: number;
}

/** Where {@link packLanes} put a block. */
export interface LanePlacement {
  column: number;
  columns: number;
  /** Blocks past {@link MAX_LANES} in this cluster, reported on the last column. */
  overflow: number;
}

/** The lane of a block that shares its time with nothing: the full width. */
export const NO_LANE: LanePlacement = { column: 0, columns: 1, overflow: 0 };

/** A lane's horizontal box as CSS, so a block, its band and its leg cannot drift apart. */
export function laneBox(lane: Pick<LanePlacement, 'column' | 'columns'>): {
  left: string;
  width: string;
} {
  const width = `calc((100% - ${(lane.columns - 1) * LANE_GUTTER_PX}px) / ${lane.columns})`;
  return { left: `calc((${width} + ${LANE_GUTTER_PX}px) * ${lane.column})`, width };
}

/**
 * Which column each block sits in, Outlook-style.
 *
 * A cluster is a maximal transitively-overlapping run, and its width is the
 * cluster's peak concurrency — not its size. Three blocks where a overlaps b and
 * b overlaps c but a and c are disjoint make two columns, not three, which is
 * what stops a long day collapsing into slivers.
 *
 * The spans handed in are the DRAWN ones — fill plus band, floored at the
 * minimum box — because two blocks a reader sees touching must be laid out as
 * touching. Ties keep insertion order, which is the only stable ordering the
 * plan has.
 */
export function packLanes(blocks: readonly LaneInput[]): Map<string, LanePlacement> {
  const out = new Map<string, LanePlacement>();
  if (blocks.length === 0) return out;

  const sorted = blocks
    .map((block, index) => ({ block, index }))
    .sort((a, b) => a.block.topMin - b.block.topMin || a.index - b.index);

  let cluster: typeof sorted = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (cluster.length === 0) return;

    // Column assignment: the first column whose last block has ended.
    const columnEnds: number[] = [];
    const placed: { id: string; column: number }[] = [];
    let overflowCount = 0;

    for (const { block } of cluster) {
      let column = columnEnds.findIndex((end) => end <= block.topMin);
      if (column === -1) {
        if (columnEnds.length < MAX_LANES) {
          column = columnEnds.length;
          columnEnds.push(block.bottomMin);
        } else {
          // Past the lane budget: it rides in the last column and is counted.
          column = MAX_LANES - 1;
          overflowCount++;
          columnEnds[column] = Math.max(columnEnds[column], block.bottomMin);
        }
      } else {
        columnEnds[column] = block.bottomMin;
      }
      placed.push({ id: block.id, column });
    }

    const columns = Math.max(1, columnEnds.length);
    for (const { id, column } of placed) {
      out.set(id, { column, columns, overflow: 0 });
    }
    if (overflowCount > 0) {
      // Reported once, on the last block of the crowded column.
      const last = placed.filter((p) => p.column === MAX_LANES - 1).at(-1);
      if (last) out.set(last.id, { column: MAX_LANES - 1, columns, overflow: overflowCount });
    }

    cluster = [];
    clusterEnd = -Infinity;
  };

  for (const entry of sorted) {
    if (cluster.length > 0 && entry.block.topMin >= clusterEnd) flush();
    cluster.push(entry);
    clusterEnd = Math.max(clusterEnd, entry.block.bottomMin);
  }
  flush();

  return out;
}

/**
 * Where a newly added ride goes: the earliest snapped minute at or after `floorMin` whose block
 * overlaps nothing already planned. `floorMin` should be the ride's own floor
 * (`rideFloor().softMin`), not the park's opening. The ceiling is {@link DayGrid.closeMin}, not the
 * slack above it, since this is the app choosing a minute.
 */
export function nextFreeStart(
  existing: readonly { startMinute: number; spanMinutes: number }[],
  grid: DayGrid,
  spanMinutes = DEFAULT_OCCUPIED_MINUTES,
  floorMin?: number
): number {
  const taken = existing
    .map((e) => ({
      from: e.startMinute,
      to: e.startMinute + Math.max(e.spanMinutes, SNAP_MIN_FINE),
    }))
    .sort((a, b) => a.from - b.from);

  // `dayStartMin` and not `openMin`: an early ride's soft floor sits below the
  // park's opening, and it is the floor that decides, not this clamp. Without
  // early entry the two are the same minute.
  const floor = snapTo(Math.max(dayStartMin(grid), floorMin ?? grid.openMin), SNAP_MIN_FINE);
  let candidate = floor;
  const last = grid.closeMin - SNAP_MIN_FINE;

  for (const slot of taken) {
    if (candidate + spanMinutes <= slot.from) break;
    if (candidate < slot.to) candidate = snapTo(slot.to + SNAP_MIN_FINE - 1, SNAP_MIN_FINE);
  }

  // The cap may not pull the answer below the floor: on a day whose slots are gone that would file
  // into the past. A block in the hatched hours is a visible answer.
  return Math.max(floor, Math.min(candidate, last));
}

/** Where a show line is drawn, and which showtimes it stands for. */
export interface ShowLinePosition {
  minute: number;
  y: number;
  /** Further showtimes this line stands for, because their labels would collide. */
  collapsedWith: number[];
}

/**
 * Show lines with labels closer than {@link SHOW_LABEL_MIN_GAP_PX} folded
 * together — and no more than {@link MAX_SHOW_LINES} of them, whatever that
 * takes.
 *
 * The gap widens rather than the tail being cut, so the park with 33 shows and
 * the park with four are drawn by one rule: a line always stands for every
 * showtime around it, and `collapsedWith` says how many. `heightPx / MAX` is
 * the gap that would leave exactly the cap on a full axis; the real count comes
 * out at or under it because folding is greedy from the top.
 */
export function showLinePositions(
  grid: DayGrid,
  showMinutes: readonly number[]
): ShowLinePosition[] {
  const sorted = [...new Set(showMinutes)].sort((a, b) => a - b);
  const gap =
    sorted.length > MAX_SHOW_LINES
      ? Math.max(SHOW_LABEL_MIN_GAP_PX, grid.heightPx / MAX_SHOW_LINES)
      : SHOW_LABEL_MIN_GAP_PX;
  const out: ShowLinePosition[] = [];

  for (const minute of sorted) {
    const y = yFor(grid, minute);
    const previous = out.at(-1);
    if (previous && y - previous.y < gap) {
      previous.collapsedWith.push(minute);
      continue;
    }
    out.push({ minute, y, collapsedWith: [] });
  }

  return out;
}

/**
 * Half a show pill's drawn height, rounded up: one `text-[10px]` line at the
 * pill's leading, its 1 px padding and its border, 19 px measured at 1280×900.
 */
export const SHOW_PILL_HALF_PX = 10;

/** Something drawn on the axis that a show pill may not be laid over. */
export type ShowLineObstacle =
  | {
      kind: 'block';
      topPx: number;
      bottomPx: number;
      /** How many blocks stand side by side there; 1 for a block alone. */
      columns: number;
    }
  | { kind: 'chip'; topPx: number; bottomPx: number };

/** What a show line runs through, which decides how its pill is drawn. */
export type ShowLineCover =
  | { kind: 'free' }
  | {
      kind: 'block';
      columns: number;
      /** A transfer chip is in the way too, on the block's edge. */
      chip: boolean;
    }
  | { kind: 'chip' };

/**
 * What a show line runs through, which decides where its pill's mask goes so it does not cover a
 * ride's name or a transfer chip. The pill's own half height counts, so a line a few pixels above
 * a block's top edge is over its name line too.
 */
export function showLineCover(y: number, obstacles: readonly ShowLineObstacle[]): ShowLineCover {
  let columns = 0;
  let chip = false;
  for (const box of obstacles) {
    if (y <= box.topPx - SHOW_PILL_HALF_PX || y >= box.bottomPx + SHOW_PILL_HALF_PX) continue;
    if (box.kind === 'block') columns = Math.max(columns, box.columns);
    else chip = true;
  }
  if (columns > 0) return { kind: 'block', columns, chip };
  return chip ? { kind: 'chip' } : { kind: 'free' };
}

/** A planned block as {@link showLineHost} sees it. */
export interface ShowLineHostCandidate {
  id: string;
  topPx: number;
  bottomPx: number;
  /** Its lane; the leftmost of two blocks side by side takes the show. */
  column: number;
}

/**
 * The block a show line falls into, which then writes the show itself; the grid draws no mark of
 * its own for that line. A line that only grazes a block's edge has no host.
 */
export function showLineHost(y: number, blocks: readonly ShowLineHostCandidate[]): string | null {
  let host: ShowLineHostCandidate | null = null;
  for (const block of blocks) {
    if (y < block.topPx || y >= block.bottomPx) continue;
    if (host === null || block.column < host.column) host = block;
  }
  return host?.id ?? null;
}
