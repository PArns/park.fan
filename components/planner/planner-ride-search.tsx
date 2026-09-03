'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarPlus, Check, Crown, Droplets, Ruler, Search } from 'lucide-react';
import { usePlanner } from '@/lib/planner/use-planner';
import { partyFlags } from '@/lib/planner/party';
import { RiderHeight } from '@/components/common/unit-display';
import { PlannerRideThumb } from '@/components/planner/planner-ride-thumb';
import type { PlannerDayPrefs, PlannerGeo } from '@/lib/planner/types';
import { buildDayGrid, nextFreeStart, rideFloor } from '@/lib/planner/day-grid';
import { startRideDrag } from '@/lib/planner/ride-drag';
import { occupiedMinutes } from '@/lib/planner/estimate';
import type { PlanDay, PlanDayRide } from '@/lib/api/types';
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
  /** The park's IANA zone, stored with the park so the plan reckons in it. */
  timezone?: string;
  /**
   * Who is coming, if anybody asked. It changes two things and they are
   * deliberately different: a row that the shortest rider cannot ride is
   * FLAGGED and still offered, while the headliner hint DROPS it. A list is the
   * catalogue and the visitor knows who is holding the bags; a hint is advice,
   * and advice somebody cannot act on is noise.
   */
  prefs?: PlannerDayPrefs;
  /**
   * Adds a block the visitor writes themselves. Beside the ride search rather
   * than in a menu: the two are the same question — "what else goes in the day"
   * — and one of the answers is not in the catalogue.
   */
  onAddCustom?: () => void;
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
  timezone,
  prefs,
  onAddCustom,
}: PlannerRideSearchProps) {
  const t = useTranslations('planner');
  const { addRide, activeEntries } = usePlanner();
  const [query, setQuery] = useState('');

  // How often each ride is already in this day — a COUNT, because a ride can
  // legitimately be planned twice (a morning lap on a walk-on, an evening one for
  // the lights). The row used to be greyed at one, which reads as "no" and is the
  // reason nobody found the second lap the store has always allowed.
  const planned = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of activeEntries) {
      // A free block has no slug and belongs to no row in this list.
      if (!entry.attractionSlug) continue;
      counts.set(entry.attractionSlug, (counts.get(entry.attractionSlug) ?? 0) + 1);
    }
    return counts;
  }, [activeEntries]);

  // Where the next ride goes. Recomputed per render rather than per click so a
  // second add after a first one lands after it, not on it — and PER RIDE,
  // because the floor is the ride's, not the park's: filing every ride at the
  // opening hour puts a block in hours the ride has no measured curve for.
  const grid = buildDayGrid(day?.context.openHour, day?.context.closeHour);
  const startFor = (ride: PlanDayRide) =>
    grid
      ? nextFreeStart(
          activeEntries.map((entry) => ({
            startMinute: entry.startMinute,
            spanMinutes: occupiedMinutes(day, entry),
          })),
          grid,
          45,
          rideFloor(grid, ride).softMin
        )
      : undefined;

  /**
   * The park's headliners that are NOT in this day's plan.
   *
   * The CURATED set from the API (`isHeadliner`), never the day's tallest bars:
   * `dayPeak` says what is busy, and "did I miss the big one" is a question
   * about what the park is known for. A headliner having a quiet Tuesday is
   * still the ride somebody travelled for.
   *
   * Silent once they are all in — a hint that never goes away is a decoration.
   */
  const missedHeadliners = useMemo(() => {
    if (!day) return [];
    return day.rides.filter(
      (ride) =>
        ride.isHeadliner &&
        !planned.has(ride.attractionSlug) &&
        // Not a headliner this party can ride is not a headliner they missed.
        !partyFlags(ride, prefs).tooShort
    );
  }, [day, planned, prefs]);

  const matches = useMemo(() => {
    if (!day) return [];
    // Below: an empty list is rendered as a stated reason, not as nothing.
    const needle = fold(query);
    if (needle.length === 0) return day.rides.slice(0, 8);
    return day.rides.filter((ride) => fold(ride.attractionName).includes(needle)).slice(0, 8);
  }, [day, query]);

  return (
    <div className="border-border/60 border-t px-2 pt-2 pb-2">
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

      {missedHeadliners.length > 0 && (
        <div
          data-planner-headliner-hint=""
          className="border-crowd-high/30 bg-crowd-high/10 mt-2 rounded-md border px-2 py-1.5"
        >
          <p className="text-crowd-high flex items-center gap-1.5 text-[11px] font-medium">
            <Crown className="size-3 shrink-0" />
            {t('headliners.missing', { count: missedHeadliners.length })}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {missedHeadliners.map((ride) => (
              <button
                key={ride.attractionSlug}
                type="button"
                onClick={() =>
                  addRide({
                    parkSlug,
                    parkName,
                    geo,
                    timezone,
                    date,
                    attractionSlug: ride.attractionSlug,
                    attractionName: ride.attractionName,
                    startMinute: startFor(ride),
                  })
                }
                draggable
                onDragStart={(event) =>
                  startRideDrag(event.dataTransfer, {
                    parkSlug,
                    attractionSlug: ride.attractionSlug,
                    attractionName: ride.attractionName,
                  })
                }
                className="bg-background/60 hover:bg-background border-border/50 flex cursor-grab items-center gap-1.5 rounded-full border py-0.5 pr-2 pl-0.5 text-[11px] transition-colors active:cursor-grabbing max-sm:min-h-9"
              >
                {/* The ride, where the media database has it. This band exists
                    to make somebody want the ride they skipped, and a name in a
                    pill does that less well than the picture does. The photo is
                    already in the payload — the plan-day proxy resolves it for
                    every ride — so this costs a request the page was making
                    anyway for the search rows below. */}
                <PlannerRideThumb
                  src={ride.backgroundImage}
                  position={ride.backgroundPosition}
                  size={4}
                />
                {ride.attractionName}
              </button>
            ))}
          </div>
        </div>
      )}

      {onAddCustom && (
        <button
          type="button"
          onClick={onAddCustom}
          className="text-muted-foreground hover:text-foreground hover:bg-accent/50 mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors max-sm:min-h-11"
        >
          <CalendarPlus className="size-3.5 shrink-0" />
          <span className="truncate">{t('custom.add')}</span>
        </button>
      )}
      {matches.length === 0 ? (
        <p className="text-muted-foreground mt-2 px-1 text-xs">
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
        <ul className="mt-2 max-h-44 overflow-y-auto">
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
                    timezone,
                    attractionSlug: ride.attractionSlug,
                    attractionName: ride.attractionName,
                    // The first free slot, not the opening hour. This call site
                    // bypassed `addEntry`'s own fallback entirely and filed
                    // everything at the same minute, so five rides added from
                    // the search landed as five blocks in one place, all
                    // reporting a conflict with each other on first use.
                    startMinute: startFor(ride),
                  })
                }
                /* Draggable, which a `<button>` is not by default — and the
                   planner's own ride list was the one surface a ride could not
                   be dragged out of, while every card on a park page could. The
                   click above stays the whole path on a phone, where HTML5 drag
                   and drop does not exist; this is the pointer path, and it is
                   what lets somebody put a ride at a chosen hour rather than at
                   the next free one. */
                draggable
                onDragStart={(event) =>
                  startRideDrag(event.dataTransfer, {
                    parkSlug,
                    attractionSlug: ride.attractionSlug,
                    attractionName: ride.attractionName,
                  })
                }
                className="hover:bg-accent flex w-full cursor-grab items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors active:cursor-grabbing max-sm:py-2.5"
              >
                {/* The ride's photo. It is ALREADY in the payload — the proxy
                    route runs `enrichAttractionsWithImages` over `/plan/day`'s
                    rides — so this costs no request, no type change and no
                    `@/lib/media` import (that catalogue is 107 KB and this is a
                    Client Component). */}
                <PlannerRideThumb
                  src={ride.backgroundImage}
                  position={ride.backgroundPosition}
                  size={8}
                />
                <span className="min-w-0 flex-1 truncate text-sm">{ride.attractionName}</span>
                {/* What this party's own answers say about this ride. A flag,
                    never a filter — see the `prefs` prop. The height is shown
                    rather than a word, because "too small" without the number
                    is an argument a parent cannot check. */}
                {(() => {
                  const flags = partyFlags(ride, prefs);
                  if (!flags.tooShort && !flags.wet) return null;
                  return (
                    <span className="flex shrink-0 items-center gap-1">
                      {flags.tooShort && ride.minimumHeight != null && (
                        <span
                          className="bg-crowd-high/15 text-crowd-high flex items-center gap-0.5 rounded-full px-1.5 text-[10px] font-medium"
                          title={t('party.tooShort')}
                        >
                          <Ruler className="size-2.5 shrink-0" aria-hidden="true" />
                          <RiderHeight cm={ride.minimumHeight} />
                        </span>
                      )}
                      {flags.wet && (
                        <Droplets
                          className="text-crowd-moderate size-3 shrink-0"
                          aria-label={t('party.wet')}
                        />
                      )}
                    </span>
                  );
                })()}
                {/* One lap is a tick; two or more is a NUMBER. A "1×" on every
                    planned ride is a count of the obvious — the interesting
                    state is the repeat, and it has to stand out from the row of
                    ordinary ticks around it. */}
                {(planned.get(ride.attractionSlug) ?? 0) === 1 && (
                  <Check className="text-crowd-low size-3.5 shrink-0" />
                )}
                {(planned.get(ride.attractionSlug) ?? 0) > 1 && (
                  <span className="bg-crowd-low/20 text-crowd-low shrink-0 rounded-full px-1.5 text-[10px] font-medium tabular-nums">
                    {planned.get(ride.attractionSlug)}×
                  </span>
                )}
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
