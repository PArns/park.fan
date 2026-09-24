'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { useTranslations } from 'next-intl';
import { CalendarPlus, ChevronDown, Columns2, Plus, X } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PlannerContextBand, type PlannerDayState } from './planner-context-band';
import { PlannerPartyChips } from './planner-party-chips';
import { PlannerDayColumn } from './planner-day-column';
import { PlannerColumnHead } from './planner-column-head';
import { PlannerRideSearch } from './planner-ride-search';
import { PlannerOverview } from './planner-overview';
import { PlannerPushToggle } from './planner-push-toggle';
import { PlannerWizard, type WizardPark } from './planner-wizard';
import { PlannerInParkCta } from './planner-in-park-cta';
import { PlannerPanelPhoto } from './planner-panel-photo';
import { PlannerDayFoot } from './planner-day-foot';
import { PlannerDragCoach } from './planner-drag-coach';
import { usePlanner } from '@/lib/planner/use-planner';
import { usePlanDay } from '@/lib/hooks/use-plan-day';
import { occupiedMinutes } from '@/lib/planner/estimate';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { usePathname, useRouter } from '@/i18n/navigation';
import { buildDayGrid, growGridForSpans, nextFreeStart, nowFloor } from '@/lib/planner/day-grid';
import {
  PLANNER_LANDSCAPE_QUERY,
  PLANNER_PHONE_QUERY,
  usePlannerPxPerMin,
} from '@/lib/planner/use-grid-scale';
import { capturePointer, isSamePointer, releasePointer } from '@/lib/planner/pointer-capture';
import { addDays, dayClock, resolveTimeZone } from '@/lib/planner/park-time';
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
 * positioned ancestor of the desktop's close button, so scrolling it takes the
 * close button off screen. `components/ui/sheet.tsx` says so at the button, and
 * the burger menu solves it the same way. (The phone sheet drops that button
 * altogether — `hideClose` — and closes on its grab handle instead.)
 */
/** The planner's own route, in all six localized spellings. See `isPlannerPage`. */
const PLANNER_PATHS = new Set(Object.values(PLANNER_SEGMENTS).map((segment) => `/${segment}`));

/**
 * The heights the phone sheet rests at, the way an iOS sheet has detents.
 *
 * - `large` is where it opens: everything under the site header (PAR-313).
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
/** How far past the top of the screen a pull may stretch the sheet, rubber-banded. */
const SHEET_OVERPULL_PX = 24;

/**
 * Where the window is too short to spare the site header a strip (PAR-482).
 * There `large` opens the sheet over the header, up to `SHEET_TOP_GAP_PX`
 * under the top edge; on a taller window it stops under the header as before.
 * The CSS twin is the `@media` block beside `--planner-sheet-large`.
 */
const SHEET_SHORT_QUERY = '(height < 50rem)';
/** What a `large` sheet leaves of the page above it on a short window. */
const SHEET_TOP_GAP_PX = 12;
/** Under this, `full` is a sliver above `large` and is not offered. */
const SHEET_MIN_DETENT_STEP_PX = 24;

/**
 * The detents in pixels, for the drag, smallest first. At rest the sheet is
 * sized by the CSS twins of these (`--planner-sheet-large`,
 * `--planner-sheet-medium` in `app/globals.css`); the drag needs numbers to
 * compare against, and it reads the same arithmetic off the window it is
 * running in.
 */
function sheetDetentHeights(viewport: number, withMedium: boolean) {
  const short = window.matchMedia(SHEET_SHORT_QUERY).matches;
  const large = short ? viewport - SHEET_TOP_GAP_PX : Math.max(0.92 * viewport, viewport - 48);
  return [
    ...(withMedium ? [{ detent: 'medium' as const, height: 0.5 * viewport }] : []),
    { detent: 'large' as const, height: large },
    ...(viewport - large > SHEET_MIN_DETENT_STEP_PX
      ? [{ detent: 'full' as const, height: viewport }]
      : []),
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

export function PlannerFlyout({ open, onOpenChange }: PlannerFlyoutProps) {
  const t = useTranslations('planner');
  /** The axis' scale: 1.2 px per minute, 1.8 on a phone. See {@link usePlannerPxPerMin}. */
  const pxPerMin = usePlannerPxPerMin();
  // Only what the PANEL itself still uses. Everything that edits a day — the
  // moves, the ticks, the removals, the party prefs — moved into
  // `PlannerDayColumn` with the grid it acts on, because with two columns open
  // each of those verbs needs a park and a date and there are two of each.
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
  const [detent, setDetent] = useState<SheetDetent>('large');
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
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setShowOverview(false);
      setDetent('large');
    }
    onOpenChange(next);
  };

  const isPhone = useMediaQuery(PLANNER_PHONE_QUERY);
  /**
   * A landscape phone — the one size where the sheet is a ROW rather than a
   * stack, with the day's chrome left of the axis instead of above it.
   *
   * Always implies {@link isPhone}: the query is that one's height branch plus a
   * width term, so nothing here can be true where that is false. Read for the
   * one decision no class can make — which side of the row draws the context
   * band — and passed on as `withBand`, exactly as `isPhone` is passed on as
   * `withHead` and `withFoot`. Everything else the arrangement needs is
   * `planner-landscape:` in the markup below, so the sheet does not depend on
   * a hook having answered before it can be laid out.
   */
  const isLandscape = useMediaQuery(PLANNER_LANDSCAPE_QUERY);
  // A landscape phone has no `medium` detent (half of a 390 px window is not a
  // day), so a sheet left there in portrait comes back to `large` on rotation.
  // Adjusted during render rather than in an effect, like `focusSecond` below:
  // an effect would draw one frame of a half-height landscape sheet first.
  if (isLandscape && detent === 'medium') setDetent('large');
  const router = useRouter();
  /**
   * Whether the page behind the panel is the planner's own.
   *
   * `usePathname` from `@/i18n/navigation` strips the LOCALE and keeps the
   * localized SEGMENT — the two are different things, and reading it as the
   * first was a bug that shipped: matching `/trip-planner` alone left the guard
   * dead on `/de/tagesplaner`, `/fr/planificateur` and three more, i.e. in five
   * of six languages, on the one route it exists to protect. The rewrites in
   * `next.config.ts` serve all six on the English route folder, but a rewrite
   * does not change what the browser asked for and `usePathname` answers that.
   *
   * So: every segment, compared exactly. `header.tsx` matches
   * `BEST_TIME_SEGMENTS` the same way for the same reason, and `PLANNER_SEGMENTS`
   * is the one place those slugs are written down — a seventh locale adds itself
   * here. Exact rather than a prefix, or `/trip-planner-anything` would count.
   */
  const pathname = usePathname();
  const isPlannerPage = PLANNER_PATHS.has(pathname);

  const panelWidth = useSyncExternalStore(
    plannerPanelWidth.subscribe,
    plannerPanelWidth.getSnapshot,
    plannerPanelWidth.getServerSnapshot
  );

  /**
   * The second column, if there is room for one — and the switch, if there
   * COULD be. Two questions, and they used to be one.
   *
   * `twoColumnsFit` is about the PANEL as it stands: below two minimum widths
   * plus a divider, a second column would be narrower than a single one is ever
   * allowed to be, so this is what decides whether one is DRAWN. Gated rather
   * than hidden, because a column is not free — it is a `/plan/day` query, a
   * best-days snapshot and a grid — and a column nobody can see must not be paid
   * for. The arrangement itself survives: narrowing the panel puts the second
   * column away and widening it brings the same day back.
   *
   * `twoColumnsOffered` is about the WINDOW, and it decides whether the switch
   * is there. Hanging the switch on the panel's width made the feature
   * self-concealing: the default panel is 448 px, two columns need 681, so at
   * the width every visitor starts on there was no switch and nothing said the
   * planner had a second column at all — it had to be found by dragging the edge
   * far enough. The switch now widens the panel itself (below), which is only an
   * honest offer where the window can carry it: `fitToViewport` caps the panel
   * at `innerWidth - PAGE_MIN_PX`, so under `TWO_COLUMN_MIN_VIEWPORT` the cap
   * would take the width back in the same frame.
   *
   * `isPhone` is kept beside it, and since PAR-76 it is **load-bearing rather
   * than belt-and-braces**. It used to be unreachable — 639 px cannot also be
   * 1041 px — but `isPhone` stopped being a statement about width: a 1280x400
   * window on a coarse pointer is wide enough for `TWO_COLUMN_MIN_VIEWPORT` and
   * a phone by the height term, so without this guard it would be offered two
   * columns inside a bottom sheet. The two thresholds remain independent — one
   * is a breakpoint, the other falls out of `PANEL_WIDTH_MIN` and `PAGE_MIN_PX`
   * — and a phone is a bottom sheet the width of the screen, where no stored
   * width applies at all.
   */
  const twoColumnsFit = !isPhone && maxColumnsFor(panelWidth) === 2;
  const windowFitsTwoColumns = useMediaQuery(TWO_COLUMN_VIEWPORT_QUERY);
  const twoColumnsOffered = !isPhone && windowFitsTwoColumns;
  const storedColumn = useSyncExternalStore(
    plannerSecondColumn.subscribe,
    plannerSecondColumn.getSnapshot,
    plannerSecondColumn.getServerSnapshot
  );
  const secondColumn = twoColumnsFit ? storedColumn : null;

  const park = activeParkSlug ? state.parks[activeParkSlug] : null;

  // Ride cards on the page behind the panel become drag sources for as long as
  // the panel is open. A drag needs somewhere to land, and this is the only time
  // there is one — see `useRideDragSource` for why the payload is attached from
  // here rather than by the card.
  useRideDragSource(open);

  /** The wizard, which is how another day gets planned from in here. */
  const [wizardOpen, setWizardOpen] = useState(false);
  /** A park to open it on, so the first step can be skipped. */
  const [wizardPark, setWizardPark] = useState<WizardPark | null>(null);
  /**
   * A day to open it on, so the second step can be skipped too.
   *
   * Only ever set by {@link startPageDay}, and cleared everywhere `wizardPark`
   * is: a date left behind would seed the NEXT wizard — the one opened from
   * „Tag hier planen", which means "some day, you pick" — with a date chosen
   * on a page the reader has since left.
   */
  const [wizardDate, setWizardDate] = useState<string | null>(null);

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

  /**
   * How much of the day each block occupies, which two things need: the axis
   * has to be tall enough to contain them, and a new block has to be filed
   * somewhere none of them is.
   */
  const spans = useMemo(
    () =>
      activeEntries.map((entry) => ({
        startMinute: entry.startMinute,
        spanMinutes: occupiedMinutes(day, entry),
      })),
    [activeEntries, day]
  );

  /**
   * The park's axis, grown until it contains the plan.
   *
   * `openMin` and `closeMin` are untouched by the growth, so the opening-hours
   * band still marks the park's real day and everything that decides WHERE a
   * block may go — `clampStart`, `rideFloor` — still speaks for the park. What
   * grows is the canvas, and the room it gains is outside opening hours by
   * construction, so it is hatched like every other minute out there.
   */
  const grid = growGridForSpans(
    buildDayGrid(day?.context.openHour, day?.context.closeHour, pxPerMin),
    spans
  );

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

  /**
   * The photograph behind the panel, if the media database has one.
   *
   * Source and focal point travel as a PAIR: a `src` from `/plan/day` under a
   * `position` from the page beacon would crop one park's picture to another
   * park's curated point, and the two are separate fields with nothing
   * connecting them.
   *
   * The second branch is what changed. While the plan's park IS the page's park
   * — the ordinary case, since a day is usually started from the park's own
   * page — its picture is already here on the beacon, out of the same media
   * database `/plan/day` reads. Waiting for the query to say so opened the panel
   * on the drawn ground and swapped the photo in a moment later, and where
   * `/plan/day` 404s (it still does until the backend ships) the swap never came
   * at all. A DIFFERENT park is unchanged and still shows no photo until its own
   * answer arrives, which is the rule this branch was written for: a day whose
   * query is in flight must not briefly show another park's façade.
   */
  const samePark = pagePark && pagePark.slug === activeParkSlug ? pagePark : null;
  const panelPhoto = !activeParkSlug
    ? { src: pagePark?.backgroundImage, position: pagePark?.backgroundPosition }
    : day?.parkBackgroundImage
      ? { src: day.parkBackgroundImage, position: day.parkBackgroundPosition }
      : { src: samePark?.backgroundImage, position: samePark?.backgroundPosition };

  /** Starts the wizard on the CALENDAR — which park is settled by the route. */
  const startPagePark = useCallback(() => {
    if (!unplannedPagePark) return;
    setWizardPark({ ...unplannedPagePark });
    setWizardDate(null);
    setWizardOpen(true);
  }, [unplannedPagePark]);

  /**
   * Starts the wizard on „Wer kommt mit" — park and day both already answered.
   *
   * It reads `pagePark` rather than `unplannedPagePark`, and that difference is
   * the whole reason it is a second function instead of an argument to the one
   * above. `unplannedPagePark` asks "is there anything left to plan HERE", and
   * goes `null` the moment this park has any day open in the panel — which is
   * right for a button that offers the park in general and wrong for one that
   * names a date: „plane den 20." is a different question from „plane hier",
   * and a second day at a park that already has one is exactly what somebody
   * comparing two dates is about to ask for.
   *
   * `plannerPageDay.take` clears as it reads and refuses a date filed under
   * another park, so a stale hand-off degrades to the old behaviour rather
   * than to the wrong day.
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
   * The whole answer to a wizard request, as ONE callback.
   *
   * The choice between the two starts lives here rather than in the effect below, and that is not
   * a style preference: `react-hooks/set-state-in-effect` refuses an effect body that branches
   * into a `setState`, and the effect has to stay what it has always been — a comparison against
   * the last counter seen, then one call. Putting the branch in a callback keeps the rule
   * satisfied and keeps the two starts readable side by side.
   */
  const startFromRequest = useCallback(() => {
    // A request that left a day behind is answered by that day; anything else is the park-header
    // press this path was written for.
    if (startPageDay()) return;
    startPagePark();
  }, [startPageDay, startPagePark]);

  /**
   * Take the page behind the panel to a park's own page.
   *
   * Switching subject in the panel is switching subject on the page: the ride
   * cards a plan is filled from are on the park's own page, and a panel about
   * Europa-Park in front of Phantasialand's rides is a drag gesture with no
   * valid target — the grid refuses a ride whose park is not its own.
   *
   * It used to refuse wherever `plannerPagePark` was `null` — every route that
   * is not park-scoped — on the reasoning that there is no park page to return
   * from. That was the wrong half of the question and it was reported from the
   * homepage: two columns open, Toverland in the right one, and clicking it did
   * nothing at all. Whether the page in front of the reader is a park page has
   * no bearing on whether they want the park they just clicked; what decides it
   * is that the columns are the subject and the page is where the rides come
   * from.
   *
   * Two guards are left. A target that is already the page's park is a no-op
   * rather than a reload. And the planner's own page is not left at all — see
   * `isPlannerPage`.
   */
  const goToPark = useCallback(
    (slug: string | null) => {
      if (!slug || pagePark?.slug === slug) return;
      // The planner's OWN page is the one route this may not leave. Everywhere
      // else the page is a place to drag rides out of and following the panel
      // is the point; there, the page IS the panel's subject and navigating
      // away would close the thing somebody just opened.
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
   * Which of the two columns the reader is working in.
   *
   * Not the plan's active day, and the difference is the whole point: the
   * primary column IS `activeParkSlug`, so making a click there change it would
   * put the same day in both columns. This is a lighter thing — where the
   * pointer last was — and it decides two things: which column is marked, and
   * which park the page behind the panel shows.
   *
   * Local state rather than the store, so it lives exactly as long as the panel
   * does. A remembered focus would be a claim about what somebody was doing
   * yesterday.
   */
  const [focusSecond, setFocusSecond] = useState(false);
  /**
   * Focus a column, and — where the gesture was a plain one — take the page.
   *
   * The navigation hangs on the CHANGE, never on the press. With one column
   * open the focus can never change, so reading Toverland's page with a
   * Phantasialand plan open and touching the panel navigates nowhere.
   *
   * **`navigate` is what keeps a control from relocating the reader.** The
   * column arms this from `onPointerDownCapture` on its own root, so it fires
   * before the press reaches anything inside — including that column's close
   * button, its optimise bar, its free-block row and the grip of a block
   * somebody is starting to drag. Marking the column is right in all of those
   * (it IS the one being worked in); pushing a new route under a half-finished
   * drag, or moving the whole page as the answer to "close this column", is
   * not. The column decides which kind of press it was; see its capture
   * handler.
   *
   * **The push is outside the updater**, which is not a style question: React
   * may call an updater more than once — it does in StrictMode — and a
   * `router.push` in there is two history entries and two RSC fetches for one
   * press. The comparison it replaced is done against `focusSecond` here, where
   * a dependency covers it.
   */
  const focusColumn = useCallback(
    (second: boolean, navigate: boolean) => {
      if (second === focusSecond) return;
      setFocusSecond(second);
      if (navigate) goToPark(second ? (secondColumn?.parkSlug ?? null) : activeParkSlug);
    },
    [focusSecond, goToPark, secondColumn?.parkSlug, activeParkSlug]
  );
  // A closed second column cannot be the focused one. Adjusted during render
  // rather than in an effect — the state is derived from `secondColumn`, and an
  // effect would leave one render with the marker on a column that is gone.
  if (focusSecond && !secondColumn) setFocusSecond(false);

  /**
   * The park page's own button, answered.
   *
   * `ParkPlannerLink` in the park header asks for the panel AND for the wizard
   * on the park the route is about — `requestOpen(source, 'page-park-wizard')`
   * — and until this it only got the first half: the panel opened on whatever
   * it had been showing, with „Tag im Phantasialand planen" as a second button
   * inside it. The panel is the only place that can answer, because
   * `startPagePark` is the action and it reads the beacon, the plan and the
   * columns to decide what „this park, unplanned" means.
   *
   * The counter is compared against the last one SEEN rather than against zero,
   * for the same reason `PlannerLauncher` does it: a second press after the
   * reader has closed the panel is a second event, and a boolean would collapse
   * the two. `useRef(0)` is what makes the first press work at all — the panel
   * is lazily mounted, so on a page that has never opened it this effect first
   * runs with the counter already at 1, which is the press that mounted it.
   *
   * It is the store's WIZARD counter, so a plain panel request from the park
   * calendar or a ride button never reaches here at all — see
   * `plannerUi.getWizardSnapshot`, which explains why that question is answered
   * by a second subscription rather than by an intent read inside this effect.
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
    const clock = dayClock(activeDate, resolveTimeZone(day?.timezone ?? park.timezone));
    addCustom({
      parkSlug: park.slug,
      parkName: park.name,
      geo: park.geo,
      timezone: day?.timezone ?? park.timezone,
      date: activeDate,
      label: t('custom.defaultLabel'),
      icon: 'break',
      // Never before now: a break filed into a morning that has gone is the
      // same fault as a queue filed there. `nowFloor` is `openMin` on every
      // other date, so nothing about a future plan moves.
      startMinute: grid ? nextFreeStart(spans, grid, undefined, nowFloor(grid, clock)) : undefined,
    });
  };

  // The park's own three-month forecast. It is here for ONE reason — the zone
  // the effect below writes back — and it is the same query key the column's
  // day picker asks for, so the two share a request rather than making two.
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

  /**
   * What the head needs, where the PANEL draws it — see `phoneHead` below.
   *
   * All three are the column's own derivations, read from the same store and
   * the same query rather than passed down or fetched again: `dayFacts` above
   * is the key the column's day picker asks for, so the two share one request.
   */
  const parks = useMemo(() => Object.values(state.parks), [state.parks]);
  const plannedDates = useMemo(
    () =>
      park
        ? Object.values(park.days)
            .filter((entry) => entry.entries.length > 0)
            .map((entry) => entry.date)
        : [],
    [park]
  );
  /**
   * Whether the panel's header IS the column's head, which is the phone case.
   *
   * `!showOverview` for the same reason the column carries the head at all:
   * the overview replaces the day, and a park name and a date over a list of
   * OTHER days would be a statement about something that is not on screen.
   *
   * `parks.length > 0` is the COLUMN's own gate, deliberately, and not the
   * `park` the rest of this row hangs on. A plan can hold parks while
   * `activeParkSlug` points at none of them — `clearDay` drops a park whose
   * last day goes, and a stale id can arrive from `localStorage` — and in that
   * state the head is the park chooser, i.e. the way out. Asking for `park`
   * here took it off the phone entirely: no head in the header (this gate), no
   * head in the column (`withHead` is false there), and no chevron either,
   * since that one really is gated on `park`. A panel with a title and no
   * control in it. The desktop has always shown the chooser in exactly this
   * state, and now the phone shows it in the same place as everything else.
   *
   * What DOES follow `park` is the title's `sr-only` below: the word
   * „Tagesplaner" gives way to a park name, so it may only give way where
   * there is one.
   */
  const phoneHead = isPhone && !showOverview && parks.length > 0;

  /**
   * The grabber, dragged: the sheet follows the finger and snaps to a detent on
   * release, the way a sheet on iOS does (PAR-482).
   *
   * It used to commit on release against a distance and do nothing while the
   * finger moved, with two heights to choose from — so the grabber could make
   * the sheet bigger but never smaller, and nothing on screen answered the
   * drag until it was over. Now every move places the sheet, and the release
   * picks the detent nearest to where it was let go; a flick moves one detent
   * on from where the drag started even over a short distance, and a flick
   * down from `medium`, or a release well under it, closes the sheet.
   *
   * **Nothing here writes a `transform`.** The sheet is glass — a
   * `backdrop-blur` over the page — and a transform on it or an ancestor makes
   * it a backdrop root, which flattens the blur for as long as the transform is
   * there (see the note on the class list below). So the drag moves the sheet
   * with `bottom` and grows it with `height`, both plain layout properties:
   * below its layout height the sheet slides down with its bottom edge past
   * the screen, which is exactly how an iOS sheet's medium detent looks, and
   * only a pull above that height resizes it. Written straight onto the
   * element for the length of the gesture, not through React state — one
   * style write per pointer move instead of a render of the whole panel.
   *
   * On release the detent is committed with `flushSync` and the inline styles
   * come off in the same task, so the class transition (the iOS sheet curve,
   * see below) carries the sheet from where the finger left it to the detent.
   * A dismiss keeps them on, so the close animation starts where the sheet is
   * rather than jumping back to a detent first.
   */
  // A plain function, like `handleOpenChange` above it and for the same reason:
  // it closes over that one, which is not memoized, so a `useCallback` here would
  // either lie about its dependencies or be rebuilt every render anyway.
  const handleSheetGrab = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const handle = event.currentTarget;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const pointerId = event.pointerId;
    // Through the shared claim, like the grid's two gestures. A bare
    // `setPointerCapture` throws `NotFoundError` for a pointer id that is not
    // active, and an uncaught throw in a React event handler takes the whole
    // gesture with it — here, before `draggedSheet` has even been reset, which
    // leaves the NEXT tap on the handle reading as the end of this drag. The
    // return value is the second half: without a capture a handle-bound
    // `pointerup` never fires, so the listeners go to the document instead of
    // waiting for an event that is not coming.
    const bus = capturePointer(handle, pointerId);
    const startY = event.clientY;
    // A pointer drag ALWAYS ends in a click, so without this the tap handler
    // undid the drag one event later: pulling up set the sheet tall and the
    // click that followed toggled it straight back. Measured, not assumed — the
    // height came back 717 px before and 717 px after an 80 px pull.
    draggedSheet.current = false;

    // Where the sheet is, in the numbers the drag works in: how much of it is
    // on screen, and how tall its box is laid out. Taken once, at the press.
    const viewport = window.innerHeight;
    const box = sheet.getBoundingClientRect();
    const startVisible = viewport - box.top;
    const layoutHeight = box.height;
    // No `medium` on a landscape phone: half of a 390 px window is not a day.
    const detents = sheetDetentHeights(viewport, !isLandscape);
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
      sheet.style.bottom = `${visible - height}px`;
    };
    const unplace = () => {
      sheet.style.removeProperty('transition');
      sheet.style.removeProperty('height');
      sheet.style.removeProperty('max-height');
      sheet.style.removeProperty('bottom');
    };
    const visibleAt = (clientY: number) => {
      const visible = startVisible - (clientY - startY);
      const top = viewport;
      // Past the top of the screen the sheet resists, and stops.
      if (visible <= top) return Math.max(0, visible);
      return top + Math.min(SHEET_OVERPULL_PX, (visible - top) / 3);
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
      // The gesture's own finger. On the document fallback a second pointer's
      // `pointerup` would otherwise decide this sheet's height from a `dy`
      // measured against a `startY` it never had.
      if (!isSamePointer(upEvent, pointerId)) return;
      detach();
      const dy = upEvent.clientY - startY;
      if (Math.abs(dy) > SHEET_TAP_SLOP_PX) draggedSheet.current = true;
      if (!draggedSheet.current) {
        unplace();
        return;
      }
      const visible = visibleAt(upEvent.clientY);
      const velocity = lastT > prevT ? (lastY - prevY) / (lastT - prevT) : 0;
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

  // `null` only while the day payload is on its way. `/plan/day` answers with
  // showtimes for every date the picker offers — the operator's own listing for
  // today and for days already gone, the last matching weekday carried forward
  // for the rest — so the panel no longer has to say "not knowable". What it
  // does have to say is WHICH of the two it is looking at, which rides along on
  // each line as `source`.
  /* Whether the day's showtimes are drawn at all — a preference of this
     browser, remembered, and read here rather than in the band so the grid's
     lines and the band above them can never disagree. */

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
        /* Scopes the iOS no-zoom rule in `app/globals.css`: every text field in
           here has to render at 16 px on a touch screen, or focusing it zooms
           the page in for good and pushes the handle off the screen. */
        data-planner-sheet=""
        /* Not `SheetContent`'s own × on the phone: that one is drawn in the
           sheet's top-right corner, which on a phone is the sheet header's day
           picker. The phone draws its close button in the handle row instead
           (PAR-483), beside the handle that drags the sheet away and toggles
           its height on a tap. The desktop keeps this one: a side panel has no
           handle, and its outside press is deliberately swallowed by
           `onInteractOutside` below, so there the × and Escape are the whole
           list.

           Keyed on `isPhone` and not on a `max-sm:` class, because that is the
           condition the sheet's SHAPE is keyed on two lines up — `side` and
           `modal` read the same value, and a class would be a fourth copy of
           `PLANNER_PHONE_QUERY` free to drift from the other three the next
           time that query grows a term. The panel only mounts on an open, i.e.
           long after hydration, so `useMediaQuery`'s `false` server snapshot
           never reaches the screen here. */
        hideClose={isPhone}
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
           way out of a bottom sheet. Escape works in both; the × is the
           desktop's, see `hideClose` above. */
        onInteractOutside={(event) => {
          if (!isPhone) event.preventDefault();
        }}
        // `side="bottom"` ships `h-auto` and no ceiling, so the height is the
        // call site's business. `svh` rather than `vh`: on iOS the address bar
        // makes `vh` taller than what is actually visible, and the summary row
        // at the bottom would sit under it.
        className={cn(
          'planner-phone:rounded-t-2xl flex w-full flex-col gap-0 p-0',
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
          'border-border/70 planner-phone:border-t planner-wide:border-l planner-wide:shadow-2xl',
          // The width is the visitor's, so the class ceiling has to go — an
          // inline width beats `w-3/4` but not `max-w-md`, which would clamp
          // every drag past 448 px into looking broken rather than wide.
          'sm:max-w-none',
          // The handle's whole job. `svh` for the same reason the cap already
          // used it: on iOS `vh` counts the address bar and the summary row
          // would sit under it.
          //
          // 92 rather than the 85 it opened at, which Patrick asked for in as
          // many words ("der Flyout könnte auch höher sein"). 85svh is 717 px at
          // 844 — the very 716 the column's arithmetic is written against — and
          // the 15 % it left showed the page's tab bar under the sheet. 92svh is
          // 776, so the axis gains 59 px before anything else in this change has
          // been counted, and 68 px of the page behind it stays visible, which
          // is what keeps the sheet reading as a sheet.
          //
          // And 100 rather than the 96 the handle used to pull to, because
          // raising the resting height took the handle's job away: 96 − 92 is
          // 4svh, measured 776 → 810 px at 390×844, i.e. 34 px of travel where
          // it used to have 93. That is under half a 15-minute block on the
          // phone axis, and `check:planner` says so out loud — its
          // `after > before + 40` was green at 85svh and went red here. The
          // check is right and the sheet was wrong: a control that moves the
          // thing it grips by 34 px is a control nobody will pull twice.
          //
          // The 68 px it costs is the overlay, and that is the whole trade.
          // Pulled up, the modal shield is behind the sheet and tapping beside
          // it is no longer a way out — so what remains has to be real, and it
          // is: the handle takes the sheet back down (a drag, or a tap, which
          // is why the tap toggles rather than only dismissing), and the × in
          // the handle row closes it outright. That × was gone from PAR-188 to
          // PAR-483, and in that time a tap on the handle led into a state
          // whose only exit was a 90 px drag nobody was told about.
          //
          // **A PORTRAIT phone rests on the header instead of on a percentage**
          // (PAR-313). 92svh is 736 px at 800 and leaves 64, of which the site
          // header is 48 and the rest is a strip of page nobody reads — so the
          // sheet gave up a whole 15-minute block of axis to show 16 px of
          // park page. `calc(100svh-3rem)` is the same edge stated as what it
          // is: everything under the bar. The `3rem` is the `h-12` of
          // `<header>` — this does not RESERVE the bar's height, which is what
          // the four places in
          // `docs/rules/the-header-is-48-px-and-its-height-is-written-down-in-four.md`
          // do; it stops below it, and that rule's page names it as the one
          // reader of the number outside the four.
          //
          // Resting at a full `100svh` is what the report asked for and it is
          // not available: the handle's only job is the difference between the
          // two states, and at 100 there is no difference left to pull. 48 px
          // of travel is over the 40 `check:planner` asserts, where the 4svh
          // the handle used to have before PAR-188 was under it.
          //
          // **`max()` and not a branch on the orientation**, because the two
          // rules cross at a HEIGHT rather than at a shape: `h − 48 < 0.92·h`
          // holds for every `h < 600`, so subtracting the bar is the bigger
          // number on a tall window and the smaller one on a short window. A
          // landscape phone is short (359 px against 342 at 390 high) and so is
          // a 320×568 portrait phone and a split screen — an `isLandscape`
          // branch would have caught the first of those and quietly made the
          // other two SHORTER than they were. `max` takes whichever rule gives
          // the sheet more, at every size, with no size named anywhere.
          //
          // **Three detents since PAR-482, and a height rather than a cap.** The
          // resting height above is `large` (`--planner-sheet-large` in
          // `app/globals.css`, the same `max()`), 100svh is `full`, and
          // `medium` is half the screen: the sheet keeps its `large` box and
          // slides down with `bottom`, its lower half past the screen's edge,
          // which is what an iOS sheet's medium detent looks like and costs the
          // layout nothing. `h-*` beside `max-h-*` because the detent has to be
          // a place the sheet IS — with `h-auto` a short day drew a short
          // sheet, and `medium`'s offset, measured from the top of a `large`
          // box, would have pushed it off the screen. The `max-h` stays the
          // same value, which is what `check:planner` reads as the ceiling.
          detent === 'full'
            ? 'planner-phone:h-svh planner-phone:max-h-svh'
            : 'planner-phone:h-(--planner-sheet-large) planner-phone:max-h-(--planner-sheet-large)',
          detent === 'medium' &&
            'planner-phone:bottom-[calc(var(--planner-sheet-medium)_-_var(--planner-sheet-large))]',
          // Snapping to a detent, and opening and closing, on the curve iOS
          // uses for its sheets rather than a symmetric ease-in-out: fast off
          // the mark, long settle. `--tw-ease` and `--tw-duration` are what
          // `animate-in` reads too, so the slide in and out gets the same curve
          // (PAR-190). The desktop panel keeps its 300 ms: it is timed against
          // the page's own inset transition, which a phone does not have.
          'planner-phone:transition-[height,max-height,bottom] planner-phone:duration-[400ms] planner-phone:ease-[cubic-bezier(0.32,0.72,0,1)]'
        )}
        // Phone-only guard on the WIDTH, not on the markup: below `sm` this is
        // a bottom sheet spanning the viewport, and an inline pixel width would
        // hold it at 448 px in the middle of a 390 px screen.
        style={isPhone ? undefined : { width: panelWidth }}
        ref={sheetRef}
      >
        {/* First child, so everything after it paints over it.

            The picture is the PANEL's subject, and the subject is the plan's
            park where there is one and the page's park where there is not. That
            second half is what was missing: with nothing planned there is no
            `/plan/day` to answer with a photo, so the panel opened as a black
            rectangle on top of a park page that had one — and the empty state,
            the one screen that has to say what this thing is for, was the one
            screen with no park in it. Branching on the ACTIVE park rather than
            falling back per field, so a day whose query is still in flight
            shows nothing rather than briefly showing a different park.

            Nothing at all is now a drawn ground rather than a black rectangle —
            see `PlannerPanelPhoto`, which is where the 9-of-212 count that
            makes that the normal case is written down. */}
        <PlannerPanelPhoto src={panelPhoto.src} position={panelPhoto.position} />

        {/* ONE row, not two. The title sat on its own line with nothing beside
            it but Radix's 16 px close button, and the park name and the day
            picker sat on a second — 83 px of a panel whose subject is a
            vertical axis with 324 px to draw it in. Merged and at `py-2` the
            head is 45 px, and the row's height is the day picker's own 28 px.

            The desktop's `pr-7` is structural, not padding taste:
            `SheetContent` puts its close button at `absolute top-4 right-4`,
            which is now INSIDE this row, and without the clearance the picker's
            forward chevron sits under it and one of the two becomes
            untappable. */}
        {/* `planner-phone:py-0` rather than the `py-1` it had: the two controls
            in this row are 44 px tall on a phone now, so the padding that used
            to give a 28 px button air is 8 px this panel spends on nothing. The
            row is 44 px either way.

            The padding and those two controls are ONE decision and move
            together — which is why both carry `planner-phone:` and not the
            `max-sm:` they were written with. Split them and a landscape phone
            gets the tight padding with 28 px buttons still in it: a 29 px row of
            targets a thumb cannot hit, measured at 844x390 before this line was
            written. The clearance below is the same kind of pair and is keyed on
            `isPhone` for the same reason — it clears the close button, so it has
            to follow the condition that decides whether there IS one. */}
        {/* The header is also the grabber's row (PAR-482), and that is where the
            space went. The grabber used to have a 44 px row of its own with the
            bell and the × in its margins, 89 px of chrome before the day's first
            fact. Now the pill sits in a 16 px strip at the top of this header,
            the × is the last control in the row below it and the bell went to
            the foot's summary row: 61 px, the same targets.

            The handle is a button laid BEHIND the row (`absolute inset-0`, and
            the row after it in the DOM paints over it), so it takes a press
            wherever no control is: the strip across the top, the row's side
            padding. A control is never under it, which is what the 44 + 44
            px stack of two separate rows could not promise — see the note on
            the old pseudo-element in `docs/features/trip-planner.md`.
            `planner-wide:hidden`, because a side panel has no grabber. */}
        <SheetHeader className="border-border/60 planner-phone:pt-4 planner-phone:pb-0 relative shrink-0 gap-0 border-b px-3 py-2">
          <button
            type="button"
            onPointerDown={handleSheetGrab}
            onClick={() => {
              if (draggedSheet.current) return;
              const available = sheetDetentHeights(window.innerHeight, !isLandscape).map(
                (candidate) => candidate.detent
              );
              setDetent((value) => nextDetentOnTap(value, available));
            }}
            data-planner-sheet-handle=""
            data-planner-sheet-detent={detent}
            aria-label={t('sheet.handle')}
            aria-expanded={detent !== 'medium'}
            className="planner-wide:hidden absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
          >
            {/* iOS's own grabber: 36 × 5 px, centred in the strip. */}
            <span className="bg-muted-foreground/45 absolute top-[5px] left-1/2 h-[5px] w-9 -translate-x-1/2 rounded-full" />
          </button>
          {/* The clearance is for the × and goes with it. On a desktop
              `SheetContent` draws its close button `absolute top-4 right-4`,
              inside this very row, so `pr-7` keeps the last control out from
              under a 16 px target. The phone used to need `max-sm:pr-14` for
              the same reason and one size up — there the button is
              `max-sm:right-2 max-sm:size-11`, covering the rightmost 52 px
              against the 28 + 12 the desktop pair reserves, and 12 px of "einen
              Tag planen" sat under it. With `hideClose` there is nothing to
              clear on a phone, and holding the 56 px anyway would spend them on
              a button that is gone.

              `!isPhone` and not `sm:`, because `hideClose` two elements up is
              `isPhone`: a landscape phone is a phone by the height term but
              matches `sm:`, so a width class would hold 28 px clear of a button
              that is not drawn there. The × in `components/ui/sheet.tsx` keeps
              its own `max-sm:` sizing — that file is shared with every other
              sheet in the app — and the two never disagree, because on every
              window this branch calls a phone the button is gone entirely. */}
          {/* `relative`, so the row paints over the handle behind it and its
              controls take their own presses. */}
          <div className={cn('relative flex items-center gap-2', !isPhone && 'pr-7')}>
            {/* Radix wants a title and a phone has no room for one. 45 px went
                to this row and 45 to the column's own head, 90 px of a 776 px
                sheet spent saying "Tagesplaner" over a park name and a date —
                and the axis under them had 211. The two rows are one row there,
                and what gives way is the word for the thing the reader is
                already looking at. `sr-only` rather than gone: the sheet is a
                dialog and a dialog owes its reader a name.

                It stays visible wherever the row has no park name to carry it:
                the overview (which is not a day), a plan with no park in it at
                all, and the state where the plan holds parks but none of them
                is active — there the head is a chooser reading „kein Park",
                which labels a control and not the panel. `park` rather than
                `phoneHead`, so the row is never left without a name on it. */}
            <SheetTitle
              className={cn(
                'flex shrink-0 items-center gap-2 text-sm',
                phoneHead && park && 'sr-only'
              )}
            >
              <CalendarPlus className="size-4" />
              {t('title')}
            </SheetTitle>
            {/* The park and the day, on a phone. Same component, same place in
                the DOM, drawn by the panel instead of by the column — see
                `withHead` on {@link PlannerDayColumn}. Its own border and
                padding come off, because the row it is in already has both;
                `min-w-0` is what lets the park name truncate rather than push
                the day picker off the edge. */}
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
                /* The way into the overview, on the one arrangement where the
                   chevron beside the date is gone — see the note on the toggle
                   below. It is the park chooser's own foot, next to "Park
                   hinzufügen", because both rows answer the same question a
                   step apart: which plan am I in, and where is the other one. */
                onShowOverview={park ? () => setShowOverview(true) : undefined}
                className="min-w-0 flex-1 border-b-0 px-0 py-0"
              />
            )}
            {park && (
              <>
                {/* The park name is the way into the overview. It was a plain
                    label with a row of chips under it naming the OTHER parks,
                    and a chip said nothing about what was planned in one.

                    **Not while the phone's head is up** (PAR-313). There this
                    button is the icon alone — 44 px of chevron sitting against
                    the day picker's own `›` — and the report read it as a
                    minimize control, which is a fair reading of two chevrons
                    side by side. `!phoneHead` and not `!isPhone`: with the
                    overview OPEN `phoneHead` is false, and then this same
                    button is drawn with its word and is the only way back. So
                    what goes is the icon-only state and nothing else; the way
                    IN moved into the park chooser beside it, see
                    `onShowOverview` above. */}
                {!phoneHead && (
                  <button
                    type="button"
                    onClick={() => setShowOverview((value) => !value)}
                    aria-expanded={showOverview}
                    data-planner-overview-toggle=""
                    className="text-muted-foreground hover:text-foreground planner-phone:min-h-11 flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-0.5 text-xs transition-colors"
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
                )}
                {/* A day can be started from anywhere in the panel, not only
                    from inside the overview. It carries the page's park where
                    there is one, so the wizard opens on the calendar rather
                    than asking a question the route already answers.

                    NOT on a phone, and that is the decision this row cost.
                    Measured at 390 px, against the row as it then was — 295 px
                    (375 − twice the header's `px-3` − the 56 of
                    `max-sm:pr-14`) —, the day picker took 176 and each 44 px
                    target plus its gap 52. One of them left the park name
                    63 px; two left it **11**, i.e. no park name. Something had
                    to go, and of the four the
                    "+" is the only one that closes no ROUTE. Two things reach
                    what it reached, and it is worth being exact about which:
                      · a second day at the park on screen is the day picker
                        beside this, one tap on `›` — measured: the same park
                        on an unplanned date, with axis, ride search and
                        optimise, which is fewer taps than the "+" ever was;
                      · the WIZARD is behind the chevron, in the overview,
                        where a new day stands next to the days that exist.
                    What does not survive is the wizard arriving with the page's
                    park already filled in — the overview's start deliberately
                    asks that question, and seeding it would delete the park
                    step for everyone (`initialPark` drops `park` from `steps`
                    entirely, so it cannot be reached forwards or backwards).
                    That residue is PAR-181 rather than a decision taken here.
                    The day picker is the panel's most-pressed control and the
                    park name is what tells a reader which plan they are in.

                    And the budget the paragraph above is measured against has
                    since moved: dropping the × gave the row 351 px, i.e. 56
                    more, so two 44 px targets leave the park name 67 rather
                    than 11. That does not put the "+" back by itself — 67 is
                    still under the 80 „Phantasialand" measures, and the two
                    paths above still reach what it reached — but it does
                    re-open the question this comment closed, which is PAR-202.

                    `!isPhone` rather than `!phoneHead`: it is gone on a phone
                    for good, not only while the head is up. The overview is
                    where it went, and the overview is the other phone state. */}
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
                {/* The second column, on and off. The day picker that used to
                    sit here moved onto the column with the park name, because
                    with two of them a panel-level picker cannot say which day
                    it means — see `PlannerColumnHead`.

                    It opens on the day AFTER the active one, same park: "and
                    the day after" is the move two columns are for, and a second
                    column showing the same date twice would open on the one
                    arrangement that says nothing. The park is whatever is
                    active, so switching either column's park is one press away
                    and neither is decided here.

                    Wherever the WINDOW could carry two — see
                    `twoColumnsOffered` — and the press makes room for them. */}
                {activeDate && !showOverview && twoColumnsOffered && (
                  <button
                    type="button"
                    onClick={() => {
                      if (secondColumn) {
                        // Closing leaves the width alone: somebody who dragged
                        // the panel to 820 px asked for 820 px, and a switch
                        // that reset it would be undoing a different gesture.
                        plannerSecondColumn.close();
                        return;
                      }
                      // Widening is the switch's job now that it is offered
                      // below the width two columns need. `commit` rather than a
                      // write of our own, so this goes through the same clamp
                      // and the same storage key the edge drag uses — and only
                      // upwards, for the same reason closing does not touch it.
                      if (panelWidth < TWO_COLUMN_MIN_WIDTH) {
                        plannerPanelWidth.commit(TWO_COLUMN_MIN_WIDTH);
                      }
                      // A column narrowed away is remembered rather than
                      // forgotten, so widening brings that day back instead of
                      // overwriting it with tomorrow.
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
            {/* A drawn way out, on the phone as well (PAR-483). PAR-188 took the ×
                off this sheet and left the handle as the exit: a drag past
                `SHEET_DISMISS_PX`, or a tap on the shield beside the sheet. Both
                failed in the field. A tap on the handle — the first thing anybody
                tries — pulled the sheet up to 100svh, where the shield is 0 px
                tall, so the only exit left was a drag nothing on screen names.
                And on iOS a focused field under 16 px zooms the page in and never
                zooms back (see `[data-planner-sheet]` in `app/globals.css`), which
                slid the header off the top of the screen altogether: "der Planer
                lässt sich nicht schließen".

                The last control of this row rather than `SheetContent`'s own
                corner slot, which would sit on top of the day picker's `›` (what
                PAR-188 was about). Measured at 390 px the row is 366: the day
                picker takes 170 with its calendar icon folded away on a phone,
                this 44, and the park name keeps 136. */}
            {isPhone && (
              <SheetClose
                data-planner-sheet-close=""
                aria-label={t('sheet.close')}
                className="group text-muted-foreground hover:text-foreground flex size-11 shrink-0 items-center justify-center"
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
                // …and go to that park's page, because switching plans is
                // switching subject — see `goToPark`, which the column focus
                // uses for the same reason.
                goToPark(slug);
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
            {/* The columns. One is the plan's active day; a second is the day
                beside it, and both draw the same component so the chrome exists
                once in the code.

                A GRID rather than a flex row, and that is the whole of "make
                the two columns look like a pair". Side by side as flex children
                each column stacked its own head, its own context band and its
                own axis — and the band's height is DATA: a park whose day
                carries a school-holiday chip has a taller one, so the right
                column's 09:00 sat 28 px below the left column's 09:00 and every
                hour rule after it was out of step. Three rows here — head, band,
                body — which each column takes as `grid-rows-subgrid`, so the two
                bands are as tall as the taller one and the axes start on the
                same pixel. `minmax(0,1fr)` because a grid track's default `auto`
                minimum is its content, which a long ride name would push past
                the panel.

                A divider on the second column, because two grids of hour rules
                need an edge to be told apart by.

                Never on a phone: the sheet is the width of the screen there, and
                two columns of a 390 px one would be 195 px each against the
                318 px a single honest column needs. `isPhone` rather than a CSS
                breakpoint, because a second column also costs a `/plan/day`
                query and a hidden one must not be paid for. */}
            {/* The sheet's body, and on ONE size it is a row.

                `contents` everywhere else, which is the whole reason this
                wrapper is affordable: an element with `display: contents` draws
                no box at all, so at every other size the sheet's flex children
                are the same boxes in the same order as before this change and
                the portrait and desktop geometry cannot move by construction —
                measured, and it did not. The three viewports and their numbers
                are in `docs/features/trip-planner.md`.

                On a landscape phone it becomes the row: `min-h-0` so the axis'
                own scroller can bound itself, `flex-1` to take what the handle
                and the sheet header leave. Why a row: 844x390 stacks 343 px of
                chrome into a 359 px sheet and leaves the axis 16 px, and two
                hours of day is 216 px at `PX_PER_MIN_COARSE` — the rows have to
                move BESIDE the axis, because there is no order of them that
                fits above it. See `planner-landscape` in `app/globals.css` for
                the arithmetic and PAR-168 for the decision. */}
            <div
              className={cn(
                'contents',
                /* The row only where there IS a day, and that is not caution —
                   every row it puts on the left hangs on a chosen park and date,
                   so without one the left column would be 320 px of the 829 px
                   sheet standing empty beside its own divider, next to the empty
                   state that is the one screen this panel has to get right.
                   Without a day the sheet stays the stack it is today. */
                park &&
                  activeDate &&
                  'planner-landscape:flex planner-landscape:min-h-0 planner-landscape:flex-1 planner-landscape:flex-row'
              )}
            >
              <div
                className={cn(
                  'grid min-h-0 flex-1 grid-rows-[auto_auto_minmax(0,1fr)]',
                  /* `basis-auto` on a phone, since the sheet has a definite
                     height (PAR-482). `flex-1` is a ZERO basis, and against a
                     definite height that hands this box only what the rows
                     around it leave: the ride search kept its full 32svh and
                     the axis fell to its 200 px floor (372 → 200 px in
                     `check:planner`). With its content as the basis the
                     overflow is shared out by size, the way it was under
                     `h-auto`, and the search is again what gives way. The
                     landscape row keeps the zero basis — there this box shares
                     a ROW, where a content basis would be a width. */
                  'planner-phone:basis-auto planner-landscape:basis-0',
                  secondColumn ? 'grid-cols-2' : 'grid-cols-1'
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
                  /* It arrives from the side it comes from rather than appearing
                   in one frame — a 389 px block popping into a panel somebody
                   is reading is a jump, not a change. On a DESCENDANT, which is
                   the one place in this panel a transform is free: the glass is
                   `SheetContent`'s, and a transform on that (or on any ancestor
                   of it) makes it a backdrop root and flattens the blur. Short,
                   because the column is already correct the moment it is there
                   and the animation is only saying where it came from.
                   `motion-reduce:animate-none` for a reader who has asked for
                   none of this.

                   On the column itself rather than on a wrapper around it: a
                   `subgrid` child has to be a DIRECT child of the grid that owns
                   the rows, and a div in between would have taken the three rows
                   for itself and handed the column back one. */
                  <PlannerDayColumn
                    parkSlug={secondColumn.parkSlug}
                    date={secondColumn.date}
                    primary={false}
                    active={focusSecond}
                    onActivate={(navigate) => focusColumn(true, navigate)}
                    open={open}
                    withFoot={!isPhone}
                    withHead={!isPhone}
                    /* Never `!isLandscape`: a second column needs `!isPhone` to
                     exist at all, and a landscape phone is a phone — so this is
                     `true` wherever this element is drawn, and writing the
                     other thing would only suggest a case that cannot arise. */
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

              {/* The other side of the row, and `contents` everywhere else for the
                same reason the wrapper above is: at every size but one these
                are the sheet's own flex children, in this order, unchanged.

                On a landscape phone they become the left column — 20rem of the
                829 px sheet, which leaves the axis 509 and is a little over the
                318 px a single honest column is reckoned at elsewhere in this
                file. `order-first` rather than a different DOM order, so the
                reading order stays the one every other size has: the day, then
                what can be done to it.

                **That is a trade and it is worth naming.** `order` moves the box
                and not the document, so here the visual order runs left to right
                while tab and screen reader run right to left — the classic
                WCAG 2.4.3 divergence. The alternative is reordering the children
                for one size, which in React means these components unmount and
                remount on rotation: the ride search loses its query, the column
                its scroll position and its selected block. A reader who tabs
                gets the axis before the controls that act on it, which is the
                same order every other size gives them; a reader who rotates
                keeps their work. See `docs/features/trip-planner.md`.

                `overflow-y-auto` because the rows inside add up to more than the
                270 px this row has — optimize 61, headliners up to 96, the free
                block 33, the summary 37, the push toggle 30, plus the band and
                whatever the search is showing. Above the axis that arithmetic
                was the bug; beside it, it is a scrollbar in a column nobody has
                to scroll to see the day. */}
              <div
                /* Named, so `check:planner` can ask THIS box whether it scrolls
                   rather than walking up from the band inside it. Present at
                   every size, like every other `data-planner-*` here — what the
                   variants decide is the display, not the markup. */
                data-planner-landscape-chrome=""
                className={cn(
                  'contents',
                  /* Same gate as the row above, and it has to be the same
                     expression: a column without the row around it would be a
                     320 px box inside a flex COLUMN, i.e. a narrow strip where
                     the sheet used to be full width. */
                  park &&
                    activeDate &&
                    'planner-landscape:flex planner-landscape:order-first planner-landscape:w-80 planner-landscape:min-h-0 planner-landscape:shrink-0 planner-landscape:flex-col planner-landscape:overflow-y-auto planner-landscape:overscroll-y-contain planner-landscape:border-border/60 planner-landscape:border-r'
                )}
              >
                {/* The day's own head, and ONLY on a landscape phone — every other
                  size draws it inside the column, where `withBand` leaves it.
                  It is the same component with the same props either way; what
                  changes is which side of the row it stands on, because 61 px
                  above a 270 px axis is a quarter of the day and 61 px beside it
                  is nothing. The border goes with it for the same reason it does
                  in the column: a rule with nothing above it is a stray
                  hairline. */}
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

                {/* PHONE ONLY, and that is the whole shape of this feature now.
                A coarse pointer has no drag and drop, so the search is the way
                a ride gets into a plan and it does the inserting. A fine
                pointer drags the ride card itself out of the page behind the
                panel — which is a better gesture, because it picks the hour at
                the same time — so the list below would be a second way in that
                costs the axis a third of the panel.

                `planner-wide:hidden` rather than `!isPhone`: `useMediaQuery` answers
                `false` on the server snapshot, so a JS branch ships the phone's
                markup in every desktop's first HTML and then deletes it. */}
                {park && activeDate && (
                  /* NOT `shrink-0`, unlike its neighbours: this is the block that
                 has to give way when the sheet runs out of room, or the floor
                 above it just moves the overflow onto the summary row. It keeps
                 a cap so it cannot take the sheet on a tall phone either, and
                 scrolls inside itself past that.

                 32svh, down from 46. The field report read "die Ride-Suche ist
                 höher als die Achse", and it was: 46svh is 388 px at 844, which
                 is more than the axis's whole box. The cap is now a little over
                 the axis's own 200 px floor (270 px at 844), so on a tall phone
                 the two are the same order of size and on a short one this is
                 still the element that gives way first.

                 **Except on a landscape phone, where it gives way to nothing.**
                 There this block is in the left column of a row whose content
                 (band 138, optimize 111, headliners 143, summary 37, push 63 at
                 320 px wide) is taller than the 269 px the column has — so every
                 pixel of that overflow landed on the one `shrink` child and the
                 search came out **0 px tall**, with its own inner element still
                 reporting a box and clipping to nothing. Measured. The column
                 scrolls there, which is the answer the stacked sheet does not
                 have: nothing has to give way, so nothing may. */
                  <div className="planner-phone:max-h-[32svh] planner-wide:hidden planner-landscape:shrink-0 min-h-0 shrink overflow-y-auto overscroll-y-contain">
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

                {/* The active day's foot, PHONE ONLY — the desktop's copy is drawn
                by each column, one set per column, because every control in
                here names a park and a date and there are two of each once a
                second column is open. A phone never has a second column, and
                the arithmetic that keeps it here is in `PlannerDayFoot`: inside
                the column it would leave the axis 119 px of a 716 px sheet.

                `isPhone` rather than the `planner-wide:hidden` the ride search below
                uses, and the difference is real: that class exists because
                `useMediaQuery` answers `false` on its server snapshot, and this
                panel is never server-rendered — it is mounted client-side the
                first time somebody asks for it, so the hook is right on its
                first render here. Two copies in the DOM would be two of every
                `data-planner-optimize` for a selector to pick the wrong one
                of. */}
                {isPhone && park && activeDate && (
                  <>
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
                      /* The bell, at the end of the day's total (PAR-482). It
                         sat in the grabber's row, which is gone; the summary
                         row is the day's own last line and the bell is about
                         this day. */
                      summaryTrailing={<PlannerPushToggle variant="icon" />}
                    />
                  </>
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
                nothing at all where push cannot work — see the component.

                `!isPhone` since PAR-313: on a phone the same component is the
                bell in the handle row, and two copies would be two
                `[data-planner-push]` for a selector to pick the wrong one of —
                and two `usePushSubscription()`, i.e. two `/api/push` requests
                and two states free to disagree about whether it is on. */}
                {!isPhone && activeEntries.length > 0 && (
                  <div className="border-border/60 shrink-0 border-t">
                    <PlannerPushToggle />
                  </div>
                )}
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
            // Started FROM a park page, the wizard opens on the calendar: the
            // first question is already answered by where the reader is
            // standing, and asking it again is the panel pretending not to know
            // what page it is on.
            initialPark={wizardPark}
            initialDate={wizardDate}
            onOpenChange={(next) => {
              setWizardOpen(next);
              if (!next) {
                setShowOverview(false);
                setWizardPark(null);
                setWizardDate(null);
              }
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
