'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarPlus, ChevronDown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PlannerContextBand, type PlannerDayState } from './planner-context-band';
import { PlannerDayPicker } from './planner-day-picker';
import { PlannerTimeline } from './planner-timeline';
import { PlannerDayGrid } from './planner-day-grid';
import { PlannerRideSearch } from './planner-ride-search';
import { PlannerOverview } from './planner-overview';
import { PlannerPushToggle } from './planner-push-toggle';
import { PlannerHelpSteps } from './planner-help';
import { PlannerWizard } from './planner-wizard';
import { PlannerPartyChips } from './planner-party-chips';
import { PlannerInParkCta } from './planner-in-park-cta';
import { usePlanner } from '@/lib/planner/use-planner';
import { usePlanDay } from '@/lib/hooks/use-plan-day';
import { totalsFor } from '@/lib/planner/estimate';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { formatShortDuration } from '@/lib/utils/duration';
import { buildDayGrid, nextFreeStart } from '@/lib/planner/day-grid';
import { parkToday, resolveTimeZone } from '@/lib/planner/park-time';
import { closedNowFor, liveWaitsFor, showLinesFor } from '@/lib/planner/live';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { PlannerShowBand } from './planner-show-band';
import { PlannerGridActions } from './planner-grid-actions';
import { PLANNER_RIDE_MIME, parseRideDrag } from '@/lib/planner/ride-drag';
import { occupiedMinutes } from '@/lib/planner/estimate';
import { useRideDragSource } from '@/lib/planner/use-ride-drag-source';
import { usePlannerDayFacts } from '@/lib/planner/use-day-facts';
import { PANEL_WIDTH_DEFAULT, clampPanelWidth, plannerPanelWidth } from '@/lib/planner/panel-width';
import { cn } from '@/lib/utils';

interface PlannerFlyoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The planner panel.
 *
 * A right-hand sheet on a desktop and a bottom sheet on a phone, which is the
 * same component with a different `side` — the content is a column either way,
 * and the two differ in where they come from rather than in what they are.
 *
 * The scroll belongs to the list, never to `SheetContent`: that element is the
 * positioned ancestor of the close button, so scrolling it takes the close
 * button off screen. `components/ui/sheet.tsx` says so at the button, and the
 * burger menu solves it the same way.
 */
/** Far enough that it cannot be a tap; short enough for a thumb. */
const SHEET_EXPAND_PX = 24;
/** Under this, the gesture was a tap and the tap handler owns it. */
const SHEET_TAP_SLOP_PX = 6;
const SHEET_DISMISS_PX = 90;

export function PlannerFlyout({ open, onOpenChange }: PlannerFlyoutProps) {
  const t = useTranslations('planner');
  const locale = useLocale();
  const {
    activeParkSlug,
    activeDate,
    activeEntries,
    state,
    setDone,
    removeRide,
    setActive,
    clearDay,
    moveRide,
    shiftFrom,
    addCustom,
    editCustom,
    addRide,
    learnTimezone,
    setDayPrefs,
  } = usePlanner();

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Which of the two things the panel is: one day, or everything planned. It
  // resets on close rather than persisting, because the day is what the panel is
  // FOR — reopening it into a list of dates would make the common case a step
  // longer for the sake of the rare one. Reset in the close handler rather than
  // in an effect on `open`: the state change belongs to the event that caused it.
  const [showOverview, setShowOverview] = useState(false);
  // The phone sheet's height, reset on the same event and for the same reason:
  // the panel opens from a launcher on whatever page the visitor is reading, and
  // coming back to a sheet that eats the screen because of a drag three pages ago
  // is a surprise rather than a setting.
  const [expanded, setExpanded] = useState(false);
  /** Whether the gesture that just ended was a drag, so the tap can stand down. */
  const draggedSheet = useRef(false);
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setShowOverview(false);
      setExpanded(false);
    }
    onOpenChange(next);
  };

  const isPhone = useMediaQuery('(max-width: 639px)');
  const panelWidth = useSyncExternalStore(
    plannerPanelWidth.subscribe,
    plannerPanelWidth.getSnapshot,
    plannerPanelWidth.getServerSnapshot
  );

  /**
   * Dragging the panel's left edge.
   *
   * Live rather than committed-on-release, which is the opposite of the phone
   * handle above it — and for the reason that made that one committed: there,
   * the two directions mean different things (resize or dismiss) and a
   * continuous drag would have to guess which is happening. Here there is one
   * meaning and one axis, so the panel follows the pointer and the width is
   * written down once, on release.
   */
  const handleEdgeGrab = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startWidth = panelWidth;
    // The panel is anchored right, so a drag to the LEFT makes it wider.
    const widthAt = (clientX: number) => clampPanelWidth(startWidth + (startX - clientX));

    const onMove = (moveEvent: PointerEvent) =>
      plannerPanelWidth.preview(widthAt(moveEvent.clientX));
    const onUp = (upEvent: PointerEvent) => {
      plannerPanelWidth.commit(widthAt(upEvent.clientX));
      detach();
    };
    const detach = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', detach);
      try {
        handle.releasePointerCapture(event.pointerId);
      } catch {
        // Already released — a cancelled gesture, or the element unmounted.
      }
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', detach);
  };
  const park = activeParkSlug ? state.parks[activeParkSlug] : null;

  // Ride cards on the page behind the panel become drag sources for as long as
  // the panel is open. A drag needs somewhere to land, and this is the only time
  // there is one — see `useRideDragSource` for why the payload is attached from
  // here rather than by the card.
  useRideDragSource(open);

  /** Whether a ride is currently hovering over the flat list. */
  const [flatDropActive, setFlatDropActive] = useState(false);
  /** The wizard, which is how another day gets planned from in here. */
  const [wizardOpen, setWizardOpen] = useState(false);

  const {
    data: day,
    isFetching,
    isError,
  } = usePlanDay({
    continent: park?.geo.continent ?? '',
    country: park?.geo.country ?? '',
    city: park?.geo.city ?? '',
    parkSlug: activeParkSlug ?? '',
    date: activeDate ?? undefined,
    enabled: open && Boolean(park && activeDate),
  });

  // Four states, keyed off `isFetching` rather than `isPending`: a disabled query
  // is pending forever, so with no park picked yet the band would pulse without a
  // request ever having been made. `isFetching && !day` also keeps a background
  // refetch from throwing the band back to a skeleton it has already left.
  const dayState: PlannerDayState = isError
    ? 'error'
    : isFetching && !day
      ? 'loading'
      : day
        ? 'ready'
        : 'empty';

  const totals = totalsFor(day ?? null, activeEntries);

  // The axis, or null when the park's hours are unknown — in which case there is
  // no honest grid to draw and the flat list is the answer.
  const timezone = resolveTimeZone(day?.timezone ?? park?.timezone);
  const grid = buildDayGrid(day?.context.openHour, day?.context.closeHour);
  const isToday = Boolean(activeDate && activeDate === parkToday(timezone));

  // The live poll, and it is gated on TODAY for two reasons that point the same
  // way: a standby reading describes this minute and says nothing about a
  // Tuesday in November, and on a park page this is a cache hit on the key the
  // page already holds rather than a second request.
  const { data: livePark } = useLiveParkData({
    continent: park?.geo.continent ?? '',
    country: park?.geo.country ?? '',
    city: park?.geo.city ?? '',
    parkSlug: activeParkSlug ?? '',
    enabled: open && Boolean(park) && isToday,
  });

  // The park's own three-month forecast, for the day picker's grid. Cheap and
  // shared: it is the park page's own query key, so on a park page this is a
  // cache hit rather than a second request.
  const dayFacts = usePlannerDayFacts(park, open && !showOverview);

  // The zone the day payload names, written back into the plan. A park added
  // from the overview's search arrives without one — the search payload has no
  // zone to give — and would otherwise reckon its dates in the reader's for as
  // long as it stays in the plan. `learnTimezone` returns the state unchanged
  // once it has been learnt, so this settles after one write and never loops.
  useEffect(() => {
    // Either source will do and the second one ARRIVES: `/plan/day` answers 404
    // until the backend ships, while the best-days snapshot is live today and
    // names the zone in its `meta`. Without it a park added from the planner's
    // own search reckoned its dates in the reader's zone for as long as it
    // stayed in the plan.
    const zone = day?.timezone ?? dayFacts.timezone;
    if (!activeParkSlug || !zone) return;
    learnTimezone(activeParkSlug, zone);
  }, [activeParkSlug, day?.timezone, dayFacts.timezone, learnTimezone]);

  /** Who is coming, for this day. The wizard writes it; the chips change it. */
  const prefs = activeDate ? park?.days[activeDate]?.prefs : undefined;

  const liveWaits = liveWaitsFor(livePark);
  const closedNow = closedNowFor(livePark);

  /**
   * Ticking a ride off, from either view.
   *
   * ONE handler, because there are two of them: the grid's docked action row and
   * the flat list's row button. The grid's passed the fifth argument and the flat
   * list's did not — and the flat list is the view every visitor actually gets
   * while `/plan/day` answers 404, so in production every tick stored `done: true`
   * with no figure. `setEntryDone` has taken `actualWait` since it was written,
   * `totalsFor` sums it and the block renders it.
   *
   * Only on the way IN: un-ticking drops the figure, because a measured number
   * must not stay attached to an entry that is a plan again.
   */
  /**
   * The sheet's own height, on a phone.
   *
   * Reset on close rather than remembered: the panel opens from a launcher on
   * whatever page the visitor is reading, and coming back to a sheet that eats
   * the screen because of a drag three pages ago is a surprise, not a setting.
   */

  /**
   * Pull up to see more of the day, push down to put it away.
   *
   * Committed on release against a distance, not live: a live height would fight
   * Radix's own open/close transition on the same element, and the two
   * directions mean different things — one resizes, the other dismisses — so a
   * continuous drag would have to guess which is happening while it happened.
   */
  // A plain function, like `handleOpenChange` above it and for the same reason:
  // it closes over that one, which is not memoized, so a `useCallback` here would
  // either lie about its dependencies or be rebuilt every render anyway.
  const handleSheetGrab = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const startY = event.clientY;
    // A pointer drag ALWAYS ends in a click, so without this the tap handler
    // undid the drag one event later: pulling up set the sheet tall and the
    // click that followed toggled it straight back. Measured, not assumed — the
    // height came back 717 px before and 717 px after an 80 px pull.
    draggedSheet.current = false;

    const finish = (upEvent: PointerEvent) => {
      const dy = upEvent.clientY - startY;
      if (Math.abs(dy) > SHEET_TAP_SLOP_PX) draggedSheet.current = true;
      if (dy > SHEET_DISMISS_PX) handleOpenChange(false);
      else if (dy < -SHEET_EXPAND_PX) setExpanded(true);
      else if (dy > SHEET_EXPAND_PX) setExpanded(false);
      detach();
    };
    const detach = () => {
      handle.removeEventListener('pointerup', finish);
      handle.removeEventListener('pointercancel', detach);
      try {
        handle.releasePointerCapture(event.pointerId);
      } catch {
        // Already released — a cancelled gesture, or the element unmounted.
      }
    };
    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', detach);
  };

  const toggleDone = useCallback(
    (entryId: string, done: boolean) => {
      if (!activeParkSlug || !activeDate) return;
      const slug = activeEntries.find((entry) => entry.id === entryId)?.attractionSlug;
      const actual = done && slug ? liveWaits?.get(slug) : undefined;
      setDone(activeParkSlug, activeDate, entryId, done, actual ?? undefined);
    },
    [activeParkSlug, activeDate, activeEntries, liveWaits, setDone]
  );
  // `null` where the date cannot have showtimes at all. The API rewrites any
  // non-today date onto today and its source is an observation table with no
  // forward schedule, so sixty of the sixty-one dates the picker offers are
  // structurally unanswerable — which is a different statement from "no shows".
  const showLines = isToday && livePark ? showLinesFor(livePark.shows) : null;

  // Days of THIS park that already have entries — marked in the picker so the
  // visitor can find them again without remembering the date.
  const plannedDates = park
    ? Object.values(park.days)
        .filter((d) => d.entries.length > 0)
        .map((d) => d.date)
    : [];

  return (
    // NOT modal on a desktop pointer. Radix's default puts `pointer-events: none`
    // on everything outside the panel and a full-screen overlay over it, which
    // is right for a dialog and wrong for a planner: the whole point of a side
    // panel is that you keep browsing the park while it is open, and a ride card
    // you cannot touch is a ride card you cannot drag onto the day. The phone
    // sheet stays modal — a bottom sheet covering the screen has to trap.
    <Sheet open={open} onOpenChange={handleOpenChange} modal={isPhone}>
      <SheetContent
        modal={isPhone}
        side={isPhone ? 'bottom' : 'right'}
        // `side="bottom"` ships `h-auto` and no ceiling, so the height is the
        // call site's business. `svh` rather than `vh`: on iOS the address bar
        // makes `vh` taller than what is actually visible, and the summary row
        // at the bottom would sit under it.
        className={cn(
          'flex w-full flex-col gap-0 p-0 max-sm:rounded-t-xl',
          // Glass, like the header's menu band: a translucent dark ground with
          // a real gaussian blur behind it, so the page keeps showing through
          // while the plan stays readable over a park photo. `/80` rather than
          // the `/95` the menu uses — a panel this tall is mostly its own
          // background, and at /95 the blur is doing nothing anybody can see.
          //
          // The blur is why nothing here may put a `transform` or an `opacity`
          // on the panel or an ancestor: either makes it a backdrop root and
          // the blur goes flat. The open animation is an `animation`, which
          // leaves nothing behind once it has run, so the glass is only flat
          // while it slides.
          'bg-background/80 supports-[backdrop-filter]:bg-background/70 backdrop-blur-2xl',
          'border-border/70 max-sm:border-t sm:border-l sm:shadow-2xl',
          // The width is the visitor's, so the class ceiling has to go — an
          // inline width beats `w-3/4` but not `max-w-md`, which would clamp
          // every drag past 448 px into looking broken rather than wide.
          'sm:max-w-none',
          // The handle's whole job. `svh` for the same reason the cap already
          // used it: on iOS `vh` counts the address bar and the summary row
          // would sit under it.
          expanded ? 'max-sm:max-h-[96svh]' : 'max-sm:max-h-[85svh]'
        )}
        // Phone-only guard on the WIDTH, not on the markup: below `sm` this is
        // a bottom sheet spanning the viewport, and an inline pixel width would
        // hold it at 448 px in the middle of a 390 px screen.
        style={isPhone ? undefined : { width: panelWidth }}
      >
        {/* The resize edge. Desktop only — `hidden sm:flex` rather than
            `!isPhone`, for the reason the phone handle gives one line down: a
            control that decides its own existence from `useMediaQuery` flickers,
            because that hook answers `false` on the server snapshot.

            A 6 px column of hit area with a 40 px pill drawn in the MIDDLE of
            it, which is the only part a visitor is meant to see — the whole
            edge is grabbable, and the pill is what says so. Double-click puts
            the width back, because a drag that went too far otherwise has to be
            dragged back by hand. */}
        <div
          onPointerDown={handleEdgeGrab}
          onDoubleClick={() => plannerPanelWidth.commit(PANEL_WIDTH_DEFAULT)}
          role="separator"
          aria-orientation="vertical"
          aria-label={t('sheet.resize')}
          data-planner-resize-edge=""
          className="group absolute inset-y-0 -left-1 z-50 hidden w-3 cursor-col-resize touch-none items-center justify-center sm:flex"
        >
          <span className="bg-border group-hover:bg-primary h-10 w-1 rounded-full transition-colors" />
        </div>
        {/* The grab handle. Phone only, and `sm:hidden` rather than `!isPhone`
            because `useMediaQuery` answers `false` on the server snapshot and a
            control that decides its own existence from that flickers.

            It does the two things a bottom sheet's handle is expected to do —
            pull up to see more of the day, push down to put it away — and a tap
            toggles, because a tap is what most people try first. The 8 px rail
            is what is drawn; the 44 px target is a pseudo-element, so the rail
            can stay a hairline without the touch area shrinking with it. */}
        <div className="flex shrink-0 justify-center pt-2 pb-1 sm:hidden">
          <button
            type="button"
            onPointerDown={handleSheetGrab}
            onClick={() => {
              if (draggedSheet.current) return;
              setExpanded((value) => !value);
            }}
            data-planner-sheet-handle=""
            aria-label={t('sheet.handle')}
            className='relative flex h-4 w-16 cursor-grab touch-none items-center justify-center after:absolute after:top-1/2 after:h-11 after:w-24 after:-translate-y-1/2 after:content-[""] active:cursor-grabbing'
          >
            <span className="bg-muted-foreground/40 h-1.5 w-10 rounded-full" />
          </button>
        </div>

        <SheetHeader className="border-border/60 shrink-0 border-b px-3 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <CalendarPlus className="size-4" />
            {t('title')}
          </SheetTitle>
          {park && (
            <div className="flex items-center justify-between gap-2">
              {/* The park name is the way into the overview. It was a plain
                  label with a row of chips under it naming the OTHER parks, and
                  a chip said nothing about what was planned in one. */}
              <button
                type="button"
                onClick={() => setShowOverview((value) => !value)}
                aria-expanded={showOverview}
                data-planner-overview-toggle=""
                className="text-muted-foreground hover:text-foreground -mx-1 flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-xs transition-colors"
              >
                <span className="truncate">{park.name}</span>
                {/* Always. Hiding it until a second park or day existed made the
                    overview — the only route to another park or another day —
                    invisible to everyone who had exactly one, which is everyone
                    at the start. This chevron is where "how do I add another
                    day" is answered, so it cannot wait for a second day. */}
                <ChevronDown
                  className={cn(
                    'size-3 shrink-0 transition-transform',
                    showOverview && 'rotate-180'
                  )}
                />
              </button>
              {activeDate && !showOverview && (
                <PlannerDayPicker
                  value={activeDate}
                  onChange={(date) => setActive(activeParkSlug, date)}
                  plannedDates={plannedDates}
                  timezone={timezone}
                  facts={dayFacts.byDate}
                  maxDate={dayFacts.lastDate ?? undefined}
                />
              )}
            </div>
          )}
        </SheetHeader>

        {showOverview ? (
          <div className="min-h-0 flex-1 overflow-y-auto py-2">
            <PlannerOverview
              state={state}
              activeParkSlug={activeParkSlug}
              activeDate={activeDate}
              onPick={(slug, date) => {
                setActive(slug, date);
                setShowOverview(false);
              }}
              onClearDay={clearDay}
              onNewDay={() => setWizardOpen(true)}
            />
          </div>
        ) : (
          <>
            <div className="border-border/60 shrink-0 border-b">
              <PlannerContextBand day={day ?? null} state={dayState} />
              {/* Who is coming, and changeable — the wizard asks it once and the
                  ride list flags rides against it all day, so this cannot be
                  write-only. */}
              {park && activeDate && (
                <div className="flex items-center gap-1.5 px-3 pb-2">
                  <PlannerPartyChips
                    prefs={prefs}
                    onChange={(patch) => setDayPrefs(park.slug, activeDate, patch)}
                  />
                </div>
              )}
            </div>

            {/* The scroll lives here, not on SheetContent — see the note above.
                `relative` is load-bearing: `overflow-y-auto` makes a scroll
                container but NOT a containing block, so without it the grid's
                absolutely positioned blocks would position against the fixed
                sheet and stay put while the grid scrolled under them.
                `overscroll-y-contain` is on every other scroll surface in this
                repo; a drag past the end of a bottom sheet is otherwise a
                pull-to-refresh. */}
            {/* The scroller and its docked action row. The row is ABSOLUTE inside
                this wrapper, so selecting a block costs no layout at all and cannot
                resize the grid's box — which is the only arrangement in which the
                44 px touch tier and an honest 20 px block can both hold. */}
            {/* A FLOOR under the grid, and it is the difference between a
                planner and a search box. Every sibling in this column is
                `shrink-0`, so `flex-1` gave the grid whatever the others left
                over — on a 390 x 844 phone the ride search alone took 444 px of
                a 717 px sheet and the grid's scroller was left with a client
                height of **16 px**. The blocks were still laid out and still
                reported a box, so nothing looked broken from the outside; they
                were simply clipped away, which is why no drag worked on a phone
                at all while both worked on a desktop. 216 px is three hours at
                the grid's own 1.2 px/min — enough to see a block, grab it and
                move it somewhere. The ride search below gives way instead. */}
            <div className="relative flex min-h-0 flex-1 flex-col max-sm:min-h-[216px]">
              <div
                ref={scrollerRef}
                className={cn(
                  'relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-1 py-2',
                  flatDropActive && 'ring-primary/60 rounded-md ring-2 ring-inset'
                )}
                /* The drop target for a day with NO axis. `PlannerDayGrid` owns
                   the gesture wherever there is a grid — it can name the minute
                   the pointer is over, which is what a grid is for — but a park
                   whose hours we do not know draws a flat list, and a ride
                   dragged onto that was refused with nothing said. The entry
                   lands after the last one, exactly as the list's own add
                   button puts it.

                   Only the planner's own payload is accepted here: a bare link
                   carries no name, and the flat list is drawn precisely when
                   there is no day payload to look one up in. */
                onDragOver={(event) => {
                  if (grid || !park || !activeDate) return;
                  if (!event.dataTransfer.types.includes(PLANNER_RIDE_MIME)) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'copy';
                  setFlatDropActive(true);
                }}
                onDragLeave={() => setFlatDropActive(false)}
                onDrop={(event) => {
                  setFlatDropActive(false);
                  if (grid || !park || !activeDate) return;
                  const dragged = parseRideDrag(event.dataTransfer.getData(PLANNER_RIDE_MIME));
                  if (!dragged || dragged.parkSlug !== park.slug) return;
                  event.preventDefault();
                  addRide({
                    parkSlug: park.slug,
                    parkName: park.name,
                    geo: park.geo,
                    timezone: day?.timezone ?? park.timezone,
                    date: activeDate,
                    attractionSlug: dragged.attractionSlug,
                    attractionName: dragged.attractionName,
                  });
                }}
              >
                {grid && <PlannerShowBand lines={showLines} />}
                {grid ? (
                  <PlannerDayGrid
                    entries={activeEntries}
                    day={day ?? null}
                    grid={grid}
                    timezone={timezone}
                    isToday={isToday}
                    liveWaits={liveWaits}
                    showLines={showLines}
                    closedNow={closedNow}
                    parkSlug={park?.slug}
                    onDropRide={(attractionSlug, attractionName, startMinute) => {
                      if (!park || !activeDate) return;
                      addRide({
                        parkSlug: park.slug,
                        parkName: park.name,
                        geo: park.geo,
                        timezone: day?.timezone ?? park.timezone,
                        date: activeDate,
                        attractionSlug,
                        attractionName,
                        startMinute,
                      });
                    }}
                    onResize={(entryId, durationMinutes) => {
                      if (activeParkSlug && activeDate)
                        editCustom(activeParkSlug, activeDate, entryId, { durationMinutes });
                    }}
                    loading={dayState === 'loading'}
                    selectedId={selectedId}
                    scrollerRef={scrollerRef}
                    onSelect={setSelectedId}
                    onMove={(entryId, startMinute) =>
                      activeParkSlug &&
                      activeDate &&
                      moveRide(activeParkSlug, activeDate, entryId, startMinute)
                    }
                    onShiftFrom={(entryId, delta) =>
                      activeParkSlug &&
                      activeDate &&
                      shiftFrom(activeParkSlug, activeDate, entryId, delta)
                    }
                  />
                ) : activeEntries.length === 0 ? (
                  /* Two lines of prose was what this said before: what to press,
                     and nothing about what pressing it gets you. The three steps
                     are the same ones the page shows, from one component, so the
                     two cannot drift. */
                  <div className="flex flex-col gap-3 px-4 py-5">
                    <div>
                      <p className="text-sm font-medium">{t('empty.title')}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {isPhone ? t('empty.bodyMobile') : t('empty.body')}
                      </p>
                    </div>
                    <PlannerHelpSteps layout="list" />
                  </div>
                ) : (
                  /* No opening hours means no honest axis — not a 24-hour one,
                     which would assert a park that never closes, and not an
                     invented 9-to-6. The flat list is what this branch is for,
                     and why those three components survive. */
                  <PlannerTimeline
                    entries={activeEntries}
                    day={day ?? null}
                    onToggleDone={toggleDone}
                    onRemove={(entryId) =>
                      activeParkSlug &&
                      activeDate &&
                      removeRide(activeParkSlug, activeDate, entryId)
                    }
                  />
                )}
              </div>
              {grid && selectedId && (
                <PlannerGridActions
                  entry={activeEntries.find((e) => e.id === selectedId) ?? null}
                  onToggleDone={toggleDone}
                  onRemove={(entryId) => {
                    if (activeParkSlug && activeDate)
                      removeRide(activeParkSlug, activeDate, entryId);
                    setSelectedId(null);
                  }}
                  onClose={() => setSelectedId(null)}
                  onEditCustom={(entryId, patch) => {
                    if (activeParkSlug && activeDate)
                      editCustom(activeParkSlug, activeDate, entryId, patch);
                  }}
                />
              )}
            </div>

            {/* The way in on a phone, where there is no ride card to drag from. Also
            shown on desktop: typing a name beats hunting for its card, and the
            list is the day's own rides either way. */}
            {park && activeDate && (
              /* NOT `shrink-0`, unlike its neighbours: this is the block that
                 has to give way when the sheet runs out of room, or the floor
                 above it just moves the overflow onto the summary row. It keeps
                 a cap so it cannot take the sheet on a tall phone either, and
                 scrolls inside itself past that. */
              <div className="min-h-0 shrink overflow-y-auto overscroll-y-contain max-sm:max-h-[46svh]">
                <PlannerRideSearch
                  parkSlug={park.slug}
                  parkName={park.name}
                  geo={park.geo}
                  date={activeDate}
                  day={day ?? null}
                  dayState={dayState}
                  timezone={day?.timezone ?? park?.timezone}
                  prefs={prefs}
                  onAddCustom={() => {
                    if (!park || !activeDate) return;
                    addCustom({
                      parkSlug: park.slug,
                      parkName: park.name,
                      geo: park.geo,
                      timezone: day?.timezone ?? park.timezone,
                      date: activeDate,
                      label: t('custom.defaultLabel'),
                      icon: 'break',
                      startMinute: grid
                        ? nextFreeStart(
                            activeEntries.map((entry) => ({
                              startMinute: entry.startMinute,
                              spanMinutes: occupiedMinutes(day, entry),
                            })),
                            grid
                          )
                        : undefined,
                    });
                  }}
                />
              </div>
            )}

            {/* Above the push toggle and below the search, because it is an
                offer about a DIFFERENT day than the one on screen — putting it
                in the header would read as a statement about the plan being
                looked at. Renders nothing unless the visitor is inside a park
                that is not the one being planned. */}
            <PlannerInParkCta activeParkSlug={activeParkSlug} />

            {/* Under the ride search, above the summary: it belongs to the DAY
                rather than to the panel's chrome, and it is the last thing
                somebody decides once the plan is actually built. Renders
                nothing at all where push cannot work — see the component. */}
            {activeEntries.length > 0 && (
              <div className="border-border/60 shrink-0 border-t">
                <PlannerPushToggle />
              </div>
            )}

            {activeEntries.length > 0 && (
              <div className="border-border/60 text-muted-foreground flex shrink-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t px-3 py-2.5 text-xs">
                <span>
                  {t('summary.rides', { count: activeEntries.length - totals.custom })}
                  {totals.custom > 0 && ` · ${t('summary.blocks', { count: totals.custom })}`}
                </span>
                <span className="flex items-baseline gap-3">
                  {totals.done > 0 && (
                    <span>
                      {t('summary.done', { done: totals.done, total: activeEntries.length })}
                    </span>
                  )}
                  {/* Expected and actual are never added together: one is a
                  prediction and the other a measurement, and a single figure
                  mixing them moves for two reasons at once. */}
                  {totals.counted > 0 && (
                    <span className="flex items-baseline gap-1" title={t('summary.waiting')}>
                      {/* Named, not just hinted. The `title` said what this
                          figure is and a phone has no hover, so on the surface
                          where this planner is actually used the row ended in a
                          duration with nothing saying which duration. */}
                      <span>{t('summary.waitingLabel')}</span>
                      {/* The site's own duration format, not a second one invented
                      here: `formatShortDuration` is what the weather warnings
                      already print and it knows all six locales' unit labels. */}
                      <span className="text-foreground font-mono tabular-nums">
                        {formatShortDuration(totals.expectedMinutes, locale)}
                      </span>
                    </span>
                  )}
                </span>
              </div>
            )}
          </>
        )}

        {/* Mounted only while it is open, which is what resets its answers —
            see the note on `PlannerWizard`'s `open` prop. It lands on the park's
            own page, so it closes this panel's overview on the way. */}
        {wizardOpen && (
          <PlannerWizard
            open
            onOpenChange={(next) => {
              setWizardOpen(next);
              if (!next) setShowOverview(false);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
