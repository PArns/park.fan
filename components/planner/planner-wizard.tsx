'use client';

import { useMemo, useState } from 'react';
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
  Sunrise,
  Utensils,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog';
import { DialogHero } from '@/components/common/dialog-hero';
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
import { loadMessageChunk } from '@/lib/i18n/message-chunk-loader';
import type { Locale } from '@/i18n/config';
import { formatGridTime, longDate, todayInZone } from '@/lib/planner/park-time';
import { RIDER_HEIGHT_CHOICES, RIDER_HEIGHT_DEFAULT_CM, partyFlags } from '@/lib/planner/party';
import { buildDayGrid, earlyEntryOpenMin, withEarlyEntry } from '@/lib/planner/day-grid';
import { usePlannerPxPerMin } from '@/lib/planner/use-grid-scale';
import { headlinersSkipped, headlinersToAdd } from '@/lib/planner/optimize';
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
import { isPlannedDay, type PlannerDayPrefs } from '@/lib/planner/types';
import { PlannerParkSearch, type PlannerParkPick } from './planner-park-search';
import { PlannerMonthCalendar } from './planner-month-calendar';
import { PlannerFitLevers } from './planner-fit-levers';
import { PlannerFitList } from './planner-fit-list';
import { PlannerStepRail, STEP_MOTION } from './planner-step-rail';

/**
 * A park as the wizard holds it. Everything past `geo` is optional decoration from the search hit,
 * because "another day at this park" comes from the plan, which stores only the slugs and the name.
 */
export interface WizardPark extends PlannerParkPick {
  timezone?: string;
}

interface PlannerWizardProps {
  /**
   * Always `true` in practice: the wizard is mounted when it opens and unmounted when it closes,
   * which is how the answers reset without a `setState` in an effect.
   */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * A park to start on, which skips the first step. What "another day at this
   * park" passes, from the panel's own overview.
   */
  initialPark?: WizardPark | null;
  /**
   * A day to start on, which skips the second step as well. Only counts together with
   * {@link initialPark}: a date without a park is a day at nowhere. Passed by the calendar's day
   * comparison, where both questions have already been answered.
   */
  initialDate?: string | null;
  /**
   * A rider height to open the "who is coming" step with, in cm. Only counts together with
   * {@link initialPark}, like the date. It comes from a park's "with kids" page, where the visitor
   * has just picked the height they are planning for.
   */
  initialRiderHeight?: number | null;
}

type Step = 'park' | 'date' | 'setup' | 'headliners';

/**
 * Park-local minutes the lunch block starts at. A default, not a claim: the snapshot this dialog
 * reads has no opening hours to centre a break in, and the block is draggable once the panel opens.
 */
const LUNCH_START_MINUTE = 12 * 60 + 30;
const LUNCH_MINUTES = 60;

/**
 * The id the probe files its lunch block under. It never reaches the store, but the fit step reads
 * the block back out of `evaluateFit`'s answer by it, so both halves must use the same string.
 */
const LUNCH_ENTRY_ID = 'wizard-lunch';

/**
 * The elements an Enter already belongs to, as a selector: fields, as in `PlannerDayColumn`'s
 * Delete guard, plus the controls the browser itself fires on Enter, or one press would run two
 * actions. `contenteditable="false"` does not own the key, so only the two truthy forms are listed.
 */
const ENTER_BELONGS_TO =
  'input, textarea, select, button, a[href], [role="button"], [contenteditable=""], [contenteditable="true"]';

/**
 * Planning a day, one question at a time: which park, which day, who is coming, and which big
 * rides. It ends on the park's own page with the panel open, because dragging a ride card into the
 * day is the gesture the feature is built around. See
 * docs/features/trip-planner.md#the-wizard-is-the-way-in.
 */
export function PlannerWizard({
  open,
  onOpenChange,
  initialPark = null,
  initialDate = null,
  initialRiderHeight = null,
}: PlannerWizardProps) {
  /** A date only counts where a park came with it — see `initialDate`. */
  const seededDate = initialPark ? initialDate : null;
  const t = useTranslations('planner');
  /** The axis' scale; see {@link usePlannerPxPerMin}. */
  const pxPerMin = usePlannerPxPerMin();
  const locale = useLocale();
  const router = useRouter();
  const { state, openDay, setDayPrefs, addCustom, applyPlan } = usePlanner();

  const [park, setPark] = useState<WizardPark | null>(initialPark);
  const [step, setStep] = useState<Step>(seededDate ? 'setup' : initialPark ? 'date' : 'park');
  // Which way the last move went, which is all the step transition needs (see `STEP_MOTION`).
  const [forward, setForward] = useState(true);
  const [date, setDate] = useState<string | null>(seededDate);
  const [prefs, setPrefs] = useState<PlannerDayPrefs>(() =>
    initialPark && initialRiderHeight !== null ? { riderHeightCm: initialRiderHeight } : {}
  );
  const [lunch, setLunch] = useState(false);
  const [planHeadliners, setPlanHeadliners] = useState(false);
  /**
   * Which big rides, in which order, and what to do about the break: the fit assistant's answer,
   * asked one step earlier. Kept while the toggle is off so switching it back on keeps the order;
   * only read where `planHeadliners` is true (see `finish`).
   */
  const [fitChoice, setFitChoice] = useState<FitChoice>(() => fitChoiceAll());

  const facts = usePlannerDayFacts(park, open && step !== 'park');
  /**
   * Opening hours and weather for the day being picked. The best-days snapshot carries neither, and
   * `/plan/day` does; it is the query the panel runs as soon as the wizard finishes, under the same
   * key, so this warms the next screen.
   */
  const planDay = usePlanDay({
    continent: park?.geo.continent ?? '',
    country: park?.geo.country ?? '',
    city: park?.geo.city ?? '',
    parkSlug: park?.slug ?? '',
    date: date ?? undefined,
    // `step !== 'park'`, not `step === 'date'`: a wizard seeded with a date never visits the date
    // step, and the last step would then find no headliners.
    enabled: open && step !== 'park' && Boolean(park && date),
  });
  /**
   * The park's photograph, held for as long as the park is the park. The `/plan/day` query it rides
   * on is keyed by date, so without this the picture blinks on every calendar press and leaves for
   * good on a closed day (404). The slug travels with the photo, so a picture held for another park
   * is simply not read. Adjusted during render, not in an effect, which would commit it a frame
   * late.
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
  // The park's own zone where the forecast has arrived, the reader's until then; `todayInZone` is
  // the only door to that fallback.
  const today = todayInZone(facts.timezone ?? park?.timezone);
  const chosen = date ? facts.byDate.get(date) : undefined;

  /**
   * The park's headliners for this day, and how many of them the day holds. The probe plans against
   * the day the finish will file, lunch block included, because an hour out of the middle decides
   * the last headliner.
   */
  const dayPayload = planDay.data ?? null;
  /**
   * Whether the day the headliner step is made of is still on its way. Not `facts.pending`: the
   * best-days snapshot is usually cached and answers at once while `/plan/day` is in flight.
   * `=== undefined`, because a closed day resolves to `null`, which is an answer.
   */
  const dayPending = Boolean(park && date) && planDay.data === undefined && !planDay.isError;
  /**
   * Whether this park lets hotel guests in before opening, the only case the early-entry question
   * is asked in. `=== true`, because absent means "no" and "nobody checked" alike.
   */
  const parkHasEarlyEntry = dayPayload?.context.hasEarlyEntry === true;
  const earlyEntryMinutes = parkHasEarlyEntry
    ? dayPayload?.context.earlyEntryMinutesPeak
    : undefined;
  // The day the finish files, early-entry answer included, on the same terms
  // `finish` writes it: only where the question was on screen.
  const earlyEntryAnswer = parkHasEarlyEntry ? prefs.earlyEntry : undefined;
  const probeDay = useMemo(
    () => withEarlyEntry(dayPayload, earlyEntryAnswer),
    [dayPayload, earlyEntryAnswer]
  );
  const wizardGrid = useMemo(
    () =>
      buildDayGrid(
        probeDay?.context.openHour,
        probeDay?.context.closeHour,
        pxPerMin,
        earlyEntryOpenMin(probeDay?.context)
      ),
    [probeDay, pxPerMin]
  );
  const headliners = useMemo(() => headlinersToAdd(dayPayload, [], prefs), [dayPayload, prefs]);
  /**
   * The headliners this party's own answers ruled out, and why, so an empty list over a family
   * whose children fit none of them does not read as "every headliner is already in". The total is
   * the engine's own `headlinersSkipped`.
   */
  const unfitHeadliners = useMemo(() => {
    const total = headlinersSkipped(dayPayload, [], prefs);
    if (!dayPayload || total === 0) return null;
    let tooShort = 0;
    let wet = 0;
    for (const ride of dayPayload.rides) {
      if (!ride.isHeadliner) continue;
      const flags = partyFlags(ride, prefs);
      if (flags.tooShort) tooShort += 1;
      if (flags.wet) wet += 1;
    }
    const key =
      wet === 0 ? 'noneFitHeight' : tooShort === 0 ? 'noneFitWet' : ('noneFitBoth' as const);
    return { total, key };
  }, [dayPayload, prefs]);
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
    if (!probeDay || !wizardGrid || headliners.length === 0) return null;
    return {
      day: probeDay,
      grid: wizardGrid,
      entries: lunchEntries,
      wishes: fitWishes(probeDay, lunchEntries, headliners),
      blocks: fitBlocks(lunchEntries),
    };
  }, [probeDay, wizardGrid, headliners, lunchEntries]);

  /**
   * The search, only on the step that reads it: it costs several beam searches per change.
   * `finish` is only reachable from the last step, so it always finds the outcome computed.
   */
  const onFitStep = step === 'headliners';
  const fitOutcome = useMemo(
    () => (fitInput && onFitStep ? evaluateFit(fitInput, fitChoice) : null),
    [fitInput, fitChoice, onFitStep]
  );
  const fitLevers = useMemo(
    () =>
      fitInput && fitOutcome && planHeadliners
        ? fitLeverView(fitInput, fitChoice, fitOutcome)
        : null,
    [fitInput, fitChoice, fitOutcome, planHeadliners]
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
   * Whether the visitor has answered anything about this day yet, which keeps the fit block on
   * screen after they fix the problem. Derived, never latched, so a change of park or date cannot
   * leave it standing. See docs/rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md.
   */
  const fitChoiceTouched =
    fitChoice.dropped.size > 0 ||
    fitChoice.priority.length > 0 ||
    fitChoice.droppedBlocks.size > 0 ||
    fitChoice.shortBlocks.size > 0;

  const plannedSlugs = new Set(Object.keys(state.parks));

  /**
   * Which questions are left: the list the rail draws and the footer walks. A step not in here
   * cannot be reached either way, so „Zurück" on a seeded day cannot land on an empty date step.
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
    // One park, one day, and the zone the forecast named.
    const withZone: WizardPark = { ...park, timezone: facts.timezone ?? park.timezone };
    openDay(withZone, date);
    // The early-entry answer only counts where the question was on screen. The key is left out
    // rather than set to `undefined`, because `setDayPrefs` merges and `undefined` would erase an
    // answer the day already holds.
    const { earlyEntry: _earlyEntry, ...rest } = prefs;
    const dayPrefs: PlannerDayPrefs = parkHasEarlyEntry ? prefs : rest;
    if (dayPrefs.riderHeightCm !== undefined || dayPrefs.avoidWet || dayPrefs.earlyEntry) {
      setDayPrefs(park.slug, date, dayPrefs);
    }
    /**
     * The break, as the last step left it: read back out of `evaluateFit`, so the block filed is
     * the one the probe planned around (gone, shortened or an hour). Only where the headliners are
     * being planned; a lever pulled and then abandoned is not an answer about lunch.
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
     * The big rides, from the same `FitChoice` the last step was drawn from, so what was marked
     * „fällt weg" is what is missing from the axis and pinned rides are the ones that survive.
     */
    if (plannedFit) {
      applyPlan({
        parkSlug: park.slug,
        parkName: park.name,
        geo: park.geo,
        timezone: withZone.timezone,
        date,
        // Only what is being added: the lunch block is already in the store, and filing it again
        // would put a second one on the axis.
        stops: plannedFit.stops.filter((stop) => stop.entryId === null),
      });
    }
    /**
     * The panel this lands in reads `planner`, and on this route the launcher has to fetch it,
     * which it would only start from an effect after the navigation. Not awaited; the loader
     * deduplicates, so the launcher's own call joins this request.
     */
    void loadMessageChunk(locale as Locale);
    plannerUi.requestOpen('wizard');
    onOpenChange(false);
    // The park's own page, via the localized router. `#attractions` lets the page's own
    // `useTabHashRouting` select the ride cards and scroll them under the header.
    router.push(
      `/parks/${park.geo.continent}/${park.geo.country}/${park.geo.city}/${park.slug}#attractions` as '/europe/germany/rust/europa-park'
    );
  };

  /**
   * The footer's primary control as one object, what it does and whether it may run, so the button
   * and the Enter key cannot disagree. `null` on the first step, where picking a park is the
   * advance, so there is no footer and Enter does nothing.
   */
  const primary: { run: () => void; enabled: boolean } | null =
    step === 'park'
      ? null
      : step === 'headliners'
        ? // Deliberately not gated on `dayPending`: the step already says it is loading, and a
          // `/plan/day` that hangs without failing would otherwise leave no way out of the wizard.
          { run: finish, enabled: Boolean(park && date) }
        : { run: () => goTo(steps[Math.min(steps.length - 1, index + 1)]), enabled: Boolean(date) };

  /**
   * Enter moves the wizard on, by running the footer's primary control and only that.
   *
   * Bound to the dialog's content, not `document`: the dialog is a focus trap, so every key passes
   * through here, and a document listener would also fire for the page behind it. A key that
   * belongs to the focused element stays with it (`ENTER_BELONGS_TO`, plus `defaultPrevented`), so
   * picking a date and skipping the step can never be one press. `event.repeat` is refused, or a
   * held key walks through to the finish.
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
      {/* `flex flex-col` and `p-0` so the photo band reaches all four edges; only the middle row
          scrolls, which keeps the band and the buttons in place on a landscape phone. */}
      <DialogContent
        showCloseButton={false}
        onKeyDown={advanceOnEnter}
        className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        {/* The step, spoken: the rail is not readable as progress, and Radix wants a description
            on every dialog. */}
        <DialogDescription className="sr-only">
          {t('wizard.step', { step: index + 1, total: steps.length })} · {t(`wizard.steps.${step}`)}
        </DialogDescription>

        <WizardHero
          park={park}
          date={date}
          locale={locale}
          plannedDays={plannedDatesFor(state, park?.slug).length}
          /* The park's picture for the ways in that do not come through the search, where the
             park comes out of the plan. Held per park, see `parkPhoto`. */
          dayPhoto={heldPhoto?.src ?? null}
          dayPhotoPosition={heldPhoto?.position}
        />
        <PlannerStepRail
          steps={steps.map((key) => ({ key, label: t(`wizard.steps.${key}`) }))}
          current={index}
          label={t('wizard.progress')}
          onJump={(to) => goTo(steps[to])}
        />

        {/* The only row that scrolls; `min-h-0` lets it shrink so `overflow-y-auto` works.
            Deliberately no floor under it: the steps differ by hundreds of pixels, and a floor
            would open the first step mostly empty. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {/* `key` remounts on every step to re-trigger the CSS animation; `motion-safe:` is the
              reduced-motion guard. See
              docs/features/trip-planner.md#the-frame-and-why-it-looks-like-this. */}
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
                      // One of the chips below, enforced by its type (`RIDER_HEIGHT_DEFAULT_CM`).
                      riderHeightCm: next ? RIDER_HEIGHT_DEFAULT_CM : undefined,
                    }))
                  }
                >
                  {prefs.riderHeightCm !== undefined && (
                    <div className="flex flex-wrap gap-1.5">
                      {/* `max-sm:min-h-9` stays a width class: the wizard is outside the
                          `planner-phone:` sweep, so these chips do not take the 44 px target. */}
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
                          {/* Both units, picked by CSS: half the catalogue's parks post heights
                              in inches. */}
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

                {/* Only at a park with the curated flag. It can arrive after the step opens
                    (a seeded date opens here while `/plan/day` is in flight), hence the fade. */}
                {parkHasEarlyEntry && (
                  <div
                    data-planner-wizard-early-entry=""
                    className="transition-opacity duration-200 starting:opacity-0"
                  >
                    <WizardToggle
                      icon={Sunrise}
                      label={t('wizard.earlyEntry.label')}
                      hint={
                        earlyEntryMinutes !== undefined
                          ? t('wizard.earlyEntry.hintMinutes', { minutes: earlyEntryMinutes })
                          : t('wizard.earlyEntry.hint')
                      }
                      checked={prefs.earlyEntry === true}
                      onChange={(next) =>
                        setPrefs((current) => ({ ...current, earlyEntry: next ? true : undefined }))
                      }
                    />
                  </div>
                )}
              </div>
            )}

            {/* The big rides get their own step, because „Platz für 9 von 10" is a decision,
                not a footnote to a checkbox. */}
            {step === 'headliners' && (
              <div className="flex flex-col gap-2.5">
                {/* "Not asked yet" and "nothing found" look the same from here: a seeded wizard
                    reaches this step while `/plan/day` may still be in flight, and claiming
                    nothing is missing would file a day without rides. See `dayPending`. */}
                {dayPending ? (
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {t('wizard.facts.loading')}
                  </p>
                ) : headliners.length === 0 && unfitHeadliners ? (
                  /* Every missing headliner was ruled out by the party: a problem to see, so it
                     is drawn as a notice in the crowd tint. */
                  <p
                    role="status"
                    data-planner-wizard-headliners-unfit=""
                    className="border-crowd-high/40 bg-crowd-high/10 text-crowd-high flex items-start gap-2 rounded-md border px-2.5 py-2 text-xs leading-relaxed"
                  >
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      {t(`wizard.headliners.${unfitHeadliners.key}`, {
                        count: unfitHeadliners.total,
                      })}
                    </span>
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

                    {/* The fit assistant, one step early and in place: the same levers, list and
                        marks as the panel's dialog, against the same engine. It opens where the
                        day is tight and stays once anything has been answered (see
                        `fitChoiceTouched`); when the choice resolves, it turns green and says
                        so. */}
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

        {/* No footer on the first step: `primary` is `null` there, so the row and the Enter key
            come and go together. `shrink-0` so a short phone scrolls the body instead of
            squeezing the buttons. `px-3` below `sm` because this row's width is set by its
            labels. See docs/features/trip-planner.md#the-frame-and-why-it-looks-like-this. */}
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
 * The band across the top: the park, its place, and the day once there is one, drawn by
 * {@link DialogHero}. Its photo comes from the search hit, or from `/plan/day`'s
 * `parkBackgroundImage` on the ways in that skip the search, a request this dialog already makes.
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
   * Days this park already has entries for: the second line on "another day at this park", which
   * has neither a place nor a date yet.
   */
  plannedDays: number;
}) {
  const t = useTranslations('planner');
  const photo = park?.imageUrl ?? dayPhoto ?? undefined;
  const photoPosition = park?.imageUrl ? park.imagePosition : dayPhotoPosition;
  const place = park ? [park.city, countryLabel(park, locale)].filter(Boolean).join(', ') : '';

  return (
    <DialogHero
      icon={CalendarDays}
      photo={photo}
      photoPosition={photoPosition}
      title={park ? park.name : t('wizard.title')}
      /* The date may not clip: the place gives way and the date keeps its width. */
      descriptionClassName="flex items-baseline gap-1"
      description={
        park ? (
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
        )
      }
    />
  );
}

/**
 * What we know about the chosen day, and only that: open or closed, crowd forecast, hours, weather
 * and the date flags, none of them derived. Hours render only with the park's timezone, because
 * every minute in the planner is park-local. See
 * docs/features/trip-planner.md#what-the-day-card-may-say.
 *
 * The weather label is `sr-only` text, which puts `parks.weather` on this route's namespace list;
 * re-run `pnpm generate:route-namespaces` after touching it.
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

  // In practice both come from `/plan/day`, since the snapshot carries neither; the snapshot is
  // still read first in case it ever does.
  const weather = day.weather ?? context?.weather ?? null;
  // The site's own weather vocabulary, so this card and the weather rail describe a day alike.
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
            /* `/plan/day`'s hours are park-local hours, not instants, so they are printed by the
               axis's own helper and not run through a timezone conversion again. */
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
            {/* A member expression, so icon, tint and label read off one narrowed object. */}
            <weatherConfig.icon
              className={cn('size-3.5 shrink-0', weatherConfig.color)}
              aria-hidden="true"
            />
            <span className="tabular-nums">
              <Temp celsius={weather.tempMin} />
              {' – '}
              <Temp celsius={weather.tempMax} />
            </span>
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
 * One question with a yes/no answer, as a card the whole of which is the switch. A
 * `<button aria-pressed>` rather than a styled checkbox: the card holds the height chips, and a
 * label cannot wrap interactive children.
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
    .filter(isPlannedDay)
    .map((day) => day.date);
}
