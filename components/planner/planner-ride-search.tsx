'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanner } from '@/lib/planner/use-planner';
import type { PlannerGeo } from '@/lib/planner/types';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerDayState } from './planner-context-band';

interface PlannerRideSearchProps {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  date: string;
  /** The day's payload — its rides are the ones that can actually be planned. */
  day: PlanDay | null;
  /** Why there is no payload, when there is none. */
  dayState: PlannerDayState;
}

/** Diacritics folded, so "winjas" finds "Winja's" and "fly" finds "F.L.Y.". */
function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Adding a ride without a ride card in reach.
 *
 * On a phone the planner is a bottom sheet over whatever page the visitor is on,
 * so there is nothing to drag from — this is the way in there, and it is why the
 * empty state says "search below" on a phone and "drag one here" everywhere else.
 *
 * The list comes from the DAY, not from the park: `/plan/day` already omits rides
 * with no measured hourly shape, so searching it can only offer rides the planner
 * can actually draw. Offering one it would then render as an em dash would be a
 * worse answer than not offering it.
 *
 * No debounce and no request: the day's rides are already in memory, twenty or so
 * per park, and filtering them is a loop. `EntityPicker`'s 250 ms debounce and
 * `AbortController` exist because it queries the API across every park; copying
 * that discipline here would add latency to a filter over an array.
 */
export function PlannerRideSearch({
  parkSlug,
  parkName,
  geo,
  date,
  day,
  dayState,
}: PlannerRideSearchProps) {
  const t = useTranslations('planner');
  const { addRide, activeEntries } = usePlanner();
  const [query, setQuery] = useState('');

  // Rides already in this day's plan. A ride can legitimately be planned twice
  // (a morning and an evening lap), so this greys the row rather than removing
  // it — it says "already in" without taking the choice away.
  const planned = useMemo(
    () => new Set(activeEntries.map((entry) => entry.attractionSlug)),
    [activeEntries]
  );

  const matches = useMemo(() => {
    if (!day) return [];
    // Below: an empty list is rendered as a stated reason, not as nothing.
    const needle = fold(query);
    if (needle.length === 0) return day.rides.slice(0, 8);
    return day.rides.filter((ride) => fold(ride.attractionName).includes(needle)).slice(0, 8);
  }, [day, query]);

  return (
    <div className="border-border/60 border-t px-2 py-2">
      <div className="relative">
        <Search className="text-muted-foreground/60 pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('search.placeholder')}
          className="bg-accent/40 focus:bg-accent placeholder:text-muted-foreground/70 h-9 w-full rounded-md pr-2 pl-7 text-sm transition-colors outline-none max-sm:h-11"
        />
      </div>

      {matches.length === 0 ? (
        <p className="text-muted-foreground px-1 py-2 text-xs">
          {/* Three different silences, and they are not interchangeable: a
              query that matched nothing, a day the API has no forecast for, and
              a request that failed. The input itself never disappears — on a
              phone it is the only way into the plan. */}
          {day
            ? t('search.noResults')
            : dayState === 'error'
              ? t('error')
              : dayState === 'loading'
                ? t('loading')
                : t('noPlan')}
        </p>
      ) : (
        <ul className="mt-1 max-h-44 overflow-y-auto">
          {matches.map((ride) => (
            <li key={ride.attractionSlug}>
              <button
                type="button"
                onClick={() =>
                  addRide({
                    parkSlug,
                    parkName,
                    geo,
                    date,
                    attractionSlug: ride.attractionSlug,
                    attractionName: ride.attractionName,
                    // Its own busiest hour is the wrong default — the point of
                    // planning is to avoid that. The park's opening hour is the
                    // honest neutral start, and dragging is one gesture away.
                    hour: day?.context.openHour ?? undefined,
                  })
                }
                className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors max-sm:py-2.5"
              >
                <Plus className="text-muted-foreground/60 size-3.5 shrink-0" />
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm',
                    planned.has(ride.attractionSlug) && 'text-muted-foreground'
                  )}
                >
                  {ride.attractionName}
                </span>
                {ride.land && (
                  <span className="text-muted-foreground shrink-0 truncate text-[11px]">
                    {ride.land}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
