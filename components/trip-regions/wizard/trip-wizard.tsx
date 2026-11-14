'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { daysBetween, formatParkDayRange } from '@/lib/utils/park-day';
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ENTER_BELONGS_TO,
  PlannerStepRail,
  STEP_MOTION,
} from '@/components/planner/planner-step-rail';
import {
  stepQuestions,
  tripWizardFacts,
  tripWizardSteps,
  wizardStepIndex,
  type TripWizardStep,
  type TripWizardStepKey,
} from '@/lib/trip-regions/wizard-steps';
import { skippedBucket } from '@/lib/trip-regions/plan-analytics';
import type { TripWizardStepName, TripWizardVia } from '@/lib/analytics/site-analytics';
import { usePlanContext, useTripEvents } from '../planner/plan-context';
import type { TicketStep } from '../planner/plan-tickets';
import { WIZARD_STEP_BODIES } from './steps';
import { FinaleStep } from './steps/finale-step';
import { PlanRibbon } from './plan-ribbon';
import { WizardGuideBand } from './wizard-guide-band';
import { WizardAskContext, WizardFrameContext, type WizardFrameValue } from './wizard-step';

/** A screen of the assistant: a step, or the finale after the last. */
export type TripWizardScreen = TripWizardStepName;

/** Where the assistant is and how it got there; `null` while it is closed. */
export interface TripWizardAt {
  screen: TripWizardScreen;
  /** How the screen was reached; `start` for the first screen of an opening from a start. */
  via: TripWizardVia | 'start';
}

/**
 * The assistant's steps for the planner's region and trip (`tripWizardSteps`), only those with a
 * body in `WIZARD_STEP_BODIES`. The list follows the trip's nights, so a Paris weekend's hotel goes
 * into the Route once its dates are chosen.
 */
export function useWizardSteps(): TripWizardStep[] {
  const { region, config, state, tickets } = usePlanContext();
  return useMemo(
    () =>
      tripWizardSteps(tripWizardFacts(region, config, state, daysBetween, tickets)).filter(
        (step) => WIZARD_STEP_BODIES[step.key] !== undefined
      ),
    [region, config, state, tickets]
  );
}

/**
 * The trip planner's assistant: one question a screen, asked by Parky from the region's scene
 * (`WizardGuideBand`), the step rail, the step's cards, and a footer with the plan as a ribbon
 * (`PlanRibbon`) once the trip has dates. A dialog over the whole height of a phone and a stage in
 * the middle of a desk. Only the dates are required; every step after them can be skipped, the rail
 * jumps to any of them, and "Show the plan now" leaves for the result at any point. The finale
 * follows the last step. Every answer writes the planner's state, the address, as the rest of the
 * planner does, so the assistant is a view on the plan and not a form of its own.
 * docs/features/trip-planner/wizard.md#the-trip-planners-assistant.
 */
export function TripWizard({
  at,
  onMove,
  onClose,
  onShowPlan,
  ticketStep,
  defaultMonth,
}: {
  at: TripWizardAt | null;
  onMove: (at: TripWizardAt) => void;
  /** Closed without the plan: Escape, the close button. */
  onClose: () => void;
  /** Leave for the plan: `early` from "Show the plan now", else from the finale or a date search. */
  onShowPlan: () => void;
  ticketStep: TicketStep;
  defaultMonth?: string;
}) {
  const t = useTranslations('tripPlanner.wizard');
  const tSetup = useTranslations('tripPlanner.setup');
  const tNav = useTranslations('tripRegion.nav');
  const { region, state, locale } = usePlanContext();
  const track = useTripEvents();
  const steps = useWizardSteps();
  const askId = useId();
  const askRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [override, setOverride] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [forward, setForward] = useState(true);

  const open = at !== null;
  const screen = at?.screen ?? 'dates';
  const finale = screen === 'finale';
  const index = finale ? steps.length : Math.max(0, wizardStepIndex(steps, screen));
  const step: TripWizardStep | undefined = finale ? undefined : steps[index];
  const dated = Boolean(state.from && state.to);
  const searching = state.when !== null;
  const last = steps.length - 1;

  // One opening counts its own skips and how far it got; a new opening starts both again.
  const [opened, setOpened] = useState(open);
  if (open !== opened) {
    setOpened(open);
    if (open) {
      setSkipped(0);
      setFurthest(index);
      setForward(true);
    }
  }
  if (open && index > furthest) setFurthest(index);

  useEffect(() => {
    if (!at || at.via === 'start') return;
    track('trip_wizard_step', { step: at.screen, via: at.via });
  }, [at, track]);

  // A new screen puts the focus on Parky's question, so a screen reader reads it first.
  const shownScreen = useRef<string | null>(null);
  useEffect(() => {
    if (!open) {
      shownScreen.current = null;
      return;
    }
    if (shownScreen.current !== null && shownScreen.current !== screen) {
      askRef.current?.focus({ preventScroll: true });
    }
    shownScreen.current = screen;
  }, [open, screen]);

  const go = useCallback(
    (to: number, via: TripWizardVia) => {
      setForward(via !== 'back' && to >= index);
      if (via === 'skip') setSkipped((n) => n + 1);
      onMove({ screen: to >= steps.length ? 'finale' : steps[to].key, via });
    },
    [index, onMove, steps]
  );

  const finish = useCallback(
    (early: boolean) => {
      track('trip_wizard_finished', { skipped: skippedBucket(skipped), early });
      onShowPlan();
    },
    [onShowPlan, skipped, track]
  );

  const primary: { label: string; run: () => void; enabled: boolean; done?: boolean } = finale
    ? { label: t('showPlan'), run: () => finish(false), enabled: true }
    : index === 0 && searching
      ? { label: tSetup('find'), run: () => finish(true), enabled: true }
      : index >= last
        ? { label: t('finish'), run: () => go(steps.length, 'next'), enabled: dated, done: true }
        : { label: t('next'), run: () => go(index + 1, 'next'), enabled: dated || index > 0 };

  const advanceOnEnter = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || event.repeat || event.defaultPrevented) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest(ENTER_BELONGS_TO)) return;
    if (!primary.enabled) return;
    event.preventDefault();
    primary.run();
  };

  const regionName = tNav('name');
  const kicker = finale
    ? `${regionName} · ${t('finished')}`
    : dated && state.from && state.to
      ? `${regionName} · ${formatParkDayRange(locale, state.from, state.to, { day: 'numeric', month: 'short' })}`
      : `${regionName} · ${t('stepOf', { step: index + 1, total: steps.length })}`;
  const ask =
    override ??
    (finale ? t('ask.finale') : t(`ask.${step?.key ?? 'dates'}`, { inRegion: tNav('inRegion') }));

  const frame = useMemo<WizardFrameValue>(
    () => ({ ticketStep, defaultMonth, showPlan: () => finish(true) }),
    [ticketStep, defaultMonth, finish]
  );

  const bodyOf = (key: TripWizardStepKey, merged: boolean) => {
    const Body = WIZARD_STEP_BODIES[key];
    if (!Body || !step) return null;
    return <Body key={key} questions={stepQuestions(step, key)} merged={merged} askId={askId} />;
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={advanceOnEnter}
        onOpenAutoFocus={(event) => {
          // The first control, not the dialog: the date grid's focusable day on the first step.
          event.preventDefault();
          requestAnimationFrame(() => {
            const body = bodyRef.current;
            const target =
              body?.querySelector<HTMLElement>('[data-plan-date][tabindex="0"]') ??
              body?.querySelector<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), [tabindex="0"]'
              );
            (target ?? askRef.current)?.focus({ preventScroll: true });
          });
        }}
        data-trip-wizard={region.slug}
        className={cn(
          'flex flex-col gap-0 overflow-hidden p-0 sm:max-h-[92svh] sm:max-w-3xl',
          'max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0'
        )}
      >
        <DialogDescription className="sr-only">
          {finale ? t('finished') : t('stepOf', { step: index + 1, total: steps.length })}
        </DialogDescription>

        <WizardGuideBand
          region={region.slug}
          kicker={kicker}
          ask={ask}
          askId={askId}
          askRef={askRef}
          evening={step?.key === 'evenings'}
          closeLabel={tSetup('close')}
          onClose={onClose}
        />
        <PlannerStepRail
          steps={steps.map((s) => ({ key: s.key, label: t(`steps.${s.key}`) }))}
          current={index}
          label={t('progress')}
          reachable={dated ? last : furthest}
          jumpLabel={(i, label) => t('jump', { step: i + 1, label })}
          onJump={(to) => go(to, 'jump')}
        />

        <WizardFrameContext value={frame}>
          <WizardAskContext value={setOverride}>
            {/* The only row that scrolls; `min-h-0` lets it shrink so `overflow-y-auto` works. */}
            <div
              ref={bodyRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6"
            >
              <div
                key={screen}
                className={cn(
                  'motion-safe:animate-in flex flex-col gap-5',
                  STEP_MOTION[String(forward)]
                )}
              >
                {finale ? (
                  <FinaleStep />
                ) : (
                  step && (
                    <>
                      {bodyOf(step.key, false)}
                      {step.merged.map((key) => bodyOf(key, true))}
                    </>
                  )
                )}
              </div>
            </div>
          </WizardAskContext>
        </WizardFrameContext>

        <div className="border-border/60 flex shrink-0 flex-col gap-2 border-t px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          {!finale && dated && !searching && <PlanRibbon onShow={() => finish(true)} />}
          <div className="flex items-center gap-1 sm:gap-2">
            {index > 0 && (
              <Button variant="ghost" onClick={() => go(index - 1, 'back')}>
                {t('back')}
              </Button>
            )}
            <span className="flex-1" />
            {!finale && index > 0 && (
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => go(index + 1, 'skip')}
                data-wizard-skip=""
              >
                {t('skip')}
              </Button>
            )}
            <Button onClick={primary.run} disabled={!primary.enabled} data-wizard-next="">
              {primary.done && <Check className="size-4" aria-hidden="true" />}
              {primary.label}
              {!primary.done && <ArrowRight className="size-4" aria-hidden="true" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
