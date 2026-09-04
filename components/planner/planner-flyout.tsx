'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarPlus, ChevronDown, Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PlannerContextBand, type PlannerDayState } from './planner-context-band';
import { PlannerDayPicker } from './planner-day-picker';
import { PlannerTimeline } from './planner-timeline';
import { PlannerDayGrid } from './planner-day-grid';
import { PlannerRideSearch } from './planner-ride-search';
import { PlannerOverview } from './planner-overview';
import { PlannerPushToggle } from './planner-push-toggle';
import { PlannerHelpSteps } from './planner-help';
import { PlannerWizard, type WizardPark } from './planner-wizard';
import { PlannerPartyChips } from './planner-party-chips';
import { PlannerInParkCta } from './planner-in-park-cta';
import { PlannerPlanParkCta } from './planner-plan-park-cta';
import { PlannerMissingHeadliners } from './planner-missing-headliners';
import { PlannerPanelPhoto } from './planner-panel-photo';
import { PlannerDragCoach } from './planner-drag-coach';
import { usePlanner } from '@/lib/planner/use-planner';
import { usePlanDay } from '@/lib/hooks/use-plan-day';
import { totalsFor } from '@/lib/planner/estimate';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useRouter } from '@/i18n/navigation';
import { formatShortDuration } from '@/lib/utils/duration';
import { buildDayGrid, nextFreeStart } from '@/lib/planner/day-grid';
import { parkToday, resolveTimeZone } from '@/lib/planner/park-time';
import { closedNowFor, liveWaitsFor } from '@/lib/planner/live';
import { showLinesFor } from '@/lib/planner/shows';
import { plannerShowsVisible } from '@/lib/planner/shows-visible';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { PlannerShowBand } from './planner-show-band';
import { PlannerGridActions } from './planner-grid-actions';
import { PLANNER_RIDE_MIME, parseRideDrag } from '@/lib/planner/ride-drag';
import { occupiedMinutes } from '@/lib/planner/estimate';
import { useRideDragSource } from '@/lib/planner/use-ride-drag-source';
import { usePlannerDayFacts } from '@/lib/planner/use-day-facts';
import { plannerPanelWidth } from '@/lib/planner/panel-width';
import { plannerPagePark } from '@/lib/planner/page-park';
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
  const router = useRouter();

  /**
   * Delete removes the selected block.
   *
   * A grid you can select an item in and not delete it from is a grid that owes
   * you a mouse trip to a button — and the action row's own button stays, for
   * the phone, where there is no Delete key.
   *
   * Bound to the DOCUMENT rather than to the block, because a block is not
   * focused after a pointer selection: the grip takes focus during a drag and a
   * plain click on the body focuses nothing at all, so a handler on the element
   * would fire for a keyboard user and for nobody else. Guarded on the three
   * places a Delete belongs to something else — a text field, a number field,
   * anything `contenteditable` — since the panel carries a search box and a free
   * block's label is an `<input>` sitting inside the very row this deletes.
   */
  useEffect(() => {
    if (!selectedId || !activeParkSlug || !activeDate) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')
      )
        return;
      event.preventDefault();
      removeRide(activeParkSlug, activeDate, selectedId);
      setSelectedId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedId, activeParkSlug, activeDate, removeRide]);
  const panelWidth = useSyncExternalStore(
    plannerPanelWidth.subscribe,
    plannerPanelWidth.getSnapshot,
    plannerPanelWidth.getServerSnapshot
  );

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
  /** A park to open it on, so the first step can be skipped. */
  const [wizardPark, setWizardPark] = useState<WizardPark | null>(null);

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

  /**
   * The park the page BEHIND the panel is about, which is a different question
   * from the park being planned and was being answered with the wrong one: the
   * header printed the plan's park, so standing on Toverland's calendar with a
   * Phantasialand plan open it read "Phantasialand" and there was no way to
   * plan what was on screen without leaving for the planner's own page.
   */
  const pagePark = useSyncExternalStore(
    plannerPagePark.subscribe,
    plannerPagePark.getSnapshot,
    plannerPagePark.getServerSnapshot
  );
  /**
   * The page's park, where the day on screen is not already its own.
   *
   * It used to ask `!state.parks[pagePark.slug]` — whether the store had ever
   * HEARD of the park — and that is not the question. `openDay` registers a park
   * the moment a day is opened for it and adds no entry, `removeEntry` leaves
   * `days[date] = {date, entries: []}` behind, and only `clearDay` prunes, and
   * only when it drops the park's last day. So one visit to the calendar's plan
   * button left an empty husk that silenced the offer for good — which is the
   * state the panel was in when this was reported.
   *
   * What it asks now is whether the reader is already planning THIS park today.
   * That covers the husk, and it covers the case the old test could not express
   * at all: standing on Toverland's page with a Phantasialand day open, the
   * right offer is Toverland.
   */
  const unplannedPagePark =
    pagePark && !(activeParkSlug === pagePark.slug && activeDate) ? pagePark : null;

  /** Starts the wizard on the CALENDAR — which park is settled by the route. */
  const startPagePark = useCallback(() => {
    if (!unplannedPagePark) return;
    setWizardPark({ ...unplannedPagePark });
    setWizardOpen(true);
  }, [unplannedPagePark]);

  /**
   * A block the visitor writes themselves — a lunch break, a show, a meeting
   * point. One handler, because there are two call sites for one action: the
   * phone's inside the ride search, the desktop's on a row of its own now that
   * the search is the phone's surface alone.
   *
   * A plain function rather than a `useCallback`: it closes over four values
   * that change on nearly every render anyway, so memoizing it would either lie
   * about its dependencies or be rebuilt each time regardless.
   */
  const addFreeBlock = () => {
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
  };

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
  // `null` only while the day payload is on its way. `/plan/day` answers with
  // showtimes for every date the picker offers — the operator's own listing for
  // today and for days already gone, the last matching weekday carried forward
  // for the rest — so the panel no longer has to say "not knowable". What it
  // does have to say is WHICH of the two it is looking at, which rides along on
  // each line as `source`.
  /* Whether the day's showtimes are drawn at all — a preference of this
     browser, remembered, and read here rather than in the band so the grid's
     lines and the band above them can never disagree. */
  const showsVisible = useSyncExternalStore(
    plannerShowsVisible.subscribe,
    plannerShowsVisible.getSnapshot,
    plannerShowsVisible.getServerSnapshot
  );

  const showLines = day
    ? showLinesFor(
        day.shows,
        day.context.openHour !== null && day.context.closeHour !== null
          ? { openMin: day.context.openHour * 60, closeMin: day.context.closeHour * 60 }
          : null
      )
    : null;

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
        /* A click on the page does NOT close the panel on a desktop.
           `DismissableLayer` fires this for every pointer press outside the
           sheet, and outside the sheet is exactly where the work is: the panel
           is deliberately non-modal so a ride card stays grabbable, and the
           press that starts a drag is an outside press. So the gesture the
           panel exists to receive was also the gesture that dismissed it —
           and short of that, every click meant to scroll or read the park page
           behind it shut the plan.
           The phone keeps its overlay tap: there the sheet is modal, the page
           behind is covered and inert, and tapping the shield is the ordinary
           way out of a bottom sheet. Escape and the × work in both. */
        onInteractOutside={(event) => {
          if (!isPhone) event.preventDefault();
        }}
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
          // `isolate` is what keeps the park photo INSIDE the panel. It sits in
          // a negative stacking layer — see `PlannerPanelPhoto` for why it has
          // to — and a negative layer with no stacking context above it keeps
          // going until it finds one, i.e. straight behind the panel's own
          // background. `backdrop-filter` already forms one wherever it is
          // supported, so this only matters where it is not; it costs nothing
          // and takes the browser's word out of the arrangement.
          'isolate',
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
        {/* First child, so everything after it paints over it. */}
        <PlannerPanelPhoto src={day?.parkBackgroundImage} position={day?.parkBackgroundPosition} />

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

        {/* ONE row, not two. The title sat on its own line with nothing beside
            it but Radix's 16 px close button, and the park name and the day
            picker sat on a second — 83 px of a panel whose subject is a
            vertical axis with 324 px to draw it in. Merged and at `py-2` the
            head is 45 px, and the row's height is the day picker's own 28 px.

            `pr-7` is structural, not padding taste: `SheetContent` puts its
            close button at `absolute top-4 right-4`, which is now INSIDE this
            row, and without the clearance the picker's forward chevron sits
            under it and one of the two becomes untappable. */}
        <SheetHeader className="border-border/60 shrink-0 gap-0 border-b px-3 py-2">
          <div className="flex items-center gap-2 pr-7">
            <SheetTitle className="flex shrink-0 items-center gap-2 text-sm">
              <CalendarPlus className="size-4" />
              {t('title')}
            </SheetTitle>
            {park && (
              <>
                {/* The park name is the way into the overview. It was a plain
                    label with a row of chips under it naming the OTHER parks,
                    and a chip said nothing about what was planned in one. */}
                <button
                  type="button"
                  onClick={() => setShowOverview((value) => !value)}
                  aria-expanded={showOverview}
                  data-planner-overview-toggle=""
                  className="text-muted-foreground hover:text-foreground flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-0.5 text-xs transition-colors"
                >
                  {/* "Meine Pläne", never the active park's name. This control
                      opens the list of ALL plans, and labelling it with one of
                      them made it read as a statement about the page — which on
                      a different park's page is simply wrong. */}
                  <span className="truncate">{t('plans.title')}</span>
                  {/* Always. Hiding it until a second park or day existed made
                      the overview — the only route to another park or another
                      day — invisible to everyone who had exactly one, which is
                      everyone at the start. This chevron is where "how do I add
                      another day" is answered, so it cannot wait. */}
                  <ChevronDown
                    className={cn(
                      'size-3 shrink-0 transition-transform',
                      showOverview && 'rotate-180'
                    )}
                  />
                </button>
                {/* A day can be started from anywhere in the panel, not only
                    from inside the overview. It carries the page's park where
                    there is one, so the wizard opens on the calendar rather
                    than asking a question the route already answers. */}
                <button
                  type="button"
                  onClick={() => {
                    setWizardPark(pagePark ? { ...pagePark } : null);
                    setWizardOpen(true);
                  }}
                  aria-label={t('wizard.open')}
                  title={t('wizard.open')}
                  data-planner-new-plan=""
                  className="text-muted-foreground hover:text-foreground hover:bg-accent flex size-7 shrink-0 items-center justify-center rounded-md transition-colors"
                >
                  <Plus className="size-4" aria-hidden="true" />
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
              </>
            )}
          </div>
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
                // …and go to that park's page, because switching plans is
                // switching subject: the ride cards a plan is filled from are
                // on the park's own page, and staying on a different park's
                // left the panel and the page disagreeing about which park was
                // being planned. Skipped when it is already the page's park, so
                // picking another DAY of the park on screen does not reload it.
                const target = state.parks[slug];
                if (!target || pagePark?.slug === slug) return;
                router.push(
                  `/parks/${target.geo.continent}/${target.geo.country}/${target.geo.city}/${target.slug}` as '/europe/germany/rust/europa-park'
                );
              }}
              onClearDay={clearDay}
              onNewDay={() => setWizardOpen(true)}
            />
          </div>
        ) : (
          <>
            {/* Only where a day has been CHOSEN, and that is the whole fix for a
                sentence the panel had no business saying. `dayState` ends in a
                fall-through `: 'empty'` (see above), and with no active park or
                date the query is disabled — so `isFetching` is false, `day` is
                undefined, and 'empty' arrives at the band meaning "nobody ever
                asked". The band cannot tell that from a real 404 and printed
                "Für diesen Tag liegt keine Prognose vor." over an empty
                planner, above the offer to plan the park the reader is standing
                in. Measured: zero requests to `/plan/day` had been made.

                Guarded HERE rather than inside the band, because 'empty' is
                also the honest 404 — a park and a date are chosen, the API
                answered, and there the sentence is the only right one. And the
                guard has to sit on the wrapper: it carries the `border-b`, so a
                band that returned `null` from inside would leave a hairline
                under the sheet header with nothing above it. */}
            {park && activeDate && (
              <div className="border-border/60 shrink-0 border-b">
                {/* Who is coming, and changeable — the wizard asks it once and
                    the ride list flags rides against it all day, so this cannot
                    be write-only. It rides at the END of the band's own second
                    row rather than on a line of its own: 30 px of panel for one
                    22 px pill, in the same type as the row above it, on a
                    surface whose subject is the axis underneath. */}
                <PlannerContextBand
                  day={day ?? null}
                  state={dayState}
                  trailing={
                    <PlannerPartyChips
                      prefs={prefs}
                      onChange={(patch) => setDayPrefs(park.slug, activeDate, patch)}
                    />
                  }
                />
              </div>
            )}

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
                {grid && (
                  <PlannerShowBand
                    lines={showLines}
                    timezone={timezone}
                    isToday={isToday}
                    visible={showsVisible}
                    onToggle={plannerShowsVisible.toggle}
                  />
                )}
                {grid ? (
                  <PlannerDayGrid
                    entries={activeEntries}
                    day={day ?? null}
                    grid={grid}
                    timezone={timezone}
                    isToday={isToday}
                    liveWaits={liveWaits}
                    /* `[]` rather than `null` while the switch is off: `null`
                       is this prop's "the day payload has not arrived", and the
                       grid draws a reserved gap for it. Hidden shows are an
                       answer, not a wait. */
                    showLines={showsVisible ? showLines : []}
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
                    /* The same offer, in the branch that is actually on screen.
                       An axis exists for every open day, so this is where a
                       reader standing in another park sees it. */
                    emptyAction={
                      unplannedPagePark ? (
                        <PlannerPlanParkCta
                          parkName={unplannedPagePark.name}
                          onStart={startPagePark}
                          className="mt-3"
                        />
                      ) : null
                    }
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
                      {/* Standing in a park with nothing planned for it, the
                          answer is that park — not a tour of the panel. It
                          starts the wizard on the CALENDAR, because which park
                          is already settled by the page. */}
                      {unplannedPagePark ? (
                        <PlannerPlanParkCta
                          parkName={unplannedPagePark.name}
                          onStart={startPagePark}
                          className="mt-2"
                        />
                      ) : (
                        /* Off a park page there is no park to name, and until
                           now that meant no button at all: the header's `+`
                           renders only once a plan exists, so an empty planner
                           opened from the homepage offered three lines of prose
                           and no way to start. The wizard's own first step is
                           the park picker, so this needs to carry nothing. */
                        <button
                          type="button"
                          onClick={() => {
                            setWizardPark(null);
                            setWizardOpen(true);
                          }}
                          data-planner-start-wizard=""
                          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors max-sm:min-h-11"
                        >
                          <CalendarPlus className="size-4 shrink-0" aria-hidden="true" />
                          <span className="truncate">{t('wizard.open')}</span>
                        </button>
                      )}

                      {/* The two sentences that stood here are gone, and they
                          were wrong rather than merely redundant. Both said
                          "such dir unten eine Bahn", and this is the branch
                          with NO axis — the ride search is mounted behind
                          `park && activeDate` and hidden above `sm`, so in six
                          of the six states that reach this markup there is
                          nothing below but the three steps that follow, and on
                          a phone the search is either absent or, on an error
                          or a day with no forecast, a field no ride can ever
                          appear in. The desktop half was worse: it was
                          displayed at exactly the widths where the search does
                          not exist at all.
                          What is true here is the button above and the three
                          steps below, and both are already on screen. */}
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
                  day={day ?? null}
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

            {/* PHONE ONLY, and that is the whole shape of this feature now.
                A coarse pointer has no drag and drop, so the search is the way
                a ride gets into a plan and it does the inserting. A fine
                pointer drags the ride card itself out of the page behind the
                panel — which is a better gesture, because it picks the hour at
                the same time — so the list below would be a second way in that
                costs the axis a third of the panel.

                `sm:hidden` rather than `!isPhone`: `useMediaQuery` answers
                `false` on the server snapshot, so a JS branch ships the phone's
                markup in every desktop's first HTML and then deletes it. */}
            {park && activeDate && (
              /* NOT `shrink-0`, unlike its neighbours: this is the block that
                 has to give way when the sheet runs out of room, or the floor
                 above it just moves the overflow onto the summary row. It keeps
                 a cap so it cannot take the sheet on a tall phone either, and
                 scrolls inside itself past that. */
              <div className="min-h-0 shrink overflow-y-auto overscroll-y-contain max-sm:max-h-[46svh] sm:hidden">
                <PlannerRideSearch
                  parkSlug={park.slug}
                  parkName={park.name}
                  geo={park.geo}
                  date={activeDate}
                  day={day ?? null}
                  dayState={dayState}
                  timezone={day?.timezone ?? park?.timezone}
                  prefs={prefs}
                  onAddCustom={addFreeBlock}
                />
              </div>
            )}

            {/* Named once, and only where the gesture exists: a fine pointer,
                and a park page behind the panel to drag a card out of — and not
                while the day is empty, because the empty axis says the same
                sentence in the middle of the panel, from the same key. Two
                copies of one instruction 300 px apart is how a hint stops
                reading as a hint. */}
            <PlannerDragCoach
              show={Boolean(pagePark && park && activeDate && activeEntries.length > 0)}
            />

            {/* Which of the park's big rides are still missing from the day.
                Above the free-block row and outside the `sm:hidden` search,
                because it is the one thing in the panel's foot that both
                pointers need: the phone adds by tapping a pill, the desktop
                drags one onto an hour. */}
            {park && activeDate && (
              <PlannerMissingHeadliners
                parkSlug={park.slug}
                parkName={park.name}
                geo={park.geo}
                date={activeDate}
                day={day ?? null}
                timezone={timezone}
                prefs={prefs}
              />
            )}

            {/* A free block — a lunch break, a show, a meeting point — on its
                own row, DESKTOP only. It used to sit inside the ride search,
                which is now the phone's surface alone, and it is the one thing
                in there that is not a ride: the catalogue has no answer for
                "and then we eat". The phone keeps its copy inside the search,
                where the same question is being asked. */}
            {park && activeDate && (
              <button
                type="button"
                onClick={addFreeBlock}
                data-planner-add-custom=""
                className="text-muted-foreground hover:text-foreground hover:bg-accent/50 border-border/60 hidden shrink-0 items-center gap-2 border-t px-3 py-2 text-left text-xs transition-colors sm:flex"
              >
                <CalendarPlus className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{t('custom.add')}</span>
              </button>
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
            // Started FROM a park page, the wizard opens on the calendar: the
            // first question is already answered by where the reader is
            // standing, and asking it again is the panel pretending not to know
            // what page it is on.
            initialPark={wizardPark}
            onOpenChange={(next) => {
              setWizardOpen(next);
              if (!next) {
                setShowOverview(false);
                setWizardPark(null);
              }
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
