'use client';

import { useId, useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ChevronDown, PlaneLanding, PlaneTakeoff, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatShortDuration } from '@/lib/utils/duration';
import {
  addBase,
  fixedNights,
  releaseBase,
  setBaseNights,
  setGateway,
  tripDates,
  type TripPlan,
} from '@/lib/trip-regions/plan';
import type { PlanBasePick } from '@/lib/trip-regions/plan-query';
import { baseLeg, gatewayChoices, planStays, staySections } from '@/lib/trip-regions/plan-stays';
import { MIN_NIGHTS_FOR_A_MOVE } from '@/lib/trip-regions/wizard-steps';
import type { TripBase } from '@/lib/trip-regions/types';
import { WIZARD_CARD_FRAME } from '@/components/planner/wizard-toggle';
import { WizardOptionCard, WizardOptionGroup } from '@/components/planner/wizard-option-card';
import { usePlanContext } from '../../planner/plan-context';
import { PLAN_FOCUS, PlanStepper } from '../../planner/plan-controls';
import { useBaseName, useGatewayName } from '../../planner/plan-place-words';
import { MoveIcon, StayMarker } from '../../planner/plan-stay-band';
import { useStatePlan } from '../../planner/use-trip-plan';
import type { WizardStepProps } from '../wizard-step';

/** A city of the route: a stay of the plan, or a base the visitor named that the plan skips. */
interface RouteRow {
  base: TripBase;
  /** Its number on the route, where the plan stays there. */
  number: number | null;
  nights: number | null;
  /** The visitor's own nights, `null` while the plan picks them. */
  fixed: number | null;
  /** The visitor named the base without nights: a stay the plan sizes. */
  added: boolean;
  parks: string[];
}

/**
 * Route, in a region that sleeps in several cities (Japan, Paris): where the trip lands and where it
 * leaves from as cards, the city first and its airports small, then the cities on a line with their
 * nights. The ends are the visitor's, the middle is the plan's: a city's nights read as the plan
 * picked them until the stepper sets them. A gateway several bases share (Charles de Gaulle) pins
 * no base, so its card is the plan's choice. A trip of two nights or fewer sleeps in one city: the
 * step says so and folds the other cities away.
 */
export function RouteStep({ questions }: WizardStepProps) {
  return (
    <div className="flex flex-col gap-6" data-wizard-route="">
      {questions.includes('gateways') && (
        <>
          <GatewayQuestion end="start" />
          <GatewayQuestion end="end" />
        </>
      )}
      {questions.includes('cities') && <RouteLine />}
    </div>
  );
}

/** Where the trip lands, or where it leaves from: a card per base with its own gateways. */
function GatewayQuestion({ end }: { end: 'start' | 'end' }) {
  const t = useTranslations('tripPlanner.wizard.route');
  const { region, state, update } = usePlanContext();
  const baseName = useBaseName();
  const gatewayName = useGatewayName();
  const headingId = useId();
  const choices = useMemo(() => gatewayChoices(region.bases ?? []), [region.bases]);
  const value = end === 'start' ? state.startBase : state.endBase;
  const shared = choices.find((c) => c.base === null);
  const Icon = end === 'start' ? PlaneLanding : PlaneTakeoff;
  const names = (gateways: (typeof choices)[number]['gateways']) =>
    gateways.map(gatewayName).join(' · ');
  return (
    <section className="flex flex-col gap-2.5">
      <h3 id={headingId} className="flex items-center gap-2 text-base font-semibold">
        <Icon className="text-muted-foreground size-4" aria-hidden="true" />
        {t(end === 'start' ? 'arrive' : 'leave')}
      </h3>
      <WizardOptionGroup
        labelledBy={headingId}
        chosen={value === null || choices.some((c) => c.base === value)}
        className="grid-cols-2"
      >
        {choices.flatMap((c) =>
          c.base
            ? [
                <WizardOptionCard
                  key={c.base}
                  checked={value === c.base}
                  onSelect={() => update((s) => setGateway(s, end, c.base))}
                  title={baseName(c.base)}
                  hint={names(c.gateways)}
                  data-wizard-gateway={c.base}
                />,
              ]
            : []
        )}
        <WizardOptionCard
          dashed
          checked={value === null}
          onSelect={() => update((s) => setGateway(s, end, null))}
          title={shared ? names(shared.gateways) : t('open')}
          hint={shared ? t('openShared') : t('openHint')}
          data-wizard-gateway=""
        />
      </WizardOptionGroup>
    </section>
  );
}

/** The cities in route order on a line, each with its nights, the ride between, and cities to add. */
function RouteLine() {
  const t = useTranslations('tripPlanner.wizard.route');
  const tRoute = useTranslations('tripPlanner.route');
  const tProblem = useTranslations('tripPlanner.problem');
  const { region, state, update, parkName, photos } = usePlanContext();
  const plan = useStatePlan().data;
  const baseName = useBaseName();
  const bases = useMemo(() => region.bases ?? [], [region.bases]);
  const order = useMemo(() => bases.map((b) => b.key), [bases]);
  const headingId = useId();
  const [more, setMore] = useState(false);
  const nights = Math.max(0, tripDates(state).length - 1);
  const fixed = fixedNights(state);
  const rows = routeRows(plan, bases, state.bases);
  const addable = bases.filter((b) => !rows.some((r) => r.base.key === b.key));
  const short = nights > 0 && nights < MIN_NIGHTS_FOR_A_MOVE && rows.length === 1;
  const photoOf = (row: RouteRow) =>
    [...row.parks, ...row.base.parks.map((p) => p.slug)].map((slug) => photos[slug]).find(Boolean);

  return (
    <section className="flex flex-col gap-3" aria-labelledby={headingId}>
      <h3 id={headingId} className="text-base font-semibold">
        {tRoute('stays')}
      </h3>
      {short && <p className="text-muted-foreground text-sm">{t('oneCity', { nights })}</p>}
      <ol className="flex flex-col">
        {rows.map((row, i) => {
          const name = baseName(row.base.key);
          const shown = row.fixed ?? row.nights;
          const current = shown ?? 0;
          const next = rows[i + 1];
          const leg =
            next && row.number !== null && next.number !== null
              ? baseLeg(region.baseLegs, row.base.key, next.base.key)
              : null;
          const photo = photoOf(row);
          return (
            <li key={row.base.key} className="flex flex-col" data-wizard-city={row.base.key}>
              <div className="flex min-h-16 items-center gap-3 py-1.5">
                {row.number !== null ? (
                  <StayMarker number={row.number} className="size-6 text-xs" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="border-primary/45 size-6 shrink-0 rounded-full border border-dashed"
                  />
                )}
                {photo && (
                  <span className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={photo.src}
                      alt=""
                      fill
                      sizes="48px"
                      quality={60}
                      className="object-cover"
                      style={{ objectPosition: photo.position }}
                    />
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold">
                    {name}
                    <span className="text-muted-foreground text-xs font-normal">
                      {row.fixed !== null ? tRoute('fixed') : tRoute('byPlan')}
                    </span>
                  </span>
                  <span className="text-muted-foreground text-xs leading-snug">
                    {row.fixed === 0
                      ? tRoute('dayTrips')
                      : row.parks.length > 0
                        ? row.parks.map(parkName).join(' · ')
                        : row.number === null
                          ? tRoute('notStayed')
                          : tRoute('noParks')}
                  </span>
                  {(row.fixed !== null || row.added) && (
                    <button
                      type="button"
                      onClick={() =>
                        update((s) =>
                          row.added && row.fixed === null
                            ? releaseBase(s, row.base.key)
                            : setBaseNights(s, row.base.key, null, order, row.added)
                        )
                      }
                      className={cn(
                        'text-primary-ink -mx-1 min-h-11 self-start rounded-md px-1 text-left text-xs font-medium underline-offset-4 hover:underline lg:min-h-8',
                        PLAN_FOCUS
                      )}
                    >
                      {row.added && row.fixed === null ? tRoute('remove') : tRoute('release')}
                    </button>
                  )}
                </span>
                <PlanStepper
                  value={shown === null ? '–' : tRoute('nights', { count: shown })}
                  valueClassName="w-20"
                  canDecrement={current > 0}
                  canIncrement={current < nights}
                  onDecrement={() =>
                    update((s) =>
                      setBaseNights(s, row.base.key, Math.max(0, current - 1), order, row.added)
                    )
                  }
                  onIncrement={() =>
                    update((s) =>
                      setBaseNights(
                        s,
                        row.base.key,
                        Math.min(nights, current + 1),
                        order,
                        row.added
                      )
                    )
                  }
                  decrementLabel={tRoute('fewer', { city: name })}
                  incrementLabel={tRoute('more', { city: name })}
                />
              </div>
              {next && (
                <div className="flex min-h-8 items-stretch gap-3">
                  <span aria-hidden="true" className="flex w-6 shrink-0 justify-center">
                    <span className="bg-primary/40 w-0.5" />
                  </span>
                  {leg && <RouteLeg leg={leg} />}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {addable.length > 0 && short && (
        <button
          type="button"
          aria-expanded={more}
          onClick={() => setMore((open) => !open)}
          className={cn(
            'text-primary-ink inline-flex min-h-11 items-center gap-1 self-start rounded-md text-sm font-medium underline-offset-4 hover:underline lg:min-h-8',
            PLAN_FOCUS
          )}
        >
          {t('otherCities')}
          <ChevronDown
            className={cn('size-4 transition-transform', more && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      )}
      {addable.length > 0 && (!short || more) && (
        <div className="grid grid-cols-2 gap-2.5">
          {addable.map((base) => (
            <button
              key={base.key}
              type="button"
              onClick={() => update((s) => addBase(s, base.key, order))}
              className={cn(
                'hover:bg-accent/50 flex min-h-11 items-start gap-2 rounded-xl border border-dashed p-3 text-left transition-colors',
                WIZARD_CARD_FRAME.off,
                PLAN_FOCUS
              )}
              data-wizard-add-city={base.key}
            >
              <Plus className="text-primary-ink mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">
                  <span className="sr-only">{tRoute('add')}: </span>
                  {baseName(base.key)}
                </span>
                <span className="text-muted-foreground text-xs leading-snug">
                  {base.parks.map((p) => parkName(p.slug)).join(' · ')}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <p
        className={cn('text-sm', fixed > nights ? 'text-crowd-ink-high' : 'text-muted-foreground')}
        aria-live="polite"
      >
        {fixed > nights
          ? tProblem('too_many_nights', { fixed, nights })
          : plan && rows.length > 0
            ? tRoute('total', {
                nights,
                cities: planStays(plan).length,
                moves: plan.totals.moves ?? Math.max(0, planStays(plan).length - 1),
              })
            : null}
      </p>
    </section>
  );
}

/** The ride between two cities on the line: mode, length and what to do before it. */
function RouteLeg({ leg }: { leg: NonNullable<ReturnType<typeof baseLeg>> }) {
  const tMove = useTranslations('tripPlanner.move');
  const { locale } = usePlanContext();
  const notes = (leg.notes ?? []).filter((note) => tMove.has(`note.${note}`));
  return (
    <span className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 py-1 text-xs">
      <span className="text-primary-ink inline-flex items-center gap-1 font-medium">
        <MoveIcon mode={leg.mode} className="size-3.5 shrink-0" />
        {tMove.has(`mode.${leg.mode}`) ? tMove(`mode.${leg.mode}`) : tMove('mode.other')},{' '}
        {formatShortDuration(leg.minutes, locale)}
      </span>
      {notes.map((note) => (
        <span key={note}>{tMove(`note.${note}`)}</span>
      ))}
    </span>
  );
}

/**
 * The route's rows: the plan's stays in route order with the parks visited from each, then the
 * bases the visitor named that the plan does not stay in (a `:0`, a city added), in the region's
 * order.
 */
function routeRows(
  plan: TripPlan | undefined,
  bases: readonly TripBase[],
  picks: readonly PlanBasePick[]
): RouteRow[] {
  const byKey = new Map(bases.map((b) => [b.key, b]));
  const stays = plan ? planStays(plan) : [];
  const sections = plan ? staySections(plan) : [];
  const rows: RouteRow[] = [];
  for (const stay of stays) {
    const base = byKey.get(stay.base);
    if (!base) continue;
    const pick = picks.find((p) => p.key === stay.base);
    const days = sections.find((s) => s.stay?.base === stay.base)?.days ?? [];
    rows.push({
      base,
      number: stay.number,
      nights: stay.nights,
      fixed: pick?.nights ?? null,
      added: pick !== undefined && pick.nights === null && pick.area === null,
      parks: [...new Set(days.flatMap((d) => d.parks.map((p) => p.slug)))],
    });
  }
  // A plan with one stay draws no sections: its days are all that stay's.
  if (stays.length === 1 && plan && rows[0]) {
    rows[0].parks = [...new Set(plan.days.flatMap((d) => d.parks.map((p) => p.slug)))];
  }
  for (const pick of picks) {
    if (rows.some((r) => r.base.key === pick.key)) continue;
    const base = byKey.get(pick.key);
    if (!base) continue;
    rows.push({
      base,
      number: null,
      nights: pick.nights,
      fixed: pick.nights,
      added: pick.nights === null && pick.area === null,
      parks: [],
    });
  }
  return rows;
}
