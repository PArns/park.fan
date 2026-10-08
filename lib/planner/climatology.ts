import type { PlanDay, PlanDayHolidayState } from '@/lib/api/types';

/** The sentence a look-back day shows: a `planner.climatology.*` key and its ICU values. */
export interface ClimatologyNote {
  holidayState: PlanDayHolidayState;
  values: { days: number };
}

/**
 * What to tell the visitor about a `climatology` day, or `null` for any other. The curves are what
 * was measured on comparable days in earlier years, so the note names the holiday situation they
 * were matched on and how many days stand behind them. `null` without the object as well: a tier
 * the API sent without its sources has nothing to say about them.
 */
export function climatologyNote(day: PlanDay | null | undefined): ClimatologyNote | null {
  if (!day || day.tier !== 'climatology' || !day.climatology) return null;
  return {
    holidayState: day.climatology.holidayState,
    values: { days: day.climatology.referenceDates.length },
  };
}
