'use client';

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Theater } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DRAG_SNAP_MIN,
  SNAP_MIN_COARSE,
  SNAP_MIN_FINE,
  clampStart,
  drawnBoxPx,
  dayStartMin,
  heightFor,
  laneBox,
  latestStart,
  minuteAt,
  NO_LANE,
  packLanes,
  packedSpanMinutes,
  rideFloor,
  snapTo,
  yFor,
  type DayGrid,
  type LanePlacement,
} from '@/lib/planner/day-grid';
import { LEG_CHIP_COMPACT_PX, LEG_CHIP_PX, legChipPlacement } from '@/lib/planner/leg-chip';
import { entryPlace, isBlockEntry, legBetween, earliestGoodStart } from '@/lib/planner/leg';
import { formatGridTime, parkMinuteNow, todayInZone } from '@/lib/planner/park-time';
import {
  getMinuteTick,
  getZero,
  subscribeToMinute,
  subscribeToNothing,
} from '@/lib/planner/minute-tick';
import { lineSource, type PlannerShowLine } from '@/lib/planner/shows';
import { bandCarriesFigure, estimateFor, isAssumedWait } from '@/lib/planner/estimate';
import { weatherRailSegments, withinWeatherHorizon } from '@/lib/planner/weather-rail';
import {
  PLANNER_RIDE_MIME,
  activeRideDrag,
  parseRideDrag,
  rideFromUrl,
} from '@/lib/planner/ride-drag';
import { capturePointer, isSamePointer, releasePointer } from '@/lib/planner/pointer-capture';
import { useWeatherHourly } from '@/lib/hooks/use-weather-hourly';
import { PlannerGridGround } from './planner-grid-ground';
import { PlannerWeatherRail } from './planner-weather-rail';
import { PlannerBlock, type PlannerBlockShow } from './planner-block';
import { PlannerLeg } from './planner-leg';
import {
  SHOW_PILL_HALF_PX,
  showLineCover,
  showLineHost,
  showLinePositions,
  type ShowLineHostCandidate,
  type ShowLineObstacle,
} from '@/lib/planner/day-grid';
import { BAND_FADE, bandGeometry } from '@/lib/planner/block-band';
import { CROWD_DOT_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { cn } from '@/lib/utils';
import { PlannerDragDemo } from './planner-drag-demo';
import { partyFlags } from '@/lib/planner/party';
import type { PlannerDayPrefs, PlannerEntry } from '@/lib/planner/types';
import type { PlanDay, PlanDayRide, PlanDayTier } from '@/lib/api/types';

interface PlannerDayGridProps {
  entries: readonly PlannerEntry[];
  day: PlanDay | null;
  grid: DayGrid;
  /** The park's IANA zone. The now line and "today" are read from it, never from the browser. */
  timezone: string;
  /** True when the plan's date is today in the PARK's reading. */
  isToday: boolean;
  /** Live standby minutes by ride slug, where a reading applies. */
  liveWaits?: Map<string, number> | null;
  /** Showtimes as park-local minutes. `null` while the day payload is on its way. */
  showLines?: PlannerShowLine[] | null;
  /** The shows switch is off: the lines stay mounted and fade out. */
  showsHidden?: boolean;
  /** Rendered inside the "nothing planned yet" overlay. Usually `null`. */
  emptyAction?: React.ReactNode;
  /** Free blocks only: the visitor dragged the bottom edge to this many minutes. */
  onResize?: (entryId: string, durationMinutes: number) => void;
  /** The plan's active park. A ride dropped in from another park is refused. */
  parkSlug?: string;
  /** A ride dragged in from the page behind the panel, dropped at this minute. */
  onDropRide?: (attractionSlug: string, attractionName: string, startMinute: number) => void;
  /** Rides reporting closed right now. Empty where the date is not today. */
  closedNow?: ReadonlySet<string>;
  /**
   * Who is coming, if anybody asked, so a placed ride keeps the flag the ride search showed. A
   * flag, never a filter.
   */
  prefs?: PlannerDayPrefs;
  loading?: boolean;
  onMove: (entryId: string, startMinute: number) => void;
  onShiftFrom: (entryId: string, deltaMinutes: number) => void;
  onSelect: (entryId: string | null) => void;
  /**
   * Take an entry out of the day from the block's own ✕, the same write as the action bar's (see
   * `PlannerBlockProps.onRemove`).
   */
  onRemove?: (entryId: string) => void;
  selectedId: string | null;
  /** The scroll container, for the drag's auto-scroll. */
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  /**
   * A drag has left the minute it started on, or has ended, so the column's action bar, a sibling
   * lying over this grid's lower edge, can stand back. See `dragMoved`.
   */
  onDragChange?: (dragging: boolean) => void;
}

/** How far from a live reading's own moment it may still speak for a block. */
const LIVE_WINDOW_MIN = 45;

/** Five minutes, like every displayed wait in this app. */
const RESIZE_STEP_MIN = 5;

const EDGE_PX = 48;
const MAX_SCROLL_SPEED = 12;

/**
 * The day grid: the axis, the ground, the blocks and the legs between them. Everything positional
 * comes from `lib/planner/day-grid.ts`; the grid owns the gesture and the DOM.
 */
export function PlannerDayGrid({
  entries,
  day,
  grid,
  timezone,
  isToday,
  liveWaits,
  showLines = null,
  showsHidden = false,
  emptyAction = null,
  onResize,
  parkSlug,
  onDropRide,
  closedNow,
  prefs,
  loading = false,
  onMove,
  onShiftFrom,
  onSelect,
  onRemove,
  selectedId,
  scrollerRef,
  onDragChange,
}: PlannerDayGridProps) {
  const t = useTranslations('planner');
  const canvasRef = useRef<HTMLDivElement>(null);
  /** The ghost of a dragged block, moved by the rAF loop — see {@link DragGhost}. */
  const ghostRef = useRef<MinuteHandle>(null);
  /** The line a ride dragged in from the page would land on — see {@link DropLine}. */
  const dropLineRef = useRef<MinuteHandle>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dense, setDense] = useState(false);

  // "A block is under the pointer" as an attribute on the grid, for the show marks that step back.
  // Not `:has()`, which restyles the whole document on every DOM change
  // (docs/rules/no-has-selector-in-the-stylesheet.md), and not state, so the grid does not
  // re-render as the pointer crosses it.
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !window.matchMedia('(pointer: fine)').matches) return;
    const sync = (event: PointerEvent) => {
      const over =
        event.type === 'pointerover' &&
        event.target instanceof Element &&
        event.target.closest('[data-planner-block]') !== null;
      if (over !== grid.hasAttribute('data-block-hover'))
        grid.toggleAttribute('data-block-hover', over);
    };
    grid.addEventListener('pointerover', sync);
    grid.addEventListener('pointerleave', sync);
    return () => {
      grid.removeEventListener('pointerover', sync);
      grid.removeEventListener('pointerleave', sync);
    };
  }, []);

  // The half-hour hairlines ask the canvas's width, not the viewport's.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setDense(entry.contentRect.width >= 400));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The now line, in park time, through `useSyncExternalStore`: a clock is an external source, and
  // its server snapshot is `null`, so the line is never in the first HTML.
  const nowTick = useSyncExternalStore(
    isToday ? subscribeToMinute : subscribeToNothing,
    isToday ? getMinuteTick : getZero,
    getZero
  );
  const nowMinute = useMemo(
    () => (isToday && nowTick >= 0 ? parkMinuteNow(timezone) : null),
    // `nowTick` is the dependency that makes this recompute each minute.
    [isToday, timezone, nowTick]
  );

  const ridesBySlug = useMemo(() => {
    const map = new Map<string, PlanDayRide>();
    for (const ride of day?.rides ?? []) map.set(ride.attractionSlug, ride);
    return map;
  }, [day]);

  const tier = day?.tier ?? 'composed';
  const showBandFigure = bandCarriesFigure(day);

  /**
   * Everything the grid draws, in one pass. A live standby reading replaces the forecast only
   * within `LIVE_WINDOW_MIN` of its own moment, and the later curve is not scaled by it, since
   * nothing measures that.
   */
  const layout = useMemo(() => {
    const ordered = [...entries].sort((a, b) => a.startMinute - b.startMinute);

    const rows = ordered.map((entry) => {
      const ride = entry.attractionSlug ? ridesBySlug.get(entry.attractionSlug) : undefined;
      const estimate = estimateFor(day, entry);

      const liveWait =
        !entry.done &&
        nowMinute !== null &&
        Math.abs(entry.startMinute - nowMinute) <= LIVE_WINDOW_MIN
          ? entry.attractionSlug
            ? (liveWaits?.get(entry.attractionSlug) ?? null)
            : null
          : null;

      const effective =
        liveWait !== null
          ? { ...estimate, wait: liveWait, uncertaintyMinutes: null, missing: 'none' as const }
          : estimate;

      // A free block's "wait" is its duration: it occupies the visitor exactly as a queue does, so
      // the transfer arithmetic needs no special case.
      const wait = entry.custom
        ? entry.custom.durationMinutes
        : entry.done
          ? (entry.actualWait ?? null)
          : effective.wait;
      // A lane is cut for the planned occupancy, band excluded: a block starting inside the
      // previous one's band is the plan working, and counting the band split packed days into two
      // columns. `packedSpanMinutes` floors it at the drawn box, so lane and box end on the same
      // line.
      const spanMinutes = packedSpanMinutes(wait);

      // "Meldet gerade geschlossen" is about now, so only on a block near now, the window the live
      // wait obeys.
      const closedRelevant =
        Boolean(entry.attractionSlug) &&
        nowMinute !== null &&
        Math.abs(entry.startMinute - nowMinute) <= LIVE_WINDOW_MIN;

      return {
        entry,
        ride,
        // Where the walk to and from this block starts and ends: the ride, or a show with
        // coordinates.
        place: entryPlace(day, entry),
        estimate: effective,
        wait,
        spanMinutes,
        live: liveWait !== null,
        closedRelevant,
      };
    });

    const lanes = packLanes(
      rows.map((r) => ({
        id: r.entry.id,
        topMin: r.entry.startMinute,
        bottomMin: r.entry.startMinute + r.spanMinutes,
      }))
    );

    const legs = rows.slice(0, -1).map((from, index) => {
      const to = rows[index + 1];
      return {
        id: `${from.entry.id}->${to.entry.id}`,
        fromEntry: from.entry,
        toEntry: to.entry,
        leg: legBetween(
          {
            startMinute: from.entry.startMinute,
            wait: from.wait,
            ride: from.place,
            block: isBlockEntry(from.entry),
          },
          {
            startMinute: to.entry.startMinute,
            wait: to.wait,
            ride: to.place,
            block: isBlockEntry(to.entry),
          },
          from.estimate.uncertaintyMinutes,
          day?.tier === 'observed'
        ),
        // The from block's lane: a leg descends from where one block ends, and in the destination's
        // column it would read as a leg from whatever block sits above that column.
        lane: lanes.get(from.entry.id) ?? NO_LANE,
        fromMinute: from.entry.startMinute + (from.wait ?? 0),
        // In minutes, like everything in this memo; the chip's room is measured against the drawn
        // edge (`drawnBoxPx`) in the render.
        fromWait: from.wait,
      };
    });

    const broken = new Set<string>();
    for (const l of legs) {
      if (l.leg.verdict === 'broken') {
        broken.add(l.fromEntry.id);
        broken.add(l.toEntry.id);
      }
    }

    return { rows, lanes, legs, broken };
    // No `grid` or `pxPerMin`: everything here is in minutes, so a scale change does not recompute
    // it.
  }, [entries, day, ridesBySlug, liveWaits, nowMinute]);

  /**
   * Where the park is, to about a kilometre, taken off the first ride with a position: nothing the
   * planner fetches carries the park's own, and the weather proxy rounds to two decimals anyway.
   */
  const located = day?.rides?.find(
    (ride) => typeof ride.latitude === 'number' && typeof ride.longitude === 'number'
  );
  const parkLat = located?.latitude ?? null;
  const parkLon = located?.longitude ?? null;

  /**
   * The hourly forecast for the day being planned, not for today. Gated on the forecast's own reach
   * (about fourteen days), or every later day would put a failing request behind it.
   */
  const planDate = day?.context.date;
  const weatherEnabled = Boolean(
    parkLat !== null &&
    parkLon !== null &&
    planDate &&
    withinWeatherHorizon(todayInZone(timezone), planDate)
  );
  const { data: hourlyWeather } = useWeatherHourly({
    latitude: parkLat,
    longitude: parkLon,
    timezone,
    date: planDate,
    enabled: weatherEnabled,
  });

  /** The row a ghost is being drawn for, or none while nothing is dragging. */
  const ghostRow = useMemo(
    () => (draggingId ? (layout.rows.find((row) => row.entry.id === draggingId) ?? null) : null),
    [draggingId, layout.rows]
  );

  /**
   * A drag that has actually gone somewhere, which is what dims the day. Not
   * `draggingId !== null`: that is set on `pointerdown`, which also selects, so every click would
   * flash the column. State of its own, set only by `reportDragMoved`, so a five-minute step
   * re-renders the ghost alone ({@link DragGhost}).
   */
  const [dragMoved, setDragMoved] = useState(false);

  /**
   * Tell the column when that is true, so the selected block's action bar can step aside: it is
   * opaque and lies over the grid's lower edge, where it hid the ghost and printed the old start.
   * Reported from the gesture's own frame rather than an effect, so it renders in the same pass;
   * the dragged block's start and the callback come through refs, since the loop is per gesture.
   */
  const draggedStart = ghostRow?.entry.startMinute ?? null;
  const draggedStartRef = useRef(draggedStart);
  useEffect(() => {
    draggedStartRef.current = draggedStart;
  }, [draggedStart]);
  const onDragChangeRef = useRef(onDragChange);
  useEffect(() => {
    onDragChangeRef.current = onDragChange;
  });
  /** The last value the column was told, so it hears each change once. */
  const reportedMoved = useRef(false);
  const reportDragMoved = useCallback((moved: boolean) => {
    if (reportedMoved.current === moved) return;
    reportedMoved.current = moved;
    setDragMoved(moved);
    onDragChangeRef.current?.(moved);
  }, []);

  const weatherSegments = useMemo(
    () => (loading ? [] : weatherRailSegments(grid, hourlyWeather?.points)),
    [grid, hourlyWeather, loading]
  );

  const dragState = useRef<{
    entryId: string;
    grabOffsetPx: number;
    startMinute: number;
    lastClientY: number;
    floorMin: number;
    element: HTMLElement;
    frame: number | null;
    committed: boolean;
    /** The minute the ghost was last handed, so a frame on the same step sends nothing. */
    ghostMinute: number | null;
  } | null>(null);

  /**
   * How to tear down whichever gesture is running, from outside it. {@link capturePointer} may put
   * the listeners on the `document`, which outlives the grid, so an unmount mid-drag must end
   * the gesture. One slot holding an abort, not a detach: a second pointer can start the other
   * gesture, and a merely unsubscribed move-drag leaves `dragState` set for the rAF loop.
   */
  const liveGesture = useRef<(() => void) | null>(null);
  useEffect(() => () => liveGesture.current?.(), []);

  /**
   * The minute under a pointer, for a drop rather than a drag: no grab offset, since the cursor is
   * where a dropped ride goes.
   */
  const minuteAtClientY = useCallback(
    (clientY: number, floorMin?: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return grid.openMin;
      const raw = minuteAt(grid, clientY - canvas.getBoundingClientRect().top);
      return clampStart(
        grid,
        snapTo(raw, DRAG_SNAP_MIN),
        Math.max(dayStartMin(grid), floorMin ?? grid.openMin)
      );
    },
    [grid]
  );

  /**
   * The floor under a ride being dragged in from the list, looked up by slug, so a ride whose curve
   * starts at 11:00 cannot be dropped at 09:00.
   */
  const floorForSlug = useCallback(
    (slug: string) =>
      rideFloor(
        grid,
        day?.rides.find((r) => r.attractionSlug === slug)
      ).softMin,
    [grid, day]
  );

  /**
   * The same floor for `dragover`, where the payload is hidden until the drop, so the preview line
   * promises what the drop will do. The slug comes from `activeRideDrag`; one from another park, or
   * a drag from another tab, falls back to the park's opening.
   */
  const draggedRideFloor = useCallback(() => {
    const dragged = activeRideDrag();
    if (!dragged || !parkSlug || dragged.parkSlug !== parkSlug) return undefined;
    return floorForSlug(dragged.attractionSlug);
  }, [floorForSlug, parkSlug]);

  /**
   * The minute under the pointer, snapped or not: the block follows the pointer freely, because a
   * block jumping between steps feels stuck, and the ghost sits on the step it will commit to.
   */
  const minuteUnderPointer = useCallback(
    (snap: boolean) => {
      const state = dragState.current;
      const canvas = canvasRef.current;
      if (!state || !canvas) return 0;
      // Re-read the rect every frame: it folds in the container's own scroll.
      const top = canvas.getBoundingClientRect().top;
      const raw = minuteAt(grid, state.lastClientY - top - state.grabOffsetPx);
      if (!snap) return clampStart(grid, Math.round(raw), state.floorMin);
      return clampStart(grid, snapTo(raw, DRAG_SNAP_MIN), state.floorMin);
    },
    [grid]
  );

  /** What a release commits to — always the snapped one. */
  const targetMinute = useCallback(() => minuteUnderPointer(true), [minuteUnderPointer]);

  const endDrag = useCallback(
    (commit: boolean) => {
      const state = dragState.current;
      if (!state) return;
      if (state.frame !== null) cancelAnimationFrame(state.frame);
      state.element.style.removeProperty('--pl-drag-dy');

      const minute = targetMinute();
      dragState.current = null;
      setDraggingId(null);
      ghostRef.current?.show(null);
      reportDragMoved(false);

      // A gesture the browser steals (`pointercancel`) must not write.
      if (commit && minute !== state.startMinute) onMove(state.entryId, minute);
    },
    [onMove, reportDragMoved, targetMinute]
  );

  /**
   * A ride dragged in from the page behind the panel. The planner's own payload
   * ({@link PLANNER_RIDE_MIME}) carries the name, so a drop needs nothing from `/plan/day`; a bare
   * `text/uri-list` is still accepted, with the name from `/plan/day`. A ride from another park is
   * refused: the forecast is per park.
   */
  const rideFromTransfer = useCallback(
    (transfer: DataTransfer): { slug: string; name: string } | null => {
      const dragged = parseRideDrag(transfer.getData(PLANNER_RIDE_MIME));
      if (dragged) {
        if (dragged.parkSlug !== parkSlug) return null;
        return { slug: dragged.attractionSlug, name: dragged.attractionName };
      }

      const fromUrl = rideFromUrl(transfer.getData('text/uri-list'));
      if (!fromUrl || fromUrl.parkSlug !== parkSlug) return null;
      const ride = ridesBySlug.get(fromUrl.attractionSlug);
      return ride ? { slug: fromUrl.attractionSlug, name: ride.attractionName } : null;
    },
    [parkSlug, ridesBySlug]
  );

  /**
   * Dragging a free block's bottom edge. Simpler than the move drag: it only changes a height and
   * commits straight to the store, which returns the same state for a no-op step, so a wobble
   * costs no write.
   */
  const handleResizeStart = useCallback(
    (entry: PlannerEntry) => (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0 || !entry.custom || entry.showSlug || !onResize) return;
      event.preventDefault();
      event.stopPropagation();

      // First: a displaced gesture has to end while the state it reads is still its own.
      liveGesture.current?.();

      const handle = event.currentTarget;
      // Where this gesture's events arrive; see {@link capturePointer}.
      const bus = capturePointer(handle, event.pointerId);
      const pointerId = event.pointerId;
      const startY = event.clientY;
      const startMinutes = entry.custom.durationMinutes;
      onSelect(entry.id);

      const onPointerMove = (moveEvent: PointerEvent) => {
        // Only this gesture's own pointer: on the document fallback every pointer arrives here.
        if (!isSamePointer(moveEvent, pointerId)) return;
        const deltaMinutes = (moveEvent.clientY - startY) / grid.pxPerMin;
        const next = Math.round((startMinutes + deltaMinutes) / RESIZE_STEP_MIN) * RESIZE_STEP_MIN;
        onResize(entry.id, next);
      };
      const onEnd = (endEvent: PointerEvent) => {
        if (!isSamePointer(endEvent, pointerId)) return;
        detach();
      };
      const detach = () => {
        bus.removeEventListener('pointermove', onPointerMove as EventListener);
        bus.removeEventListener('pointerup', onEnd as EventListener);
        bus.removeEventListener('pointercancel', onEnd as EventListener);
        releasePointer(handle, pointerId);
        if (liveGesture.current === detach) liveGesture.current = null;
      };
      // Held so an unmount mid-gesture can tear it down.
      liveGesture.current = detach;
      bus.addEventListener('pointermove', onPointerMove as EventListener);
      bus.addEventListener('pointerup', onEnd as EventListener);
      bus.addEventListener('pointercancel', onEnd as EventListener);
    },
    [grid.pxPerMin, onResize, onSelect]
  );

  const handleDragStart = useCallback(
    (entry: PlannerEntry, floorMin: number) => (event: React.PointerEvent<HTMLElement>) => {
      // A show is bound to its performance: the grip selects it, a press never drags it.
      if (event.button !== 0 || entry.showSlug) return;
      event.preventDefault();

      const block = event.currentTarget.closest('[data-planner-block]') as HTMLElement | null;
      if (!block) return;

      // First, before this gesture writes anything: an abort run after the assignment below would
      // null out the drag that just replaced it.
      liveGesture.current?.();

      const handle = event.currentTarget;
      // Where this gesture's events arrive; see {@link capturePointer}.
      const bus = capturePointer(handle, event.pointerId);
      const pointerId = event.pointerId;
      // `preventDefault` above eats the focus a mouse drag would take, so focus it for the
      // keyboard.
      handle.focus({ preventScroll: true });

      dragState.current = {
        entryId: entry.id,
        grabOffsetPx: event.clientY - block.getBoundingClientRect().top,
        startMinute: entry.startMinute,
        lastClientY: event.clientY,
        floorMin,
        element: block,
        frame: null,
        committed: false,
        ghostMinute: null,
      };
      setDraggingId(entry.id);
      onSelect(entry.id);

      const onPointerMove = (moveEvent: PointerEvent) => {
        // Only this gesture's own pointer, or a second finger would drive the drag and commit it.
        if (!isSamePointer(moveEvent, pointerId)) return;
        if (dragState.current) dragState.current.lastClientY = moveEvent.clientY;
      };
      const onUp = (upEvent: PointerEvent) => {
        if (!isSamePointer(upEvent, pointerId)) return;
        detach();
        endDrag(true);
      };
      const onCancel = (cancelEvent: PointerEvent) => {
        if (!isSamePointer(cancelEvent, pointerId)) return;
        detach();
        endDrag(false);
      };
      const detach = () => {
        bus.removeEventListener('pointermove', onPointerMove as EventListener);
        bus.removeEventListener('pointerup', onUp as EventListener);
        bus.removeEventListener('pointercancel', onCancel as EventListener);
        releasePointer(handle, pointerId);
        if (liveGesture.current === abort) liveGesture.current = null;
      };
      // An interruption from outside ends the drag, not just the listeners: `dragState` would stay
      // set and the rAF loop would keep following. `false`, so it writes no minute.
      const abort = () => {
        detach();
        endDrag(false);
      };

      liveGesture.current = abort;
      bus.addEventListener('pointermove', onPointerMove as EventListener);
      bus.addEventListener('pointerup', onUp as EventListener);
      bus.addEventListener('pointercancel', onCancel as EventListener);

      // A rAF loop in the gesture, not an event-driven one: `pointermove` does not fire while a
      // finger is held still, and the auto-scroll has to keep moving.
      const frame = () => {
        const state = dragState.current;
        if (!state) return;

        const scroller = scrollerRef.current;
        if (scroller && scroller.scrollHeight > scroller.clientHeight) {
          // The scroller's rect, not the viewport's: on a phone the page shows below the sheet.
          const box = scroller.getBoundingClientRect();
          // The edge is a fraction of the box, capped at {@link EDGE_PX}, so a short scroller keeps
          // half its height neutral instead of auto-scrolling from almost anywhere.
          const edge = Math.min(EDGE_PX, box.height / 4);
          const depthTop = box.top + edge - state.lastClientY;
          const depthBottom = state.lastClientY - (box.bottom - edge);
          if (depthTop > 0) {
            scroller.scrollTop -= MAX_SCROLL_SPEED * Math.min(1, depthTop / edge);
          } else if (depthBottom > 0) {
            scroller.scrollTop += MAX_SCROLL_SPEED * Math.min(1, depthBottom / edge);
          }
        }

        const minute = targetMinute();

        // A custom property, never `top`, which would lay out every block per frame. The unsnapped
        // minute, so the block stays under the finger.
        state.element.style.setProperty(
          '--pl-drag-dy',
          `${heightFor(grid, minuteUnderPointer(false) - state.startMinute)}px`
        );

        // The ghost follows the snapped minute, and only when it changes, so it renders a few
        // times per gesture (see `DragGhost`).
        if (state.ghostMinute !== minute) {
          state.ghostMinute = minute;
          ghostRef.current?.show(minute);
        }
        // In the same frame, so the grid's and the column's updates join the ghost's.
        const start = draggedStartRef.current;
        reportDragMoved(start !== null && minute !== start);

        state.frame = requestAnimationFrame(frame);
      };

      dragState.current.frame = requestAnimationFrame(frame);
    },
    [endDrag, grid, minuteUnderPointer, onSelect, reportDragMoved, scrollerRef, targetMinute]
  );

  /**
   * Cancel a drag the page is about to lose, and only then. `endDrag` is read through a ref so this
   * effect depends on nothing: its identity changes with the parent's re-render that the gesture
   * itself causes, and the cleanup would cancel every drag a frame after it began.
   */
  const endDragRef = useRef(endDrag);
  useEffect(() => {
    endDragRef.current = endDrag;
  });

  useEffect(() => {
    const stop = () => endDragRef.current(false);
    document.addEventListener('visibilitychange', stop);
    return () => {
      document.removeEventListener('visibilitychange', stop);
      endDragRef.current(false);
    };
  }, []);

  /**
   * The `step` of each block's range input, the arrow-key step: the quarter hour on a fine pointer,
   * half an hour on a coarse one. Not {@link DRAG_SNAP_MIN}: five minutes is good for a hand and
   * bad for a key pressed once per step across a day.
   */
  const keyboardStep =
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
      ? SNAP_MIN_COARSE
      : SNAP_MIN_FINE;

  const hours: number[] = [];
  for (let h = Math.ceil(dayStartMin(grid) / 60); h * 60 <= grid.closeMin; h++) hours.push(h);

  // Which shows each drawn line stands for, by name, including the ones `showLinePositions` folded
  // into it (`collapsedWith`), so a folded show does not vanish.
  const showRows = useMemo(() => {
    if (showLines === null) return null;
    const byMinute = new Map<number, PlannerShowLine[]>();
    for (const line of showLines) {
      const at = byMinute.get(line.minute) ?? [];
      at.push(line);
      byMinute.set(line.minute, at);
    }
    // What the pills may not lie on: every block over its span or drawn box, whichever reaches
    // further, and every transfer chip.
    const obstacles: ShowLineObstacle[] = [
      ...layout.rows.map((row) => ({
        kind: 'block' as const,
        topPx: yFor(grid, row.entry.startMinute),
        bottomPx: Math.max(
          yFor(grid, row.entry.startMinute + row.spanMinutes),
          yFor(grid, row.entry.startMinute) + drawnBoxPx(grid, row.wait)
        ),
        columns: layout.lanes.get(row.entry.id)?.columns ?? 1,
      })),
      ...layout.legs.map((l) => {
        const top = yFor(grid, l.fromMinute);
        const { topPx, compact } = legChipPlacement(
          Math.max(0, yFor(grid, l.toEntry.startMinute) - top),
          yFor(grid, l.fromEntry.startMinute) + drawnBoxPx(grid, l.fromWait) - top,
          l.leg.verdict === 'broken'
        );
        return {
          kind: 'chip' as const,
          topPx: top + topPx,
          bottomPx: top + topPx + (compact ? LEG_CHIP_COMPACT_PX : LEG_CHIP_PX),
        };
      }),
    ];
    // The blocks a line may be written into, over their drawn box.
    const hosts: ShowLineHostCandidate[] = layout.rows.map((row) => {
      const top = yFor(grid, row.entry.startMinute);
      const box = drawnBoxPx(grid, row.wait);
      return {
        id: row.entry.id,
        topPx: top,
        bottomPx: top + box,
        column: layout.lanes.get(row.entry.id)?.column ?? 0,
      };
    });
    return showLinePositions(
      grid,
      showLines.map((line) => line.minute)
    )
      .filter((line) => line.minute >= grid.gridStartMin && line.minute <= grid.gridEndMin)
      .map((line) => {
        const minutes = [line.minute, ...line.collapsedWith];
        const shows = minutes.flatMap((m) => byMinute.get(m) ?? []);
        const names = [...new Set(shows.map((show) => show.name))];
        const cover = showLineCover(line.y, obstacles);
        const host = showLineHost(line.y, hosts);
        return { ...line, minutes, names, source: lineSource(shows), cover, host };
      });
  }, [showLines, grid, layout]);
  // The shows each block writes on its own second line, by entry.
  const showsByEntry = useMemo(() => {
    const byEntry = new Map<string, PlannerBlockShow[]>();
    for (const line of showRows ?? []) {
      if (line.host === null) continue;
      const list = byEntry.get(line.host) ?? [];
      list.push({ minute: line.minute, names: line.names, source: line.source });
      byEntry.set(line.host, list);
    }
    return byEntry;
  }, [showRows]);
  // The empty day's card, measured because its height follows its sentence; a pill under it is not
  // drawn, so no half pill peeks over it.
  const [emptyCard, setEmptyCard] = useState<{ top: number; bottom: number } | null>(null);
  const measureEmptyCard = useCallback((card: HTMLDivElement | null) => {
    if (!card) return;
    const read = () => {
      const top = card.offsetTop;
      const bottom = top + card.offsetHeight;
      setEmptyCard((current) =>
        current?.top === top && current.bottom === bottom ? current : { top, bottom }
      );
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(card);
    if (card.parentElement) observer.observe(card.parentElement);
    return () => {
      observer.disconnect();
      setEmptyCard(null);
    };
  }, []);
  const underEmptyCard = (y: number) =>
    emptyCard !== null &&
    y > emptyCard.top - SHOW_PILL_HALF_PX &&
    y < emptyCard.bottom + SHOW_PILL_HALF_PX;

  // Every show mark fades with the switch. `visibility` flips at the end of the fade out, so a
  // hidden line takes no press.
  const showFade = cn(
    'transition-[opacity,visibility] duration-200',
    showsHidden && 'invisible opacity-0'
  );

  return (
    <div ref={gridRef} className="group/grid relative flex" data-planner-grid="">
      {/* The gutter, its own column, so a show pill and an hour label cannot collide. */}
      <div className="relative w-11 shrink-0 max-sm:w-10" style={{ height: grid.heightPx }}>
        {/* First in the DOM: the opaque show chips and now pill paint over a weather label, since
            a showtime is an appointment and the weather a condition. */}
        <PlannerWeatherRail segments={weatherSegments} />
        {hours.map((hour) => (
          <span
            key={hour}
            className="text-muted-foreground absolute right-1 -translate-y-1/2 text-[11px] tabular-nums"
            style={{ top: yFor(grid, hour * 60) }}
          >
            {formatGridTime(hour * 60)}
          </span>
        ))}
        {/* The showtime. A projection gets a `~` and is set back, because the API answers
            `scheduled` only for today and past days. */}
        {showRows?.map((line) => (
          <span
            key={`show-time-${line.minute}`}
            data-planner-show-time={line.source}
            className={cn(
              'bg-background absolute right-1 -translate-y-1/2 rounded px-0.5 text-[10px] tabular-nums',
              line.source === 'projected' ? 'text-foreground/50' : 'text-foreground/70',
              showFade
            )}
            style={{ top: line.y }}
          >
            {line.source === 'projected' ? '~' : ''}
            {formatGridTime(line.minute)}
          </span>
        ))}

        {nowMinute !== null && nowMinute >= grid.gridStartMin && nowMinute <= grid.gridEndMin && (
          <span
            className="bg-destructive text-destructive-foreground absolute right-1 -translate-y-1/2 rounded-full px-1 text-[10px] tabular-nums"
            style={{ top: yFor(grid, nowMinute) }}
          >
            {formatGridTime(nowMinute)}
          </span>
        )}
      </div>

      <div
        ref={canvasRef}
        className="relative min-w-0 flex-1 pr-2"
        style={{ height: grid.heightPx }}
        onDragOver={(event) => {
          if (!onDropRide) return;
          // The type list, never the values: Chrome hides the payload until the drop. Our payload
          // is accepted outright, a bare link optimistically, anything else left alone.
          const types = event.dataTransfer.types;
          if (!types.includes(PLANNER_RIDE_MIME) && !types.includes('text/uri-list')) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
          // The ride's own floor, the same number the drop clamps to. See `draggedRideFloor`.
          dropLineRef.current?.show(minuteAtClientY(event.clientY, draggedRideFloor()));
        }}
        onDragLeave={() => dropLineRef.current?.show(null)}
        onDrop={(event) => {
          // First, before any refusal: `dragover` already claimed the drop, and returning without
          // preventing the default lets the browser follow a dropped link away from the app.
          event.preventDefault();
          dropLineRef.current?.show(null);
          if (!onDropRide) return;
          const ride = rideFromTransfer(event.dataTransfer);
          if (!ride) return;
          onDropRide(ride.slug, ride.name, minuteAtClientY(event.clientY, floorForSlug(ride.slug)));
        }}
      >
        {/* Where it would land: the same minute the drag commits to. */}
        <DropLine ref={dropLineRef} grid={grid} />

        <PlannerGridGround grid={grid} dense={dense} loading={loading} />

        {/* "Closes approximately" is a sentence, so it is a caption on the canvas rather than in
            the gutter, where it was cut off. The `~` says the hour above `closeMin` may or may not
            still be open. */}
        {grid.closeIsTruncated && (
          <span
            className="text-muted-foreground/70 pointer-events-none absolute left-0 z-10 translate-y-1 text-[10px] whitespace-nowrap"
            style={{ top: yFor(grid, grid.closeMin) }}
          >
            {t('grid.closesApprox', { time: formatGridTime(grid.closeMin) })}
          </span>
        )}

        {/* Shows as lines under the blocks (`z-10` against `10 + column`), so a line never buries a
            name; the time goes in the gutter. */}
        {showRows?.map((line) => (
          <div key={`show-${line.minute}`}>
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 z-10 border-t',
                line.source === 'projected'
                  ? 'border-foreground/20 border-dotted'
                  : 'border-foreground/30 border-dashed',
                showFade
              )}
              style={{ top: line.y }}
              aria-hidden="true"
            />
            {/* The name, on the line where the axis is free. Where the line falls into a block the
                block writes the show itself (`showLineHost`) and nothing is drawn here. Between two
                blocks the names sit at the right end, clear of the transfer chip (240 px is the
                widest chip plus its inset); a line grazing a block gets the mask alone
                (`showLineCover`). */}
            {line.host === null && (
              <div
                data-planner-show=""
                data-planner-show-source={line.source}
                data-planner-show-covered={line.cover.kind === 'free' ? undefined : line.cover.kind}
                className={cn(
                  'glass-light pointer-events-none absolute z-20 flex max-w-[80%] -translate-y-1/2 items-center gap-1 rounded-full text-[10px] shadow-sm',
                  line.cover.kind === 'chip'
                    ? 'right-2 px-1.5 py-px'
                    : line.cover.kind === 'free'
                      ? 'left-1/2 -translate-x-1/2 px-1.5 py-px'
                      : 'left-1/2 -translate-x-1/2 p-1',
                  line.source === 'projected' ? 'text-muted-foreground italic' : 'text-foreground',
                  showFade,
                  underEmptyCard(line.y) && 'invisible',
                  // A pointer on a block means somebody is reading or moving it, so show marks step
                  // back. Fine pointers only: a tap leaves `:hover` stuck on a touch screen.
                  'pointer-fine:group-data-[block-hover]/grid:opacity-20'
                )}
                style={{
                  top: line.y,
                  ...(line.cover.kind === 'block'
                    ? { left: `${(line.cover.chip ? 75 : 50) / line.cover.columns}%` }
                    : line.cover.kind === 'chip'
                      ? { maxWidth: 'max(20px, calc(100% - 240px))' }
                      : null),
                }}
              >
                <Theater className="size-2.5 shrink-0" aria-hidden="true" />
                <span
                  className={line.cover.kind === 'block' ? 'sr-only' : 'min-w-0 truncate pr-0.5'}
                >
                  {line.names.join(' · ')}
                </span>
                {line.minutes.length > 1 && line.cover.kind !== 'block' && (
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    +{line.minutes.length - 1}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {/* The now line, and the reason the panel says its clock is the park's. */}
        {nowMinute !== null && nowMinute >= grid.gridStartMin && nowMinute <= grid.gridEndMin && (
          <div
            className="bg-destructive/70 pointer-events-none absolute inset-x-0 z-[15] h-px"
            style={{ top: yFor(grid, nowMinute) }}
            aria-hidden="true"
          />
        )}

        {entries.length === 0 ? (
          /* A card over the axis rather than a caption, `z-30` with its own ground, so the show
             pills do not run through the one sentence that says how to start. */
          <div
            ref={measureEmptyCard}
            className="text-muted-foreground border-border/60 bg-background/90 absolute inset-x-4 top-1/3 z-30 mx-auto max-w-sm rounded-lg border px-4 py-3 text-center text-xs shadow-sm backdrop-blur-sm transition-opacity duration-300 starting:opacity-0"
          >
            {/* The gesture itself on the desktop: a hand carrying a card onto the axis. */}
            <PlannerDragDemo className="planner-wide:block mx-auto mb-1.5 hidden" />
            <p className="text-foreground text-sm font-medium">{t('empty.title')}</p>
            {/* One sentence per pointer, chosen by CSS: `useMediaQuery`'s server snapshot would
                ship the phone's line to every desktop. The ride search is `planner-wide:hidden`, so
                "such dir unten eine Bahn" is only true where it is drawn; both halves ask the same
                question. */}
            <p className="planner-wide:hidden mt-1">{t('empty.bodyGrid')}</p>
            <p className="planner-wide:block mt-1 hidden">{t('coach.drag')}</p>
            {/* The way out of an empty day for a reader standing in another park (see
                `PlannerPlanParkCta`). `pointer-events-auto`, since the overlay is inside the drop
                canvas. */}
            {emptyAction && (
              <div className="pointer-events-auto mx-auto max-w-56">{emptyAction}</div>
            )}
          </div>
        ) : (
          <ol className="absolute inset-0">
            {/* The uncertainty bands, under everything else: a band is a maybe, so it never makes a
                block or a leg chip harder to read. Its own layer, because a block's `z-index` makes
                it a stacking context. A tail from the end of the queue to the end of the spread,
                fading out, since a spread's last minute is its least likely one. */}
            {layout.rows.map((row) => {
              // A block under the finger moves by a transform its band does not follow; the ghost
              // says where it lands.
              if (draggingId === row.entry.id) return null;
              const band = bandGeometry(grid, row.entry, row.estimate, { live: row.live });
              if (!band) return null;
              const tone =
                isAssumedWait(row.estimate) || row.wait === null
                  ? null
                  : waitTimeCrowdTier(row.wait);
              if (!tone) return null;
              const lane = layout.lanes.get(row.entry.id) ?? NO_LANE;
              return (
                <li
                  key={`band-${row.entry.id}`}
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute rounded-b-md opacity-25',
                    CROWD_DOT_CLASS[tone]
                  )}
                  style={{
                    top: band.top,
                    height: band.height,
                    ...laneBox(lane),
                    zIndex: 4,
                    maskImage: BAND_FADE,
                    WebkitMaskImage: BAND_FADE,
                  }}
                />
              );
            })}
            {layout.legs.map((entry) => (
              <PlannerLeg
                key={entry.id}
                leg={entry.leg}
                grid={grid}
                fromMinute={entry.fromMinute}
                toMinute={entry.toEntry.startMinute}
                fromBottomPx={
                  yFor(grid, entry.fromEntry.startMinute) + drawnBoxPx(grid, entry.fromWait)
                }
                lane={entry.lane}
                dimmed={dragMoved}
                onRepair={() =>
                  onMove(
                    entry.toEntry.id,
                    earliestGoodStart(
                      {
                        startMinute: entry.fromEntry.startMinute,
                        wait:
                          layout.rows.find((r) => r.entry.id === entry.fromEntry.id)?.wait ?? null,
                        ride: null,
                      },
                      entry.leg
                    )
                  )
                }
                onRepairCascade={() =>
                  onShiftFrom(
                    entry.toEntry.id,
                    Math.max(0, entry.leg.floorMinutes - entry.leg.gapMinutes)
                  )
                }
              />
            ))}

            {/* The ghost: a real block at the minute the drag would commit to, with the wait
                recomputed for that minute, so its height answers "and then it is this tall". It
                renders on the snapped minute only, in front, inert, while every real block steps
                back (`dimmed`). */}
            <DragGhost
              ref={ghostRef}
              row={ghostRow}
              lane={ghostRow ? layout.lanes.get(ghostRow.entry.id) : undefined}
              day={day}
              grid={grid}
              tier={tier}
              showBandFigure={showBandFigure}
              prefs={prefs}
              keyboardStep={keyboardStep}
            />

            {layout.rows.map((row, index) => {
              const floor = rideFloor(grid, row.ride);
              const previous = index > 0 ? layout.legs[index - 1] : null;
              return (
                <PlannerBlock
                  key={row.entry.id}
                  entry={row.entry}
                  estimate={row.estimate}
                  grid={grid}
                  /* This hour's regime; see `PlannerEstimate.tier`. */
                  tier={row.estimate.tier ?? tier}
                  lane={layout.lanes.get(row.entry.id) ?? NO_LANE}
                  land={row.ride?.land}
                  metresFromPrevious={previous?.leg.metres ?? null}
                  shows={showsByEntry.get(row.entry.id)}
                  showsHidden={showsHidden}
                  showBandFigure={showBandFigure}
                  live={row.live}
                  photo={
                    row.ride?.backgroundImage
                      ? {
                          src: row.ride.backgroundImage,
                          position: row.ride.backgroundPosition ?? '50% 0%',
                        }
                      : null
                  }
                  closedNow={
                    row.closedRelevant && row.entry.attractionSlug
                      ? (closedNow?.has(row.entry.attractionSlug) ?? false)
                      : false
                  }
                  downYesterday={row.ride?.downYesterday === true}
                  /* `{}` for a free block or a ride the payload lacks: `partyFlags` answers
                     `NONE`. */
                  wet={partyFlags(row.ride ?? {}, prefs).wet}
                  selected={selectedId === row.entry.id}
                  dragging={draggingId === row.entry.id}
                  dimmed={dragMoved}
                  conflict={layout.broken.has(row.entry.id)}
                  onSelect={() => onSelect(row.entry.id)}
                  onRemove={onRemove ? () => onRemove(row.entry.id) : undefined}
                  onDragStart={handleDragStart(row.entry, floor.hardMin)}
                  onResizeStart={
                    row.entry.custom && !row.entry.showSlug
                      ? handleResizeStart(row.entry)
                      : undefined
                  }
                  onMove={(minute) => onMove(row.entry.id, minute)}
                  minMinute={floor.hardMin}
                  maxMinute={latestStart(grid)}
                  keyboardStep={keyboardStep}
                />
              );
            })}
          </ol>
        )}

        {/* The not-yet-open region of the dragged ride, in its own lane only. Hard region: the
            drag cannot enter it. */}
        {draggingId !== null &&
          (() => {
            const row = layout.rows.find((r) => r.entry.id === draggingId);
            if (!row) return null;
            const floor = rideFloor(grid, row.ride);
            const lane = layout.lanes.get(row.entry.id) ?? NO_LANE;
            const { left: laneLeft, width: laneWidth } = laneBox(lane);
            return (
              <>
                <div
                  className="border-primary/70 pointer-events-none absolute top-0 z-[25] border-b"
                  style={{
                    height: yFor(grid, floor.hardMin),
                    left: laneLeft,
                    width: laneWidth,
                    backgroundColor: 'color-mix(in oklch, var(--background) 70%, transparent)',
                    backgroundImage:
                      'repeating-linear-gradient(135deg, color-mix(in oklch, var(--muted-foreground) 22%, transparent) 0 2px, transparent 2px 7px)',
                  }}
                  aria-hidden="true"
                />
                {/* Soft region: measurement, not opening. It never blocks; a block dropped in it
                    loses its figure. */}
                {floor.softMin > floor.hardMin && (
                  <div
                    className="pointer-events-none absolute z-[24] opacity-20"
                    style={{
                      top: yFor(grid, floor.hardMin),
                      height: heightFor(grid, floor.softMin - floor.hardMin),
                      left: laneLeft,
                      width: laneWidth,
                      backgroundImage:
                        'repeating-linear-gradient(135deg, color-mix(in oklch, var(--muted-foreground) 22%, transparent) 0 2px, transparent 2px 7px)',
                    }}
                    aria-hidden="true"
                  />
                )}
              </>
            );
          })()}
      </div>
    </div>
  );
}

/**
 * A minute that a child draws and the grid's handlers set, so a five-minute step re-renders only
 * the component that draws it. A `setState`, not a store, so it batches with the grid's and the
 * column's updates.
 */
interface MinuteHandle {
  show: (minute: number | null) => void;
}

/** What the ghost reads off the row it stands in for. */
interface GhostRow {
  entry: PlannerEntry;
  ride?: PlanDayRide;
  live: boolean;
}

/**
 * The ghost of a dragged block, at the minute the drag would commit to.
 *
 * The minute is this component's state (see {@link MinuteHandle}); everything
 * else comes from the grid as props.
 */
function DragGhost({
  ref,
  row,
  lane,
  day,
  grid,
  tier,
  showBandFigure,
  prefs,
  keyboardStep,
}: {
  ref: React.Ref<MinuteHandle>;
  row: GhostRow | null;
  lane: LanePlacement | undefined;
  day: PlanDay | null;
  grid: DayGrid;
  /** The day's tier, for an hour whose estimate carries none of its own. */
  tier: PlanDayTier;
  showBandFigure: boolean;
  prefs?: PlannerDayPrefs;
  keyboardStep: number;
}) {
  /**
   * The minute the dragged block would land on, as React state: it changes once per step, so the
   * ghost can be a real block with its own height, while the 60 Hz movement stays out of React.
   */
  const [minute, setMinute] = useState<number | null>(null);
  useImperativeHandle(ref, () => ({ show: setMinute }), []);

  /**
   * What the ghost would cost where it hovers, computed once for both its figure and its edge.
   */
  const estimate = useMemo(
    () => (row && minute !== null ? estimateFor(day, { ...row.entry, startMinute: minute }) : null),
    [day, row, minute]
  );

  if (!row || minute === null || !estimate) return null;

  return (
    <PlannerBlock
      ghost
      entry={{ ...row.entry, startMinute: minute }}
      estimate={estimate}
      grid={grid}
      /* The hour the ghost would land in, so the edge changes under the pointer. */
      tier={estimate.tier ?? tier}
      lane={lane ?? NO_LANE}
      land={row.ride?.land}
      metresFromPrevious={null}
      showBandFigure={showBandFigure}
      live={row.live}
      photo={
        row.ride?.backgroundImage
          ? {
              src: row.ride.backgroundImage,
              position: row.ride.backgroundPosition ?? '50% 0%',
            }
          : null
      }
      closedNow={false}
      downYesterday={false}
      /* The same ride carries the same mark at any hour. */
      wet={partyFlags(row.ride ?? {}, prefs).wet}
      selected={false}
      dragging={false}
      conflict={false}
      onSelect={() => {}}
      onDragStart={() => {}}
      onMove={() => {}}
      minMinute={grid.openMin}
      maxMinute={latestStart(grid)}
      keyboardStep={keyboardStep}
    />
  );
}

/**
 * The line a ride dragged in from the page would land on.
 *
 * Set on every `dragover`, which keeps firing for as long as the pointer is over
 * the canvas; see {@link MinuteHandle} for why the minute is kept here.
 */
function DropLine({ ref, grid }: { ref: React.Ref<MinuteHandle>; grid: DayGrid }) {
  const [minute, setMinute] = useState<number | null>(null);
  useImperativeHandle(ref, () => ({ show: setMinute }), []);

  if (minute === null) return null;

  return (
    <div
      className="bg-primary pointer-events-none absolute inset-x-0 z-30 h-0.5 transition-[top,opacity] duration-150 ease-out starting:opacity-0"
      style={{ top: yFor(grid, minute) }}
      aria-hidden="true"
    />
  );
}
