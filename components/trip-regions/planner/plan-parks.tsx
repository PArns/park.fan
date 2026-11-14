'use client';

import { useId, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  effectiveParks,
  findLeg,
  minimumVisits,
  parkDaysAvailable,
  setParkVisits,
  stepVisits,
  tripDates,
  visitSteps,
} from '@/lib/trip-regions/plan';
import type { TripCalendar, TripRegionPark } from '@/lib/trip-regions/types';
import { regionOrShared } from '@/lib/trip-regions/region-words';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS, PlanStepper } from './plan-controls';
import { useTripCalendar } from './use-trip-plan';

/**
 * A park's state over the trip where it says something a visitor must know before choosing it:
 * closed on every day of the trip, or no hours published for any. `null` otherwise, and without
 * dates.
 */
function tripState(
  calendar: TripCalendar | undefined,
  slug: string,
  dates: readonly string[]
): { kind: 'closed'; season: string | null } | { kind: 'no_hours' } | null {
  if (!calendar || dates.length === 0) return null;
  const cells = dates.map((d) => calendar.days.find((day) => day.date === d)?.parks[slug]);
  if (cells.some((c) => !c)) return null;
  if (cells.every((c) => c?.status === 'CLOSED')) {
    const closedBy = cells.find((c) => c?.closedBy)?.closedBy;
    const season = calendar.seasons.find((s) => s.id === closedBy);
    return { kind: 'closed', season: season?.name ?? null };
  }
  if (cells.every((c) => c?.status !== 'OPERATING')) return { kind: 'no_hours' };
  return null;
}

/**
 * Which parks: one checkbox each, the headliners by resort and the water parks, SeaWorld's parks and
 * the day trips behind "More parks" with the drive from the hotel area and what their days hold. A
 * chosen park has a stepper for its days: "1–2 days" until the visitor sets a number, which lets
 * the plan give it a second day where the trip has room (the split, under More options). The line
 * at the foot says whether the parks fit the trip's free days.
 */
export function PlanParks() {
  const t = useTranslations('tripPlanner');
  const tRegion = useTranslations('tripRegion.planner');
  const { region, state, update, headliners, regionOrder, groupByKey, live, parkName } =
    usePlanContext();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreId = useId();

  const dates = useMemo(() => tripDates(state), [state]);
  const calendar = useTripCalendar(state.from, state.to);
  const picks = effectiveParks(state, headliners);
  const visitsOf = (slug: string) => picks.find((p) => p.slug === slug);

  const groups = (filter: (p: TripRegionPark) => boolean) =>
    region.groups
      .map((g) => ({ group: g, parks: region.parks.filter((p) => p.group === g.key && filter(p)) }))
      .filter((g) => g.parks.length > 0);
  const main = groups((p) => p.headliner);
  const more = groups((p) => !p.headliner);
  const moreChosen = picks.filter((p) => !headliners.includes(p.slug)).length;

  const days = parkDaysAvailable(state);
  const over = Math.max(0, minimumVisits(picks) - days * (state.hop ? 2 : 1));

  const row = (park: TripRegionPark, extra: boolean) => {
    const pick = visitsOf(park.slug);
    const chosen = pick !== undefined;
    const visits = pick?.visits ?? null;
    const steps = visitSteps(state.split);
    const at = steps.indexOf(visits ?? (state.split === 'auto' ? null : 1));
    const shown =
      visits === null && state.split === 'auto'
        ? t('parks.auto')
        : t('parks.days', { count: visits ?? 1 });
    const leg =
      extra && state.area ? findLeg(region.travel.legs, `hotel:${state.area}`, park.slug) : null;
    const status = extra ? tripState(calendar.data, park.slug, dates) : null;
    const line = [
      leg
        ? t(t.has(`parks.way.${leg.mode}`) ? `parks.way.${leg.mode}` : 'parks.way.other', {
            minutes: leg.minutes + (leg.transferMinutes ?? 0),
          })
        : null,
      status?.kind === 'closed'
        ? status.season
          ? t('parks.closedSeason', { season: status.season })
          : t('parks.closed')
        : status?.kind === 'no_hours'
          ? t('parks.noHours')
          : null,
    ].filter(Boolean);
    const name = parkName(park.slug);
    return (
      <li key={park.slug} className="flex min-h-14 items-center gap-2 py-1.5">
        <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={chosen}
            disabled={!live}
            onChange={(event) => {
              const on = event.currentTarget.checked;
              update((s) => setParkVisits(s, park.slug, on ? null : 0, regionOrder, headliners));
            }}
            className={cn('accent-primary size-4 shrink-0', PLAN_FOCUS)}
          />
          <span className="flex min-w-0 flex-col">
            <span
              className={cn('text-sm leading-5 font-medium', !chosen && 'text-muted-foreground')}
            >
              {name}
            </span>
            {line.length > 0 && (
              <span className="text-muted-foreground text-xs leading-snug">{line.join(' · ')}</span>
            )}
          </span>
        </label>
        {chosen && (
          <PlanStepper
            value={shown}
            valueClassName="w-20"
            disabled={!live}
            canDecrement={at > 0}
            canIncrement={at < steps.length - 1}
            onDecrement={() =>
              update((s) =>
                setParkVisits(
                  s,
                  park.slug,
                  stepVisits(visits, -1, s.split),
                  regionOrder,
                  headliners
                )
              )
            }
            onIncrement={() =>
              update((s) =>
                setParkVisits(s, park.slug, stepVisits(visits, 1, s.split), regionOrder, headliners)
              )
            }
            decrementLabel={t('parks.fewer', { park: name })}
            incrementLabel={t('parks.more', { park: name })}
          />
        )}
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {main.map(({ group, parks }) => (
        <section key={group.key} aria-label={group.name}>
          <h4 className="text-muted-foreground px-0.5 text-xs font-semibold tracking-wide uppercase">
            {groupByKey.get(group.key)?.name ?? group.name}
          </h4>
          <ul className="divide-border/60 divide-y">{parks.map((p) => row(p, false))}</ul>
        </section>
      ))}

      {more.length > 0 && (
        <div className="border-border/60 rounded-xl border">
          <button
            type="button"
            aria-expanded={moreOpen}
            aria-controls={moreId}
            onClick={() => setMoreOpen((open) => !open)}
            className={cn(
              'hover:bg-accent/60 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors',
              PLAN_FOCUS
            )}
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-medium">{t('parks.moreParks')}</span>
              <span className="text-muted-foreground text-xs">
                {moreChosen > 0
                  ? t('parks.moreChosen', { count: moreChosen })
                  : regionOrShared(tRegion, t, 'parks.moreHint')}
              </span>
            </span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 transition-transform duration-200',
                moreOpen && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </button>
          <div id={moreId} hidden={!moreOpen} className="px-3 pb-2">
            {more.map(({ group, parks }) => (
              <section key={group.key} aria-label={group.name} className="pt-2">
                <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {group.name}
                </h4>
                <ul className="divide-border/60 divide-y">{parks.map((p) => row(p, true))}</ul>
              </section>
            ))}
            {state.area && (
              <p className="text-muted-foreground pt-2 text-xs">
                {t('parks.driveSource', { source: region.travel.attribution })}
              </p>
            )}
          </div>
        </div>
      )}

      {dates.length > 0 && (
        <p
          className={cn('text-sm', over > 0 && 'text-crowd-ink-high')}
          aria-live="polite"
          data-plan-budget={over > 0 ? 'over' : 'fits'}
        >
          {over > 0
            ? t('parks.budgetOver', { parks: picks.length, days, over })
            : t('parks.budgetFits', { parks: picks.length, days })}
        </p>
      )}
    </div>
  );
}
