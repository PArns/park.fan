'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { editGlowDays } from '@/lib/trip-regions/plan';
import type { PlanEdits } from './use-plan-state';

/** The days the last edit changed, while their glow has not played yet. */
interface PlanGlow {
  seq: number;
  dates: ReadonlySet<string>;
  done: (seq: number) => void;
}

const PlanGlowContext = createContext<PlanGlow | null>(null);

/** Provides the result's {@link usePlanGlow} to the days of every view. */
export const PlanGlowProvider = PlanGlowContext.Provider;

/**
 * The glow of the last edit or undo (`editGlowDays`), once the plan it asked for is on screen:
 * while the result waits for the new plan the old days would glow, so nothing does. It plays once
 * per edit; a view switched to afterwards shows the days without it.
 */
export function usePlanGlow(edits: PlanEdits, waiting: boolean): PlanGlow | null {
  const [played, setPlayed] = useState(0);
  const { seq, change } = edits;
  const dates = useMemo(() => new Set(editGlowDays(change)), [change]);
  return useMemo(
    () =>
      !waiting && seq > played && dates.size > 0
        ? { seq, dates, done: (s: number) => setPlayed((p) => Math.max(p, s)) }
        : null,
    [waiting, seq, played, dates]
  );
}

/**
 * A brief ring over a day the last edit moved or an idea changed (`.plan-day-glow`): it rises and
 * fades, or only fades under reduced motion. The parent is `relative` and keeps its rounding; the
 * ring takes no press. `date` is the day, or every day of a run of free days.
 */
export function PlanDayGlow({ date }: { date: string | readonly string[] }) {
  const glow = useContext(PlanGlowContext);
  const dates = typeof date === 'string' ? [date] : date;
  if (!glow || !dates.some((d) => glow.dates.has(d))) return null;
  return (
    <span
      key={glow.seq}
      aria-hidden="true"
      className="plan-day-glow"
      data-plan-glow=""
      onAnimationEnd={() => glow.done(glow.seq)}
    />
  );
}
