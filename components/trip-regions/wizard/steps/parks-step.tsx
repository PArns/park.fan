'use client';

import { useId, useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { CalendarPlus, ChevronDown, ListChecks, Plane, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDays, formatParkDay } from '@/lib/utils/park-day';
import { getListFormat } from '@/lib/utils/intl-format';
import {
  effectiveParks,
  findLeg,
  MAX_TRIP_DAYS,
  minimumVisits,
  parkDaysAvailable,
  setParkVisits,
  setTripDates,
  stepVisits,
  tripDates,
  visitSteps,
} from '@/lib/trip-regions/plan';
import { parksLeftOut } from '@/lib/trip-regions/plan-copy';
import { parkCode } from '@/lib/trip-regions/plan-week';
import { leftOutBucket } from '@/lib/trip-regions/plan-analytics';
import type { TripCalendar, TripRegionPark } from '@/lib/trip-regions/types';
import { WizardCheck } from '@/components/planner/wizard-toggle';
import { WizardOptionCard, WizardOptionGroup } from '@/components/planner/wizard-option-card';
import { usePlanContext, useTripEvents } from '../../planner/plan-context';
import { PLAN_FOCUS, PlanStepper } from '../../planner/plan-controls';
import { useBaseName } from '../../planner/plan-place-words';
import { useStatePlan, useTripCalendar } from '../../planner/use-trip-plan';
import { useWizardAsk, type WizardStepProps } from '../wizard-step';
import { SpareDaysQuestion } from './spare-days-question';

/** More parks than this outside the headliners fold behind one row. */
const OPEN_EXTRAS = 4;

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
 * Step 2, the parks: a card per park with its photo, by resort, the headliners chosen to start
 * with. A chosen card has its check and a stepper for its days; one not chosen is paler, shows a
 * plus and the way there (from the hotel area, or in a region with bases from the nearest city),
 * and a park closed on every day of the trip says so before anyone chooses it. Under the cards the
 * question for a trip with many more days than its parks need (`SpareDaysQuestion`). Where the plan
 * left chosen parks out, Parky says so and the step opens with three ways to make room.
 */
export function ParksStep({ merged, askId }: WizardStepProps) {
  const t = useTranslations('tripPlanner');
  const { region, headliners, state, groupByKey } = usePlanContext();
  const [extrasOpen, setExtrasOpen] = useState(false);
  const extrasId = useId();
  const picks = effectiveParks(state, headliners);
  const days = parkDaysAvailable(state);
  const over = Math.max(0, minimumVisits(picks) - days * (state.hop ? 2 : 1));

  const groups = (filter: (p: TripRegionPark) => boolean) =>
    region.groups
      .map((g) => ({ group: g, parks: region.parks.filter((p) => p.group === g.key && filter(p)) }))
      .filter((g) => g.parks.length > 0);
  const main = groups((p) => p.headliner);
  const extras = region.parks.filter((p) => !p.headliner);
  const folded = extras.length > OPEN_EXTRAS;
  const extrasChosen = picks.filter((p) => !headliners.includes(p.slug)).length;
  const grid = 'grid grid-cols-2 gap-2.5 sm:grid-cols-4';

  return (
    <div className="flex flex-col gap-5">
      <LeftOutQuestion askId={askId} />
      {!merged && <p className="text-muted-foreground text-sm">{t('wizard.parks.lead')}</p>}
      {main.map(({ group, parks }) => (
        <section key={group.key} aria-label={group.name} className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {groupByKey.get(group.key)?.name ?? group.name}
          </h3>
          <div className={grid}>
            {parks.map((park) => (
              <ParkCard key={park.slug} park={park} />
            ))}
          </div>
        </section>
      ))}
      {extras.length > 0 && (
        <section aria-label={t('parks.moreParks')} className="flex flex-col gap-2">
          {folded ? (
            <button
              type="button"
              aria-expanded={extrasOpen}
              aria-controls={extrasId}
              onClick={() => setExtrasOpen((open) => !open)}
              className={cn(
                'border-border/60 hover:bg-accent/60 flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors',
                PLAN_FOCUS
              )}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">{t('parks.moreParks')}</span>
                <span className="text-muted-foreground text-xs">
                  {extrasChosen > 0
                    ? t('parks.moreChosen', { count: extrasChosen })
                    : t('wizard.parks.moreCount', { count: extras.length })}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  'size-4 shrink-0 transition-transform duration-200',
                  extrasOpen && 'rotate-180'
                )}
                aria-hidden="true"
              />
            </button>
          ) : (
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {t('parks.moreParks')}
            </h3>
          )}
          <div id={extrasId} hidden={folded && !extrasOpen} className={grid}>
            {extras.map((park) => (
              <ParkCard key={park.slug} park={park} />
            ))}
          </div>
        </section>
      )}
      {over > 0 && (
        <p className="text-crowd-ink-high text-sm" aria-live="polite" data-plan-budget="over">
          {t('parks.budgetOver', { parks: picks.length, days, over })}
        </p>
      )}
      <SpareDaysQuestion />
    </div>
  );
}

/**
 * One park as a card: the whole picture is its checkbox ("Tokyo DisneySea", checked), the stepper
 * under a chosen one has its own names ("Tokyo DisneySea: one day more"). Without a photo, a tinted
 * field with the park's code at the same height.
 */
function ParkCard({ park }: { park: TripRegionPark }) {
  const t = useTranslations('tripPlanner');
  const { state, update, headliners, regionOrder, live, parkName, photos } = usePlanContext();
  const note = useParkNote();
  const noteId = useId();
  const pick = effectiveParks(state, headliners).find((p) => p.slug === park.slug);
  const chosen = pick !== undefined;
  const visits = pick?.visits ?? null;
  const steps = visitSteps(state.split);
  const at = steps.indexOf(visits ?? (state.split === 'auto' ? null : 1));
  // The number alone: the label beside the stepper says "Days", and a half-width card has no room
  // for the word twice.
  const shown = visits === null && state.split === 'auto' ? '1–2' : String(visits ?? 1);
  const name = parkName(park.slug);
  const facts = note(park.slug);
  const photo = photos[park.slug];
  const setVisits = (next: number | null) =>
    update((s) => setParkVisits(s, park.slug, next, regionOrder, headliners));

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border transition',
        chosen ? 'border-primary/45 bg-primary/5' : 'border-border/70 bg-card',
        facts.closed && !chosen && 'opacity-70 grayscale'
      )}
      data-wizard-park={park.slug}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={chosen}
        aria-describedby={facts.line ? noteId : undefined}
        disabled={!live}
        onClick={() => setVisits(chosen ? 0 : null)}
        className={cn(
          'relative block aspect-[2/1] w-full overflow-hidden text-left focus-visible:ring-inset',
          PLAN_FOCUS
        )}
      >
        {photo ? (
          <Image
            src={photo.src}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, 180px"
            quality={60}
            className={cn('object-cover transition', !chosen && 'saturate-[0.35]')}
            style={{ objectPosition: photo.position }}
          />
        ) : (
          <span
            aria-hidden="true"
            className="bg-primary/10 text-primary-ink/40 absolute inset-0 flex items-center justify-center text-3xl font-black"
          >
            {parkCode(park)}
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-2.5 pt-6 pb-1.5 text-sm leading-tight font-semibold text-white">
          {name}
        </span>
        <span className="absolute top-2 right-2">
          {chosen ? (
            <WizardCheck checked className="size-6 shadow-sm" />
          ) : (
            <span className="bg-background/85 text-foreground flex size-6 items-center justify-center rounded-full border shadow-sm">
              <Plus className="size-3.5" aria-hidden="true" />
            </span>
          )}
        </span>
      </button>
      <div className="flex min-h-12 items-center px-2.5 py-1.5">
        {chosen ? (
          <div className="flex w-full items-center justify-between gap-0.5">
            <span className="text-muted-foreground text-xs">{t('wizard.parks.daysLabel')}</span>
            <PlanStepper
              value={shown}
              valueClassName="w-8"
              disabled={!live}
              canDecrement={at > 0}
              canIncrement={at < steps.length - 1}
              onDecrement={() => setVisits(stepVisits(visits, -1, state.split))}
              onIncrement={() => setVisits(stepVisits(visits, 1, state.split))}
              decrementLabel={t('parks.fewer', { park: name })}
              incrementLabel={t('parks.more', { park: name })}
            />
          </div>
        ) : (
          facts.line && (
            <p id={noteId} className="text-muted-foreground text-xs leading-snug">
              {facts.line}
            </p>
          )
        )}
      </div>
    </div>
  );
}

/**
 * What a park card says under a park not chosen: closed on every day of the trip, no hours yet, or
 * the way there, from the hotel area in a region without bases, else from the city of the region's
 * bases that reaches it fastest ("About 110 min by coach from Tokyo").
 */
function useParkNote(): (slug: string) => { line: string | null; closed: boolean } {
  const t = useTranslations('tripPlanner');
  const { region, state } = usePlanContext();
  const baseName = useBaseName();
  const dates = useMemo(() => tripDates(state), [state]);
  const calendar = useTripCalendar(state.from, state.to);
  const way = (mode: string, minutes: number) =>
    t(t.has(`parks.way.${mode}`) ? `parks.way.${mode}` : 'parks.way.other', { minutes });
  return (slug) => {
    const status = tripState(calendar.data, slug, dates);
    if (status?.kind === 'closed') {
      return {
        closed: true,
        line: status.season
          ? t('parks.closedSeason', { season: status.season })
          : t('parks.closed'),
      };
    }
    if (status?.kind === 'no_hours') return { closed: false, line: t('parks.noHours') };
    const leg = state.area ? findLeg(region.travel.legs, `hotel:${state.area}`, slug) : null;
    if (leg) {
      return { closed: false, line: way(leg.mode, leg.minutes + (leg.transferMinutes ?? 0)) };
    }
    const nearest = (region.bases ?? [])
      .flatMap((base) =>
        base.parks.filter((p) => p.slug === slug).map((p) => ({ base: base.key, ...p }))
      )
      .sort((a, b) => a.minutes - b.minutes)[0];
    return {
      closed: false,
      line: nearest
        ? t('wizard.parks.wayFrom', {
            way: way(nearest.mode, nearest.minutes),
            city: baseName(nearest.base),
          })
        : null,
    };
  };
}

/**
 * The plan had no day for some chosen parks (a Paris weekend leaves both Disney parks out): Parky
 * says which, and up to three cards make room, each counted as `trip_left_out_fix`: a park on the
 * travel days, only the parks left out (where they are most of the choice), a longer trip. Derived from the plan's `parksLeftOut`, until the
 * API names the conflict with a code of its own.
 */
function LeftOutQuestion({ askId }: { askId: string }) {
  const t = useTranslations('tripPlanner');
  const { state, update, locale, parkName, headliners, regionOrder } = usePlanContext();
  const track = useTripEvents();
  const plan = useStatePlan();
  const left = plan.data && plan.current ? parksLeftOut(plan.data) : [];
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });
  const days = parkDaysAvailable(state);
  useWizardAsk(
    left.length > 0
      ? t('answer.leftOut', { parks: list.format(left.map(parkName)), count: left.length, days })
      : null
  );
  if (left.length === 0 || !state.from || !state.to) return null;

  const fixed = (fix: 'travel_days' | 'parks' | 'longer') =>
    track('trip_left_out_fix', { fix, left_out: leftOutBucket(left.length) });
  const travelFree = state.arrival === 'free' || state.departure === 'free';
  const withTravel = parkDaysAvailable({ ...state, arrival: 'park', departure: 'park' });
  const others = effectiveParks(state, headliners)
    .map((p) => p.slug)
    .filter((slug) => !left.includes(slug));
  const longer = Math.min(left.length, MAX_TRIP_DAYS - tripDates(state).length);
  const to = state.to;
  const end = longer > 0 ? addDays(to, longer) : null;

  return (
    <WizardOptionGroup labelledBy={askId} chosen={false} className="sm:grid-cols-3">
      {travelFree && (
        <WizardOptionCard
          checked={false}
          icon={Plane}
          title={t('answer.travelDays')}
          hint={t('wizard.parks.conflict.travelDays', { count: withTravel })}
          onSelect={() => {
            fixed('travel_days');
            update((s) => ({ ...s, arrival: 'park', departure: 'park' }));
          }}
        />
      )}
      {/* Only where the parks left out are most of the choice: a Paris weekend's two Disney parks
          against Parc Astérix, not Orlando's seventh park against six. */}
      {others.length > 0 && left.length >= others.length && left.length <= days && (
        <WizardOptionCard
          checked={false}
          icon={ListChecks}
          title={t('wizard.parks.conflict.only', { parks: list.format(left.map(parkName)) })}
          hint={t('wizard.parks.conflict.onlyHint', {
            parks: list.format(others.map(parkName)),
            count: others.length,
          })}
          onSelect={() => {
            fixed('parks');
            update((s) =>
              others.reduce((n, slug) => setParkVisits(n, slug, 0, regionOrder, headliners), s)
            );
          }}
        />
      )}
      {end && (
        <WizardOptionCard
          checked={false}
          icon={CalendarPlus}
          title={t('answer.longer', { count: longer })}
          hint={t('wizard.parks.conflict.longer', {
            date: formatParkDay(locale, end, { day: 'numeric', month: 'long' }),
          })}
          onSelect={() => {
            fixed('longer');
            update((s) => (s.from && s.to ? setTripDates(s, s.from, addDays(s.to, longer)) : s));
          }}
        />
      )}
    </WizardOptionGroup>
  );
}
