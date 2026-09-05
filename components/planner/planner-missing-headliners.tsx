'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Crown } from 'lucide-react';
import { usePlanner } from '@/lib/planner/use-planner';
import { PlannerRideThumb } from './planner-ride-thumb';
import { partyFlags } from '@/lib/planner/party';
import { buildDayGrid, nextFreeStart, rideFloor } from '@/lib/planner/day-grid';
import { dayClock, resolveTimeZone } from '@/lib/planner/park-time';
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
  // Read on every render rather than once: this band is open for as long as the
  // panel is, and a pill pressed at 14:00 may not file into the morning because
  // the clock was read when the sheet opened. No subscription — nothing here
  // has to disappear on a tick, and the value that matters is the one at the
  // moment of the press.
  const clock = dayClock(date, resolveTimeZone(timezone));
  // Per ride, not per park: filing every ride at the opening hour puts a block
  // in hours the ride has no measured curve for — and some of them do not open
  // with the gates at all. The clock is the third floor under the same rule:
  // a queue in an hour that has passed is one nobody can join.
  const startFor = (ride: PlanDayRide) =>
    grid
      ? nextFreeStart(
          activeEntries.map((entry) => ({
            startMinute: entry.startMinute,
            spanMinutes: occupiedMinutes(day, entry),
          })),
          grid,
          45,
          rideFloor(grid, ride, clock).softMin
        )
      : undefined;

  if (missing.length === 0) return null;
  // A day that has been walked is a record, and "these headliners are still
  // missing" is an offer about a day somebody can still have. On yesterday it
  // is a reproach, and a pill files a ride at a minute the app picked.
  if (clock.phase === 'past') return null;

  return (
    <div data-planner-headliner-hint="" className="border-border/60 shrink-0 border-t px-2 py-2">
      {/* Its own ground, and only ONE of them: this shipped as
          `bg-crowd-high/10 bg-background/70`, which is two `background-color`
          declarations on one element — the tint never painted, and the band was
          the panel's ground with a crown on it. The photo behind the panel is
          in a negative layer now and no longer thins anything, so the band can
          go back to being what it says it is: the crowd tint, over the panel. */}
      {/* Capped on a phone, where this band and the ride search under it are two
          ways to add the same ride and 716 px of sheet has to carry both: a park
          with ten missing headliners drew three rows of pills, 127 px, and took
          them off the axis. Every pill stays reachable — the box scrolls — and
          above `sm` there is nothing to ration. */}
      <div className="border-crowd-high/40 bg-crowd-high/10 rounded-md border px-2 py-1.5 max-sm:max-h-[5.5rem] max-sm:overflow-y-auto max-sm:overscroll-y-contain">
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
                startRideDrag(
                  event.dataTransfer,
                  {
                    parkSlug,
                    attractionSlug: ride.attractionSlug,
                    attractionName: ride.attractionName,
                  },
                  // The pill's own thumbnail, which is already decoded — a drag
                  // image is snapshotted inside `dragstart` and cannot wait for
                  // a load. `photo` rides along for the ride whose picture is
                  // somehow not painted yet: it warms the same rendition so the
                  // next drag has one.
                  {
                    element: event.currentTarget,
                    photo: ride.backgroundImage,
                    photoPosition: ride.backgroundPosition,
                  }
                )
              }
              className="bg-background/70 hover:bg-background border-border/50 hover:border-crowd-high/50 flex max-w-full items-center gap-1.5 rounded-full border py-0.5 pr-2 pl-1 text-[11px] transition-colors sm:cursor-grab sm:active:cursor-grabbing"
            >
              {/* The ride's picture, at 16 px. A pill was a word in a rounded
                  box, which is what a filter chip looks like — and these are
                  rides, the same objects the list below draws with a photograph
                  each. Twenty-four of Phantasialand's thirty-four have no
                  picture in the media database, so the coaster mark is the
                  COMMON case rather than the exception and the box is the same
                  size either way; a band where half the pills carried a
                  thumbnail and half did not would read as a loading state. */}
              <PlannerRideThumb
                src={ride.backgroundImage}
                position={ride.backgroundPosition}
                size={4}
              />
              <span className="min-w-0 truncate">{ride.attractionName}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
