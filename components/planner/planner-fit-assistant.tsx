'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatShortDuration } from '@/lib/utils/duration';
import { formatGridTime } from '@/lib/planner/park-time';
import {
  evaluateFit,
  fitChoiceAll,
  fitLeverView,
  fitOrder,
  togglePin,
  toggleLever,
  toggleWish,
  type FitChoice,
  type FitInput,
  type FitLever,
} from '@/lib/planner/fit';
import { PlannerFitLevers } from './planner-fit-levers';
import { PlannerFitList } from './planner-fit-list';
import { PlannerStepRail } from './planner-step-rail';
import { cn } from '@/lib/utils';

type FitStep = 'levers' | 'rides' | 'result';

interface PlannerFitAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkName: string;
  /** The day, already formatted for the reader — this component picks no format. */
  dateLabel: string;
  input: FitInput;
  /** The visitor's answer: what to plan, in what order, with which blocks. */
  onConfirm: (choice: FitChoice) => void;
}

/**
 * What to give up, asked as a walk-through rather than as a footnote.
 *
 * The day does not always hold what somebody asks it to. Phantasialand has ten
 * headliners and a nine-hour Saturday, and with an hour out of the middle for
 * lunch one of them has nowhere to go — measured, on 2026-09-12, and on
 * 2026-10-03 it is two. Until this, that came back as a clause in a grey
 * eleven-pixel line under the buttons („eine passt nicht mehr in den Tag")
 * beside a block drawn in the hatched hours, and the report that started this
 * work said what a reader does with that: nothing, because it does not read as
 * something to act on.
 *
 * So it is a dialog, it is three questions, and each one is answerable:
 *
 * 1. **Stellschrauben.** What could change so the day holds everything —
 *    measured levers, never advice. „Ohne Mittagspause passt der Plan" is
 *    printed on the days where taking the break out makes the whole list fit;
 *    on the days where it only helps it says how far it gets. Skipped entirely
 *    where the day has no free block to argue about, because a step with
 *    nothing on it is a step people learn to click through.
 * 2. **Wichtigkeit.** The whole list, ticked, with the rides that will not make
 *    it marked — and a pin per row that moves a ride to the top of the order
 *    the engine gives things up in. Untick, pin, watch the marks move: that is
 *    the „ausprobieren" the assistant exists for, and every recomputation is
 *    the same optimiser that runs on the press.
 * 3. **Ergebnis.** The day it comes to: how many rides, when the last queue is
 *    left, what it costs in queueing, and what is being left out by name.
 *
 * **Nothing is written until the last press.** Every screen recomputes against
 * a `FitChoice` held here, so backing out at any point leaves the plan exactly
 * as it was — which is what makes unticking a ride the visitor already has a
 * safe thing to offer. `optimizeDay` on its own may never delete an entry (it
 * parks it past the gate instead, see its `OVERFLOW_STRIDE`), and this is the
 * one place that rule is relaxed: not behind anybody's back, but in front of a
 * list where the ride is named and the press says what it will do.
 */
export function PlannerFitAssistant({
  open,
  onOpenChange,
  parkName,
  dateLabel,
  input,
  onConfirm,
}: PlannerFitAssistantProps) {
  const t = useTranslations('planner');
  const locale = useLocale();

  /**
   * The answers, initialised at MOUNT and never reset by an effect.
   *
   * The call site gives this component a `key` that changes on every press, so
   * each conflict is a fresh mount with a fresh answer — the same shape the
   * wizard uses, and for the same reason: an effect watching `open` would be a
   * cascading render that still has to guard against inheriting the previous
   * day's keys.
   */
  const [choice, setChoice] = useState<FitChoice>(() => fitChoiceAll());
  const steps: FitStep[] =
    input.blocks.length > 0 ? ['levers', 'rides', 'result'] : ['rides', 'result'];
  const [step, setStep] = useState<FitStep>(steps[0]);
  const [forward, setForward] = useState(true);

  /**
   * Everything the screens read, all three derived from one choice.
   *
   * Memoised together because they are three runs of the same search and the
   * levers are one run per free block on top — 5–50 ms each, which is nothing
   * on a press and is a stutter if it happens on every keystroke of a render.
   */
  const order = useMemo(() => fitOrder(input, choice), [input, choice]);
  const outcome = useMemo(() => evaluateFit(input, choice), [input, choice]);
  const { levers, applied } = useMemo(() => fitLeverView(input, choice), [input, choice]);

  const wanted = input.wishes.filter((wish) => !choice.dropped.has(wish.key)).length;
  const fits = outcome.fitted.length;
  /**
   * Everything still ticked has a slot before closing.
   *
   * Read in three places and named once, because it is the dialog's only real
   * state: the band at the top, the first step's sentence and the mark beside
   * it all have to agree, and a visitor who has just unticked their way out of
   * the problem is the one who notices when they do not.
   */
  const solved = fits >= wanted;
  const missed = useMemo(() => new Set(outcome.missed), [outcome]);
  const pinned = useMemo(() => new Set(choice.priority), [choice]);
  const byKey = useMemo(() => new Map(input.wishes.map((wish) => [wish.key, wish])), [input]);

  const index = steps.indexOf(step);
  const goTo = (next: FitStep) => {
    setForward(steps.indexOf(next) > index);
    setStep(next);
  };

  const pull = (lever: FitLever) => setChoice((current) => toggleLever(input, current, lever));
  const tick = (key: string) => setChoice((current) => toggleWish(current, key));
  const pin = (key: string) => setChoice((current) => togglePin(current, key));

  const last = index === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        {/* The band the wizard spends on a photograph, spent here on the
            sentence that opened the dialog. There is no park to choose and the
            panel behind this one is already showing the park's picture; what a
            reader needs at the top is what is wrong and with which day. */}
        <div className="bg-crowd-high/10 border-crowd-high/30 shrink-0 border-b px-5 py-3 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="text-crowd-high size-4 shrink-0" aria-hidden="true" />
            {t('fit.title')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1 text-xs leading-snug">
            {t('fit.subtitle', { park: parkName, date: dateLabel })}
          </DialogDescription>
        </div>

        <PlannerStepRail
          steps={steps.map((key) => ({ key, label: t(`fit.steps.${key}`) }))}
          current={index}
          label={t('wizard.progress')}
          onJump={(to) => goTo(steps[to])}
        />

        {/* The one figure the whole dialog is about, on every screen and always
            live. Pinning a ride or cutting the break short moves it in the same
            frame the press lands in, which is what makes the two lists below
            something to experiment with rather than a form to fill in. */}
        <p
          data-planner-fit-count=""
          data-planner-fit-solved={solved ? '' : undefined}
          className={cn(
            'border-border/60 flex shrink-0 flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b px-5 py-2 text-xs sm:px-6',
            solved ? 'bg-status-operating/10 text-status-operating' : 'text-crowd-high'
          )}
        >
          <span className="flex items-center gap-1.5 font-medium">
            {/* The mark is what carries the state at a glance, and the reason
                for it is the report this change came out of: a visitor who
                unticks their way to a day that fits sees the „fällt weg" marks
                disappear and nothing arrive in their place, so the screen looks
                like it lost something rather than like the problem is solved.
                Colour alone would not do it either — it is the same sentence
                either way, in a hue somebody may not be able to tell apart. */}
            {solved ? (
              <Check className="size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            {solved ? t('fit.allFit', { count: fits }) : t('fit.someFit', { fits, total: wanted })}
          </span>
          {fits > 0 && (
            <span className="text-muted-foreground">
              {t('fit.endsAt', { time: formatGridTime(outcome.endMinute) })} ·{' '}
              {t('fit.queueing', {
                duration: formatShortDuration(outcome.totalWaitMinutes, locale),
              })}
            </span>
          )}
        </p>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div key={step} className={cn('motion-safe:animate-in', STEP_MOTION[String(forward)])}>
            {step === 'levers' && (
              <div className="flex flex-col gap-3">
                {/* Three states, not two. The step used to say „an den Blöcken
                    liegt es nicht" whenever no lever was on offer, which is
                    true while the day is short and a lie the moment somebody
                    has already made it fit — and coming back to this screen
                    after unticking a ride is exactly when it was read. */}
                <p
                  className={cn(
                    'text-xs leading-relaxed',
                    solved ? 'text-status-operating' : 'text-muted-foreground'
                  )}
                >
                  {solved
                    ? t('fit.leversFits')
                    : levers.length > 0
                      ? t('fit.leversBody')
                      : t('fit.leversNone')}
                </p>
                <PlannerFitLevers levers={levers} applied={applied} onToggle={pull} />
              </div>
            )}

            {step === 'rides' && (
              <div className="flex flex-col gap-3">
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {t('fit.ridesBody')}
                </p>
                <PlannerFitList
                  wishes={order}
                  dropped={choice.dropped}
                  missed={missed}
                  pinned={pinned}
                  onToggle={tick}
                  onPin={pin}
                />
              </div>
            )}

            {step === 'result' && (
              <div className="flex flex-col gap-3">
                <ul className="flex flex-col gap-1.5 text-xs">
                  <ResultRow
                    label={t('fit.resultRides')}
                    value={t('summary.rides', { count: fits })}
                  />
                  {fits > 0 && (
                    <>
                      <ResultRow
                        label={t('fit.resultEnd')}
                        value={formatGridTime(outcome.endMinute)}
                      />
                      <ResultRow
                        label={t('fit.resultWait')}
                        value={formatShortDuration(outcome.totalWaitMinutes, locale)}
                      />
                    </>
                  )}
                </ul>

                {/* Named, never counted. „zwei passen nicht" is the sentence
                    this dialog exists to replace: the visitor is about to press
                    a button that takes two rides out of their day, and the only
                    honest thing to put in front of that press is which two. */}
                {(outcome.missed.length > 0 || choice.dropped.size > 0) && (
                  <div className="border-crowd-high/30 bg-crowd-high/10 flex flex-col gap-1 rounded-md border px-2.5 py-2">
                    <p className="text-crowd-high text-[11px] font-medium">{t('fit.resultOut')}</p>
                    <p className="text-muted-foreground text-[11px] leading-snug">
                      {[...outcome.missed, ...choice.dropped]
                        .map((key) => byKey.get(key)?.attractionName)
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                )}

                <p className="text-muted-foreground flex items-start gap-1.5 text-xs leading-relaxed">
                  <ArrowRight className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  {t('fit.resultHint')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-border/60 flex shrink-0 items-center justify-between gap-2 border-t px-3 py-3 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (index === 0 ? onOpenChange(false) : goTo(steps[index - 1]))}
          >
            {index === 0 ? t('cancel') : t('wizard.back')}
          </Button>
          {last ? (
            <Button onClick={() => onConfirm(choice)} data-planner-fit-apply="">
              <Check className="size-4" aria-hidden="true" />
              {t('fit.apply')}
            </Button>
          ) : (
            <Button onClick={() => goTo(steps[index + 1])} data-planner-fit-next="">
              {t('wizard.next')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="border-border/50 flex items-baseline justify-between gap-3 border-b pb-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </li>
  );
}

/** Which way a step slides in from — the wizard's own two class strings. */
const STEP_MOTION: Record<string, string> = {
  true: 'motion-safe:slide-in-from-right-4 motion-safe:fade-in-0 motion-safe:duration-200',
  false: 'motion-safe:slide-in-from-left-4 motion-safe:fade-in-0 motion-safe:duration-200',
};
