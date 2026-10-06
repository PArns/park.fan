'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarPlus, ChevronDown, Columns2, History, Plus, X } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PlannerContextBand, type PlannerDayState } from './planner-context-band';
import { PlannerPartyChips } from './planner-party-chips';
import { PlannerShowsButton } from './planner-show-band';
import { dayHasShowLines } from '@/lib/planner/shows';
import { PlannerDayColumn } from './planner-day-column';
import { PlannerColumnHead } from './planner-column-head';
import { PlannerRideSearch } from './planner-ride-search';
import { PlannerDayShowPicker } from './planner-show-picker';
import { PlannerOverview } from './planner-overview';
import { PlannerPushToggle } from './planner-push-toggle';
import { PlannerWizard, type WizardPark } from './planner-wizard';
import { PlannerInParkCta } from './planner-in-park-cta';
import { PlannerPanelPhoto } from './planner-panel-photo';
import { PlannerDayFoot } from './planner-day-foot';
import { PlannerDragCoach } from './planner-drag-coach';
import { usePlanner } from '@/lib/planner/use-planner';
import { usePlanDay } from '@/lib/hooks/use-plan-day';
import { spansFor } from '@/lib/planner/estimate';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { usePathname, useRouter } from '@/i18n/navigation';
import {
  buildDayGrid,
  earlyEntryOpenMin,
  growGridForSpans,
  nextFreeStart,
  nowFloor,
  withEarlyEntry,
} from '@/lib/planner/day-grid';
import {
  PLANNER_LANDSCAPE_QUERY,
  PLANNER_PHONE_QUERY,
  usePlannerPxPerMin,
} from '@/lib/planner/use-grid-scale';
import { capturePointer, isSamePointer, releasePointer } from '@/lib/planner/pointer-capture';
import { useSheetViewport } from '@/lib/planner/use-sheet-viewport';
import {
  addDays,
  dayClock,
  longDate,
  pastActiveDay,
  resolveTimeZone,
} from '@/lib/planner/park-time';
import { isPlannedDay } from '@/lib/planner/types';
import { useRideDragSource } from '@/lib/planner/use-ride-drag-source';
import { usePlannerDayFacts } from '@/lib/planner/use-day-facts';
import { plannerPanelWidth } from '@/lib/planner/panel-width';
import {
  TWO_COLUMN_MIN_WIDTH,
  TWO_COLUMN_VIEWPORT_QUERY,
  maxColumnsFor,
  plannerSecondColumn,
} from '@/lib/planner/second-column';
import { plannerPagePark } from '@/lib/planner/page-park';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import { plannerUi } from '@/lib/planner/ui-store';
import { plannerPageDay } from '@/lib/planner/page-day';
import { plannerPageHeight } from '@/lib/planner/page-height';
import { cn } from '@/lib/utils';
import { PHONE_TARGET_32 } from '@/lib/planner/touch-target';

interface PlannerFlyoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * The launcher was pressed while the active day is over, and it is asking
   * what to open instead of opening it (see `openOrAsk` in `PlannerLauncher`).
   */
  askingPastDay: boolean;
  onAskingPastDayChange: (asking: boolean) => void;
}

/** The planner's own route, in all six localized spellings. See `isPlannerPage`. */
const PLANNER_PATHS = new Set(Object.values(PLANNER_SEGMENTS).map((segment) => `/${segment}`));

/**
 * The heights the phone sheet rests at, the way an iOS sheet has detents.
 *
 * - `large` is where it opens: everything under the site header.
 * - `full` is the whole screen, for the most day at once.
 * - `medium` is half the screen, to see the page behind — the ride cards a
 *   plan is filled from — without closing the plan.
 *
 * The sheet follows the finger while its grabber is dragged and snaps to the
 * nearest of these on release. See `handleSheetGrab`.
 */
type SheetDetent = 'medium' | 'large' | 'full';
/** Under this, the gesture was a tap and the tap handler owns it. */
const SHEET_TAP_SLOP_PX = 6;
/** Released this far below the smallest detent, the sheet closes. */
const SHEET_DISMISS_PX = 90;
/**
 * A release faster than this, in px per ms, moves one detent on from where the
 * drag started even if the finger has not travelled far: a flick, the way a
 * sheet on iOS answers one.
 */
const SHEET_FLICK_PX_PER_MS = 0.5;
/** A finger that rested this long before letting go placed the sheet; it did not flick it. */
const SHEET_FLICK_HOLD_MS = 100;
/** How far past the top of the screen a pull may stretch the sheet, rubber-banded. */
const SHEET_OVERPULL_PX = 24;

/**
 * Where the window is too short to spare the site header a strip: there `large` opens over the
 * header. The detent itself is CSS (`--planner-sheet-large` in `app/globals.css`); this copy only
 * answers whether the grabber has anything to toggle on a landscape phone.
 */
const SHEET_SHORT_QUERY = '(height < 50rem)';
/** Under this, `full` is a sliver above `large` and is not offered. */
const SHEET_MIN_DETENT_STEP_PX = 24;

/** A CSS length, resolved in pixels by the page's own stylesheet. */
function cssLengthPx(value: string): number {
  const probe = document.createElement('div');
  probe.style.cssText = `position:fixed;top:0;left:0;width:0;visibility:hidden;pointer-events:none;height:${value}`;
  document.body.appendChild(probe);
  const px = probe.getBoundingClientRect().height;
  probe.remove();
  return px;
}

/**
 * The detents in pixels, for the drag, smallest first, measured off the stylesheet with a probe: on
 * iOS `innerHeight` and `100svh` differ while the toolbar collapses, and a drag snapping to its own
 * arithmetic would jump again when the CSS settles.
 */
function sheetDetentHeights(withMedium: boolean) {
  const large = cssLengthPx('var(--planner-sheet-large)');
  const full = cssLengthPx('var(--planner-viewport)');
  return [
    ...(withMedium
      ? [{ detent: 'medium' as const, height: cssLengthPx('var(--planner-sheet-medium)') }]
      : []),
    { detent: 'large' as const, height: large },
    ...(full - large > SHEET_MIN_DETENT_STEP_PX ? [{ detent: 'full' as const, height: full }] : []),
  ];
}

/**
 * What a tap on the grabber does: one detent up, and from the top one back
 * down — to `large` from `full`, to `medium` where `large` is the top.
 */
function nextDetentOnTap(current: SheetDetent, available: readonly SheetDetent[]): SheetDetent {
  const index = available.indexOf(current);
  if (index >= 0 && index < available.length - 1) return available[index + 1];
  if (current === 'full') return 'large';
  return available[0];
}

/**
 * Whether the panel, at the width it stands at, holds two columns.
 *
 * The one fact about the width that the panel's render reads, so the panel
 * subscribes to this and not to the width: a resize drag moves the width on
 * every pointer move, and this flips once, at `TWO_COLUMN_MIN_WIDTH`. The
 * pixels go onto the sheet without a render — see `attachSheet`.
 */
const panelHoldsTwo = () => maxColumnsFor(plannerPanelWidth.getSnapshot()) === 2;
const panelHoldsTwoOnServer = () => maxColumnsFor(plannerPanelWidth.getServerSnapshot()) === 2;

/**
 * The trip planner panel: a right-hand sheet on desktop, a draggable bottom sheet with detents on
 * phones, holding the day picker and one or two day columns. Asks what to open when the active day
 * is already over. The scroll belongs to the list, never to `SheetContent`, which positions the
 * desktop's close button (see `components/ui/sheet.tsx`).
 */
export function PlannerFlyout({
  open,
  onOpenChange,
  askingPastDay,
  onAskingPastDayChange,
}: PlannerFlyoutProps) {
  const t = useTranslations('planner');
  const locale = useLocale();
  /** The axis' scale; see {@link usePlannerPxPerMin}. */
  const pxPerMin = usePlannerPxPerMin();
  // Only what the panel itself uses: everything that edits a day lives in `PlannerDayColumn`, which
  // knows its park and date.
  const {
    activeParkSlug,
    activeDate,
    activeEntries,
    state,
    setActive,
    clearDay,
    addCustom,
    learnTimezone,
    // Only reachable from here on a landscape phone, where the panel draws the
    // context band and therefore owns its party chips — every other size leaves
    // both inside the column. See `isLandscape`.
    setDayPrefs,
  } = usePlanner();

  // One day, or everything planned. Reset on close, since the day is what the panel is for, and in
  // the close handler rather than an effect, as the event caused it.
  const [showOverview, setShowOverview] = useState(false);
  // The phone sheet's height, reset on the same event: a drag three pages ago is not a setting.
  const [detent, setDetent] = useState<SheetDetent>('large');
  /**
   * The phone's search mode: the ride search has the sheet, the axis and the foot step aside.
   * Portrait only; see `searching` on {@link PlannerRideSearch}.
   */
  const [searching, setSearching] = useState(false);
  if (!open && searching) setSearching(false);
  /** The sheet element itself, which the grabber moves while it is dragged. */
  const sheetRef = useRef<HTMLDivElement>(null);
  /** Whether the gesture that just ended was a drag, so the tap can stand down. */
  const draggedSheet = useRef(false);
  /**
   * Tear-down for a sheet drag that is still running, reachable from outside it.
   * See the grid's `liveGesture` — same fallback, same leak, and here the
   * closure holds `handleOpenChange`.
   */
  const sheetGesture = useRef<(() => void) | null>(null);
  useEffect(() => () => sheetGesture.current?.(), []);
  /**
   * A dismiss drag leaves its inline placement on the sheet, so the close
   * animation starts where the finger let go (see `handleSheetGrab`). Radix
   * keeps the same node when the panel is reopened before that animation has
   * finished, and it would come back half off the screen with no transition —
   * so an open always starts from the classes.
   */
  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    for (const property of ['transition', 'height', 'max-height', 'bottom']) {
      sheet.style.removeProperty(property);
    }
  }, [open]);
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setShowOverview(false);
      setDetent('large');
    }
    onOpenChange(next);
  };

  const isPhone = useMediaQuery(PLANNER_PHONE_QUERY);
  // The phone sheet's height is what the browser shows, not a viewport unit:
  // a zoom or the keyboard otherwise leaves the grabber and the × above the
  // top of the screen with no way out. See `useSheetViewport`.
  useSheetViewport(open && isPhone);
  /**
   * A landscape phone, the one size where the sheet is a row, with the day's chrome beside the
   * axis. Always implies {@link isPhone}. Read only for which side draws the context band
   * (`withBand`); everything else is `planner-landscape:` in the markup.
   */
  const isLandscape = useMediaQuery(PLANNER_LANDSCAPE_QUERY);
  /**
   * A portrait phone, whatever the pointer: the ride search is one row at rest and opens its search
   * mode on a tap, since at rest the sheet has no room for the list.
   */
  const phoneSearch = isPhone && !isLandscape;
  const searchMode = searching && phoneSearch;
  /**
   * Whether a tap on the grabber has anywhere to go. On a short landscape window `large` is the
   * only detent, so the grabber only drags and stays out of the tab order and accessibility tree;
   * the × is the named way out.
   */
  const isShortWindow = useMediaQuery(SHEET_SHORT_QUERY);
  const grabberToggles = !(isLandscape && isShortWindow);
  // A landscape phone has no `medium` detent (half of a 390 px window is not a
  // day), so a sheet left there in portrait comes back to `large` on rotation.
  // Adjusted during render rather than in an effect, like `focusSecond` below:
  // an effect would draw one frame of a half-height landscape sheet first.
  if (isLandscape && detent === 'medium') setDetent('large');
  const router = useRouter();
  /**
   * Whether the page behind the panel is the planner's own. `usePathname` keeps the localized
   * segment, so every locale's segment is compared, exactly, as `header.tsx` does for
   * `BEST_TIME_SEGMENTS`.
   */
  const pathname = usePathname();
  const isPlannerPage = PLANNER_PATHS.has(pathname);

  const panelWideForTwo = useSyncExternalStore(
    plannerPanelWidth.subscribe,
    panelHoldsTwo,
    panelHoldsTwoOnServer
  );

  /**
   * The sheet's width on the wide arrangement, written onto the element from the store rather than
   * rendered, so a resize drag does not re-render the panel; the ref callback runs before the first
   * paint. It tears down on `null` and reattaches when `isPhone` changes, since a phone sheet spans
   * the screen.
   */
  const detachSheet = useRef<(() => void) | null>(null);
  const attachSheet = useCallback(
    (sheet: HTMLDivElement | null) => {
      detachSheet.current?.();
      detachSheet.current = null;
      sheetRef.current = sheet;
      if (!sheet || isPhone) return;
      // The store also speaks on a window resize where the capped width stays; that writes nothing.
      let written = '';
      const writeWidth = () => {
        const width = `${plannerPanelWidth.getSnapshot()}px`;
        if (width === written) return;
        written = width;
        sheet.style.width = width;
      };
      writeWidth();
      const unsubscribe = plannerPanelWidth.subscribe(writeWidth);
      detachSheet.current = () => {
        unsubscribe();
        sheet.style.removeProperty('width');
      };
    },
    [isPhone]
  );

  /**
   * The second column if there is room for one, and the switch if there could be. `twoColumnsFit`
   * asks the panel's width and gates drawing, since a column costs queries; the arrangement is
   * remembered. `twoColumnsOffered` asks the window, since the switch widens the panel itself and
   * `fitToViewport` would undo that below `TWO_COLUMN_MIN_VIEWPORT`. `isPhone` is load-bearing: a
   * wide, short window on a coarse pointer is a phone and gets no second column.
   */
  const twoColumnsFit = !isPhone && panelWideForTwo;
  const windowFitsTwoColumns = useMediaQuery(TWO_COLUMN_VIEWPORT_QUERY);
  const twoColumnsOffered = !isPhone && windowFitsTwoColumns;
  const storedColumn = useSyncExternalStore(
    plannerSecondColumn.subscribe,
    plannerSecondColumn.getSnapshot,
    plannerSecondColumn.getServerSnapshot
  );
  const secondColumn = twoColumnsFit ? storedColumn : null;

  const park = activeParkSlug ? state.parks[activeParkSlug] : null;

  // Ride cards behind the panel are drag sources while it is open; see `useRideDragSource`.
  useRideDragSource(open);

  /** The wizard, which is how another day gets planned from in here. */
  const [wizardOpen, setWizardOpen] = useState(false);
  /** A park to open it on, so the first step can be skipped. */
  const [wizardPark, setWizardPark] = useState<WizardPark | null>(null);
  /**
   * A day to open it on, so the second step is skipped too. Set only by {@link startPageDay} and
   * cleared with `wizardPark`, so a date never seeds a later "some day, you pick" wizard.
   */
  const [wizardDate, setWizardDate] = useState<string | null>(null);
  /**
   * A rider height to open the wizard's "who is coming" step with — the hand-off a park's "with
   * kids" page leaves (`plannerPageHeight`). Assigned by {@link startPagePark} alone and cleared
   * with the wizard, so a height chosen on one page cannot seed a wizard started from another.
   */
  const [wizardHeight, setWizardHeight] = useState<number | null>(null);

  const {
    data: fetchedDay,
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
  /** Who is coming, for this day. The wizard writes it; the chips change it. */
  const prefs = activeDate ? park?.days[activeDate]?.prefs : undefined;
  // Folded as the day column folds it, so the phone's search and foot plan against the same
  // opening; memoised because the spans and the grid key on it.
  const earlyEntry = prefs?.earlyEntry;
  const day = useMemo(() => withEarlyEntry(fetchedDay, earlyEntry), [fetchedDay, earlyEntry]);

  // `isFetching`, not `isPending` (a disabled query is pending for ever); `isFetching && !day`
  // keeps a background refetch from returning the band to a skeleton.
  const dayState: PlannerDayState = isError
    ? 'error'
    : isFetching && !day
      ? 'loading'
      : day
        ? 'ready'
        : 'empty';

  /**
   * How much of the day each block occupies, which two things need: the axis
   * has to be tall enough to contain them, and a new block has to be filed
   * somewhere none of them is.
   */
  const spans = useMemo(() => spansFor(day, activeEntries), [activeEntries, day]);

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

  /** The park the page behind the panel is about, which is not the park being planned. */
  const pagePark = useSyncExternalStore(
    plannerPagePark.subscribe,
    plannerPagePark.getSnapshot,
    plannerPagePark.getServerSnapshot
  );
  /**
   * The page's park, where the day on screen is not already its own: on Toverland's page with a
   * Phantasialand day open, the offer is Toverland. Not "has the store heard of this park", since
   * `openDay` and `removeEntry` leave empty days behind.
   */
  const unplannedPagePark =
    pagePark && !(activeParkSlug === pagePark.slug && activeDate) ? pagePark : null;

  /**
   * The photograph behind the panel. Source and focal point travel as a pair, so one park's picture
   * is never cropped to another's point. Where the plan's park is the page's park, the beacon's
   * photo is used at once; for a different park nothing shows until its own answer arrives.
   */
  const samePark = pagePark && pagePark.slug === activeParkSlug ? pagePark : null;
  const panelPhoto = !activeParkSlug
    ? { src: pagePark?.backgroundImage, position: pagePark?.backgroundPosition }
    : day?.parkBackgroundImage
      ? { src: day.parkBackgroundImage, position: day.parkBackgroundPosition }
      : { src: samePark?.backgroundImage, position: samePark?.backgroundPosition };

  /** Starts the wizard on the calendar: which park is settled by the route. */
  const startPagePark = useCallback(() => {
    if (!unplannedPagePark) return;
    setWizardPark({ ...unplannedPagePark });
    setWizardDate(null);
    setWizardHeight(plannerPageHeight.take(unplannedPagePark.slug));
    setWizardOpen(true);
  }, [unplannedPagePark]);

  /**
   * Starts the wizard for a day not in the plan yet (the past-day question's „Neuen Tag planen"),
   * on the page's park where there is one. `pagePark`, not `unplannedPagePark`: the day that is
   * over is often at this very park.
   */
  const startNewDay = useCallback(() => {
    setWizardPark(pagePark ? { ...pagePark } : null);
    setWizardDate(null);
    setWizardOpen(true);
  }, [pagePark]);

  /**
   * Starts the wizard on „Wer kommt mit", park and day both answered. `pagePark`, not
   * `unplannedPagePark`: a second day at a park that already has one is exactly what a date
   * comparison asks for. `plannerPageDay.take` refuses another park's date.
   */
  const startPageDay = useCallback(() => {
    if (!pagePark) return false;
    const date = plannerPageDay.take(pagePark.slug);
    if (!date) return false;
    setWizardPark({ ...pagePark });
    setWizardDate(date);
    setWizardOpen(true);
    return true;
  }, [pagePark]);

  /**
   * The whole answer to a wizard request, as one callback, so the effect below stays a counter
   * comparison and one call (`react-hooks/set-state-in-effect` refuses a branch into `setState`).
   */
  const startFromRequest = useCallback(() => {
    // A request that left a day behind is answered by that day; otherwise the park-header press.
    if (startPageDay()) return;
    startPagePark();
  }, [startPageDay, startPagePark]);

  /**
   * Take the page behind the panel to a park's own page: the ride cards a plan is filled from are
   * there, and the grid refuses a ride from another park. A no-op where the page is already that
   * park, and never on the planner's own page.
   */
  const goToPark = useCallback(
    (slug: string | null) => {
      if (!slug || pagePark?.slug === slug) return;
      // The planner's own page is the one route this may not leave: there the page is the panel's
      // subject.
      if (isPlannerPage) return;
      const target = state.parks[slug];
      if (!target) return;
      router.push(
        `/parks/${target.geo.continent}/${target.geo.country}/${target.geo.city}/${target.slug}` as '/europe/germany/rust/europa-park'
      );
    },
    [pagePark?.slug, isPlannerPage, router, state.parks]
  );

  /**
   * Which of the two columns the reader is working in: where the pointer last was, not the plan's
   * active day. It marks the column and picks the park the page shows. Local state, so it lives as
   * long as the panel.
   */
  const [focusSecond, setFocusSecond] = useState(false);
  /**
   * Focus a column and, where the press was a plain one, take the page. Navigation follows a change
   * of focus, never the press, so a single column never navigates. `navigate` is false for a press
   * on anything inside the column (see its capture handler). The push is outside the updater, which
   * React may call twice.
   */
  const focusColumn = useCallback(
    (second: boolean, navigate: boolean) => {
      if (second === focusSecond) return;
      setFocusSecond(second);
      if (navigate) goToPark(second ? (secondColumn?.parkSlug ?? null) : activeParkSlug);
    },
    [focusSecond, goToPark, secondColumn?.parkSlug, activeParkSlug]
  );
  // A closed second column cannot be the focused one; adjusted during render, or the marker would
  // sit on a gone column for one render.
  if (focusSecond && !secondColumn) setFocusSecond(false);

  /**
   * The day the question is about, read while it is asked. `null` otherwise,
   * and also when the plan changed under an open question (another tab, a
   * sync) so that the day is no longer over or no longer there: the dialog
   * then has nothing to name and stays shut.
   */
  const pastDay = askingPastDay ? pastActiveDay(state) : null;

  /**
   * The park page's own button, answered: `ParkPlannerLink` asks for the panel and the wizard on
   * the route's park, and only the panel can start it. The counter is compared against the last one
   * seen, starting at 0, so the press that lazily mounted the panel counts. It is the store's
   * wizard counter (see `plannerUi.getWizardSnapshot`).
   */
  const wizardRequests = useSyncExternalStore(
    plannerUi.subscribe,
    plannerUi.getWizardSnapshot,
    plannerUi.getWizardServerSnapshot
  );
  const lastWizardRequest = useRef(0);
  useEffect(() => {
    if (wizardRequests === lastWizardRequest.current) return;
    lastWizardRequest.current = wizardRequests;
    startFromRequest();
  }, [wizardRequests, startFromRequest]);

  /**
   * A block the visitor writes themselves: one handler for the phone's search and the desktop's
   * row. A plain function, since what it closes over changes on nearly every render.
   */
  const addFreeBlock = () => {
    if (!park || !activeDate) return;
    const clock = dayClock(activeDate, resolveTimeZone(day?.timezone ?? park.timezone));
    addCustom({
      parkSlug: park.slug,
      parkName: park.name,
      geo: park.geo,
      timezone: day?.timezone ?? park.timezone,
      date: activeDate,
      label: t('custom.defaultLabel'),
      icon: 'break',
      // Never before now; `nowFloor` is `openMin` on every other date.
      startMinute: grid ? nextFreeStart(spans, grid, undefined, nowFloor(grid, clock)) : undefined,
    });
  };

  // The park's three-month forecast, here for the zone written back below, under the same query key
  // as the column's day picker.
  const dayFacts = usePlannerDayFacts(park, open && !showOverview);

  // The zone the payloads name, written back into the plan for a park added from the overview's
  // search, which has none. `learnTimezone` returns the same state once learnt, so this settles.
  useEffect(() => {
    // Either source will do; the best-days snapshot names the zone in its `meta`.
    const zone = day?.timezone ?? dayFacts.timezone;
    if (!activeParkSlug || !zone) return;
    learnTimezone(activeParkSlug, zone);
  }, [activeParkSlug, day?.timezone, dayFacts.timezone, learnTimezone]);

  /**
   * What the head needs where the panel draws it (see `phoneHead`), from the same store and query
   * as the column's own.
   */
  const parks = useMemo(() => Object.values(state.parks), [state.parks]);
  const plannedDates = useMemo(
    () =>
      park
        ? Object.values(park.days)
            .filter(isPlannedDay)
            .map((entry) => entry.date)
        : [],
    [park]
  );
  /**
   * Whether the panel's header is the column's head, the phone case. Not over the overview, which
   * is not a day. Gated on `parks.length` like the column, not on `park`: a plan can hold parks
   * while none is active, and then the head is the park chooser, the way out.
   */
  const phoneHead = isPhone && !showOverview && parks.length > 0;

  /**
   * The grabber, dragged: the sheet follows the finger and snaps to the nearest detent on release;
   * a flick moves one detent on, and a flick down from `medium` or a release well below it closes.
   *
   * Nothing here writes a `transform`, which would make the glass a backdrop root and flatten its
   * blur: the drag moves the sheet with `bottom` and grows it with `height`, written straight onto
   * the element. On release the detent is committed with `flushSync` and the inline styles come
   * off, so the class transition carries the sheet on; a dismiss keeps them, so the close starts
   * there. A plain function, since it closes over the unmemoised `handleOpenChange`.
   */
  const handleSheetGrab = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const handle = event.currentTarget;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const pointerId = event.pointerId;
    // Through the shared claim, like the grid's gestures: a bare `setPointerCapture` can throw, and
    // without a capture the listeners go to the document. See `capturePointer`.
    const bus = capturePointer(handle, pointerId);
    const startY = event.clientY;
    // A pointer drag always ends in a click, so the tap handler has to know a drag happened.
    draggedSheet.current = false;

    // Where the sheet is, in the drag's numbers, taken once at the press from the values the sheet
    // is placed by, not `innerHeight`, which ignores a page zoom.
    const room = cssLengthPx('var(--planner-viewport)');
    const lift = cssLengthPx('var(--planner-viewport-lift)');
    const layoutHeight = sheet.getBoundingClientRect().height;
    const startVisible = layoutHeight + parseFloat(getComputedStyle(sheet).bottom) - lift;
    // No `medium` on a landscape phone: half of a 390 px window is not a day.
    const detents = sheetDetentHeights(!isLandscape);
    const startDetent = detent;
    let moved = false;
    // The last two moves, for the release velocity.
    let lastY = startY;
    let lastT = event.timeStamp;
    let prevY = startY;
    let prevT = event.timeStamp;

    const place = (visible: number) => {
      const height = Math.max(layoutHeight, visible);
      sheet.style.transition = 'none';
      sheet.style.height = `${height}px`;
      sheet.style.maxHeight = `${height}px`;
      sheet.style.bottom = `${lift + visible - height}px`;
    };
    const unplace = () => {
      sheet.style.removeProperty('transition');
      sheet.style.removeProperty('height');
      sheet.style.removeProperty('max-height');
      sheet.style.removeProperty('bottom');
    };
    const visibleAt = (clientY: number) => {
      const visible = startVisible - (clientY - startY);
      // Past the top of the screen the sheet resists, and stops.
      if (visible <= room) return Math.max(0, visible);
      return room + Math.min(SHEET_OVERPULL_PX, (visible - room) / 3);
    };

    const onMove = (moveEvent: PointerEvent) => {
      if (!isSamePointer(moveEvent, pointerId)) return;
      prevY = lastY;
      prevT = lastT;
      lastY = moveEvent.clientY;
      lastT = moveEvent.timeStamp;
      if (!moved && Math.abs(moveEvent.clientY - startY) <= SHEET_TAP_SLOP_PX) return;
      moved = true;
      place(visibleAt(moveEvent.clientY));
    };
    const finish = (upEvent: PointerEvent) => {
      // This gesture's own pointer, on the document fallback.
      if (!isSamePointer(upEvent, pointerId)) return;
      detach();
      const dy = upEvent.clientY - startY;
      if (Math.abs(dy) > SHEET_TAP_SLOP_PX) draggedSheet.current = true;
      if (!draggedSheet.current) {
        unplace();
        return;
      }
      const visible = visibleAt(upEvent.clientY);
      // The speed of the last move, only if the finger was still moving at release: a held release
      // is a placement, not a flick.
      const held = upEvent.timeStamp - lastT > SHEET_FLICK_HOLD_MS;
      const velocity = !held && lastT > prevT ? (lastY - prevY) / (lastT - prevT) : 0;
      const nearest = detents.reduce((best, candidate) =>
        Math.abs(candidate.height - visible) < Math.abs(best.height - visible) ? candidate : best
      );
      const startIndex = detents.findIndex((candidate) => candidate.detent === startDetent);
      let target: SheetDetent | 'dismiss' = nearest.detent;
      if (visible < detents[0].height - SHEET_DISMISS_PX) target = 'dismiss';
      else if (Math.abs(velocity) > SHEET_FLICK_PX_PER_MS && nearest.detent === startDetent) {
        // A flick that did not travel as far as the next detent still means it.
        const step = startIndex + (velocity > 0 ? -1 : 1);
        target = step < 0 ? 'dismiss' : detents[Math.min(step, detents.length - 1)].detent;
      }
      if (target === 'dismiss') {
        handleOpenChange(false);
        return;
      }
      const next = target;
      flushSync(() => setDetent(next));
      unplace();
    };
    const cancel = (cancelEvent: PointerEvent) => {
      if (!isSamePointer(cancelEvent, pointerId)) return;
      detach();
      unplace();
    };
    const detach = () => {
      bus.removeEventListener('pointermove', onMove as EventListener);
      bus.removeEventListener('pointerup', finish as EventListener);
      bus.removeEventListener('pointercancel', cancel as EventListener);
      releasePointer(handle, pointerId);
      if (sheetGesture.current === detach) sheetGesture.current = null;
    };
    // Same reason as the grid's `liveGesture`: on the document fallback these
    // listeners outlive the panel, and this one closes over `handleOpenChange`.
    sheetGesture.current?.();
    sheetGesture.current = detach;
    bus.addEventListener('pointermove', onMove as EventListener);
    bus.addEventListener('pointerup', finish as EventListener);
    bus.addEventListener('pointercancel', cancel as EventListener);
  };

  return (
    // Not modal on a desktop: the page behind stays usable, so a ride card can be dragged onto the
    // day. The phone's bottom sheet stays modal.
    <>
      <Sheet open={open} onOpenChange={handleOpenChange} modal={isPhone}>
        <SheetContent
          modal={isPhone}
          side={isPhone ? 'bottom' : 'right'}
          /* Scopes the iOS no-zoom rule in `app/globals.css`: every text field in
           here has to render at 16 px on a touch screen, or focusing it zooms
           the page in for good and pushes the handle off the screen. */
          data-planner-sheet=""
          /* No `SheetContent` × on a phone, where its corner is the day picker's; the phone draws
             its own in the header row. Keyed on `isPhone`, like `side` and `modal`, not a class, so
             the condition is not copied a fourth time. */
          hideClose={isPhone}
          /* An outside press does not close the panel on a desktop: the panel is non-modal so ride
             cards stay grabbable, and the press that starts a drag is an outside press. The phone
             keeps its overlay tap. */
          onInteractOutside={(event) => {
            if (!isPhone) event.preventDefault();
          }}
          // `side="bottom"` ships `h-auto` and no ceiling. Never `vh` or `svh`: the detents below
          // are counted in what is on screen.
          className={cn(
            'planner-phone:rounded-t-2xl flex w-full flex-col gap-0 p-0',
            // Glass: a translucent ground with a real blur, `/80` since a tall panel is mostly its
            // own background. Nothing may put a `transform` or `opacity` on the panel or an
            // ancestor, which would flatten the blur; the open animation leaves nothing behind.
            'bg-background/80 supports-[backdrop-filter]:bg-background/70 backdrop-blur-2xl',
            // `isolate` keeps the park photo, in a negative layer, inside the panel (see
            // `PlannerPanelPhoto`).
            'isolate',
            'border-border/70 planner-phone:border-t planner-wide:border-l planner-wide:shadow-2xl',
            // The width is the visitor's, so the class ceiling has to go — an
            // inline width beats `w-3/4` but not `max-w-md`, which would clamp
            // every drag past 448 px into looking broken rather than wide.
            'sm:max-w-none',
            // The phone's detents (`--planner-sheet-large` in `app/globals.css`): `large` rests
            // under the site header or at 92 %, whichever gives more (`max()`, not an orientation
            // branch); `full` is the whole screen; `medium` keeps the `large` box and slides down
            // with `bottom`. `h-*` beside `max-h-*`, so a detent is a place the sheet is. All are
            // counted in `--planner-viewport`, what is on screen, and the sheet stands on
            // `--planner-viewport-lift` (see `useSheetViewport`).
            detent === 'full'
              ? 'planner-phone:h-(--planner-viewport) planner-phone:max-h-(--planner-viewport)'
              : 'planner-phone:h-(--planner-sheet-large) planner-phone:max-h-(--planner-sheet-large)',
            detent === 'medium'
              ? 'planner-phone:bottom-[calc(var(--planner-viewport-lift)_+_var(--planner-sheet-medium)_-_var(--planner-sheet-large))]'
              : 'planner-phone:bottom-(--planner-viewport-lift)',
            // Detent snaps and the slide in and out use the iOS sheet curve; `--tw-ease` and
            // `--tw-duration` are what `animate-in` reads too. The desktop keeps its 300 ms, timed
            // against the page's own inset transition.
            'planner-phone:transition-[height,max-height,bottom] planner-phone:duration-[400ms] planner-phone:ease-[cubic-bezier(0.32,0.72,0,1)]',
            // Less motion where asked, which `SheetContent` never honoured. The state variants,
            // because `data-[state=open]:animate-in` outranks a bare `animate-none`; here rather
            // than in `components/ui/sheet.tsx`, which other sheets share.
            'motion-reduce:transition-none motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none'
          )}
          // The width is not a prop: `attachSheet` writes it, and leaves it off
          // on a phone.
          ref={attachSheet}
        >
          {/* First child, so everything after it paints over it. The picture follows the plan's
              park, or the page's where nothing is planned; it branches on the active park, so a day
              still loading never shows another park's. Without a photo it draws a ground (see
              `PlannerPanelPhoto`). */}
          <PlannerPanelPhoto src={panelPhoto.src} position={panelPhoto.position} />

          {/* One header row: the park and day, and on a phone the grabber in a strip above, the
              bell and the ×. The phone's controls are drawn 32 px and reach 44 px into the strip
              and the `pb-1.5` (`PHONE_TARGET_32`); padding and controls are both `planner-phone:`,
              one decision. The handle is a button laid behind the row (`absolute inset-0`), so it
              takes a press wherever no control is; `planner-wide:hidden`, as a side panel has
              none. */}
          <SheetHeader className="border-border/60 planner-phone:pt-4 planner-phone:pb-1.5 relative shrink-0 gap-0 border-b px-3 py-2">
            <button
              type="button"
              onPointerDown={handleSheetGrab}
              onClick={() => {
                if (draggedSheet.current) return;
                const available = sheetDetentHeights(!isLandscape).map(
                  (candidate) => candidate.detent
                );
                setDetent((value) => nextDetentOnTap(value, available));
              }}
              data-planner-sheet-handle=""
              data-planner-sheet-detent={detent}
              aria-label={t('sheet.handle')}
              aria-expanded={grabberToggles ? detent !== 'medium' : undefined}
              aria-hidden={grabberToggles ? undefined : true}
              tabIndex={grabberToggles ? undefined : -1}
              className="planner-wide:hidden absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
            >
              {/* iOS's own grabber: 36 × 5 px, centred in the strip. */}
              <span className="bg-muted-foreground/45 absolute top-[5px] left-1/2 h-[5px] w-9 -translate-x-1/2 rounded-full" />
            </button>
            {/* `pr-7` on a desktop keeps the last control out from under `SheetContent`'s × at
                `absolute top-4 right-4`; with `hideClose` a phone has nothing to clear. `!isPhone`
                rather than `sm:`, to follow `hideClose`. `relative`, so the row paints over the
                handle behind it. */}
            <div
              className={cn(
                'relative flex items-center gap-2',
                // 4 px between the phone's controls: every pixel of gap comes off the park name.
                isPhone ? 'gap-1' : 'pr-7'
              )}
            >
              {/* Radix wants a title. On a phone it is `sr-only` where the row carries a park name,
                  since a dialog owes its reader a name; visible wherever the row has none (the
                  overview, no active park). `park`, not `phoneHead`, so the row always has a
                  name. */}
              <SheetTitle
                className={cn(
                  'flex shrink-0 items-center gap-2 text-sm',
                  phoneHead && park && 'sr-only'
                )}
              >
                <CalendarPlus className="size-4" />
                {t('title')}
              </SheetTitle>
              {/* The park and the day on a phone, drawn by the panel instead of the column (see
                  `withHead` on {@link PlannerDayColumn}); `min-w-0` lets the park name
                  truncate. */}
              {phoneHead && (
                <PlannerColumnHead
                  parks={parks}
                  parkSlug={activeParkSlug}
                  date={activeDate}
                  onPickPark={(slug) => setActive(slug, activeDate)}
                  onPickDate={(date) => setActive(activeParkSlug, date)}
                  onNewPark={() => {
                    setWizardPark(pagePark ? { ...pagePark } : null);
                    setWizardDate(null);
                    setWizardOpen(true);
                  }}
                  plannedDates={plannedDates}
                  timezone={resolveTimeZone(day?.timezone ?? park?.timezone)}
                  facts={dayFacts.byDate}
                  maxDate={dayFacts.lastDate ?? undefined}
                  /* The way into the overview on a phone, in the park chooser's foot. */
                  onShowOverview={park ? () => setShowOverview(true) : undefined}
                  className="min-w-0 flex-1 border-b-0 px-0 py-0"
                />
              )}
              {park && (
                <>
                  {/* The way into the overview. Not while the phone's head is up, where the icon
                      alone beside the day picker's `›` read as a minimize control; with the
                      overview open it is drawn with its word and is the way back. */}
                  {!phoneHead && (
                    <button
                      type="button"
                      onClick={() => setShowOverview((value) => !value)}
                      aria-expanded={showOverview}
                      data-planner-overview-toggle=""
                      className={cn(
                        'text-muted-foreground hover:text-foreground flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-0.5 text-xs transition-colors',
                        PHONE_TARGET_32
                      )}
                    >
                      {/* "Meine Pläne", never the active park's name: it opens all plans. */}
                      <span className="truncate">{t('plans.title')}</span>
                      {/* Always: the overview is the only route to another park or day. */}
                      <ChevronDown
                        className={cn(
                          'size-3 shrink-0 transition-transform',
                          showOverview && 'rotate-180'
                        )}
                      />
                    </button>
                  )}
                  {/* A day can be started from anywhere in the panel, on the page's park where
                      there is one. Not on a phone, where the row has no room left for the park
                      name; there the day picker's `›` and the overview's wizard reach the same
                      days. */}
                  {!isPhone && (
                    <button
                      type="button"
                      onClick={() => {
                        setWizardPark(pagePark ? { ...pagePark } : null);
                        setWizardDate(null);
                        setWizardOpen(true);
                      }}
                      aria-label={t('wizard.open')}
                      title={t('wizard.open')}
                      data-planner-new-plan=""
                      className="text-muted-foreground hover:text-foreground hover:bg-accent planner-phone:size-11 flex size-7 shrink-0 items-center justify-center rounded-md transition-colors"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  )}
                  {/* The notification bell, only with something planned, since switching it on
                      uploads the plan. */}
                  {!isPhone && activeEntries.length > 0 && <PlannerPushToggle variant="icon" />}
                  {/* The second column, on and off. It opens on the day after the active one, same
                      park, which is what two columns are for. Offered wherever the window could
                      carry two (`twoColumnsOffered`); the press makes room. */}
                  {activeDate && !showOverview && twoColumnsOffered && (
                    <button
                      type="button"
                      onClick={() => {
                        if (secondColumn) {
                          // Closing leaves the width alone: it was the visitor's own.
                          plannerSecondColumn.close();
                          return;
                        }
                        // Widen through `commit`, the edge drag's clamp and storage, and only
                        // upwards.
                        if (plannerPanelWidth.getSnapshot() < TWO_COLUMN_MIN_WIDTH) {
                          plannerPanelWidth.commit(TWO_COLUMN_MIN_WIDTH);
                        }
                        // A column narrowed away is remembered, so widening brings that day back.
                        if (storedColumn) return;
                        if (!activeParkSlug) return;
                        plannerSecondColumn.open({
                          parkSlug: activeParkSlug,
                          date: addDays(activeDate, 1),
                        });
                      }}
                      aria-pressed={Boolean(secondColumn)}
                      aria-label={secondColumn ? t('column.close') : t('column.open')}
                      title={secondColumn ? t('column.close') : t('column.open')}
                      data-planner-second-column={secondColumn ? 'on' : 'off'}
                      className={cn(
                        'hover:bg-accent flex size-7 shrink-0 items-center justify-center rounded-md transition-colors',
                        secondColumn
                          ? 'bg-accent text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Columns2 className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </>
              )}
              {/* The bell beside the ×, only with something planned. Then a drawn way out on the
                  phone, since the handle alone was an exit nobody found and a zoomed page could
                  push the header off screen. 32 px drawn, so the disc sits 12 px from the edge,
                  reaching 44 × 44 (`PHONE_TARGET_32` and the row's padding). */}
              {isPhone && park && activeEntries.length > 0 && <PlannerPushToggle variant="icon" />}
              {isPhone && (
                <SheetClose
                  data-planner-sheet-close=""
                  aria-label={t('sheet.close')}
                  className={cn(
                    'group text-muted-foreground hover:text-foreground flex w-8 shrink-0 items-center justify-center',
                    PHONE_TARGET_32,
                    'planner-phone:after:-right-3'
                  )}
                >
                  {/* The round grey × of an iOS sheet: a 28 px disc drawn inside
                    the 44 px target. */}
                  <span className="bg-foreground/10 group-hover:bg-foreground/15 flex size-7 items-center justify-center rounded-full transition-colors">
                    <X className="size-4" aria-hidden="true" />
                  </span>
                </SheetClose>
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
                  // …and go to that park's page, as `goToPark` does for the column focus.
                  goToPark(slug);
                }}
                onClearDay={clearDay}
                onNewDay={() => setWizardOpen(true)}
              />
            </div>
          ) : (
            <>
              {/* The sheet's body: `contents`, so at every size but one its children are the
                  sheet's own flex children, unchanged; on a landscape phone it is the row, the
                  day's chrome beside the axis. See `planner-landscape` in `app/globals.css`. */}
              <div
                className={cn(
                  'contents',
                  /* The row only where there is a day: every row it puts on the left hangs on a
                     chosen park and date, so without one the left column would stand empty. */
                  park &&
                    activeDate &&
                    'planner-landscape:flex planner-landscape:min-h-0 planner-landscape:flex-1 planner-landscape:flex-row'
                )}
              >
                {/* The columns: a grid whose three rows (head, band, body) each column takes as
                    `grid-rows-subgrid`, so both axes start on the same pixel. Never two columns on
                    a phone, where a hidden one would still cost a `/plan/day` query. */}
                <div
                  className={cn(
                    'grid min-h-0 flex-1 grid-rows-[auto_auto_minmax(0,1fr)]',
                    /* `basis-auto` on a phone, where the sheet has a definite height: `flex-1`'s
                       zero basis left the axis only what the rows around it left. The landscape row
                       keeps the zero basis, since a content basis there would be a width. */
                    'planner-phone:basis-auto planner-landscape:basis-0',
                    secondColumn ? 'grid-cols-2' : 'grid-cols-1',
                    // Stepped aside while the phone searches, and kept mounted:
                    // a selected block and the grid's scroll position survive.
                    searchMode && 'hidden'
                  )}
                >
                  <PlannerDayColumn
                    parkSlug={activeParkSlug}
                    date={activeDate}
                    primary
                    active={Boolean(secondColumn) && !focusSecond}
                    onActivate={(navigate) => focusColumn(false, navigate)}
                    open={open}
                    withFoot={!isPhone}
                    withHead={!isPhone}
                    withBand={!isLandscape}
                    className="row-span-3 grid grid-rows-subgrid"
                    onPickPark={(slug) => setActive(slug, activeDate)}
                    onPickDate={(date) => setActive(activeParkSlug, date)}
                    onNewPark={() => {
                      setWizardPark(pagePark ? { ...pagePark } : null);
                      setWizardDate(null);
                      setWizardOpen(true);
                    }}
                    unplannedPagePark={unplannedPagePark}
                    onStartPagePark={startPagePark}
                    onOpenWizard={() => {
                      setWizardPark(null);
                      setWizardDate(null);
                      setWizardOpen(true);
                    }}
                  />
                  {secondColumn && (
                    /* It slides in from its side, on the column itself: a transform on a descendant
                       does not flatten the sheet's blur, and a `subgrid` child has to be a direct
                       child of the grid. */
                    <PlannerDayColumn
                      parkSlug={secondColumn.parkSlug}
                      date={secondColumn.date}
                      primary={false}
                      active={focusSecond}
                      onActivate={(navigate) => focusColumn(true, navigate)}
                      open={open}
                      withFoot={!isPhone}
                      withHead={!isPhone}
                      /* Always `true`: a second column only exists off a phone. */
                      withBand
                      className="border-border/60 animate-in fade-in slide-in-from-right-4 row-span-3 grid grid-rows-subgrid border-l duration-200 ease-out motion-reduce:animate-none"
                      onPickPark={(slug) =>
                        plannerSecondColumn.open({ parkSlug: slug, date: secondColumn.date })
                      }
                      onPickDate={(date) => plannerSecondColumn.setDate(date)}
                      onNewPark={() => {
                        setWizardPark(null);
                        setWizardDate(null);
                        setWizardOpen(true);
                      }}
                      onClose={() => plannerSecondColumn.close()}
                    />
                  )}
                </div>

                {/* The other side of the row, `contents` at every size but one. On a landscape
                    phone it is the left column: `order-first` rather than another DOM order, so
                    rotating does not remount the search and the column, at the cost of tab order
                    running axis first. `overflow-y-auto`, since its rows are taller than the
                    row. */}
                <div
                  /* Named, so `check:planner` can ask this box whether it scrolls. */
                  data-planner-landscape-chrome=""
                  className={cn(
                    'contents',
                    /* The same gate as the row, or a 320 px box would sit in a flex column. `w-64`
                       below 40rem, `w-80` above, so a 568 px window still leaves the axis about
                       312. */
                    park &&
                      activeDate &&
                      'planner-landscape:flex planner-landscape:order-first planner-landscape:w-64 planner-landscape:sm:w-80 planner-landscape:min-h-0 planner-landscape:shrink-0 planner-landscape:flex-col planner-landscape:overflow-y-auto planner-landscape:overscroll-y-contain planner-landscape:border-border/60 planner-landscape:border-r'
                  )}
                >
                  {/* The day's context band, here only on a landscape phone, where 61 px above a
                      270 px axis would be a quarter of the day; elsewhere the column draws it. */}
                  {isLandscape && park && activeDate && (
                    <div className="border-border/60 min-w-0 shrink-0 border-b">
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

                  {/* The phone's ride search, the panel's own copy for the active day, since a
                      coarse pointer has no drag and drop; the desktop draws one per column
                      (`inline` on {@link PlannerRideSearch}). `isPhone`, not a CSS class: the panel
                      is client-only, and a hidden copy would be a second search field. */}
                  {isPhone && park && activeDate && (
                    /* Not `shrink-0`: in the stacked sheet this block gives way first, capped at
                       `32svh` and scrolling inside. On a landscape phone it does not shrink: the
                       column scrolls instead, and a shrinking search came out 0 px tall. */
                    <div
                      className={cn(
                        'planner-phone:max-h-[32svh] planner-wide:hidden planner-landscape:shrink-0 min-h-0 shrink overflow-y-auto overscroll-y-contain',
                        // Search mode: the sheet is this block's, and the list
                        // inside it scrolls rather than the block.
                        searchMode &&
                          'planner-phone:max-h-none flex flex-1 flex-col overflow-hidden',
                        // At rest on a portrait phone the block is one 45 px row
                        // (see `compact`), with nothing below it to give away:
                        // squeezed, it would clip the row it is.
                        phoneSearch && !searchMode && 'shrink-0'
                      )}
                    >
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
                        showPicker={
                          <PlannerDayShowPicker
                            parkSlug={park.slug}
                            parkName={park.name}
                            geo={park.geo}
                            timezone={resolveTimeZone(day?.timezone ?? park.timezone)}
                            date={activeDate}
                            day={day}
                            entries={activeEntries}
                          />
                        }
                        searching={searchMode}
                        onSearchingChange={setSearching}
                        compact={phoneSearch}
                      />
                    </div>
                  )}

                  {/* Named once, only where the gesture exists, and not on an empty day, whose axis
                      says the same sentence from the same key. */}
                  <PlannerDragCoach
                    show={Boolean(pagePark && park && activeDate && activeEntries.length > 0)}
                  />

                  {/* The active day's foot, phone only: the desktop's is drawn per column.
                      `isPhone` rather than a CSS class, since the panel is client-only and two
                      copies would duplicate `data-planner-optimize`. See `PlannerDayFoot`. */}
                  {isPhone && park && activeDate && (
                    /* `contents`, so the foot's rows stay rows of the sheet;
                     `hidden` while the phone searches, and kept mounted, so an
                     undo waiting in the optimise row is still there after. */
                    <div className={cn('contents', searchMode && 'hidden')}>
                      <PlannerDayFoot
                        parkSlug={park.slug}
                        parkName={park.name}
                        geo={park.geo}
                        date={activeDate}
                        day={day ?? null}
                        grid={grid}
                        timezone={resolveTimeZone(day?.timezone ?? park.timezone)}
                        prefs={prefs}
                        entries={activeEntries}
                        onAddFreeBlock={addFreeBlock}
                        /* The phone's show switch, only for a day with shows, or the row would be
                           drawn for an empty control. See `actionsTrailing`. */
                        actionsTrailing={dayHasShowLines(day) ? <PlannerShowsButton /> : undefined}
                      />
                    </div>
                  )}

                  {/* An offer about a different day than the one on screen, so below the search and
                      not in the header. Renders nothing unless the visitor is in another park. */}
                  <div className={cn('contents', searchMode && 'hidden')}>
                    <PlannerInParkCta activeParkSlug={activeParkSlug} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Mounted only while it is open, which is what resets its answers —
            see the note on `PlannerWizard`'s `open` prop. It lands on the park's
            own page, so it closes this panel's overview on the way. */}
          {wizardOpen && (
            <PlannerWizard
              open
              // From a park page the wizard opens on the calendar: the route already says which
              // park.
              initialPark={wizardPark}
              initialDate={wizardDate}
              initialRiderHeight={wizardHeight}
              onOpenChange={(next) => {
                setWizardOpen(next);
                if (!next) {
                  setShowOverview(false);
                  setWizardPark(null);
                  setWizardDate(null);
                  setWizardHeight(null);
                }
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* The launcher's question, when the day it would open on is over. Outside
        the sheet, because the sheet is exactly what has not been opened yet.
        Both buttons open the panel: „Neuen Tag planen" with the wizard on top,
        on the page's park where there is one, the other on the day that is
        over. Escape and the overlay open nothing. */}
      <ConfirmDialog
        marker="planner-past-day"
        open={pastDay !== null}
        onOpenChange={onAskingPastDayChange}
        icon={History}
        title={t('pastDay.title')}
        description={
          pastDay
            ? t('pastDay.body', { park: pastDay.parkName, date: longDate(pastDay.date, locale) })
            : undefined
        }
        confirmLabel={t('wizard.open')}
        cancelLabel={t('pastDay.view')}
        onConfirm={() => {
          startNewDay();
          onOpenChange(true);
        }}
        onCancel={() => onOpenChange(true)}
      />
    </>
  );
}
