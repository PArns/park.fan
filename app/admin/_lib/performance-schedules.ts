import { firstOverlap, sortWorksPeriods, type DayWindowRow } from './works-periods';
import type { ParkSeason } from './types';

/** One schedule as the `performances` field carries it: park-local days, `HH:MM` start times. */
export interface PerformanceScheduleRow extends DayWindowRow {
  /** As typed: the editor's one input split at its commas, so blanks and spaces may be in it. */
  times: string[];
}

/** The backend's caps, for a field description that does not name its own. */
const DEFAULT_MAX_SCHEDULES = 10;
const DEFAULT_MAX_TIMES = 48;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** A row's start times as the backend stores them: trimmed, without blanks, unique and sorted. */
export function cleanTimes(times: readonly string[]): string[] {
  return [...new Set(times.map((time) => time.trim()).filter(Boolean))].sort();
}

/** The value of a `performances` field as rows; anything else reads as no schedules. */
export function performanceRows(value: unknown): PerformanceScheduleRow[] {
  return Array.isArray(value) ? (value as PerformanceScheduleRow[]) : [];
}

/** The rows as a save sends them: in the stored order, each with its times cleaned. */
export function performanceSchedulesForSave(
  rows: PerformanceScheduleRow[]
): PerformanceScheduleRow[] {
  return sortWorksPeriods(rows.map((row) => ({ ...row, times: cleanTimes(row.times) })));
}

/**
 * The API's checks on a schedule list, run before the save so the editor sees the problem at the
 * row. Returns the first problem as a German sentence, or null when the list may be saved.
 */
export function performanceSchedulesError(
  rows: PerformanceScheduleRow[],
  limits: { max?: number; maxTimes?: number } = {}
): string | null {
  const maxSchedules = limits.max ?? DEFAULT_MAX_SCHEDULES;
  const maxTimes = limits.maxTimes ?? DEFAULT_MAX_TIMES;
  if (rows.length > maxSchedules) return `Höchstens ${maxSchedules} Zeiträume pro Attraktion.`;
  for (const [index, row] of rows.entries()) {
    const label = `Zeile ${index + 1}`;
    if (row.from && row.to && row.from > row.to) return `${label}: „ab" liegt nach „bis".`;
    const times = cleanTimes(row.times);
    if (times.length === 0) return `${label}: mindestens eine Startzeit angeben.`;
    if (times.length > maxTimes) return `${label}: höchstens ${maxTimes} Startzeiten.`;
    const wrong = times.find((time) => !TIME.test(time));
    if (wrong) return `${label}: „${wrong}" ist keine Uhrzeit im Format HH:MM.`;
  }
  return firstOverlap(rows)
    ? 'Zeiträume überschneiden sich. Ein Zeitraum ohne Daten gilt an jedem Tag und steht allein.'
    : null;
}

/** The season whose first and last day a row's span is, or null: what the row's season picker shows. */
export function seasonOfRow(
  row: DayWindowRow,
  seasons: readonly Pick<ParkSeason, 'id' | 'startDate' | 'endDate'>[]
): string | null {
  return (
    seasons.find((season) => season.startDate === row.from && season.endDate === row.to)?.id ?? null
  );
}
