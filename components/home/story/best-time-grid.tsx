'use client';

import { useState, type ReactNode } from 'react';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { RideDayCurveCard, type DayCurveCandidate } from '@/components/parks/ride-day-curve-card';
import { cn } from '@/lib/utils';

/**
 * The chapter's two columns, with the wide one removed when there is nothing to
 * put in it.
 *
 * `RideDayCurveCard` walks its candidates and can legitimately end with nothing:
 * every featured park in a locale can be in its winter break on the same day,
 * and until the API serves `/stats/day` at all, every candidate 404s. It
 * returned `null` into a `1.5fr` grid column, so the chapter rendered its
 * heading, an empty half-width hole and two cards pushed to the right.
 *
 * Only the card knows that, and it knows it after mounting, so the grid template
 * has to be client state. The side column arrives as `children` and stays
 * server-rendered — it is prose and links, and none of it depends on the curve.
 */
export function BestTimeGrid({
  candidates,
  children,
}: {
  candidates: DayCurveCandidate[];
  children: ReactNode;
}) {
  const [exhausted, setExhausted] = useState(candidates.length === 0);

  return (
    <div className={cn('grid gap-6 lg:items-start', !exhausted && 'lg:grid-cols-[1.5fr_1fr]')}>
      {!exhausted && (
        <Reveal>
          {/* The whole featured list, in order: a park in its winter break or
              having a maintenance day hands over to the next one rather than
              leaving the chapter with an empty column. */}
          <RideDayCurveCard candidates={candidates} onExhausted={() => setExhausted(true)} />
        </Reveal>
      )}

      <Reveal delay={80}>{children}</Reveal>
    </div>
  );
}
