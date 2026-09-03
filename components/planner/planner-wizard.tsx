'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ArrowRight, CalendarDays, Check, Clock, Droplets, Ruler, Utensils, X } from 'lucide-react';
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
import { formatGridTime, todayInZone } from '@/lib/planner/park-time';
import { RIDER_HEIGHT_CHOICES, RIDER_HEIGHT_DEFAULT_CM } from '@/lib/planner/party';
import type { CalendarDay, PlanDay } from '@/lib/api/types';
import type { PlannerDayPrefs } from '@/lib/planner/types';
import { PlannerParkSearch, type PlannerParkPick } from './planner-park-search';
import { PlannerMonthCalendar } from './planner-month-calendar';

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
}

type Step = 'park' | 'date' | 'setup';

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
export function PlannerWizard({ open, onOpenChange, initialPark = null }: PlannerWizardProps) {
  const t = useTranslations('planner');
  const locale = useLocale();
  const router = useRouter();
  const { state, openDay, setDayPrefs, addCustom } = usePlanner();

  const [park, setPark] = useState<WizardPark | null>(initialPark);
  const [step, setStep] = useState<Step>(initialPark ? 'date' : 'park');
  // Which way the last move went, which is all the step transition needs to
  // know — see `STEP_MOTION`.
  const [forward, setForward] = useState(true);
  const [date, setDate] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<PlannerDayPrefs>({});
  const [lunch, setLunch] = useState(false);

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
    enabled: open && step === 'date' && Boolean(park && date),
  });
  // The park's own zone where the forecast has arrived, the reader's until then.
  // Never a constant: `todayInZone` names that fallback and is the only door to it.
  const today = todayInZone(facts.timezone ?? park?.timezone);
  const chosen = date ? facts.byDate.get(date) : undefined;

  const plannedSlugs = new Set(Object.keys(state.parks));

  const steps: Step[] = initialPark ? ['date', 'setup'] : ['park', 'date', 'setup'];
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
    if (lunch) {
      addCustom({
        parkSlug: park.slug,
        parkName: park.name,
        geo: park.geo,
        timezone: withZone.timezone,
        date,
        label: t('wizard.blocks.lunch'),
        icon: 'food',
        startMinute: LUNCH_START_MINUTE,
        durationMinutes: LUNCH_MINUTES,
      });
    }
    plannerUi.requestOpen();
    onOpenChange(false);
    // The park's own page, where the ride cards are. `@/i18n/navigation`'s
    // router, so the localized path is built rather than guessed.
    router.push(
      `/parks/${park.geo.continent}/${park.geo.country}/${park.geo.city}/${park.slug}` as '/europe/germany/rust/europa-park'
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* `flex flex-col` over the grid the dialog ships with, and `p-0` so the
          photo band can reach all four edges. The middle row is the only one
          that scrolls, which is what keeps the band and the buttons in place on
          a phone in landscape. */}
      <DialogContent
        showCloseButton={false}
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
        />
        <WizardRail steps={steps} current={index} onJump={(to) => goTo(steps[to])} />

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

        {/* No footer on the first step. Picking a park from the list IS the
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
        {step !== 'park' && (
          <div className="border-border/60 flex shrink-0 items-center justify-between gap-2 border-t px-3 py-3 sm:px-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goTo(steps[Math.max(0, index - 1)])}
              disabled={index === 0}
            >
              {t('wizard.back')}
            </Button>
            {step === 'setup' ? (
              <Button onClick={finish} data-planner-wizard-finish="">
                <Check className="size-4" aria-hidden="true" />
                {t('wizard.finish')}
              </Button>
            ) : (
              <Button
                onClick={() => goTo(steps[Math.min(steps.length - 1, index + 1)])}
                disabled={!date}
                data-planner-wizard-next=""
              >
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
 * yet, and the other way in — another day at a park already in the plan — has
 * no photo at all, because a plan stores slugs rather than asset URLs. Both get
 * a tinted field and the oversized translucent glyph the site's chapter
 * headings use, at the same height, so nothing moves when the picture lands.
 *
 * There is a client-safe media manifest that would fill that second gap
 * (`@/lib/media/hero`, 21 KB) and it is deliberately not used: it holds a
 * picture for eight of 212 parks, and 21 KB of JavaScript for a decorative band
 * on 4 % of the catalogue is the wrong side of this project's payload budget.
 */
function WizardHero({
  park,
  date,
  locale,
  plannedDays,
}: {
  park: WizardPark | null;
  date: string | null;
  locale: string;
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
  const photo = park?.imageUrl;
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
            style={{ objectFit: 'cover', objectPosition: park?.imagePosition }}
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
 * Three circles and the labels under them.
 *
 * A step counter in prose ("Schritt 2 von 3") is information a reader has to
 * assemble; three marks with two of them filled is the same fact at a glance,
 * and it is the only place in the dialog that shows where the end is.
 *
 * A **finished** step is a button, which is the point of drawing it: the
 * commonest correction in a three-question form is "wrong day", and reaching it
 * by pressing the day is shorter than pressing `Zurück`. Nothing leads forward —
 * that is the footer's job, and it is the half that knows whether the current
 * question has an answer yet.
 */
function WizardRail({
  steps,
  current,
  onJump,
}: {
  steps: readonly Step[];
  current: number;
  onJump: (index: number) => void;
}) {
  const t = useTranslations('planner');

  const count = steps.length;

  return (
    <div className="border-border/60 shrink-0 border-b px-5 pt-3 pb-2.5 sm:px-6">
      {/* EQUAL columns, and the connectors measured off them. The first version
          was a flex row where each step's connector took the space its own
          label did not, so three circles whose labels are "Park", "Tag" and
          "Wer kommt mit" came out at 15 %, 72 % and 92 % of the row with one
          connector eleven times the length of the other — a progress bar that
          reported the width of its own captions. */}
      <ol
        className="relative grid"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
        aria-label={t('wizard.progress')}
      >
        {/* One line per GAP rather than one track behind the circles: two of the
            three circle states are a translucent tint, and a line under those
            shows through the middle of the mark. `RAIL_DOT_CLEARANCE` is the
            circle's radius plus a little air. */}
        {steps.slice(0, -1).map((step, gap) => (
          <span
            key={`gap-${step}`}
            aria-hidden="true"
            className={cn(
              'absolute top-[23px] h-px',
              gap < current ? 'bg-primary/60' : 'bg-border'
            )}
            style={{
              left: `calc(${(((gap + 0.5) / count) * 100).toFixed(4)}% + ${RAIL_DOT_CLEARANCE}px)`,
              right: `calc(${((1 - (gap + 1.5) / count) * 100).toFixed(4)}% + ${RAIL_DOT_CLEARANCE}px)`,
            }}
          />
        ))}

        {steps.map((step, i) => {
          const done = i < current;
          const now = i === current;

          return (
            <li key={step} className="flex min-w-0 justify-center">
              <button
                type="button"
                onClick={() => onJump(i)}
                disabled={!done}
                aria-current={now ? 'step' : undefined}
                className={cn(
                  'flex max-w-full min-w-0 flex-col items-center gap-1 rounded-lg px-1.5 py-0.5 transition-colors',
                  done ? 'hover:bg-accent cursor-pointer' : 'cursor-default'
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium tabular-nums transition-colors',
                    done && 'bg-primary/15 border-primary/40 text-primary',
                    now && 'bg-primary text-primary-foreground border-primary',
                    !done && !now && 'border-border text-muted-foreground/70'
                  )}
                >
                  {done ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
                </span>
                <span
                  className={cn(
                    'max-w-full truncate text-[10px] leading-tight sm:text-[11px]',
                    now ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {t(`wizard.steps.${step}`)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * How far a connector stops short of a circle's centre, in pixels.
 *
 * The mark is `size-6`, so 12 is its radius and the rest is air. `top-[23px]`
 * on the lines is the same measurement vertically: 12 px of the row's own
 * padding plus that radius, less half the line.
 */
const RAIL_DOT_CLEARANCE = 18;

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

/** `Donnerstag, 17. September` — noon UTC, so the label names the day it is filed under. */
function longDate(date: string, locale: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
