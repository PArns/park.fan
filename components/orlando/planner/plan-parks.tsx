'use client';

import { useId, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  effectiveParks,
  findLeg,
  MAX_VISITS_PER_PARK,
  minimumVisits,
  parkDaysAvailable,
  setParkVisits,
  setSplit,
  stepVisits,
  tripDates,
} from '@/lib/orlando/plan';
import type { TripCalendar, TripRegionPark } from '@/lib/orlando/types';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS, PlanCheckRow, PlanStepper } from './plan-controls';
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
 * Which parks, and how many days each: the headliners by resort, each with a 0–3 stepper, and the
 * water parks, SeaWorld's parks and the day trips behind "More parks" with the drive from the hotel
 * area and what their days hold. With "split my days for me" on (the default) a park nobody gave a
 * number reads "auto": the plan may give it a second day where the trip has room.
 */
export function PlanParks() {
  const t = useTranslations('orlandoPlanner');
  const { region, state, update, headliners, regionOrder, groupByKey, live, parkName } = usePlanContext();
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
  const visits = minimumVisits(picks);

  const row = (park: TripRegionPark, extra: boolean) => {
    const pick = visitsOf(park.slug);
    const count = pick ? (pick.visits ?? (state.split === 'auto' ? null : 1)) : 0;
    const shown = count === null ? t('parks.auto') : count === 0 ? '0' : `${count}×`;
    const set = (delta: 1 | -1) => {
      const next = pick
        ? stepVisits(pick.visits, delta, state.split)
        : delta > 0
          ? state.split === 'auto'
            ? null
            : 1
          : 0;
      update((s) => setParkVisits(s, park.slug, next, regionOrder, headliners));
    };
    const leg =
      extra && state.area ? findLeg(region.travel.legs, `hotel:${state.area}`, park.slug) : null;
    const status = extra ? tripState(calendar.data, park.slug, dates) : null;
    const line = [
      leg ? t('parks.drive', { minutes: leg.minutes + (leg.transferMinutes ?? 0) }) : null,
      status?.kind === 'closed'
        ? status.season
          ? t('parks.closedSeason', { season: status.season })
          : t('parks.closed')
        : status?.kind === 'no_hours'
          ? t('parks.noHours')
          : null,
    ].filter(Boolean);
    return (
      <li key={park.slug} className="flex min-h-14 items-center gap-3 py-1.5">
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn('text-sm leading-5 font-medium', count === 0 && 'text-muted-foreground')}
          >
            {parkName(park.slug)}
          </span>
          {line.length > 0 && (
            <span className="text-muted-foreground text-xs leading-snug">{line.join(' · ')}</span>
          )}
        </span>
        <PlanStepper
          value={shown}
          disabled={!live}
          canDecrement={count !== 0}
          canIncrement={count === null || count < MAX_VISITS_PER_PARK}
          onDecrement={() => set(-1)}
          onIncrement={() => set(1)}
          decrementLabel={t('parks.fewer', { park: parkName(park.slug) })}
          incrementLabel={t('parks.more', { park: parkName(park.slug) })}
        />
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <PlanCheckRow
        checked={state.split === 'auto'}
        disabled={!live}
        onChange={(on) => update((s) => setSplit(s, on ? 'auto' : 'fixed'))}
        label={t('parks.split')}
        hint={t('parks.splitHint')}
      />

      {main.map(({ group, parks }) => (
        <section key={group.key} aria-label={group.name}>
          <h4 className="text-muted-foreground px-0.5 text-xs font-semibold tracking-wide uppercase">
            {groupByKey.get(group.key)?.name ?? group.name}
          </h4>
          <ul className="divide-border/60 divide-y">{parks.map((p) => row(p, false))}</ul>
        </section>
      ))}

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
              {moreChosen > 0 ? t('parks.moreChosen', { count: moreChosen }) : t('parks.moreHint')}
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

      {dates.length > 0 && (
        <p
          className={cn('text-sm', visits > days * (state.hop ? 2 : 1) && 'text-destructive')}
          aria-live="polite"
        >
          {t('parks.budget', { visits, days })}
        </p>
      )}
    </div>
  );
}
