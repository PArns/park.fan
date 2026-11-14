'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeftRight, CalendarRange, Lock, Moon, Shuffle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getListFormat } from '@/lib/utils/intl-format';
import { formatParkDay } from '@/lib/utils/park-day';
import { effectiveParks, type TripPlanState } from '@/lib/trip-regions/plan';
import {
  hopperGains,
  hopperTicketResorts,
  ticketsCoverBothResorts,
  toggleHopper,
  type HopperGain,
} from '@/lib/trip-regions/plan-tickets';
import { Button } from '@/components/ui/button';
import { WizardOptionCard, WizardOptionGroup } from '@/components/planner/wizard-option-card';
import {
  WIZARD_CARD_FRAME,
  WIZARD_CARD_ICON,
  WizardToggle,
} from '@/components/planner/wizard-toggle';
import { usePlanContext, useTripEvents } from '../../planner/plan-context';
import { useHopperWord } from '../../planner/plan-ticket-words';
import { useStatePlan } from '../../planner/use-trip-plan';
import type { WizardStepProps } from '../wizard-step';

/**
 * Evenings: whether the plan suggests an evening where a park closes early, with the region's
 * places for one as chips; Magic Kingdom's fireworks against its party nights as two cards;
 * keeping Disney and Universal days together; and park hopping, which counts only with a hopper.
 * Without one, hopping is a locked card that says so, and where the API's hopper verdict finds a
 * park that fits only with it, it says that too and offers the plan with the hopper. Merged into
 * Tempo (Japan), only the evening switch is drawn.
 */
export function EveningsStep({ questions, merged }: WizardStepProps) {
  return (
    <div className={cn('flex flex-col gap-5', merged && '-mt-2.5')} data-wizard-evenings="">
      {questions.includes('evenings') && <EveningToggle />}
      {questions.includes('fireworks') && <Fireworks />}
      {questions.includes('blocks') && <Blocks />}
      {questions.includes('hop') && <Hopping />}
    </div>
  );
}

/** The plan's evening suggestions, with the places of the trip's resorts as chips. */
function EveningToggle() {
  const tOptions = useTranslations('tripPlanner.options');
  const tRegion = useTranslations('tripRegion.planner.options');
  const { region, state, update, headliners, parkBySlug } = usePlanContext();
  const groups = new Set(
    effectiveParks(state, headliners).map((p) => parkBySlug.get(p.slug)?.group)
  );
  const venues = (region.venues ?? []).filter((v) => groups.has(v.group));
  return (
    <WizardToggle
      icon={Moon}
      label={tOptions('evenings')}
      hint={tRegion.has('eveningsHint') ? tRegion('eveningsHint') : null}
      checked={state.evenings}
      onChange={(evenings) => update((s) => ({ ...s, evenings }))}
    >
      {state.evenings && venues.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" data-wizard-venues="">
          {venues.map((venue) => (
            <li
              key={venue.key}
              className="border-border/70 text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs"
            >
              {venue.name}
            </li>
          ))}
        </ul>
      )}
    </WizardToggle>
  );
}

/** The fireworks question: a park day that avoids the party nights, or one where it pays. */
function Fireworks() {
  const tOptions = useTranslations('tripPlanner.options');
  const tRegion = useTranslations('tripRegion.planner.options');
  const { state, update } = usePlanContext();
  const headingId = useId();
  const choose = (fireworks: TripPlanState['fireworks']) => update((s) => ({ ...s, fireworks }));
  return (
    <section className="flex flex-col gap-2.5">
      <h3 id={headingId} className="text-base font-semibold">
        {tRegion('fireworks')}
      </h3>
      <WizardOptionGroup labelledBy={headingId} className="grid-cols-2">
        <WizardOptionCard
          size="tile"
          icon={Sparkles}
          checked={state.fireworks === 'want'}
          onSelect={() => choose('want')}
          title={tOptions('fireworksWant')}
          hint={tRegion('fireworksWantHint')}
          data-wizard-fireworks="want"
        />
        <WizardOptionCard
          size="tile"
          icon={Shuffle}
          checked={state.fireworks === 'any'}
          onSelect={() => choose('any')}
          title={tOptions('fireworksAny')}
          hint={tRegion('fireworksAnyHint')}
          data-wizard-fireworks="any"
        />
      </WizardOptionGroup>
    </section>
  );
}

/**
 * Disney days and Universal days together: a switch, or with owned tickets for both resorts the
 * three answers of where they may mix.
 */
function Blocks() {
  const tOptions = useTranslations('tripPlanner.options');
  const tRegion = useTranslations('tripRegion.planner.options');
  const { config, state, update, tickets: catalog } = usePlanContext();
  const headingId = useId();
  const mixable = ticketsCoverBothResorts(config.blockResorts, state.tickets, catalog);
  if (!mixable) {
    return (
      <WizardToggle
        icon={CalendarRange}
        label={tRegion('blocks')}
        hint={tOptions('blocksHint')}
        checked={state.blocks !== false}
        onChange={(on) => update((s) => ({ ...s, blocks: on ? null : false }))}
      />
    );
  }
  const value = state.blocks === null ? 'auto' : state.blocks ? 'on' : 'off';
  const answers = [
    { mode: 'auto', title: tOptions('blocksAuto'), hint: tOptions('blocksAutoHint'), blocks: null },
    { mode: 'on', title: tOptions('blocksAlways'), hint: undefined, blocks: true },
    { mode: 'off', title: tOptions('blocksFree'), hint: undefined, blocks: false },
  ] as const;
  return (
    <section className="flex flex-col gap-2.5">
      <h3 id={headingId} className="text-base font-semibold">
        {tRegion('blocksTickets')}
      </h3>
      <WizardOptionGroup labelledBy={headingId}>
        {answers.map((a) => (
          <WizardOptionCard
            key={a.mode}
            checked={value === a.mode}
            onSelect={() => update((s) => ({ ...s, blocks: a.blocks }))}
            title={a.title}
            hint={a.hint}
            data-wizard-blocks={a.mode}
          />
        ))}
      </WizardOptionGroup>
    </section>
  );
}

/**
 * Park hopping: a switch once the trip has a hopper (an owned ticket with one, or the plan made
 * with it), else a locked card. The locked card names the first thing the API's verdict says the
 * hopper adds (a park that fits only with it, an evening in a second park) and offers that plan.
 */
function Hopping() {
  const t = useTranslations('tripPlanner.wizard.evenings');
  const tOptions = useTranslations('tripPlanner.options');
  const tHopper = useTranslations('tripPlanner.tickets.hopper');
  const { config, state, update, tickets: catalog, parkName, locale } = usePlanContext();
  const plan = useStatePlan().data;
  const hopperWord = useHopperWord();
  const track = useTripEvents();
  const hopper =
    state.ticket === 'hopper' ||
    state.hopper.length > 0 ||
    hopperTicketResorts(state.tickets, catalog).length > 0;
  if (hopper) {
    return (
      <WizardToggle
        icon={ArrowLeftRight}
        label={tOptions('hop')}
        hint={tOptions('hopHint')}
        checked={state.hop}
        onChange={(hop) => update((s) => ({ ...s, hop }))}
      />
    );
  }

  const suggestions = plan?.meta.ticketSuggestion ?? [];
  const optional = [
    ...new Set(
      suggestions.filter((s) => catalog.get(s.product)?.hopping === 'optional').map((s) => s.resort)
    ),
  ];
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });
  const or = getListFormat(locale, { style: 'long', type: 'disjunction' });
  const names = [...new Set(Object.keys(config.tickets?.hopperNames ?? {}).map(hopperWord))];
  const sentence = (resort: string, gain: HopperGain): string | null => {
    if (gain.kind === 'fits') {
      return t('hopFits', {
        hopper: hopperWord(resort),
        parks: list.format(gain.parks.map(parkName)),
        count: gain.parks.length,
      });
    }
    if (gain.kind === 'evening') {
      return t('hopEvening', {
        hopper: hopperWord(resort),
        park: parkName(gain.park),
        date: formatParkDay(locale, gain.date, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
      });
    }
    return null;
  };
  const verdict = suggestions
    .map((s) => {
      const line = hopperGains(s.hopper)
        .map((gain) => sentence(s.resort, gain))
        .find((text) => text !== null);
      return line ? { resort: s.resort, line } : null;
    })
    .find((v) => v !== null);

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-dashed p-3',
        WIZARD_CARD_FRAME.off
      )}
      data-wizard-hop="locked"
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          WIZARD_CARD_ICON.off
        )}
      >
        <Lock className="size-4" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-medium">{tOptions('hop')}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {t('hopLocked', { hopper: or.format(names) })}
        </p>
        {verdict && (
          <>
            <p className="text-sm font-medium" data-wizard-hop-verdict="">
              {verdict.line}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-1 self-start"
              onClick={() => {
                track('trip_hopper_toggled', { resort: verdict.resort, on: true });
                update((s) => toggleHopper(s, verdict.resort, optional));
              }}
            >
              {tHopper('with', { hopper: hopperWord(verdict.resort) })}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
