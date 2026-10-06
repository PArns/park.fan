'use client';

import { useState, type ReactNode } from 'react';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { RideDayCurveCard, type DayCurveCandidate } from '@/components/parks/ride-day-curve-card';
import { cn } from '@/lib/utils';

/**
 * The chapter's two columns, with the wide one removed when there is nothing to put in it:
 * `RideDayCurveCard` can end with no candidate (every featured park closed, or `/stats/day`
 * unavailable), and only it knows, after mounting, so the grid template is client state. The side
 * column arrives as `children` and stays server-rendered.
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
