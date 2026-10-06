'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Crown } from 'lucide-react';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { usePlanner } from '@/lib/planner/use-planner';
import { PlannerRideThumb } from './planner-ride-thumb';
import { partyFlags } from '@/lib/planner/party';
import { buildDayGrid, earlyEntryOpenMin, nextFreeStart, rideFloor } from '@/lib/planner/day-grid';
import { PLANNER_PHONE_QUERY, usePlannerPxPerMin } from '@/lib/planner/use-grid-scale';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { dayClock, resolveTimeZone } from '@/lib/planner/park-time';
import { spansFor } from '@/lib/planner/estimate';
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
 * The curated set (`isHeadliner`), never the day's busiest rides: a headliner on a quiet day is
 * still the ride somebody travelled for. Silent once they are all in. A pill adds on click (next
 * free slot) and drags (an hour of the visitor's choosing).
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
  /** The axis' scale; see {@link usePlannerPxPerMin}. */
  const pxPerMin = usePlannerPxPerMin();
  /** The same arrangement the `planner-phone:` classes below switch on. */
  const isPhone = useMediaQuery(PLANNER_PHONE_QUERY);
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
        // A headliner this party cannot ride is not one they missed.
        !partyFlags(ride, prefs).tooShort
    );
  }, [day, planned, prefs]);

  const grid = buildDayGrid(
    day?.context.openHour,
    day?.context.closeHour,
    pxPerMin,
    earlyEntryOpenMin(day?.context)
  );
  // Read on every render: the band stays open with the panel, and a pill pressed at 14:00 may not
  // file into the morning. No subscription, since only the value at the press matters.
  const clock = dayClock(date, resolveTimeZone(timezone));
  // Per ride, not per park: some rides open later than the gates or have no curve for the first
  // hours, and the clock is the third floor under the same rule.
  const startFor = (ride: PlanDayRide) =>
    grid
      ? nextFreeStart(
          spansFor(day, activeEntries),
          grid,
          undefined,
          rideFloor(grid, ride, clock).softMin
        )
      : undefined;

  const heading = (
    <>
      <Crown className="size-3 shrink-0" aria-hidden="true" />
      {/* One flex item, not three: `t.rich` splits the sentence into runs, and each would get the
          row's gap. */}
      <span>
        {t.rich('headliners.missing', {
          count: missing.length,
          // A link on the wide arrangement, plain text on a phone, where an 11 px line cannot be a
          // 44 px target. `showTooltip={false}` because a tooltip opened from this sheet paints
          // under it (`z-50` against the sheet's `z-[70]`); the link carries the reader to the
          // whole definition.
          term: (chunks) =>
            isPhone ? (
              <>{chunks}</>
            ) : (
              <GlossaryTermLink termId="headliner" showTooltip={false}>
                {chunks}
              </GlossaryTermLink>
            ),
        })}
      </span>
    </>
  );

  if (missing.length === 0) return null;
  // On a walked day "still missing" is a reproach, not an offer.
  if (clock.phase === 'past') return null;

  return (
    <div
      data-planner-headliner-hint=""
      className="border-border/60 planner-phone:py-1.5 shrink-0 border-t px-2 py-2"
    >
      {/* One background only: two `bg-*` colours on one element left the tint unpainted. One row
          on a phone, scrolled sideways, so the band costs the axis a single 44 px row and the
          heading's count says how many there are; the desktop keeps the wrapping row.
          `planner-phone:` rather than `max-sm:`, since the band rations height. */}
      <div className="border-crowd-high/40 bg-crowd-high/10 planner-phone:p-1 rounded-md border px-2 py-1.5">
        <p className="text-crowd-high flex items-center gap-1.5 text-[11px] font-medium">
          {heading}
        </p>
        {/* On a phone the pills are 26 px with a 44 px `after:` target reaching 12 px up and 6 down
            (`-top-[13px]`/`-bottom-[7px]`, measured from the padding edge inside a 1 px border).
            A scroller clips hit-testing, so the row carries 14 px of padding above and 8 below
            and hands them back with negative margins. Pills sit 4 px from the border on every
            side. */}
        <div className="planner-phone:flex-nowrap planner-phone:overflow-x-auto planner-phone:overscroll-x-contain planner-phone:[scrollbar-width:none] planner-phone:-mt-2.5 planner-phone:-mb-2 planner-phone:items-center planner-phone:pt-3.5 planner-phone:pb-2 mt-1 flex flex-wrap gap-1">
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
                  // The pill's own decoded thumbnail, since a drag image cannot wait for a load;
                  // `photo` warms the same rendition for the next drag.
                  {
                    element: event.currentTarget,
                    photo: ride.backgroundImage,
                    photoPosition: ride.backgroundPosition,
                  }
                )
              }
              className="bg-background/70 hover:bg-background border-border/50 hover:border-crowd-high/50 planner-phone:h-[26px] planner-phone:max-w-56 planner-phone:shrink-0 planner-phone:after:absolute planner-phone:after:inset-x-0 planner-phone:after:-top-[13px] planner-phone:after:-bottom-[7px] planner-phone:after:content-[''] planner-wide:cursor-grab planner-wide:active:cursor-grabbing relative flex max-w-full items-center gap-1.5 rounded-full border py-0.5 pr-2 pl-1 text-[11px] transition-colors"
            >
              {/* The ride's picture at 16 px, or the coaster mark, which is the common case, so the
                  box is the same size either way. */}
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
