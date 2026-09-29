'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Check, Loader2, Route, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { assignParks, MAX_ASSIGN_DAYS, MAX_ASSIGN_PARKS, windowDates } from '@/lib/planner/assign';
import type { AssignCrowd, AssignedDay } from '@/lib/planner/assign';
import { addDays, daysBetween, longDate, todayInZone } from '@/lib/planner/park-time';
import { usePlanner } from '@/lib/planner/use-planner';
import { useParksBestDays } from '@/lib/planner/use-assign-facts';
import { isPlannedDay, type PlannerGeo } from '@/lib/planner/types';
import { PlannerParkSearch, type PlannerParkPick } from './planner-park-search';

/** A park the assistant may plan: from the plan, or picked in the search. */
interface TripPark {
  slug: string;
  name: string;
  geo: PlannerGeo;
  timezone?: string;
}

const NO_LEVELS: ReadonlyMap<string, AssignCrowd> = new Map();
/** Two weeks, which is what most trips of several parks are. */
const DEFAULT_SPAN = 13;

interface PlannerTripAssistantProps {
  onOpenChange: (open: boolean) => void;
}

/**
 * Which park on which day, proposed from the crowd forecast (PAR-9).
 *
 * A dialog opened from a button on the planner page, the same shape as the fit assistant beside
 * it: the visitor sets the window and the parks, reads a proposal, and nothing is written until
 * "annehmen". The proposal is taken or dropped as a whole, not per day.
 *
 * Window and park choice live here and are not stored: there is no trip in the plan, only
 * parks, days and entries. "Several trips" means the assistant is run again for the next window;
 * a run only ever adds days, and the days already in the plan stay where they are.
 *
 * Mounted by the caller only while open, so every opening starts from the defaults and no effect
 * has to reset anything.
 */
export function PlannerTripAssistant({ onOpenChange }: PlannerTripAssistantProps) {
  const t = useTranslations('planner');
  const locale = useLocale();
  const { state, reserveDays } = usePlanner();

  const [from, setFrom] = useState(() => todayInZone(undefined));
  const [to, setTo] = useState(() => addDays(todayInZone(undefined), DEFAULT_SPAN));
  const [travelDays, setTravelDays] = useState(true);
  const [extras, setExtras] = useState<readonly TripPark[]>([]);

  // Every park the plan holds, planned day or not, plus the ones picked here.
  const universe = useMemo<TripPark[]>(() => {
    const known = new Map<string, TripPark>();
    for (const park of Object.values(state.parks)) {
      known.set(park.slug, {
        slug: park.slug,
        name: park.name,
        geo: park.geo,
        timezone: park.timezone,
      });
    }
    for (const park of extras) if (!known.has(park.slug)) known.set(park.slug, park);
    return [...known.values()].sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [state.parks, extras, locale]);

  // Parks that already have a day in the first window need no second one unless the visitor asks.
  const [chosen, setChosen] = useState<ReadonlySet<string>>(() => {
    const start = todayInZone(undefined);
    const end = addDays(start, DEFAULT_SPAN);
    return new Set(
      Object.values(state.parks)
        .filter(
          (park) =>
            !Object.values(park.days).some(
              (day) => isPlannedDay(day) && day.date >= start && day.date <= end
            )
        )
        .map((park) => park.slug)
    );
  });

  const chosenParks = useMemo(
    () => universe.filter((park) => chosen.has(park.slug)),
    [universe, chosen]
  );
  const { facts, pending } = useParksBestDays(chosenParks, true);

  // Every planned day of every park: occupied, never moved, and the neighbours of a new day.
  const fixed = useMemo(
    () =>
      Object.values(state.parks).flatMap((park) =>
        Object.values(park.days)
          .filter(isPlannedDay)
          .map((day) => ({ date: day.date, country: park.geo.country }))
      ),
    [state.parks]
  );

  const span = useMemo(() => windowDates(from, to), [from, to]);
  const result = useMemo(() => {
    if (pending || chosenParks.length === 0 || span.length === 0) return null;
    return assignParks({
      parks: chosenParks.map((park) => ({
        slug: park.slug,
        country: park.geo.country,
        levels: facts.get(park.slug)?.levels ?? NO_LEVELS,
      })),
      from,
      to,
      fixed,
      travelDays,
    });
  }, [pending, chosenParks, span, facts, from, to, fixed, travelDays]);

  const parkBySlug = useMemo(() => new Map(universe.map((park) => [park.slug, park])), [universe]);
  const capped = span.length === MAX_ASSIGN_DAYS && to > span[span.length - 1];

  const toggle = (slug: string) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  const pick = (park: PlannerParkPick) => {
    setExtras((current) => [...current, { slug: park.slug, name: park.name, geo: park.geo }]);
    setChosen((current) => new Set(current).add(park.slug));
  };

  const accept = () => {
    if (!result || result.days.length === 0) return;
    reserveDays(
      result.days.map((day) => {
        const park = parkBySlug.get(day.parkSlug)!;
        return {
          park: { ...park, timezone: park.timezone ?? facts.get(park.slug)?.timezone ?? undefined },
          date: day.date,
        };
      })
    );
    onOpenChange(false);
  };

  const rows = useMemo(
    () => tripRows(result?.days ?? [], parkBySlug, travelDays),
    [result, parkBySlug, travelDays]
  );
  const unplaced = (result?.unplaced ?? [])
    .map((slug) => parkBySlug.get(slug)?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <div className="bg-primary/5 border-border/60 shrink-0 border-b px-5 py-3 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <Route className="text-primary size-4 shrink-0" aria-hidden="true" />
            {t('trip.title')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1 text-xs leading-snug">
            {t('trip.subtitle')}
          </DialogDescription>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-medium">
                {t('trip.from')}
                <Input
                  type="date"
                  value={from}
                  min={todayInZone(undefined)}
                  onChange={(event) => event.target.value && setFrom(event.target.value)}
                  data-planner-trip-from=""
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium">
                {t('trip.to')}
                <Input
                  type="date"
                  value={to}
                  min={from}
                  onChange={(event) => event.target.value && setTo(event.target.value)}
                  data-planner-trip-to=""
                />
              </label>
            </div>
            {span.length === 0 && (
              <p className="text-crowd-high -mt-3 text-xs">{t('trip.windowEmpty')}</p>
            )}
            {capped && (
              <p className="text-muted-foreground -mt-3 text-xs">
                {t('trip.windowCapped', { max: MAX_ASSIGN_DAYS })}
              </p>
            )}

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-xs font-medium">{t('trip.parks')}</legend>
              {universe.length === 0 && (
                <p className="text-muted-foreground text-xs">{t('trip.noParks')}</p>
              )}
              {universe.map((park) => (
                <label key={park.slug} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={chosen.has(park.slug)}
                    onChange={() => toggle(park.slug)}
                    className="accent-primary size-4"
                    data-planner-trip-park={park.slug}
                  />
                  <span className="min-w-0 truncate">{park.name}</span>
                </label>
              ))}
              <PlannerParkSearch
                plannedSlugs={new Set(universe.map((p) => p.slug))}
                onPick={pick}
              />
              {chosen.size > MAX_ASSIGN_PARKS && (
                <p className="text-crowd-high text-xs">
                  {t('trip.tooMany', { max: MAX_ASSIGN_PARKS })}
                </p>
              )}
            </fieldset>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={travelDays}
                onChange={(event) => setTravelDays(event.target.checked)}
                className="accent-primary size-4"
                data-planner-trip-travel=""
              />
              {t('trip.travelDays')}
            </label>

            <section aria-live="polite" data-planner-trip-result="">
              <h3 className="mb-2 text-xs font-medium">{t('trip.proposal')}</h3>
              {chosenParks.length === 0 ? (
                <p className="text-muted-foreground text-xs">{t('trip.pickOne')}</p>
              ) : pending ? (
                <p className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  {t('trip.loading')}
                </p>
              ) : (
                <>
                  <ul className="flex flex-col">
                    {rows.map((row) =>
                      row.kind === 'travel' ? (
                        <li
                          key={`travel-${row.date}`}
                          className="text-muted-foreground border-border/40 flex items-center gap-2 border-t py-1.5 text-xs italic"
                        >
                          <ArrowRight className="size-3 shrink-0" aria-hidden="true" />
                          <span className="tabular-nums">{longDate(row.date, locale)}</span>
                          {t('trip.travelDay')}
                        </li>
                      ) : (
                        <li
                          key={row.day.date}
                          className="border-border/40 flex items-center justify-between gap-3 border-t py-2 text-sm"
                          data-planner-trip-day={`${row.day.parkSlug}:${row.day.date}`}
                        >
                          <span className="min-w-0">
                            <span className="text-muted-foreground block text-xs tabular-nums">
                              {longDate(row.day.date, locale)}
                            </span>
                            <span className="block truncate font-medium">{row.parkName}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            {row.day.second && (
                              <span className="text-muted-foreground text-[11px]">
                                {t('trip.second')}
                              </span>
                            )}
                            <CrowdLevelBadge level={row.day.level} />
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                  {rows.length === 0 && (
                    <p className="text-muted-foreground text-xs">{t('trip.noDays')}</p>
                  )}
                  {unplaced.length > 0 && (
                    <p className="text-crowd-high mt-2 text-xs leading-snug">
                      {t('trip.unplaced', { parks: unplaced.join(', ') })}
                    </p>
                  )}
                  {rows.some((row) => row.kind === 'day' && row.day.level === 'unknown') && (
                    <p className="text-muted-foreground mt-2 text-xs leading-snug">
                      {t('trip.unknownNote')}
                    </p>
                  )}
                  <p className="text-muted-foreground mt-2 text-xs leading-snug">
                    {t('trip.keptNote')}
                  </p>
                </>
              )}
            </section>
          </div>
        </div>

        <div className="border-border/60 flex shrink-0 items-center justify-between gap-2 border-t px-3 py-3 sm:px-6">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="size-4" aria-hidden="true" />
            {t('trip.dismiss')}
          </Button>
          <Button
            onClick={accept}
            disabled={!result || result.days.length === 0}
            data-planner-trip-accept=""
          >
            <Check className="size-4" aria-hidden="true" />
            {t('trip.accept')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type TripRow =
  { kind: 'day'; day: AssignedDay; parkName: string } | { kind: 'travel'; date: string };

/**
 * The proposal as rows, with a note for the free day between two countries.
 *
 * Only where the gap is real: with the switch off, or two days of one country, there is nothing
 * to say. The note is a date the visitor can see is left empty, not a booking.
 */
function tripRows(
  days: readonly AssignedDay[],
  parks: ReadonlyMap<string, TripPark>,
  travelDays: boolean
): TripRow[] {
  const rows: TripRow[] = [];
  days.forEach((day, i) => {
    const previous = days[i - 1];
    if (previous && travelDays) {
      const a = parks.get(previous.parkSlug);
      const b = parks.get(day.parkSlug);
      if (a && b && a.geo.country !== b.geo.country && daysBetween(previous.date, day.date) >= 2) {
        rows.push({ kind: 'travel', date: addDays(previous.date, 1) });
      }
    }
    rows.push({ kind: 'day', day, parkName: parks.get(day.parkSlug)?.name ?? day.parkSlug });
  });
  return rows;
}
