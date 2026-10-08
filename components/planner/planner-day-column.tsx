'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarPlus } from 'lucide-react';
import { PlannerColumnHead } from './planner-column-head';
import { PlannerContextBand, type PlannerDayState } from './planner-context-band';
import { PlannerPartyChips } from './planner-party-chips';
import { PlannerShowBand } from './planner-show-band';
import { PlannerDayGrid } from './planner-day-grid';
import { PlannerGridActions } from './planner-grid-actions';
import { PlannerTimeline } from './planner-timeline';
import { PlannerHelpSteps } from './planner-help';
import { PlannerPlanParkCta } from './planner-plan-park-cta';
import { PlannerDayFoot } from './planner-day-foot';
import { PlannerRideSearch } from './planner-ride-search';
import { PlannerDayShowPicker } from './planner-show-picker';
import { usePlanner } from '@/lib/planner/use-planner';
import { entriesFor, isPlannedDay, type PlannerEntry } from '@/lib/planner/types';
import { usePlanDay } from '@/lib/hooks/use-plan-day';
import { usePlannerDayFacts } from '@/lib/planner/use-day-facts';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import {
  buildDayGrid,
  clampStart,
  earlyEntryOpenMin,
  growGridForSpans,
  nextFreeStart,
  nowFloor,
  rideFloor,
  withEarlyEntry,
} from '@/lib/planner/day-grid';
import { unavailableNote } from '@/lib/planner/unavailable';
import { usePlannerPxPerMin } from '@/lib/planner/use-grid-scale';
import { spansFor } from '@/lib/planner/estimate';
import { closedNowFor, liveWaitsFor } from '@/lib/planner/live';
import { dayClock, parkToday, resolveTimeZone } from '@/lib/planner/park-time';
import { showDayHours, showLinesFor } from '@/lib/planner/shows';
import { plannerShowsVisible } from '@/lib/planner/shows-visible';
import { PLANNER_RIDE_MIME, parseRideDrag } from '@/lib/planner/ride-drag';
import { cn } from '@/lib/utils';

/**
 * What a press has to land outside for it to count as "show me this park": controls, form fields
 * and anything draggable, including a block's body, which selects it.
 */
const SELF_ACTING =
  'button, a, input, textarea, select, [role="button"], [role="slider"], [draggable="true"], [data-planner-block]';

/** Air between a revealed block and the action bar docked under it. */
const REVEAL_GAP_PX = 8;
/** How far below the scroller's top a revealed block's head must stay: the sticky show strip. */
const REVEAL_TOP_PX = 44;

interface PlannerDayColumnProps {
  parkSlug: string | null;
  date: string | null;
  /**
   * The plan's active column. Exactly one is, and every panel-level control (ride search, headliner
   * band, free-block row, summary) speaks for it.
   */
  primary: boolean;
  /** Whether the panel is open, which is what gates this column's queries. */
  open: boolean;
  onPickPark: (parkSlug: string) => void;
  onPickDate: (date: string) => void;
  onNewPark: () => void;
  /** Absent on the primary column: the plan's active day cannot be closed away. */
  onClose?: () => void;
  /** The park the page behind the panel is about, where it has no day yet. */
  unplannedPagePark?: { slug: string; name: string } | null;
  onStartPagePark?: () => void;
  onOpenWizard?: () => void;
  /**
   * Whether this column draws its own foot. The panel decides, because on a phone the foot does not
   * fit in a column and the panel draws it once. See {@link PlannerDayFoot}.
   */
  withFoot: boolean;
  /**
   * Whether this column draws its own head, the park and the day. On a phone the panel draws the
   * same `PlannerColumnHead` inside its `SheetHeader` instead, moved rather than copied so there is
   * one `[data-planner-column-park]`.
   */
  withHead: boolean;
  /**
   * Whether this column draws its own context band. False only on a landscape phone, where the
   * panel draws the band beside the axis and this row stays an empty element for the subgrid.
   */
  withBand: boolean;
  /**
   * The column the reader is working in, where there is more than one: a fact about the pointer,
   * not {@link primary}, which is a fact about the plan. `false` for a lone column.
   */
  active: boolean;
  /**
   * The reader touched this column. `navigate` says whether the press landed on the column's own
   * ground rather than on something that does its own job.
   */
  onActivate?: (navigate: boolean) => void;
  /**
   * The column's place in the panel's grid. A class from the flyout, because only the parent knows
   * how many columns there are and owns the row template each column takes as a `subgrid`.
   */
  className?: string;
}

/**
 * One day of one park, with everything about that day: head, context band, show strip, axis and
 * the action row a selected block docks into. The foot and the photo behind the panel follow the
 * primary column instead. Every query is keyed by (park, date), so two columns of one park share
 * the park-level ones.
 */
export function PlannerDayColumn({
  parkSlug,
  date,
  primary,
  open,
  onPickPark,
  onPickDate,
  onNewPark,
  onClose,
  unplannedPagePark = null,
  onStartPagePark,
  onOpenWizard,
  withFoot,
  withHead,
  withBand,
  active,
  onActivate,
  className,
}: PlannerDayColumnProps) {
  const t = useTranslations('planner');
  /** The axis' scale; see {@link usePlannerPxPerMin}. */
  const pxPerMin = usePlannerPxPerMin();
  const {
    state,
    addRide,
    addCustom,
    moveRide,
    removeRide,
    shiftFrom,
    editCustom,
    setDone,
    setDayPrefs,
  } = usePlanner();

  const park = parkSlug ? state.parks[parkSlug] : null;
  const entries = useMemo(() => entriesFor(state, parkSlug, date), [state, parkSlug, date]);

  /**
   * Which block is selected, per column: entry ids are unique only within one (park, date), so the
   * same id can exist in two columns.
   */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /**
   * A block is being dragged, so the action bar, a sibling of the grid lying over its lower edge,
   * can stand down.
   */
  const [dragging, setDragging] = useState(false);
  const [flatDropActive, setFlatDropActive] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  /**
   * The action bar's height, and a request to bring the selected block clear of it. While a block
   * is selected the scroller gets the bar's height as bottom padding, and a click scrolls the block
   * up by as much as the bar covers. The scroll follows the click, not the selection, because a
   * drag selects on `pointerdown` and scrolling under a held grip moves the drop target.
   */
  const barBoxRef = useRef<HTMLDivElement>(null);
  const [barHeight, setBarHeight] = useState(0);
  /** The block a click asked to reveal, with a counter so a second tap asks again. */
  const [reveal, setReveal] = useState<{ id: string; tick: number } | null>(null);
  useEffect(() => {
    const bar = selectedId
      ? barBoxRef.current?.querySelector<HTMLElement>('[data-planner-grid-actions]')
      : null;
    if (!bar) return;
    // The observer reports once on `observe`, so no direct read is needed here.
    const observer = new ResizeObserver(() => setBarHeight(bar.offsetHeight));
    observer.observe(bar);
    return () => observer.disconnect();
  }, [selectedId]);
  useEffect(() => {
    // Only the block the click was on: a later drag selects another block on `pointerdown`.
    if (!reveal || reveal.id !== selectedId || dragging || barHeight === 0) return;
    const scroller = scrollerRef.current;
    const block = scroller?.querySelector<HTMLElement>(
      `[data-planner-entry="${CSS.escape(selectedId)}"]`
    );
    if (!scroller || !block) return;
    const box = scroller.getBoundingClientRect();
    const rect = block.getBoundingClientRect();
    const clearBottom = box.bottom - barHeight - REVEAL_GAP_PX;
    if (rect.bottom <= clearBottom) return;
    // As far as the bar covers, but never so far that the block's top goes under the sticky show
    // strip.
    const delta = Math.min(rect.bottom - clearBottom, rect.top - box.top - REVEAL_TOP_PX);
    if (delta <= 0) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollBy({ top: delta, behavior: smooth ? 'smooth' : 'auto' });
  }, [reveal, selectedId, dragging, barHeight]);

  const {
    data: fetchedDay,
    isFetching,
    isError,
  } = usePlanDay({
    continent: park?.geo.continent ?? '',
    country: park?.geo.country ?? '',
    city: park?.geo.city ?? '',
    parkSlug: parkSlug ?? '',
    date: date ?? undefined,
    enabled: open && Boolean(park && date),
  });
  const prefs = date ? park?.days[date]?.prefs : undefined;
  // The early-entry answer folded into the day, memoised because the spans, grid and optimiser key
  // on the folded object.
  const earlyEntry = prefs?.earlyEntry;
  const day = useMemo(() => withEarlyEntry(fetchedDay, earlyEntry), [fetchedDay, earlyEntry]);

  // `isFetching`, not `isPending`: a disabled query is pending for ever.
  const dayState: PlannerDayState = isError
    ? 'error'
    : isFetching && !day
      ? 'loading'
      : day
        ? 'ready'
        : 'empty';

  const unavailable = unavailableNote(day);
  const timezone = resolveTimeZone(day?.timezone ?? park?.timezone);
  const isToday = Boolean(date && date === parkToday(timezone));
  // Where this day stands against the park's clock, for `addFreeBlock`.
  const clock = date ? dayClock(date, timezone) : undefined;

  const spans = useMemo(() => spansFor(day, entries), [entries, day]);

  /**
   * The park's axis, grown until it contains the plan; `openMin`/`closeMin` stay the park's.
   * Memoised so the grid keeps its identity across renders that do not move it, since
   * `PlannerOptimizeActions` keys a search on it.
   */
  const openHour = day?.context.openHour;
  const closeHour = day?.context.closeHour;
  // A number, so the memo keys on a value, not on the context object.
  const earlyOpen = earlyEntryOpenMin(day?.context);
  // Two memos, not one: `spans` changes on every edit, and `growGridForSpans` returns the base grid
  // itself when the plan fits, so the identity moves only with the axis.
  const baseGrid = useMemo(
    () => buildDayGrid(openHour, closeHour, pxPerMin, earlyOpen),
    [openHour, closeHour, pxPerMin, earlyOpen]
  );
  const grid = useMemo(() => growGridForSpans(baseGrid, spans), [baseGrid, spans]);

  const dayFacts = usePlannerDayFacts(park, open);

  // Gated on today: a standby reading describes this minute, and on a park page this is a cache
  // hit.
  const { data: livePark } = useLiveParkData({
    continent: park?.geo.continent ?? '',
    country: park?.geo.country ?? '',
    city: park?.geo.city ?? '',
    parkSlug: parkSlug ?? '',
    enabled: open && isToday && Boolean(park),
  });
  // Memoised on the snapshot: the grid's layout and show memos key on these.
  const liveWaits = useMemo(() => liveWaitsFor(livePark), [livePark]);
  const closedNow = useMemo(() => closedNowFor(livePark), [livePark]);

  const showsVisible = useSyncExternalStore(
    plannerShowsVisible.subscribe,
    plannerShowsVisible.getSnapshot,
    plannerShowsVisible.getServerSnapshot
  );
  const showLines = useMemo(
    () =>
      day
        ? showLinesFor(day.shows, showDayHours(day.context.openHour, day.context.closeHour))
        : null,
    [day]
  );

  const plannedDates = park
    ? Object.values(park.days)
        .filter(isPlannedDay)
        .map((d) => d.date)
    : [];

  /**
   * Delete removes the selected block. Bound to the document, because a pointer selection leaves
   * nothing focused; ignored inside text fields and `contenteditable`. Per column, with the
   * selection it acts on, so at most one listener is bound.
   */
  useEffect(() => {
    if (!selectedId || !parkSlug || !date) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')
      )
        return;
      event.preventDefault();
      removeRide(parkSlug, date, selectedId);
      setSelectedId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedId, parkSlug, date, removeRide]);

  const parks = useMemo(() => Object.values(state.parks), [state.parks]);

  /**
   * Ticking a ride off, from either view. The measured figure is looked up here, because the flat
   * list cannot pass it; un-ticking drops it, since a plan again carries no measurement.
   */
  const toggleDone = (entryId: string, done: boolean) => {
    if (!parkSlug || !date) return;
    const slug = entries.find((entry: PlannerEntry) => entry.id === entryId)?.attractionSlug;
    const actual = done && slug ? liveWaits?.get(slug) : undefined;
    setDone(parkSlug, date, entryId, done, actual ?? undefined);
  };

  /**
   * A block the visitor writes themselves, filed at the first minute this column's blocks leave
   * free, which is why it reads this column's spans and axis.
   */
  const addFreeBlock = () => {
    if (!park || !date) return;
    addCustom({
      parkSlug: park.slug,
      parkName: park.name,
      geo: park.geo,
      timezone: day?.timezone ?? park.timezone,
      date,
      label: t('custom.defaultLabel'),
      icon: 'break',
      // Never before now; `nowFloor` is `openMin` on every other date.
      startMinute: grid ? nextFreeStart(spans, grid, undefined, nowFloor(grid, clock)) : undefined,
    });
  };

  return (
    <div
      data-planner-column={parkSlug && date ? `${parkSlug}:${date}` : ''}
      data-planner-column-primary={primary ? '' : undefined}
      data-planner-column-active={active ? '' : undefined}
      /* Capture and `pointerdown`, since a drag never produces a click. Capturing fires before the
         target, so the press is classified: from anything interactive it only marks the column,
         or "close this column" would navigate first and a drag would start under a route being
         replaced. `focusColumn` returns early when nothing changes. */
      onPointerDownCapture={(event) => {
        const target = event.target as HTMLElement | null;
        onActivate?.(!target?.closest(SELF_ACTING));
      }}
      onFocusCapture={(event) => {
        const target = event.target as HTMLElement | null;
        onActivate?.(!target?.closest(SELF_ACTING));
      }}
      className={cn('relative flex min-w-0 flex-col', className)}
    >
      {/* The marker: a 2 px rule along the top edge rather than a tint, so neither column is dimmed
          for a fact about the pointer. `absolute`, so it takes no subgrid row; only with a second
          column to tell apart. */}
      {active && (
        <div
          className="bg-primary/70 pointer-events-none absolute inset-x-0 -top-px z-20 h-0.5"
          aria-hidden="true"
        />
      )}
      {/* Row 1 of the panel's subgrid, always an element: `grid-rows-subgrid` counts children, and
          a missing row would put the two columns out of step. The head waits for the plan to hold a
          park; `withHead` moves it to the sheet header on a phone. */}
      <div className="min-w-0">
        {withHead && parks.length > 0 && (
          <PlannerColumnHead
            parks={parks}
            parkSlug={parkSlug}
            date={date}
            onPickPark={onPickPark}
            onPickDate={onPickDate}
            onNewPark={onNewPark}
            onClose={onClose}
            plannedDates={plannedDates}
            timezone={timezone}
            facts={dayFacts.byDate}
            maxDate={dayFacts.lastDate ?? undefined}
          />
        )}
      </div>

      {/* Row 2, always an element, and the reason for the subgrid: the band's height is data, and
          bands of different heights put the two axes' hours at different heights. Drawn only where
          a day has been chosen, or a disabled query reads as "keine Prognose". On a landscape phone
          the panel draws it beside the axis instead. */}
      <div className={cn('min-w-0', withBand && park && date && 'border-border/60 border-b')}>
        {withBand && park && date && (
          <PlannerContextBand
            day={day ?? null}
            state={dayState}
            trailing={
              <PlannerPartyChips
                prefs={prefs}
                onChange={(patch) => setDayPrefs(park.slug, date, patch)}
              />
            }
          />
        )}
      </div>

      {/* Row 3: the axis and everything under it, in one row, since the feet differ in height and
          only the axis has to line up. */}
      <div className="flex min-h-0 flex-col overflow-hidden">
        {/* A floor under the grid, so the phone sheet stays a planner rather than a search box.
            200 px is about the same span of day at 1.8 px per minute that 140 px was at 1.2. On
            `max-sm:`, not `planner-phone:`: in a landscape sheet the floor would push the axis out
            of the window, and the landscape row already gives the axis more than 200 px. See
            docs/features/trip-planner.md#a-landscape-phone-is-a-row-because-the-chrome-is-taller-than-the-sheet. */}
        <div ref={barBoxRef} className="relative flex min-h-0 flex-1 flex-col max-sm:min-h-[200px]">
          <div
            ref={scrollerRef}
            className={cn(
              /* `planner-phone:pt-0`: the show band is sticky inside this scroller, so top padding
                 only pushes its switch down. The bottom padding keeps the last block clear of the
                 action bar. */
              'planner-phone:pt-0 relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-1 py-2',
              flatDropActive && 'ring-primary/60 rounded-md ring-2 ring-inset'
            )}
            /* Room under the day for the action bar (see `barHeight`), as padding so the grid's
               geometry, which every drag reads, does not change. */
            style={
              selectedId && barHeight > 0 ? { paddingBottom: barHeight + REVEAL_GAP_PX } : undefined
            }
            /* Runs after the block's own handler has selected it. See `reveal`. */
            onClick={(event) => {
              const id = (event.target as HTMLElement)
                .closest('[data-planner-entry]')
                ?.getAttribute('data-planner-entry');
              if (id) setReveal((last) => ({ id, tick: (last?.tick ?? 0) + 1 }));
            }}
            onDragOver={(event) => {
              if (grid || !park || !date) return;
              if (!event.dataTransfer.types.includes(PLANNER_RIDE_MIME)) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
              setFlatDropActive(true);
            }}
            onDragLeave={() => setFlatDropActive(false)}
            onDrop={(event) => {
              // Prevented first: a park card writes `text/uri-list` beside our payload, and an
              // early return would leave the browser following the link.
              event.preventDefault();
              setFlatDropActive(false);
              if (grid || !park || !date) return;
              const dragged = parseRideDrag(event.dataTransfer.getData(PLANNER_RIDE_MIME));
              if (!dragged || dragged.parkSlug !== park.slug) return;
              addRide({
                parkSlug: park.slug,
                parkName: park.name,
                geo: park.geo,
                timezone: day?.timezone ?? park.timezone,
                date,
                attractionSlug: dragged.attractionSlug,
                attractionName: dragged.attractionName,
              });
            }}
          >
            {grid && (
              <PlannerShowBand
                lines={showLines}
                timezone={timezone}
                isToday={isToday}
                visible={showsVisible}
                onToggle={plannerShowsVisible.toggle}
                className="planner-phone:hidden"
              />
            )}
            {grid ? (
              <PlannerDayGrid
                entries={entries}
                day={day ?? null}
                grid={grid}
                timezone={timezone}
                isToday={isToday}
                liveWaits={liveWaits}
                showLines={showLines}
                showsHidden={!showsVisible}
                closedNow={closedNow}
                prefs={prefs}
                parkSlug={park?.slug}
                onDropRide={(attractionSlug, attractionName, startMinute) => {
                  if (!park || !date) return;
                  addRide({
                    parkSlug: park.slug,
                    parkName: park.name,
                    geo: park.geo,
                    timezone: day?.timezone ?? park.timezone,
                    date,
                    attractionSlug,
                    attractionName,
                    startMinute,
                  });
                }}
                onResize={(entryId, durationMinutes) => {
                  if (parkSlug && date) editCustom(parkSlug, date, entryId, { durationMinutes });
                }}
                loading={dayState === 'loading'}
                emptyAction={
                  unplannedPagePark && onStartPagePark ? (
                    <PlannerPlanParkCta
                      parkName={unplannedPagePark.name}
                      onStart={onStartPagePark}
                      className="mt-3"
                    />
                  ) : null
                }
                selectedId={selectedId}
                scrollerRef={scrollerRef}
                onDragChange={setDragging}
                onSelect={setSelectedId}
                /* The block's own ✕: take the entry out and drop a selection that now points at
                   nothing, as the action bar does. */
                onRemove={(entryId) => {
                  if (parkSlug && date) removeRide(parkSlug, date, entryId);
                  setSelectedId(null);
                }}
                onMove={(entryId, startMinute) =>
                  parkSlug && date && moveRide(parkSlug, date, entryId, startMinute)
                }
                onShiftFrom={(entryId, delta) =>
                  parkSlug && date && shiftFrom(parkSlug, date, entryId, delta)
                }
              />
            ) : entries.length === 0 ? (
              <div className="flex flex-col gap-3 px-4 py-5">
                <div>
                  <p className="text-sm font-medium">{t('empty.title')}</p>
                  {unavailable && (
                    <p
                      className="text-muted-foreground mt-1 text-xs"
                      data-planner-unavailable={unavailable.key}
                    >
                      {t(`unavailable.${unavailable.key}`, unavailable.values)}
                    </p>
                  )}
                  {unplannedPagePark && onStartPagePark ? (
                    <PlannerPlanParkCta
                      parkName={unplannedPagePark.name}
                      onStart={onStartPagePark}
                      className="mt-2"
                    />
                  ) : (
                    onOpenWizard && (
                      <button
                        type="button"
                        onClick={onOpenWizard}
                        data-planner-start-wizard=""
                        className="bg-primary text-primary-foreground hover:bg-primary/90 planner-phone:min-h-11 mt-2 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors"
                      >
                        <CalendarPlus className="size-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{t('wizard.open')}</span>
                      </button>
                    )
                  )}
                </div>
                <PlannerHelpSteps layout="list" />
              </div>
            ) : (
              /* No opening hours means no honest axis — not a 24-hour one, which
               would assert a park that never closes, and not an invented 9-to-6. */
              <PlannerTimeline
                entries={entries}
                day={day ?? null}
                prefs={prefs}
                onToggleDone={toggleDone}
                onRemove={(entryId) => parkSlug && date && removeRide(parkSlug, date, entryId)}
              />
            )}
          </div>
          {/* The bar stands down while a drag has actually moved: it would cover the ghost and
              state the block's old start. It returns at the drop with the minute written. */}
          {grid && selectedId && (
            <PlannerGridActions
              entry={entries.find((e: PlannerEntry) => e.id === selectedId) ?? null}
              day={day ?? null}
              standBack={dragging}
              onToggleDone={toggleDone}
              onRemove={(entryId) => {
                if (parkSlug && date) removeRide(parkSlug, date, entryId);
                setSelectedId(null);
              }}
              onClose={() => setSelectedId(null)}
              onEditCustom={(entryId, patch) => {
                if (parkSlug && date) editCustom(parkSlug, date, entryId, patch);
              }}
              /* Clamped here with `clampStart` against the same `rideFloor().hardMin` the drag
                 obeys, so a nudge cannot put a block anywhere a drag could not. */
              onNudge={(entryId, deltaMinutes) => {
                if (!parkSlug || !date || !grid) return;
                const entry = entries.find((e: PlannerEntry) => e.id === entryId);
                if (!entry) return;
                const ride = entry.attractionSlug
                  ? day?.rides.find((r) => r.attractionSlug === entry.attractionSlug)
                  : undefined;
                const next = clampStart(
                  grid,
                  entry.startMinute + deltaMinutes,
                  rideFloor(grid, ride).hardMin
                );
                if (next !== entry.startMinute) moveRide(parkSlug, date, entryId, next);
              }}
            />
          )}
        </div>

        {/* The column's foot (see {@link PlannerDayFoot}). A branch rather than a CSS-hidden copy:
            the panel is client-only, so `useMediaQuery` is right on first render, and two copies
            would duplicate `data-planner-optimize`. */}
        {withFoot && park && date && (
          <>
            <PlannerDayFoot
              parkSlug={park.slug}
              parkName={park.name}
              geo={park.geo}
              date={date}
              day={day ?? null}
              grid={grid}
              timezone={timezone}
              prefs={prefs}
              entries={entries}
              onAddFreeBlock={addFreeBlock}
              showPicker={
                <PlannerDayShowPicker
                  parkSlug={park.slug}
                  parkName={park.name}
                  geo={park.geo}
                  timezone={timezone}
                  date={date}
                  day={day}
                  entries={entries}
                />
              }
              search={
                <PlannerRideSearch
                  parkSlug={park.slug}
                  parkName={park.name}
                  geo={park.geo}
                  date={date}
                  day={day ?? null}
                  dayState={dayState}
                  timezone={timezone}
                  prefs={prefs}
                  inline
                />
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
