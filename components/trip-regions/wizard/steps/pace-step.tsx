'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { BookOpen, Info, PlaneLanding, PlaneTakeoff, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { formatClockTime } from '@/lib/utils/intl-format';
import { formatParkDay } from '@/lib/utils/park-day';
import { effectiveParks, MAX_REST_STREAK, setSplit, type PlanRest } from '@/lib/trip-regions/plan';
import { tripRegionGuidePath } from '@/lib/trip-regions/paths';
import { planStays } from '@/lib/trip-regions/plan-stays';
import {
  AUTO_REST_STREAK,
  DEFAULT_REST_STREAK,
  pacePattern,
  restStreak,
  travelDayFact,
} from '@/lib/trip-regions/wizard-choices';
import { WizardOptionCard, WizardOptionGroup } from '@/components/planner/wizard-option-card';
import { WizardToggle } from '@/components/planner/wizard-toggle';
import { usePlanContext } from '../../planner/plan-context';
import { PLAN_FOCUS, PlanStepper } from '../../planner/plan-controls';
import { useBaseName } from '../../planner/plan-place-words';
import { useStatePlan, useTripCalendar } from '../../planner/use-trip-plan';
import type { WizardStepProps } from '../wizard-step';

/**
 * Tempo: how full the trip is, as three cards with a week drawn as a pattern (`pacePattern`), park
 * days solid and rest days pale, the own limit's pattern following its stepper; then the switches
 * for second days and a park on the travel days, whose cards name a fact of that day from the
 * calendar (`travelDayFact`). The region's planner guide is linked under the cards, the one place that
 * explains the options at length.
 */
export function PaceStep({ questions, askId }: WizardStepProps) {
  const t = useTranslations('tripPlanner.wizard.pace');
  const tOptions = useTranslations('tripPlanner.options');
  const { state, update, config, locale } = usePlanContext();
  const moreId = useId();
  const guide = tripRegionGuidePath(config, locale);
  const streak = restStreak(state.rest);
  const mode = streak !== null ? 'max' : state.rest === 'none' ? 'none' : 'auto';
  const setRest = (rest: PlanRest) => update((s) => ({ ...s, rest }));
  const toggles = questions.includes('second_days') || questions.includes('travel_days');

  return (
    <div className="flex flex-col gap-5" data-wizard-pace="">
      {questions.includes('rest') && (
        <div className="flex flex-col gap-2">
          <WizardOptionGroup labelledBy={askId}>
            <WizardOptionCard
              checked={mode === 'auto'}
              onSelect={() => setRest('auto')}
              title={tOptions('restAutoLabel')}
              hint={tOptions('restAutoHint')}
              aside={<PacePattern streak={AUTO_REST_STREAK} />}
              data-wizard-rest="auto"
            />
            <WizardOptionCard
              checked={mode === 'max'}
              onSelect={() => setRest(`max:${streak ?? DEFAULT_REST_STREAK}`)}
              title={tOptions('restMaxLabel')}
              hint={t('maxHint', { n: streak ?? DEFAULT_REST_STREAK })}
              aside={<PacePattern streak={streak ?? DEFAULT_REST_STREAK} />}
              data-wizard-rest="max"
            >
              {streak !== null && (
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm">{t('streak')}</span>
                  <PlanStepper
                    value={streak}
                    canDecrement={streak > 1}
                    canIncrement={streak < MAX_REST_STREAK}
                    onDecrement={() => setRest(`max:${streak - 1}`)}
                    onIncrement={() => setRest(`max:${streak + 1}`)}
                    decrementLabel={tOptions('restFewer')}
                    incrementLabel={tOptions('restMore')}
                  />
                </span>
              )}
            </WizardOptionCard>
            <WizardOptionCard
              checked={mode === 'none'}
              onSelect={() => setRest('none')}
              title={tOptions('restNoneLabel')}
              hint={t('noneHint')}
              aside={<PacePattern streak={null} />}
              data-wizard-rest="none"
            />
          </WizardOptionGroup>
          <p className="text-muted-foreground flex items-start gap-1.5 text-xs leading-relaxed">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {t('patternKey')}
          </p>
          {guide && (
            <Link
              href={guide}
              className={cn(
                'text-primary-ink inline-flex min-h-11 items-center gap-2 self-start rounded-md text-sm font-medium underline-offset-4 hover:underline lg:min-h-8',
                PLAN_FOCUS
              )}
            >
              <BookOpen className="size-4 shrink-0" aria-hidden="true" />
              {tOptions('guide')}
            </Link>
          )}
        </div>
      )}

      {toggles && (
        <section
          className="flex flex-col gap-2.5"
          aria-labelledby={moreId}
          data-wizard-pace-more=""
        >
          <h3 id={moreId} className="text-base font-semibold">
            {t('more')}
          </h3>
          {questions.includes('second_days') && (
            <WizardToggle
              icon={Sparkles}
              label={tOptions('split')}
              hint={tOptions('splitHint')}
              checked={state.split === 'auto'}
              onChange={(on) => update((s) => setSplit(s, on ? 'auto' : 'fixed'))}
            />
          )}
          {questions.includes('travel_days') && (
            <>
              <TravelDayToggle end="arrival" />
              <TravelDayToggle end="departure" />
            </>
          )}
        </section>
      )}
    </div>
  );
}

/** A week of the trip as squares: a park day solid, a rest day pale. A picture; the card says it. */
function PacePattern({ streak }: { streak: number | null }) {
  return (
    <span aria-hidden="true" className="flex gap-0.5 pt-1">
      {pacePattern(streak).map((park, i) => (
        <span
          key={i}
          className={cn('size-2.5 rounded-[3px]', park ? 'bg-primary' : 'bg-primary/15')}
        />
      ))}
    </span>
  );
}

/**
 * A park on the arrival or the departure day, as a switch whose line is a fact of that day: where
 * the trip lands or leaves from in a region with cities, and the park among the trip's that closes
 * last on the arrival or opens first on the departure.
 */
function TravelDayToggle({ end }: { end: 'arrival' | 'departure' }) {
  const t = useTranslations('tripPlanner.wizard.pace');
  const tDates = useTranslations('tripPlanner.dates');
  const { region, state, update, headliners, parkName, locale, timeZone } = usePlanContext();
  const plan = useStatePlan().data;
  const calendar = useTripCalendar(state.from, state.to);
  const baseName = useBaseName();
  const date = end === 'arrival' ? state.from : state.to;
  const stays = plan ? planStays(plan) : [];
  const stay = end === 'arrival' ? stays[0] : stays.at(-1);
  const base = stay ? region.bases?.find((b) => b.key === stay.base) : undefined;
  const reach = base ? new Set(base.parks.map((p) => p.slug)) : null;
  const parks = effectiveParks(state, headliners)
    .map((p) => p.slug)
    .filter((slug) => !reach || reach.has(slug));
  const fact = date
    ? travelDayFact(
        calendar.data?.days.find((d) => d.date === date),
        parks,
        end
      )
    : null;
  const day = date
    ? formatParkDay(locale, date, { weekday: 'short', day: 'numeric', month: 'short' })
    : '';
  const lines = [
    base ? t(end === 'arrival' ? 'startsIn' : 'endsIn', { city: baseName(base.key) }) : null,
    fact
      ? t(end === 'arrival' ? 'openUntil' : 'opensAt', {
          park: parkName(fact.slug),
          time: formatClockTime(fact.at, locale, timeZone),
          date: day,
        })
      : null,
  ].filter(Boolean);
  const on = (end === 'arrival' ? state.arrival : state.departure) === 'park';
  return (
    <WizardToggle
      icon={end === 'arrival' ? PlaneLanding : PlaneTakeoff}
      label={tDates(end === 'arrival' ? 'arrivalPark' : 'departurePark')}
      hint={
        lines.length > 0 ? lines.join(' ') : t(end === 'arrival' ? 'arrivalHint' : 'departureHint')
      }
      checked={on}
      onChange={(next) =>
        update((s) =>
          end === 'arrival'
            ? { ...s, arrival: next ? 'park' : 'free' }
            : { ...s, departure: next ? 'park' : 'free' }
        )
      }
    />
  );
}
