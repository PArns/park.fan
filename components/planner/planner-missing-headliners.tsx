'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Crown } from 'lucide-react';
import { usePlanner } from '@/lib/planner/use-planner';
import { partyFlags } from '@/lib/planner/party';
import { buildDayGrid, nextFreeStart, rideFloor } from '@/lib/planner/day-grid';
import { occupiedMinutes } from '@/lib/planner/estimate';
import { startRideDrag } from '@/lib/planner/ride-drag';
import type { PlannerDayPrefs, PlannerGeo } from '@/lib/planner/types';
import type { PlanDay, PlanDayRide } from '@/lib/api/types';

interface PlannerMissingHeadlinersProps {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  date: string;
  day: PlanDay | null;
  timezone?: string;
  prefs?: PlannerDayPrefs;
}

/**
 * The park's headliners that are not in this day's plan.
 *
 * The CURATED set from the API (`isHeadliner`), never the day's tallest bars:
 * `dayPeak` says what is busy, and "did I miss the big one" is a question about
 * what the park is known for. A headliner having a quiet Tuesday is still the
 * ride somebody travelled for. Silent once they are all in — a hint that never
 * goes away is a decoration.
 *
 * It lived inside the ride search once and was taken out because the eight rows
 * below it showed the same rides. The search is `sm:hidden` now — the phone's
 * surface alone — so the band would have vanished from the desktop with it,
 * which is where it was missed. Its own component, rendered beside the search
 * rather than in it, and the overlap with those rows is accepted: the list is a
 * catalogue of everything the day has, this is a short statement about the plan.
 *
 * A pill both adds on click and drags, because the two gestures answer
 * different questions — the click files it at the next free slot, the drag
 * picks the hour.
 */
export function PlannerMissingHeadliners({
  parkSlug,
  parkName,
  geo,
  date,
  day,
  timezone,
  prefs,
}: PlannerMissingHeadlinersProps) {
  const t = useTranslations('planner');
  const { state, addRide } = usePlanner();

  const activeEntries = useMemo(
    () => state.parks[parkSlug]?.days[date]?.entries ?? [],
    [state, parkSlug, date]
  );

  const planned = useMemo(() => {
    const slugs = new Set<string>();
    for (const entry of activeEntries) if (entry.attractionSlug) slugs.add(entry.attractionSlug);
    return slugs;
  }, [activeEntries]);

  const missing = useMemo(() => {
    if (!day) return [];
    return day.rides.filter(
      (ride) =>
        ride.isHeadliner &&
        !planned.has(ride.attractionSlug) &&
        // Not a headliner this party can ride is not a headliner they missed.
        !partyFlags(ride, prefs).tooShort
    );
  }, [day, planned, prefs]);

  const grid = buildDayGrid(day?.context.openHour, day?.context.closeHour);
  // Per ride, not per park: filing every ride at the opening hour puts a block
  // in hours the ride has no measured curve for — and some of them do not open
  // with the gates at all.
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

  if (missing.length === 0) return null;

  return (
    <div data-planner-headliner-hint="" className="border-border/60 shrink-0 border-t px-2 py-2">
      {/* A solid-enough ground of its own: the panel has a photo behind it now,
          and at `/10` this band read as a smudge over a lit façade. */}
      <div className="border-crowd-high/40 bg-crowd-high/10 bg-background/70 rounded-md border px-2 py-1.5 backdrop-blur-sm">
        <p className="text-crowd-high flex items-center gap-1.5 text-[11px] font-medium">
          <Crown className="size-3 shrink-0" aria-hidden="true" />
          {t('headliners.missing', { count: missing.length })}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {missing.map((ride) => (
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
              className="bg-background/70 hover:bg-background border-border/50 hover:border-crowd-high/50 max-w-full truncate rounded-full border px-2 py-0.5 text-[11px] transition-colors sm:cursor-grab sm:active:cursor-grabbing"
            >
              {ride.attractionName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
