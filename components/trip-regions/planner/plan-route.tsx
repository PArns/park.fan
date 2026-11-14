'use client';

import { useId, useMemo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { PlaneLanding, PlaneTakeoff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getListFormat } from '@/lib/utils/intl-format';
import {
  addBase,
  fixedNights,
  releaseBase,
  setBaseArea,
  setBaseNights,
  setGateway,
  setMoveBuffer,
  tripDates,
  type TripPlan,
} from '@/lib/trip-regions/plan';
import { DEFAULT_MOVE_BUFFERS, type PlanBasePick } from '@/lib/trip-regions/plan-query';
import { gatewayChoices, planStays, staySections } from '@/lib/trip-regions/plan-stays';
import { regionOrShared } from '@/lib/trip-regions/region-words';
import type { TripBase } from '@/lib/trip-regions/types';
import type { PlanSetupRoute } from './plan-setup';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS, PlanRadioGroup, PlanStepper } from './plan-controls';
import { useAreaName, useBaseName, useGatewayName } from './plan-place-words';
import { StayMarker } from './plan-stay-band';
import { useStatePlan } from './use-trip-plan';

/** A city of the Route step: a stay of the plan, or a base the visitor named that the plan skips. */
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
 * The setup's Route in a region with bases (Japan, Paris): the step, its summary line and its rows
 * under More options. `null` everywhere else, where the planner sleeps in one place.
 */
export function usePlanRouteSetup(): PlanSetupRoute | null {
  const t = useTranslations('tripPlanner.route');
  const { region, locale } = usePlanContext();
  const plan = useStatePlan();
  const baseName = useBaseName();
  if (!region.bases?.length) return null;
  const stays = plan.data ? planStays(plan.data) : [];
  const list = getListFormat(locale, { style: 'narrow', type: 'unit' });
  return {
    body: <PlanRoute plan={plan.data} />,
    summary:
      stays.length > 0
        ? list.format(stays.map((s) => t('stayShort', { city: baseName(s.base), count: s.nights })))
        : t('summaryOpen'),
    options: <PlanRouteOptions plan={plan.data} />,
  };
}

/**
 * The Route: where the trip lands and where it leaves from, then the cities in between with their
 * nights. The ends are the visitor's, the middle is the plan's: a city's nights read as the plan
 * picked them until the visitor sets them with the same stepper as a park's days. A gateway several
 * bases share (Charles de Gaulle) pins no base, so it reads as "not decided" and the plan picks.
 */
export function PlanRoute({ plan }: { plan: TripPlan | undefined }) {
  const t = useTranslations('tripPlanner.route');
  const tProblem = useTranslations('tripPlanner.problem');
  const { region, state, update, live, parkName } = usePlanContext();
  const baseName = useBaseName();
  const gatewayName = useGatewayName();
  const bases = useMemo(() => region.bases ?? [], [region.bases]);
  const order = useMemo(() => bases.map((b) => b.key), [bases]);
  const choices = useMemo(() => gatewayChoices(bases), [bases]);
  const nights = Math.max(0, tripDates(state).length - 1);
  const fixed = fixedNights(state);
  const rows = routeRows(plan, bases, state.bases);
  const addable = bases.filter((b) => !rows.some((r) => r.base.key === b.key));
  const addId = useId();

  const or = getListFormat(usePlanContext().locale, { type: 'disjunction' });
  const shared = choices.find((c) => c.base === null);
  const gatewayOptions = [
    {
      value: '',
      label: shared
        ? t('gatewayShared', { airports: or.format(shared.gateways.map(gatewayName)) })
        : t('gatewayOpen'),
    },
    ...choices.flatMap((c) =>
      c.base
        ? [
            {
              value: c.base,
              label: t('gatewayAt', {
                city: baseName(c.base),
                airports: or.format(c.gateways.map(gatewayName)),
              }),
            },
          ]
        : []
    ),
  ];

  return (
    <div className="flex flex-col gap-4" data-plan-route="">
      <div className="grid gap-3 sm:grid-cols-2">
        <GatewaySelect
          label={t('arrive')}
          icon={<PlaneLanding className="text-muted-foreground size-4" aria-hidden="true" />}
          value={state.startBase ?? ''}
          options={gatewayOptions}
          disabled={!live}
          onChange={(base) => update((s) => setGateway(s, 'start', base || null))}
        />
        <GatewaySelect
          label={t('leave')}
          icon={<PlaneTakeoff className="text-muted-foreground size-4" aria-hidden="true" />}
          value={state.endBase ?? ''}
          options={gatewayOptions}
          disabled={!live}
          onChange={(base) => update((s) => setGateway(s, 'end', base || null))}
        />
      </div>

      <section className="flex flex-col gap-1" aria-label={t('stays')}>
        <h4 className="text-muted-foreground px-0.5 text-xs font-semibold tracking-wide uppercase">
          {t('stays')}
        </h4>
        <ol className="divide-border/60 divide-y">
          {rows.map((row) => {
            const name = baseName(row.base.key);
            const shown = row.fixed ?? row.nights;
            const current = shown ?? 0;
            return (
              <li
                key={row.base.key}
                className="flex min-h-16 items-center gap-3 py-2"
                data-plan-route-base={row.base.key}
              >
                {row.number !== null ? (
                  <StayMarker number={row.number} />
                ) : (
                  <span
                    aria-hidden="true"
                    className="border-primary/45 size-5 shrink-0 rounded-full border border-dashed"
                  />
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium">
                    {name}
                    <span className="text-muted-foreground text-xs font-normal">
                      {row.fixed !== null ? t('fixed') : t('byPlan')}
                    </span>
                  </span>
                  <span className="text-muted-foreground text-xs leading-snug">
                    {row.fixed === 0
                      ? t('dayTrips')
                      : row.parks.length > 0
                        ? row.parks.map(parkName).join(' · ')
                        : row.number === null
                          ? t('notStayed')
                          : t('noParks')}
                  </span>
                  {(row.fixed !== null || row.added) && (
                    <button
                      type="button"
                      disabled={!live}
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
                      {row.added && row.fixed === null ? t('remove') : t('release')}
                    </button>
                  )}
                </span>
                <PlanStepper
                  value={shown === null ? '–' : t('nights', { count: shown })}
                  valueClassName="w-20"
                  disabled={!live}
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
                  decrementLabel={t('fewer', { city: name })}
                  incrementLabel={t('more', { city: name })}
                />
              </li>
            );
          })}
        </ol>
        {addable.length > 0 && (
          <label htmlFor={addId} className="flex flex-col gap-1 pt-2 text-sm font-medium">
            {t('add')}
            <select
              id={addId}
              value=""
              disabled={!live}
              onChange={(e) => {
                const key = e.currentTarget.value;
                if (key) update((s) => addBase(s, key, order));
              }}
              className={cn(
                'border-border bg-background h-11 rounded-md border px-2 text-sm font-normal',
                PLAN_FOCUS
              )}
            >
              <option value="">{t('addPick')}</option>
              {addable.map((b) => (
                <option key={b.key} value={b.key}>
                  {baseName(b.key)}
                </option>
              ))}
            </select>
          </label>
        )}
        <p
          className={cn('pt-2 text-sm', fixed > nights && 'text-crowd-ink-high')}
          aria-live="polite"
        >
          {fixed > nights
            ? tProblem('too_many_nights', { fixed, nights })
            : plan && rows.length > 0
              ? t('total', {
                  nights,
                  cities: planStays(plan).length,
                  moves: plan.totals.moves ?? Math.max(0, planStays(plan).length - 1),
                })
              : null}
        </p>
      </section>
    </div>
  );
}

/**
 * The Route's rows: the plan's stays in route order with the parks visited from each, then the
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

function GatewaySelect({
  label,
  icon,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-sm font-semibold">
      <span className="flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.currentTarget.value)}
        className={cn(
          'border-border bg-background h-11 rounded-md border px-2 text-sm font-normal',
          PLAN_FOCUS
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * More options in a region with bases: the hotel area per city the plan stays in (its perks and the
 * ways to the parks count only with one named), and the minutes a hotel change takes on top of the
 * ride, from the region's choices with its own default chosen.
 */
function PlanRouteOptions({ plan }: { plan: TripPlan | undefined }) {
  const t = useTranslations('tripPlanner.options');
  const tPlanner = useTranslations('tripPlanner');
  const tRegion = useTranslations('tripRegion.planner');
  const { region, state, update, live } = usePlanContext();
  const baseName = useBaseName();
  const areaName = useAreaName();
  const bases = region.bases ?? [];
  const order = bases.map((b) => b.key);
  const rules = region.stayRules;
  const buffers = rules?.moveBufferOptions ?? DEFAULT_MOVE_BUFFERS;
  const regionDefault = rules?.moveOverheadMinutes ?? buffers[1] ?? buffers[0];
  const stays = plan ? planStays(plan).map((s) => s.base) : [];
  const shown = bases.filter(
    (b) =>
      stays.includes(b.key) ||
      state.bases.some((p) => p.key === b.key && p.nights !== 0 && b.hotelAreas.length > 0)
  );
  const moves = plan ? (plan.totals.moves ?? 0) > 0 : true;

  return (
    <>
      {shown.length > 0 && (
        <fieldset className="flex flex-col gap-2" disabled={!live}>
          <legend className="mb-1 px-2 text-sm font-semibold">{t('hotel')}</legend>
          {shown.map((base) => {
            const pick = state.bases.find((p) => p.key === base.key);
            return (
              <AreaSelect
                key={base.key}
                label={baseName(base.key)}
                value={pick?.area ?? ''}
                options={[
                  { value: '', label: t('areaNone') },
                  ...base.hotelAreas.map((a) => ({ value: a, label: areaName(a) })),
                ]}
                onChange={(area) => update((s) => setBaseArea(s, base.key, area || null, order))}
              />
            );
          })}
          <p className="text-muted-foreground px-2 text-xs leading-snug">{t('hotelBasesHint')}</p>
        </fieldset>
      )}
      {moves && (
        <PlanRadioGroup<string>
          legend={t('moveBuffer')}
          value={String(state.moveBuffer ?? regionDefault)}
          disabled={!live}
          onChange={(minutes) => update((s) => setMoveBuffer(s, Number(minutes), regionDefault))}
          hint={regionOrShared(tRegion, tPlanner, 'options.moveBufferHint')}
          options={buffers.map((minutes) => ({
            value: String(minutes),
            label: t('moveBufferMinutes', { minutes }),
          }))}
        />
      )}
    </>
  );
}

function AreaSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex flex-col gap-1 px-2 text-sm">
      {label}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        className={cn(
          'border-border bg-background h-11 rounded-md border px-2 text-sm',
          PLAN_FOCUS
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
