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
  type FitLeverView,
} from '@/lib/planner/fit';
import { PlannerFitLevers } from './planner-fit-levers';
import { PlannerFitList } from './planner-fit-list';
import { PlannerStepRail, STEP_MOTION } from './planner-step-rail';
import { cn } from '@/lib/utils';

type FitStep = 'levers' | 'rides' | 'result';

const NO_LEVERS: FitLeverView = { levers: [], applied: new Set() };

interface PlannerFitAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkName: string;
  /** The day, already formatted for the reader — this component picks no format. */
  dateLabel: string;
  input: FitInput;
  /** The visitor's answer: what to plan, in what order, with which blocks. */
  onConfirm: (choice: FitChoice) => void;
  /**
   * The answer to start from: absent on a fresh conflict (everything ticked), the previous answer
   * on „Anpassen", so the visitor revises rather than starts over, and after „In den Plan"
   * everything ticked with that ride pinned (`requestedRideChoice`).
   */
  initialChoice?: FitChoice;
  /**
   * The one ride whose press opened this (`AddToPlannerButton`), named in the title because it is
   * the reason the dialog is on screen.
   */
  requested?: string;
}

/**
 * What to give up, asked as a walk-through rather than as a footnote: measured levers (skipped
 * where the day has no free block), the whole list with what falls out marked and a pin per row,
 * and the result with what is left out by name.
 *
 * Nothing is written until the last press: every screen recomputes against a `FitChoice` held
 * here, so backing out leaves the plan as it was. This is the one place an entry may be removed,
 * in front of a list that names it. See
 * docs/rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md.
 */
export function PlannerFitAssistant({
  open,
  onOpenChange,
  parkName,
  dateLabel,
  input,
  onConfirm,
  initialChoice,
  requested,
}: PlannerFitAssistantProps) {
  const t = useTranslations('planner');
  const locale = useLocale();

  /**
   * The answers, initialised at mount and never reset by an effect: the call site keys this
   * component per press, so each conflict is a fresh mount, as the wizard does.
   */
  const [choice, setChoice] = useState<FitChoice>(() => initialChoice ?? fitChoiceAll());
  const steps: FitStep[] =
    input.blocks.length > 0 ? ['levers', 'rides', 'result'] : ['rides', 'result'];
  const [step, setStep] = useState<FitStep>(steps[0]);
  const [forward, setForward] = useState(true);

  /**
   * Everything the screens read, derived from one choice and memoised, since each is a run of the
   * same search.
   */
  const order = useMemo(() => fitOrder(input, choice), [input, choice]);
  const outcome = useMemo(() => evaluateFit(input, choice), [input, choice]);
  // One probe per free block, and only the first screen draws them.
  const { levers, applied } = useMemo(
    () => (step === 'levers' ? fitLeverView(input, choice, outcome) : NO_LEVERS),
    [step, input, choice, outcome]
  );

  const wanted = input.wishes.filter((wish) => !choice.dropped.has(wish.key)).length;
  const fits = outcome.fitted.length;
  /**
   * Everything still ticked has a slot before closing: the dialog's only real state, named once so
   * the band, the first step's sentence and its mark agree.
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
        {/* The band the wizard spends on a photograph, spent here on what is wrong and with which
            day. */}
        <div className="bg-crowd-high/10 border-crowd-high/30 shrink-0 border-b px-5 py-3 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="text-crowd-high size-4 shrink-0" aria-hidden="true" />
            {requested ? t('fit.titleFor', { ride: requested }) : t('fit.title')}
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

        {/* The figure the dialog is about, on every screen and live, so the lists below are
            something to experiment with. */}
        <p
          data-planner-fit-count=""
          data-planner-fit-solved={solved ? '' : undefined}
          className={cn(
            'border-border/60 flex shrink-0 flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b px-5 py-2 text-xs sm:px-6',
            solved ? 'bg-status-operating/10 text-status-operating' : 'text-crowd-high'
          )}
        >
          <span className="flex items-center gap-1.5 font-medium">
            {/* The mark carries the state at a glance, so a list whose „fällt weg" marks just went
                quiet reads as solved; colour alone would not. */}
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
                {/* Three states, not two: "an den Blöcken liegt es nicht" is a lie once the visitor
                    has made the day fit. */}
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

                {/* Named, never counted: before a press that takes rides out of the day, the honest
                    thing to show is which ones. */}
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
