/** A fact about a day that a calendar cell's signal bar marks with a coloured segment. */
export type DaySignal = 'school' | 'neighbor' | 'holiday' | 'bridge';

// Categories, not a scale, so not the `--crowd-*` palette: the scale's amber for neighbour
// holidays would sit beside a crowd tier of the same colour that means something else. Red for a
// public holiday follows the wall-calendar convention.
/** Segment colour per day signal, so the calendar cells, the day dialog and the legend agree. */
export const DAY_SIGNAL_CLASS: Record<DaySignal, string> = {
  school: 'bg-yellow-500 dark:bg-yellow-400',
  neighbor: 'bg-amber-600 dark:bg-amber-500',
  holiday: 'bg-red-500 dark:bg-red-400',
  bridge: 'bg-blue-500 dark:bg-blue-400',
};

/**
 * A day in a region's storm season (Orlando's hurricanes, Japan's typhoons), one more segment of a
 * calendar cell's signal bar: `storm` the season, `stormPeak` its peak, which the planner ranks
 * lower.
 */
export type StormSignal = 'storm' | 'stormPeak';

/**
 * The storm season's segment, in its own violet (`--signal-storm`): dashed for the season, solid
 * for the peak, so the peak reads stronger without a second colour.
 */
export const STORM_SIGNAL_CLASS: Record<StormSignal, string> = {
  storm: 'bg-[repeating-linear-gradient(90deg,var(--signal-storm)_0_4px,transparent_4px_6px)]',
  stormPeak: 'bg-signal-storm',
};

/**
 * The signals a day's own holidays light, in the calendar cell's order. Neighbouring regions are
 * not among them: only the calendar carries those.
 */
export function holidaySignals(
  holiday: { isSchoolVacation?: boolean; isHoliday?: boolean; isBridgeDay?: boolean } | null
): DaySignal[] {
  if (!holiday) return [];
  const signals: DaySignal[] = [];
  if (holiday.isSchoolVacation) signals.push('school');
  if (holiday.isHoliday) signals.push('holiday');
  if (holiday.isBridgeDay) signals.push('bridge');
  return signals;
}
