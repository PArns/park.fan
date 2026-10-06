/** A fact about a day that a calendar cell's signal bar marks with a coloured segment. */
type DaySignal = 'school' | 'neighbor' | 'holiday' | 'bridge';

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
