'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
    openDay,
    learnTimezone,
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
  const park = activeParkSlug ? state.parks[activeParkSlug] : null;

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

  // The zone the day payload names, written back into the plan. A park added
  // from the overview's search arrives without one — the search payload has no
  // zone to give — and would otherwise reckon its dates in the reader's for as
  // long as it stays in the plan. `learnTimezone` returns the state unchanged
  // once it has been learnt, so this settles after one write and never loops.
  useEffect(() => {
    if (!activeParkSlug || !day?.timezone) return;
    learnTimezone(activeParkSlug, day.timezone);
  }, [activeParkSlug, day?.timezone, learnTimezone]);

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
          'flex w-full flex-col gap-0 p-0 max-sm:rounded-t-xl sm:max-w-md',
          // The handle's whole job. `svh` for the same reason the cap already
          // used it: on iOS `vh` counts the address bar and the summary row
          // would sit under it.
          expanded ? 'max-sm:max-h-[96svh]' : 'max-sm:max-h-[85svh]'
        )}
      >
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
              onAddPark={(picked, date) => {
                openDay(picked, date);
                setShowOverview(false);
              }}
            />
          </div>
        ) : (
          <>
            <div className="border-border/60 shrink-0 border-b">
              <PlannerContextBand day={day ?? null} state={dayState} />
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
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div
                ref={scrollerRef}
                className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-1 py-2"
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
              <div className="shrink-0">
                <PlannerRideSearch
                  parkSlug={park.slug}
                  parkName={park.name}
                  geo={park.geo}
                  date={activeDate}
                  day={day ?? null}
                  dayState={dayState}
                  timezone={day?.timezone ?? park?.timezone}
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
                              spanMinutes: entry.custom?.durationMinutes ?? 45,
                            })),
                            grid
                          )
                        : undefined,
                    });
                  }}
                />
              </div>
            )}

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
              <div className="border-border/60 text-muted-foreground flex shrink-0 items-baseline justify-between gap-3 border-t px-3 py-2.5 text-xs">
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
                    <span
                      className="text-foreground font-mono tabular-nums"
                      title={t('summary.waiting')}
                    >
                      {/* The site's own duration format, not a second one invented
                      here: `formatShortDuration` is what the weather warnings
                      already print and it knows all six locales' unit labels. */}
                      {formatShortDuration(totals.expectedMinutes, locale)}
                    </span>
                  )}
                </span>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
