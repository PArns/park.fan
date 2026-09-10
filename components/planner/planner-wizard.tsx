'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Crown,
  Droplets,
  Ruler,
  Utensils,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { ParkTimeRange } from '@/components/common/park-time';
import { RiderHeight, Temp } from '@/components/common/unit-display';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { getCountryName } from '@/lib/utils/region-names';
import { cn } from '@/lib/utils';
import { usePlanner } from '@/lib/planner/use-planner';
import { usePlannerDayFacts } from '@/lib/planner/use-day-facts';
import { usePlanDay } from '@/lib/hooks/use-plan-day';
import { plannerUi } from '@/lib/planner/ui-store';
import { formatGridTime, longDate, todayInZone } from '@/lib/planner/park-time';
import { RIDER_HEIGHT_CHOICES, RIDER_HEIGHT_DEFAULT_CM } from '@/lib/planner/party';
import { buildDayGrid } from '@/lib/planner/day-grid';
import { headlinersToAdd } from '@/lib/planner/optimize';
import {
  evaluateFit,
  fitBlocks,
  fitChoiceAll,
  fitLeverView,
  fitOrder,
  fitWishes,
  togglePin,
  toggleLever,
  toggleWish,
  type FitChoice,
  type FitInput,
} from '@/lib/planner/fit';
import type { CalendarDay, PlanDay } from '@/lib/api/types';
import type { PlannerDayPrefs } from '@/lib/planner/types';
import { PlannerParkSearch, type PlannerParkPick } from './planner-park-search';
import { PlannerMonthCalendar } from './planner-month-calendar';
import { PlannerFitLevers } from './planner-fit-levers';
import { PlannerFitList } from './planner-fit-list';
import { PlannerStepRail } from './planner-step-rail';

/**
 * A park as the wizard holds it.
 *
 * Everything past `geo` is decoration the SEARCH happened to hand over and the
 * hero paints — a photograph and a place name. All of it optional, because the
 * other way in carries none of it: "another day at this park" comes from the
 * plan itself, which stores the four slugs and the name and nothing else.
 */
export interface WizardPark extends PlannerParkPick {
  timezone?: string;
}

interface PlannerWizardProps {
  /**
   * Always `true` in practice: the wizard is MOUNTED when it opens and
   * unmounted when it closes, which is how the answers reset. An effect that
   * cleared them on close was the first version, and React 19 rejects a
   * `setState` in an effect body outright (`react-hooks/set-state-in-effect`) —
   * rightly, because the mount boundary already does it for free and cannot
   * forget a field.
   */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * A park to start on, which skips the first step. What "another day at this
   * park" passes, from the panel's own overview.
   */
  initialPark?: WizardPark | null;
  /**
   * A day to start on, which skips the second step as well.
   *
   * Only meaningful together with {@link initialPark} — a date without a park
   * is a day at nowhere, and the step list below ignores it in that case
   * rather than opening on a „Wer kommt mit" for a park nobody has named.
   *
   * What passes it is the calendar's day comparison: somebody who has just put
   * two dates side by side and pressed „Diesen Tag planen" has answered both
   * of the first two questions, and the wizard opening on the date step would
   * be asking one of them for the second time.
   */
  initialDate?: string | null;
}

type Step = 'park' | 'date' | 'setup' | 'headliners';

/**
 * Park-local minutes the lunch block starts at.
 *
 * A default, not a claim: the park's opening hours are not in the snapshot this
 * dialog reads (it carries status, crowd level and holiday flags — measured, not
 * assumed), so there is nothing to centre a break in yet. 12:30 is where a
 * European park's lunch queue is worst, the block is draggable the moment the
 * panel opens, and the alternative — asking about lunch and then putting the
 * block at the first free minute of the morning — would be worse.
 */
const LUNCH_START_MINUTE = 12 * 60 + 30;
const LUNCH_MINUTES = 60;

/**
 * The id the probe files its lunch block under.
 *
 * It never reaches the store — the block is created by `addCustom` at the end,
 * with an id the store mints — but the fit step reads the block back out of
 * `evaluateFit`'s answer to find out whether it survived, and by how much it
 * was cut short. Named rather than repeated, because the two halves have to be
 * the same string or the wizard files an hour the visitor gave up.
 */
const LUNCH_ENTRY_ID = 'wizard-lunch';

/**
 * The elements an Enter already belongs to, as a selector.
 *
 * The first four are `PlannerDayColumn`'s guard for its Delete key, copied for
 * the same reason: a key pressed inside a field is the field's, and the panel
 * over there carries a search box and an editable block label. What is added
 * here are the controls the BROWSER itself acts on — Enter on a `<button>` or a
 * link fires that element's click — so reading the same keystroke as "next
 * step" would run two actions from one press. In this dialog that is not
 * hypothetical: every day of the month grid is a `<button>` whose click picks
 * the date, and the footer's own „Weiter" is one too, which would advance twice.
 *
 * `contenteditable` is spelled out in its two truthy forms rather than as a
 * bare attribute selector, exactly as one file over: `contenteditable="false"`
 * marks an element that does NOT own the key.
 */
const ENTER_BELONGS_TO =
  'input, textarea, select, button, a[href], [role="button"], [contenteditable=""], [contenteditable="true"]';

/**
 * Planning a day, one question at a time.
 *
 * The feature's way in was a search field: type a park, and a panel opened on
 * an empty timeline for today, in the reader's own timezone, with no indication
 * of what to do next. Everything that made the day plannable — which day, who is
 * coming, whether the park is even open — had to be discovered afterwards, in a
 * panel, one control at a time. This asks the three questions in the order
 * somebody actually answers them, and then puts them on the park's own page,
 * where the ride cards are.
 *
 * Each step is a question, and none of them invents an answer:
 *
 * 1. **Which park.** The site's own search, so the four URL slugs a plan is
 *    filed under come from the API rather than being reconstructed from a name.
 * 2. **Which day**, on a month grid tinted with that park's own crowd forecast —
 *    the reason the step is worth a screen. The forecast also carries the park's
 *    TIMEZONE, which is what stops a plan being filed under the reader's date.
 * 3. **Who is coming.** Two answers that keep mattering (the shortest rider's
 *    height, whether the party wants to stay dry — both flags, never filters)
 *    and one that is just a block in the day (lunch).
 *
 * It ends on the park page with the panel open, because dragging a ride card
 * into the day is the gesture the whole feature is built around and there are no
 * ride cards in a dialog.
 *
 * **The frame is three fixed pieces around one changing one** — a photo band, a
 * progress rail, the step, a footer — which is what makes it read as one object
 * being filled in rather than three dialogs in a row. The first version was a
 * shadcn dialog with a title, the line "Schritt 2 von 3 · Tag" and a pair of
 * buttons: correct, and indistinguishable from a cookie prompt. Nothing about
 * it said the subject was a day out at a named park, though the search payload
 * had been carrying that park's own photograph the whole time.
 */
export function PlannerWizard({
  open,
  onOpenChange,
  initialPark = null,
  initialDate = null,
}: PlannerWizardProps) {
  /** A date only counts where a park came with it — see `initialDate`. */
  const seededDate = initialPark ? initialDate : null;
  const t = useTranslations('planner');
  const locale = useLocale();
  const router = useRouter();
  const { state, openDay, setDayPrefs, addCustom, applyPlan } = usePlanner();

  const [park, setPark] = useState<WizardPark | null>(initialPark);
  const [step, setStep] = useState<Step>(seededDate ? 'setup' : initialPark ? 'date' : 'park');
  // Which way the last move went, which is all the step transition needs to
  // know — see `STEP_MOTION`.
  const [forward, setForward] = useState(true);
  const [date, setDate] = useState<string | null>(seededDate);
  const [prefs, setPrefs] = useState<PlannerDayPrefs>({});
  const [lunch, setLunch] = useState(false);
  const [planHeadliners, setPlanHeadliners] = useState(false);
  /**
   * Which big rides, in which order of importance, and what to do about the
   * break — the fit assistant's own answer, asked here one step earlier.
   *
   * It is held even while the toggle above is off, so switching the step back
   * on does not throw away an order somebody already put the rides in. What it
   * decides is only ever read where `planHeadliners` is true; see `finish`.
   */
  const [fitChoice, setFitChoice] = useState<FitChoice>(() => fitChoiceAll());

  const facts = usePlannerDayFacts(park, open && step !== 'park');
  /**
   * Opening hours and weather for the day being picked.
   *
   * The best-days snapshot the calendar runs on answers `hours: null` and
   * `weather: null` on every one of its 91 days — checked against the live
   * endpoint, not assumed — so the card under the calendar could only ever show
   * a crowd chip. `/plan/day` carries both in its `context`, and asking for it
   * here is not a request the wizard spends: it is the exact query the panel
   * runs the moment this wizard finishes, under the same key, so the last step
   * warms the first screen of the next one.
   */
  const planDay = usePlanDay({
    continent: park?.geo.continent ?? '',
    country: park?.geo.country ?? '',
    city: park?.geo.city ?? '',
    parkSlug: park?.slug ?? '',
    date: date ?? undefined,
    // `step !== 'park'` rather than `step === 'date'`: a wizard seeded with a date never VISITS
    // the date step, so the gate that used to be satisfied on the way past it is never satisfied
    // at all — `planDay.data` stays undefined, the last step finds no headliners, and „Große
    // Bahnen" reports that the day has none. On the ordinary path this changes nothing that shows:
    // `date` is null until the date step answers it, and afterwards the query is already cached
    // under the same key.
    enabled: open && step !== 'park' && Boolean(park && date),
  });
  /**
   * The park's photograph, held for as long as the park is the park.
   *
   * `parkBackgroundImage` rides on the `/plan/day` payload and is a property of
   * the PARK — the same file for every date it is ever asked about. The query
   * it rides on is keyed by the DATE though, so every arrow press in the
   * calendar starts a new one, `planDay.data` is `undefined` for as long as
   * that is in flight, and the band fell back to its no-photo state and faded
   * the same picture back in on arrival: a photograph blinking once per press,
   * on the one screen whose whole job is pressing them. A day the park is shut
   * did it for good — `/plan/day` answers 404 there and the hook resolves that
   * to `null`, so the picture left and did not come back, on a step where the
   * park has not changed and the picture is a statement about the park.
   *
   * The slug travels with the photo, so there is nothing here to clear: a
   * picture remembered for another park is simply not this park's, and the read
   * below says so. That is also what makes going back to the search and picking
   * a second park safe without an effect watching for it.
   *
   * **Adjusted during render rather than in an effect**, which is the shape
   * React documents for holding a value across a prop change and the shape this
   * codebase is held to anyway (`react-hooks/set-state-in-effect`). It is also
   * the better of the two here: an effect would commit the photo one render
   * late, which is a frame of the no-photo state on the way IN as well.
   *
   * The search path never comes through here — a hit carries its own
   * `imageUrl`, and {@link WizardHero} prefers it.
   */
  const [parkPhoto, setParkPhoto] = useState<{
    slug: string;
    src: string;
    position?: string;
  } | null>(null);
  const parkSlug = park?.slug;
  const dayPhoto = planDay.data?.parkBackgroundImage;
  const dayPhotoPosition = planDay.data?.parkBackgroundPosition;
  if (parkSlug && dayPhoto && (parkPhoto?.slug !== parkSlug || parkPhoto.src !== dayPhoto)) {
    setParkPhoto({ slug: parkSlug, src: dayPhoto, position: dayPhotoPosition });
  }
  const heldPhoto = parkSlug && parkPhoto?.slug === parkSlug ? parkPhoto : null;
  // The park's own zone where the forecast has arrived, the reader's until then.
  // Never a constant: `todayInZone` names that fallback and is the only door to it.
  const today = todayInZone(facts.timezone ?? park?.timezone);
  const chosen = date ? facts.byDate.get(date) : undefined;

  /**
   * The park's headliners for this day, and how many of them the day holds.
   *
   * The wizard has the day payload already — it is what paints the hero — so
   * asking the optimiser what fits costs one search and no request. It answers
   * the question the visitor is standing in front of: "put the big rides in for
   * me" is only a promise the app can keep where they all fit, and where they
   * do not, saying so here is the difference between an offer and a surprise.
   *
   * The probe plans against the same day the finish will: with the lunch block
   * where the wizard would put it, because an hour out of the middle is what
   * decides the last headliner. Memoised on everything it reads, or the search
   * would run on every keystroke of the step.
   */
  const dayPayload = planDay.data ?? null;
  /**
   * Is the DAY still on its way — the payload the headliner step is made of.
   *
   * Not `facts.pending`. `facts` is the best-days snapshot, keyed by park alone
   * and already cached by four components on a park page; it answers instantly
   * while `/plan/day` — keyed by park AND date, refetched on every arrow press —
   * is still in flight. Waiting on the wrong one is the same as not waiting.
   *
   * `data === undefined` rather than `!data`, for the reason the same distinction
   * exists in `use-day-facts`: a shut day answers 404 and the hook resolves that
   * to `null`, which is an ANSWER. `!data` would hold the step open for ever on
   * exactly the days that have nothing to offer.
   */
  const dayPending = Boolean(park && date) && planDay.data === undefined && !planDay.isError;
  const wizardGrid = useMemo(
    () => buildDayGrid(dayPayload?.context.openHour, dayPayload?.context.closeHour),
    [dayPayload]
  );
  const headliners = useMemo(() => headlinersToAdd(dayPayload, [], prefs), [dayPayload, prefs]);
  const lunchLabel = t('wizard.blocks.lunch');
  const lunchEntries = useMemo(
    () =>
      lunch
        ? [
            {
              id: LUNCH_ENTRY_ID,
              custom: {
                label: lunchLabel,
                icon: 'food' as const,
                durationMinutes: LUNCH_MINUTES,
              },
              startMinute: LUNCH_START_MINUTE,
            },
          ]
        : [],
    [lunch, lunchLabel]
  );

  /**
   * The last step's whole subject: which big rides, against which day.
   *
   * `null` where there is nothing to decide — no payload, no axis, or a park
   * with no headliners the day is missing. Everything below reads it and does
   * the same, so the step draws one sentence instead of a dead control.
   */
  const fitInput = useMemo<FitInput | null>(() => {
    if (!dayPayload || !wizardGrid || headliners.length === 0) return null;
    return {
      day: dayPayload,
      grid: wizardGrid,
      entries: lunchEntries,
      wishes: fitWishes(dayPayload, lunchEntries, headliners),
      blocks: fitBlocks(lunchEntries),
    };
  }, [dayPayload, wizardGrid, headliners, lunchEntries]);

  const fitOutcome = useMemo(
    () => (fitInput ? evaluateFit(fitInput, fitChoice) : null),
    [fitInput, fitChoice]
  );
  const fitLevers = useMemo(
    () => (fitInput ? fitLeverView(fitInput, fitChoice) : null),
    [fitInput, fitChoice]
  );
  const fitWishOrder = useMemo(
    () => (fitInput ? fitOrder(fitInput, fitChoice) : []),
    [fitInput, fitChoice]
  );
  const fitMissed = useMemo(() => new Set(fitOutcome?.missed ?? []), [fitOutcome]);
  const fitPinned = useMemo(() => new Set(fitChoice.priority), [fitChoice]);

  /** How many of the big rides are wanted, and how many the day holds. */
  const wantedHeadliners = fitInput
    ? fitInput.wishes.filter((wish) => !fitChoice.dropped.has(wish.key)).length
    : 0;
  const headlinerFit = fitOutcome ? fitOutcome.fitted.length : null;
  const headlinerConflict = headlinerFit !== null && headlinerFit < wantedHeadliners;
  /**
   * Whether the visitor has answered anything about this day yet.
   *
   * It is what keeps the fit block ON SCREEN after they fix the problem. The
   * block used to hang on `headlinerConflict` alone, so unticking the ride that
   * did not fit took the conflict away and the whole thing — levers, list,
   * marks — vanished under the finger that had just pressed a checkbox. The
   * reported version of that: start removing rides and the list is simply gone,
   * with no way back to it and no way to see what the removal bought.
   *
   * So the block appears while the day is short and stays for as long as
   * anything has been chosen, which is derived rather than latched: a
   * `useState` remembering "was tight once" would survive a change of park or
   * date underneath it, and this cannot.
   */
  const fitChoiceTouched =
    fitChoice.dropped.size > 0 ||
    fitChoice.priority.length > 0 ||
    fitChoice.droppedBlocks.size > 0 ||
    fitChoice.shortBlocks.size > 0;

  const plannedSlugs = new Set(Object.keys(state.parks));

  /**
   * Which questions are left, which is the same list the rail draws and the
   * footer walks. A step that is not in here cannot be reached forwards OR
   * backwards — which is what keeps „Zurück" on a seeded day from landing on
   * an empty date step: on `['setup','headliners']` the first step's index is
   * 0, and the back button is already disabled there.
   */
  const steps: Step[] = seededDate
    ? ['setup', 'headliners']
    : initialPark
      ? ['date', 'setup', 'headliners']
      : ['park', 'date', 'setup', 'headliners'];
  const index = steps.indexOf(step);

  const goTo = (next: Step) => {
    setForward(steps.indexOf(next) > index);
    setStep(next);
  };

  const finish = () => {
    if (!park || !date) return;
    // One park, one day, and the zone the forecast named — which is the whole
    // reason the date step fetches anything at all.
    const withZone: WizardPark = { ...park, timezone: facts.timezone ?? park.timezone };
    openDay(withZone, date);
    if (prefs.riderHeightCm !== undefined || prefs.avoidWet) {
      setDayPrefs(park.slug, date, prefs);
    }
    /**
     * The break, as the last step left it.
     *
     * „Ohne Mittagspause passt der Plan" is a lever on that step, so the block
     * the wizard files is the one the fit answer KEPT — gone where the visitor
     * pulled it, half as long where they cut it short, an hour otherwise.
     * Reading it back out of `evaluateFit` rather than off a second piece of
     * state is what makes the day that is filed the day that was shown: the
     * probe planned around this exact block.
     *
     * Only where the headliners are actually being planned. A lever pulled and
     * then abandoned by switching the toggle off is not an answer about lunch.
     */
    const plannedFit = planHeadliners ? fitOutcome : null;
    const lunchBlock = plannedFit
      ? (plannedFit.entries.find((entry) => entry.id === LUNCH_ENTRY_ID) ?? null)
      : (lunchEntries[0] ?? null);
    if (lunchBlock?.custom) {
      addCustom({
        parkSlug: park.slug,
        parkName: park.name,
        geo: park.geo,
        timezone: withZone.timezone,
        date,
        label: lunchBlock.custom.label,
        icon: 'food',
        startMinute: lunchBlock.startMinute,
        durationMinutes: lunchBlock.custom.durationMinutes,
      });
    }
    /**
     * The big rides, in the order the day is cheapest in.
     *
     * The same `FitChoice` the last step was drawn from, so what the visitor
     * saw marked „fällt weg" is what is missing from the axis — and the rides
     * they pinned are the ones that survived. Where they touched nothing it is
     * the engine's own answer (`Candidate.dropWeight`), which is what the
     * default has to mean if the step is not to be a toll gate.
     */
    if (plannedFit) {
      applyPlan({
        parkSlug: park.slug,
        parkName: park.name,
        geo: park.geo,
        timezone: withZone.timezone,
        date,
        // Only what is being ADDED: the lunch block is already in the store
        // with an id this plan does not know, and re-filing it here would put
        // a second one on the axis.
        stops: plannedFit.stops
          .filter((stop) => stop.entryId === null)
          .map((stop) => ({
            entryId: null,
            attractionSlug: stop.attractionSlug,
            attractionName: stop.attractionName,
            startMinute: stop.startMinute,
          })),
      });
    }
    plannerUi.requestOpen('wizard');
    onOpenChange(false);
    // The park's own page, where the ride cards are. `@/i18n/navigation`'s
    // router, so the localized path is built rather than guessed.
    //
    // With `#attractions`, because landing at the top of the page is landing
    // three screens above the only thing the panel wants: the cards. The hash
    // is the park page's own mechanism — `useTabHashRouting` selects that tab
    // and scrolls it under the sticky header — so this asks for the scroll in
    // the language the page already speaks instead of reaching for the DOM
    // after a navigation.
    router.push(
      `/parks/${park.geo.continent}/${park.geo.country}/${park.geo.city}/${park.slug}#attractions` as '/europe/germany/rust/europa-park'
    );
  };

  /**
   * The footer's primary control, as one object: what it does and whether it
   * may run.
   *
   * There are two callers now — the button and the Enter key — and the whole
   * point of the shape is that they cannot disagree. The obvious alternative
   * was a second condition beside the key handler ("Enter advances where there
   * is a date"), which is the same sentence written twice: the day the
   * date step grows a second required answer, one of the two copies keeps the
   * old one and Enter starts skipping a question the button still blocks.
   *
   * On the last step `enabled` repeats the condition `finish` itself refuses
   * on, which is what turned the finish button from always-enabled into a
   * control that states its own precondition. Nothing changes on screen — the
   * date step's own button is what gates the way in, and the rail leads
   * backwards only — but the guard inside `finish` is no longer the only place
   * that knows.
   *
   * `null` on the first step, and that is why the footer is absent there rather
   * than disabled: picking a park IS the advance, so a „Weiter" beside the list
   * is a control nobody ever presses, and Enter has nothing to do for the same
   * reason.
   */
  const primary: { run: () => void; enabled: boolean } | null =
    step === 'park'
      ? null
      : step === 'headliners'
        ? // Bewusst NICHT an `dayPending` gehängt. Der Schritt sagt oben, dass er
          // noch lädt, und das ist das, was er schuldet; den Knopf zusätzlich zu
          // sperren macht den Wizard unabschließbar, sobald `/plan/day` hängt
          // statt zu scheitern — ein `fetch` ohne Zeitgrenze setzt nie `isError`,
          // und dann ist auch Enter tot. Eine Oberfläche, aus der es keinen
          // Ausgang gibt, ist schlimmer als ein Tag ohne Headliner, den man
          // im Panel in zwei Griffen füllt.
          { run: finish, enabled: Boolean(park && date) }
        : { run: () => goTo(steps[Math.min(steps.length - 1, index + 1)]), enabled: Boolean(date) };

  /**
   * Enter moves the wizard on.
   *
   * Three questions on three screens, and until this the only way past each one
   * was the pointer: the day is answered on a grid the keyboard can reach, and
   * then the hand has to travel to a button in the corner to do the one thing
   * that obviously comes next.
   *
   * **It hangs on the dialog's content, not on `document`.** `PlannerDayColumn`
   * binds its Delete key to the document because it has nothing else to bind
   * to — a block selected with the pointer leaves no element focused, so there
   * is no node the key is guaranteed to pass through. This dialog is the
   * opposite case: it is a focus trap, so every keystroke made while it is open
   * lands on a descendant of the content and bubbles through here by
   * construction. A document listener would additionally fire for the park page
   * and the planner panel BEHIND the dialog, and would have to re-derive from
   * `open` and from the event target what the DOM already knows; it would also
   * keep listening through the close animation, while Radix still has the
   * content mounted.
   *
   * **What Enter does is the footer's primary button and only that** — see
   * `primary`, which the button renders off as well. So a step whose question
   * has no answer yet ignores the key for exactly the reason the button is
   * grey.
   *
   * **A key that belongs to the focused element stays with it** (see
   * `ENTER_BELONGS_TO`). The park search keeps its own Enter — it picks the
   * highlighted hit, which is the whole reason that handler exists — and it
   * keeps it as an `<input>`, by the general rule, not by a name check for that
   * component. A day cell in the month grid keeps its Enter the same way, so
   * picking a date and skipping the step can never be one press.
   * `defaultPrevented` is checked on top of the selector, so a control that
   * handled the key without being on that list is still believed.
   *
   * `event.repeat` is refused because a held key would otherwise walk the last
   * two steps and finish the wizard while the finger is still down.
   */
  const advanceOnEnter = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || event.repeat || event.defaultPrevented) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest(ENTER_BELONGS_TO)) return;
    if (!primary?.enabled) return;
    event.preventDefault();
    primary.run();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* `flex flex-col` over the grid the dialog ships with, and `p-0` so the
          photo band can reach all four edges. The middle row is the only one
          that scrolls, which is what keeps the band and the buttons in place on
          a phone in landscape. */}
      <DialogContent
        showCloseButton={false}
        onKeyDown={advanceOnEnter}
        className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        {/* The step, spoken rather than drawn. The rail below says the same
            thing in three circles, which a screen reader cannot read as
            progress — and Radix wants a description on every dialog. */}
        <DialogDescription className="sr-only">
          {t('wizard.step', { step: index + 1, total: steps.length })} · {t(`wizard.steps.${step}`)}
        </DialogDescription>

        <WizardHero
          park={park}
          date={date}
          locale={locale}
          plannedDays={plannedDatesFor(state, park?.slug).length}
          /* The park's picture for the three ways in that do NOT come through
             the search — „+ Weiterer Tag", the panel's „+", the in-park CTA —
             where the park comes out of the plan and a plan stores slugs rather
             than asset URLs. It is the same photograph, from a payload this
             dialog already fetches — held per park rather than read off the
             current answer, see `parkPhoto`. */
          dayPhoto={heldPhoto?.src ?? null}
          dayPhotoPosition={heldPhoto?.position}
        />
        <PlannerStepRail
          steps={steps.map((key) => ({ key, label: t(`wizard.steps.${key}`) }))}
          current={index}
          label={t('wizard.progress')}
          onJump={(to) => goTo(steps[to])}
        />

        {/* The only row that scrolls, and the only one with no height of its
            own — `min-h-0` is what lets a flex child shrink below its content so
            `overflow-y-auto` has something to do.

            Deliberately NO floor under it. Measured at 1280 and at 390, the
            body is 68/76 px on an empty search, 362/390 px with six hits,
            344/360 px on the calendar and 347/405 px on the last step (417/495
            with every answer switched on). A floor at the tallest would open the
            first step in a box two thirds empty, and a floor at the search
            list's height would not stop the frame moving anyway: step one swings
            300 px as the visitor types, which reads as the list arriving rather
            than as the dialog lurching, because a centred dialog grows from both
            edges at once. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {/* `key` remounts on every step, which is what re-triggers the CSS
              animation. `motion-safe:` is the whole reduced-motion guard, and
              it is CSS rather than GSAP on purpose: the house rules for GSAP
              (`use-menu-reveal`) exist because a REVEAL that strands leaves an
              invisible element behind, while a step swap animates content that
              CSS already has at its resting state — the same trade
              `tabs-with-hash` makes for the same reason, and it costs no chunk. */}
          <div key={step} className={cn('motion-safe:animate-in', STEP_MOTION[String(forward)])}>
            {step === 'park' && (
              <PlannerParkSearch
                plannedSlugs={plannedSlugs}
                onPick={(picked) => {
                  setPark(picked);
                  setForward(true);
                  setStep('date');
                }}
              />
            )}

            {step === 'date' && (
              <div className="flex flex-col gap-3">
                <PlannerMonthCalendar
                  value={date}
                  onChange={setDate}
                  today={today}
                  plannedDates={plannedDatesFor(state, park?.slug)}
                  facts={facts.byDate}
                  maxDate={facts.lastDate ?? undefined}
                  size="roomy"
                />
                <WizardDayCard
                  date={date}
                  day={chosen}
                  context={planDay.data?.context ?? null}
                  timezone={facts.timezone}
                  hasSchedule={facts.hasOperatingSchedule}
                  loading={facts.loading}
                />
              </div>
            )}

            {step === 'setup' && (
              <div className="flex flex-col gap-2.5">
                <WizardToggle
                  icon={Utensils}
                  label={t('wizard.lunch.label')}
                  hint={t('wizard.lunch.hint')}
                  checked={lunch}
                  onChange={setLunch}
                />

                <WizardToggle
                  icon={Ruler}
                  label={t('wizard.kids.label')}
                  hint={t('wizard.kids.hint')}
                  checked={prefs.riderHeightCm !== undefined}
                  onChange={(next) =>
                    setPrefs((current) => ({
                      ...current,
                      // One of the chips below, enforced by its own type — see
                      // `RIDER_HEIGHT_DEFAULT_CM`.
                      riderHeightCm: next ? RIDER_HEIGHT_DEFAULT_CM : undefined,
                    }))
                  }
                >
                  {prefs.riderHeightCm !== undefined && (
                    <div className="flex flex-wrap gap-1.5">
                      {RIDER_HEIGHT_CHOICES.map((cm) => (
                        <button
                          key={cm}
                          type="button"
                          onClick={() => setPrefs((current) => ({ ...current, riderHeightCm: cm }))}
                          aria-pressed={prefs.riderHeightCm === cm}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-xs tabular-nums transition-colors max-sm:min-h-9',
                            prefs.riderHeightCm === cm
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'hover:bg-accent border-border bg-background'
                          )}
                        >
                          {/* Both units, picked by CSS — a height is a measurement
                              and half the catalogue's parks post it in inches. */}
                          <RiderHeight cm={cm} />
                        </button>
                      ))}
                    </div>
                  )}
                </WizardToggle>

                <WizardToggle
                  icon={Droplets}
                  label={t('wizard.wet.label')}
                  hint={t('wizard.wet.hint')}
                  checked={prefs.avoidWet === true}
                  onChange={(next) =>
                    setPrefs((current) => ({ ...current, avoidWet: next ? true : undefined }))
                  }
                />
              </div>
            )}

            {/* The big rides, on their own screen.
                They were a fourth toggle among „Mittagessen", „Kinder sind
                dabei" and „trocken bleiben" — three answers about the party and
                one that rebuilds the whole day, with a hint that had to admit in
                passing that not all of them would fit. The conflict is the
                reason for the split: „Platz für 9 von 10" is not a footnote to
                a checkbox, it is a decision, and this is where it is made. */}
            {step === 'headliners' && (
              <div className="flex flex-col gap-2.5">
                {/* „Noch nicht gefragt" und „nichts gefunden" sehen von hier aus
                    gleich aus, und der Unterschied ist der ganze Schritt.

                    Ein Wizard mit gesetztem Datum öffnet auf `setup`, also ist
                    dieser Schritt einen Klick vom Mount entfernt: `/plan/day`
                    ist dann oft noch unterwegs, `headliners` ist `[]`, und der
                    Satz „Für diesen Tag fehlt keine große Bahn mehr" behauptete
                    ein Ergebnis, das niemand ausgerechnet hat. Wer in diesem
                    Fenster abschließt, legt einen Tag ohne Bahnen an und hat
                    dazu gelesen, dass keine fehlt.

                    Gewartet wird auf `/plan/day` und nicht auf `facts` — siehe
                    `dayPending`: die Best-Days-Momentaufnahme ist auf einer
                    Parkseite längst im Cache und antwortet sofort, während der
                    Tag selbst noch unterwegs ist. */}
                {dayPending ? (
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {t('wizard.facts.loading')}
                  </p>
                ) : headliners.length === 0 || headlinerFit === null || !fitInput ? (
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {t('wizard.headliners.none')}
                  </p>
                ) : (
                  <>
                    <WizardToggle
                      icon={Crown}
                      label={t('wizard.headliners.label')}
                      hint={
                        headlinerConflict
                          ? t('wizard.headliners.hintTight', {
                              fits: headlinerFit,
                              total: wantedHeadliners,
                            })
                          : t('wizard.headliners.hint', { count: headlinerFit })
                      }
                      checked={planHeadliners}
                      onChange={setPlanHeadliners}
                    />

                    {/* The fit assistant, one step early and in place.
                        It is the same three pieces the panel's dialog uses —
                        the measured levers, the ordered list, the „fällt weg"
                        marks — and they recompute against the same engine that
                        runs on „Plan öffnen".

                        It opens where it is tight and STAYS once anything has
                        been answered — see `fitChoiceTouched`. A day that holds
                        all ten and has been left alone still gets nothing, so
                        the common case is a toggle and not a form; what is not
                        allowed is the block disappearing mid-edit, which is
                        what hanging it on the conflict alone did. When the
                        choice resolves, the band turns green and says so rather
                        than leaving somebody looking at a list whose marks have
                        just gone quiet. */}
                    {planHeadliners && fitLevers && (headlinerConflict || fitChoiceTouched) && (
                      <div
                        data-planner-wizard-fit=""
                        data-planner-wizard-fit-solved={headlinerConflict ? undefined : ''}
                        className={cn(
                          'flex flex-col gap-2.5 rounded-md border px-2.5 py-2.5',
                          headlinerConflict
                            ? 'border-crowd-high/30 bg-crowd-high/10'
                            : 'border-status-operating/30 bg-status-operating/10'
                        )}
                      >
                        <p
                          className={cn(
                            'flex items-start gap-1.5 text-xs font-medium',
                            headlinerConflict ? 'text-crowd-high' : 'text-status-operating'
                          )}
                        >
                          {headlinerConflict ? (
                            <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                          ) : (
                            <Check className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                          )}
                          {headlinerConflict
                            ? t('wizard.headliners.conflict', {
                                fits: headlinerFit,
                                total: wantedHeadliners,
                              })
                            : t('wizard.headliners.resolved', { count: headlinerFit })}
                        </p>

                        {fitLevers.levers.length > 0 && (
                          <PlannerFitLevers
                            levers={fitLevers.levers}
                            applied={fitLevers.applied}
                            onToggle={(lever) =>
                              setFitChoice((current) => toggleLever(fitInput, current, lever))
                            }
                          />
                        )}

                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          {t('fit.ridesBody')}
                        </p>
                        <PlannerFitList
                          wishes={fitWishOrder}
                          dropped={fitChoice.dropped}
                          missed={fitMissed}
                          pinned={fitPinned}
                          onToggle={(key) => setFitChoice((current) => toggleWish(current, key))}
                          onPin={(key) => setFitChoice((current) => togglePin(current, key))}
                        />
                      </div>
                    )}
                  </>
                )}

                {park && (
                  <p className="text-muted-foreground mt-1 flex items-start gap-1.5 text-xs leading-relaxed">
                    <ArrowRight className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    {t('wizard.nextUp', { park: park.name })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* No footer on the first step — which is `primary` being `null` there
            rather than a second test on `step`, so the row and the Enter key
            appear and disappear together. Picking a park from the list IS the
            advance, so a `Weiter` button there is a control that never gets
            pressed sitting next to a `Zurück` that leads nowhere.

            `shrink-0`, or the last step on a short phone — 746 px against the
            776 px a 92svh dialog gets at 844, and less on anything smaller —
            squeezes the buttons instead of scrolling the body above them.

            And `px-3` below `sm` rather than the step body's `px-5`, because
            this row is the one place a label decides the width. Measured at
            320 px across six locales, the pair of buttons wants 194–240 px and
            French is the outlier at 240: `Retour` + `Ouvrir le planning` had
            231 px to sit in and was nine short. Shortening the French was the
            wrong repair — „planning" is the term the other nine strings in that
            locale use, so trading it for „plan" to buy nine pixels would leave
            one button disagreeing with the rest of the panel. At `px-3` the row
            offers 247 px, so the widest locale keeps 7 px and nothing is
            squeezed in any of the six.

            Measure the NATURAL width (`scrollWidth` per control), never the
            span the two ends occupy: `justify-between` fills the row whatever
            fits, so that span equals the available width right up to the moment
            it overflows and reads as "exactly right" all the way. */}
        {primary && (
          <div className="border-border/60 flex shrink-0 items-center justify-between gap-2 border-t px-3 py-3 sm:px-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goTo(steps[Math.max(0, index - 1)])}
              disabled={index === 0}
            >
              {t('wizard.back')}
            </Button>
            {step === 'headliners' ? (
              <Button
                onClick={primary.run}
                disabled={!primary.enabled}
                data-planner-wizard-finish=""
              >
                <Check className="size-4" aria-hidden="true" />
                {t('wizard.finish')}
              </Button>
            ) : (
              <Button onClick={primary.run} disabled={!primary.enabled} data-planner-wizard-next="">
                {t('wizard.next')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Which way a step slides in from.
 *
 * Keyed by the stringified direction so the two literal class strings are both
 * visible to Tailwind's scanner — a `slide-in-from-${side}` template is a class
 * that never gets generated.
 */
const STEP_MOTION: Record<string, string> = {
  true: 'motion-safe:slide-in-from-right-4 motion-safe:fade-in-0 motion-safe:duration-200',
  false: 'motion-safe:slide-in-from-left-4 motion-safe:fade-in-0 motion-safe:duration-200',
};

/**
 * The band across the top: the park, its place, and the day once there is one.
 *
 * The photograph is the park's own — the same background picture its park page
 * paints, straight off the search hit that named it, at the focal point the
 * media database curates. It arrives at the moment the park is picked, which is
 * the one bit of theatre in here and is earned: choosing Phantasialand should
 * look different from choosing Efteling.
 *
 * **No photo is a designed state, not a grey box.** The first step has no park
 * yet, so it gets a tinted field and the oversized translucent glyph the site's
 * chapter headings use, at the same height, so nothing moves when the picture
 * lands.
 *
 * The OTHER gap is closed now. Three of the four ways into this dialog skip the
 * search — „+ Weiterer Tag" in the plan list, the „+" in the panel's header, the
 * in-park offer — and there the park comes out of the plan, which stores slugs
 * rather than asset URLs; measured, all three drew the tinted field for a park
 * whose photograph was on screen behind the dialog. It is filled from
 * `/plan/day`'s own `parkBackgroundImage`, which this dialog already fetches for
 * the date step's hours and weather, and which the panel behind it already
 * paints. So the picture arrives with the day rather than with the park on those
 * paths — one beat later, in the same fixed-height band, and never a request
 * that was not already being made. Once, though: `parkPhoto` in the dialog
 * above holds it for the park, so walking the calendar does not take it away
 * and hand it back per press.
 *
 * The client-safe media manifest (`@/lib/media/hero`, 21 KB) is still not used
 * and is now not needed: it holds a picture for eight of 212 parks, and the
 * payload this dialog already has covers every park the API answers for.
 */
function WizardHero({
  park,
  date,
  locale,
  plannedDays,
  dayPhoto,
  dayPhotoPosition,
}: {
  park: WizardPark | null;
  date: string | null;
  locale: string;
  /** The park's photo off `/plan/day`, for the paths the search never touched. */
  dayPhoto?: string | null;
  dayPhotoPosition?: string;
  /**
   * Days this park already has entries for. It is what the second line says on
   * the one path that has neither a place nor a date yet — "another day at this
   * park", where the park came from the plan rather than from the search — and
   * the line was blank there, which reads as a field somebody forgot to fill.
   */
  plannedDays: number;
}) {
  const t = useTranslations('planner');
  // `common`, because `planner.close` is the day grid's "clear selection" and
  // this is a dialog's close button. The chrome namespace ships on every page.
  const tCommon = useTranslations('common');
  const photo = park?.imageUrl ?? dayPhoto ?? undefined;
  const photoPosition = park?.imageUrl ? park.imagePosition : dayPhotoPosition;
  const place = park ? [park.city, countryLabel(park, locale)].filter(Boolean).join(', ') : '';

  return (
    <div className="relative h-28 shrink-0 overflow-hidden sm:h-32">
      {photo ? (
        <>
          <Image
            key={photo}
            src={photo}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 512px"
            className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500"
            style={{ objectFit: 'cover', objectPosition: photoPosition }}
          />
          {/* Dark at the bottom because that is where the text is, and only
              there: a scrim over the whole frame turns a photograph into a
              texture.

              The three stops are MEASURED, not chosen. The first pair
              (`from-black/85 via-black/45 to-black/5`) looked right on
              Phantasialand's night shot and was not: rendering six parks, hiding
              the text and walking the luminance of the exact box it had
              occupied put the second line — `text-xs`, so it owes 4.5:1 — at
              **4.20:1 on Disneyland at the 95th percentile**, with the brightest
              pixel under the title down at 2.73:1 against the 3:1 a 20 px
              semibold headline owes. At `/95 · /70 · transparent` the same
              twelve cases (six parks × two viewports) read 8.73–14.09:1 at p95
              and 5.42–7.39:1 at the single worst pixel, so the small line clears
              AA everywhere with headroom and the castle's stonework is still
              legible. */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent"
            aria-hidden="true"
          />
        </>
      ) : (
        <>
          <div
            className="from-primary/25 via-primary/8 absolute inset-0 bg-gradient-to-br to-transparent"
            aria-hidden="true"
          />
          <CalendarDays
            className="text-primary/20 absolute -right-4 -bottom-8 size-40"
            aria-hidden="true"
          />
        </>
      )}

      <DialogClose
        aria-label={tCommon('close')}
        className={cn(
          'absolute top-2.5 right-2.5 z-10 rounded-full p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none',
          // Over a photograph the button has to carry its own ground: the
          // dialog's default close is `text-muted-foreground`, which lands
          // somewhere between invisible and illegible depending on what the
          // picture happens to do in that corner.
          photo
            ? 'bg-black/35 text-white/90 ring-white/40 hover:bg-black/55 hover:text-white'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground ring-ring'
        )}
      >
        <X className="size-4" aria-hidden="true" />
      </DialogClose>

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <DialogTitle
          className={cn(
            'truncate text-xl font-semibold sm:text-2xl',
            photo && 'text-white drop-shadow-sm'
          )}
        >
          {park ? park.name : t('wizard.title')}
        </DialogTitle>
        {/* The DATE is what may not clip. At 360 px "Brühl, Deutschland ·
            Samstag, 19. September" is wider than the band, and a single
            `truncate` over the pair cuts the half the reader is here to check —
            so the place gives way and the date keeps its width. */}
        <p
          className={cn(
            'mt-0.5 flex items-baseline gap-1 text-xs sm:text-sm',
            photo ? 'text-white/85' : 'text-muted-foreground'
          )}
        >
          {park ? (
            <>
              {place && <span className="truncate">{place}</span>}
              {date ? (
                <span className="shrink-0">
                  {place && '· '}
                  {longDate(date, locale)}
                </span>
              ) : (
                !place && (
                  <span className="truncate">
                    {t('wizard.hero.plannedDays', { count: plannedDays })}
                  </span>
                )
              )}
            </>
          ) : (
            <span className="truncate">{t('wizard.hero.question')}</span>
          )}
        </p>
      </div>
    </div>
  );
}

/**
 * What we know about the chosen day — and only that.
 *
 * Every figure here is a field of the park's own precomputed best-days snapshot:
 * whether it is open, the crowd forecast, the opening hours, the day's weather
 * and the three date flags that explain a busy day. Nothing is fetched for this
 * card and nothing is derived — a planner that filled in hours or a temperature
 * from somewhere else would be inventing the two facts a visitor is most likely
 * to act on.
 *
 * The empty state used to be the bug worth fixing here: with no day picked, the
 * card said "für diesen Tag haben wir noch keine Prognose", which is a claim
 * about a day nobody had named. There are four states and they are different
 * sentences — no day yet, the park publishes no hours at all, a closed day, and
 * a day we have a forecast for.
 *
 * Hours render only where the snapshot named the park's timezone, because a
 * clock time with no zone behind it is the planner's one unforgivable mistake:
 * every minute in this feature is park-local by construction.
 *
 * The weather condition rides along as `sr-only` text, which is what puts
 * `parks.weather` on this route's namespace list — 558 B brotli, for the one
 * thing in the row a reader without the icon would otherwise get nothing from.
 * Re-run `pnpm generate:route-namespaces` after touching this.
 */
function WizardDayCard({
  date,
  day,
  context,
  timezone,
  hasSchedule,
  loading,
}: {
  date: string | null;
  day: CalendarDay | undefined;
  /** `/plan/day`'s own view of this date — the only source of hours and weather. */
  context: PlanDay['context'] | null;
  timezone: string | null;
  hasSchedule: boolean | null;
  loading: boolean;
}) {
  const t = useTranslations('planner');
  const tWeather = useTranslations('parks.weather');
  const locale = useLocale();

  const frame = 'bg-muted/40 rounded-xl border border-border/50 px-3 py-2.5 text-xs';

  if (!date) {
    return <p className={cn(frame, 'text-muted-foreground')}>{t('wizard.facts.pickFirst')}</p>;
  }
  if (hasSchedule === false) {
    return <p className={cn(frame, 'text-muted-foreground')}>{t('day.noHours')}</p>;
  }
  if (!day) {
    return (
      <p className={cn(frame, 'text-muted-foreground')}>
        {loading ? t('wizard.facts.loading') : t('wizard.facts.nothing')}
      </p>
    );
  }

  const closed = day.crowdLevel === 'closed' || day.status === 'CLOSED';
  if (closed) {
    return <p className={cn(frame, 'text-muted-foreground')}>{t('day.closed')}</p>;
  }

  // Both of these come from `/plan/day` in practice: the best-days snapshot
  // this card's crowd level comes from carries `hours: null` and
  // `weather: null` on every day it covers. The snapshot is still read first,
  // because a park whose snapshot ever does carry them should not be made to
  // wait for a second request to say so.
  const weather = day.weather ?? context?.weather ?? null;
  // The site's own weather vocabulary — icon, tint and label per WMO code — so
  // this card and the planner's weather rail describe one day the same way.
  const weatherConfig = weather ? getWeatherConfig(weather.icon, true) : null;
  const hours = day.hours?.type === 'OPERATING' ? day.hours : undefined;

  return (
    <div className={frame}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <CrowdLevelBadge level={day.crowdLevel} />

        {hours && timezone ? (
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            <ParkTimeRange
              openingTime={hours.openingTime}
              closingTime={hours.closingTime}
              parkTimezone={timezone}
              locale={locale}
            />
          </span>
        ) : (
          context?.openHour != null &&
          context.closeHour != null && (
            /* `/plan/day`'s hours, which are park-local HOURS rather than the
               instants `ParkTimeRange` formats — so they are printed the way
               the grid's own axis prints them, by the same helper, and not run
               through a timezone conversion they have already had. */
            <span className="text-muted-foreground flex items-center gap-1 tabular-nums">
              <Clock className="size-3.5 shrink-0" aria-hidden="true" />
              {formatGridTime(context.openHour * 60)}
              {' – '}
              {formatGridTime(context.closeHour * 60)}
            </span>
          )
        )}

        {weather && weatherConfig && (
          <span className="text-muted-foreground flex items-center gap-1">
            {/* A JSX member expression rather than an aliased component, so the
                icon, the tint and the label all read off one narrowed object. */}
            <weatherConfig.icon
              className={cn('size-3.5 shrink-0', weatherConfig.color)}
              aria-hidden="true"
            />
            <span className="tabular-nums">
              <Temp celsius={weather.tempMin} />
              {' – '}
              <Temp celsius={weather.tempMax} />
            </span>
            {/* The condition in words, for a reader who gets no icon. */}
            <span className="sr-only">{tWeather(weatherConfig.label)}</span>
          </span>
        )}
      </div>

      {(day.isHoliday || day.isBridgeDay || day.isSchoolVacation) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {day.isHoliday && <Badge variant="outline">{t('context.holiday')}</Badge>}
          {day.isBridgeDay && <Badge variant="outline">{t('context.bridgeDay')}</Badge>}
          {day.isSchoolVacation && <Badge variant="outline">{t('context.schoolVacation')}</Badge>}
        </div>
      )}
    </div>
  );
}

/**
 * One question with a yes/no answer, as a card the whole of which is the switch.
 *
 * It was a native checkbox and two lines of text. Three of those in a column is
 * a form, and this dialog's other two steps are a photograph and a tinted
 * calendar — so the last step read like the settings page of a different
 * application. A card with a hit area, a tinted icon tile and a tick reads as
 * the same family as the ride cards these answers go on to mark.
 *
 * A `<button aria-pressed>` rather than a styled checkbox: the whole card is the
 * target, and a real `<input>` under a card that size means either a label
 * wrapping interactive children (the height chips are inside it) or a hidden
 * input whose focus ring has to be re-drawn by hand.
 */
function WizardToggle({
  icon: Icon,
  label,
  hint,
  checked,
  onChange,
  children,
}: {
  icon: typeof Utensils;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Revealed under the card while it is on — the height chips. */
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border transition-colors',
        checked ? 'border-primary/45 bg-primary/5' : 'border-border/70 bg-card'
      )}
    >
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className="focus-visible:ring-ring flex w-full items-start gap-3 rounded-xl p-3 text-left focus-visible:ring-2 focus-visible:outline-none"
      >
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
            checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{label}</span>
          <span className="text-muted-foreground mt-0.5 block text-xs leading-relaxed">{hint}</span>
        </span>
        <span
          className={cn(
            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
            checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
          )}
          aria-hidden="true"
        >
          {checked && <Check className="size-3" />}
        </span>
      </button>
      {children && <div className="px-3 pb-3 pl-14">{children}</div>}
    </div>
  );
}

/**
 * The country in the reader's language.
 *
 * The search payload names it in English — "Netherlands", "South Korea" — and
 * the ISO code rides along on the same hit, so `Intl.DisplayNames` settles it.
 */
function countryLabel(park: WizardPark, locale: string): string | undefined {
  if (!park.countryCode) return park.country;
  return getCountryName(park.countryCode, locale);
}

/** The days of this park that already carry entries, for the calendar's markers. */
function plannedDatesFor(
  state: ReturnType<typeof usePlanner>['state'],
  parkSlug: string | undefined
): string[] {
  if (!parkSlug) return [];
  const park = state.parks[parkSlug];
  if (!park) return [];
  return Object.values(park.days)
    .filter((day) => day.entries.length > 0)
    .map((day) => day.date);
}
