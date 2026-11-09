import type { CuratedField } from './types';

/** One curated works window as the `periods` field carries it: park-local days, both inclusive. */
export interface WorksPeriodRow {
  from: string | null;
  to: string | null;
  toUncertain: boolean;
}

/** The backend's cap on windows per ride. */
export const MAX_WORKS_PERIODS = 20;

/** Sorts after every real day, so an open end compares as the latest. */
const OPEN_END = '9999-12-31';

/** The single-window columns the `periods` field replaced. */
const LEGACY_WORKS_PERIOD_KEYS = new Set([
  'curatedOutOfServiceFrom',
  'curatedOutOfServiceTo',
  'curatedOutOfServiceToUncertain',
]);

/**
 * Whether the editor leaves a field out: flagged `legacy` or `hidden` by the backend, or one of the
 * old single-window columns while a `periods` field in the same group already holds their value.
 */
export function isHiddenCuratedField(field: CuratedField, fields: CuratedField[]): boolean {
  if (field.legacy || field.hidden) return true;
  return (
    LEGACY_WORKS_PERIOD_KEYS.has(field.key) &&
    fields.some((other) => other.type === 'periods' && other.group === field.group)
  );
}

/** The windows in the order the backend stores them: by start, an open start first, then by end. */
export function sortWorksPeriods(periods: WorksPeriodRow[]): WorksPeriodRow[] {
  return [...periods].sort(
    (a, b) =>
      (a.from ?? '').localeCompare(b.from ?? '') ||
      (a.to ?? OPEN_END).localeCompare(b.to ?? OPEN_END)
  );
}

/**
 * The API's checks on a window list, run before the save so the editor sees the problem at the
 * row. Returns the first problem as a German sentence, or null when the list may be saved.
 */
export function worksPeriodsError(periods: WorksPeriodRow[]): string | null {
  if (periods.length > MAX_WORKS_PERIODS) {
    return `Höchstens ${MAX_WORKS_PERIODS} Wartungsfenster pro Attraktion.`;
  }
  for (const [index, period] of periods.entries()) {
    const row = `Zeile ${index + 1}`;
    if (!period.from && !period.to) return `${row}: „ab" oder „bis" angeben.`;
    if (period.from && period.to && period.from > period.to) {
      return `${row}: „ab" liegt nach „bis".`;
    }
    if (period.toUncertain && !period.to) {
      return `${row}: „Ende geschätzt" braucht ein „bis".`;
    }
  }
  // Sorted by start, a window overlaps an earlier one exactly when it starts on or before the
  // furthest end seen so far. Both bounds are inclusive, an open end runs forever.
  let furthestEnd: string | null = null;
  let previous: WorksPeriodRow | null = null;
  for (const period of sortWorksPeriods(periods)) {
    if (previous && furthestEnd !== null && (period.from ?? '') <= furthestEnd) {
      return `Wartungsfenster überschneiden sich (${label(previous)} und ${label(period)}).`;
    }
    const end = period.to ?? OPEN_END;
    if (furthestEnd === null || end > furthestEnd) furthestEnd = end;
    previous = period;
  }
  return null;
}

function label(period: WorksPeriodRow): string {
  const day = (iso: string | null) =>
    iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : '…';
  return `${day(period.from)}–${day(period.to)}`;
}
