/**
 * The admin model comparison (`/v1/admin/model-comparison`, reached through `/api/admin/…`): one
 * matrix of every model against every question the app answers, and one replayed day.
 */

/** A matrix circle: what the app shows today, better, worse, no reliable difference, or still measuring. */
export type ModelCellState = 'today' | 'better' | 'worse' | 'unclear' | 'pending';

/** One of the three checks a model passes before it replaces what the app shows. */
export type ModelCheckState = 'yes' | 'no' | 'running' | 'open';

/** The live measurement behind a cell: `diff` is the model's error minus the reference's. */
export interface ModelCellLive {
  diff: number;
  ciLow: number;
  ciHigh: number;
  days: number;
  parks: number;
  n: number;
  modelMae: number;
  referenceMae: number;
  /** First day of the live measurement (`YYYY-MM-DD`), null when unknown. */
  since: string | null;
}

/** The offline benchmark behind a cell, kept apart from the live figures. */
export interface ModelCellOffline {
  diff?: number;
  ciLow?: number;
  ciHigh?: number;
  source: string;
  period?: string;
}

/** One model's answer to one question. */
export interface ModelCell {
  state: ModelCellState;
  note: string;
  checks: { offline: ModelCheckState; live: ModelCheckState; visible: boolean };
  live: ModelCellLive | null;
  offline: ModelCellOffline | null;
  /** When a pending or unconfirmed result is due; `label` is already plain German. */
  expectedBy: { date: string; label: string } | null;
}

/** A row of the matrix: one question the app answers, and the model it serves for it today. */
export interface ModelComparisonQuestion {
  id: string;
  group: string;
  label: string;
  sub: string;
  /** How far ahead the question forecasts, in plain German ("15 Minuten voraus"). */
  leadLabel: string;
  servedModel: string;
  metric: { unit: 'min' | 'rate'; lowerIsBetter: boolean };
  /** Keyed by model id. A model with no key does not answer this question. */
  cells: Record<string, ModelCell>;
}

/** A model the matrix has a column for. */
export interface ComparisonModel {
  id: string;
  label: string;
  oneLiner: string;
}

/** `GET /api/admin/model-comparison?days=28&region=ALL`. */
export interface ModelComparisonReport {
  generatedAt: string;
  window: { days: number; firstDate: string | null; lastDate: string | null };
  rule: { minDays: number; minParks: number };
  models: ComparisonModel[];
  groups: { id: 'live' | 'today' | 'planner' | 'calendar' | string; label: string }[];
  questions: ModelComparisonQuestion[];
  summary: { better: number; pending: number; unclear: number; worse: number };
}

/** The moment a stored forecast was made, relative to the day it forecasts. */
export interface ForecastOrigin {
  id: 'morning' | 'd1' | 'd3' | 'd7' | string;
  label: string;
}

/** `GET /api/admin/model-comparison/day/options?date=YYYY-MM-DD`. */
export interface ModelComparisonDayOptions {
  date: string;
  dates: string[];
  parks: {
    id: string;
    name: string;
    timezone: string;
    rides: { id: string; name: string; isHeadliner: boolean }[];
  }[];
  origins: ForecastOrigin[];
}

/** `GET /api/admin/model-comparison/day?parkId&date&attractionId&origin`. */
export interface ModelComparisonDay {
  park: { id: string; name: string; timezone: string };
  ride: { id: string; name: string };
  date: string;
  /** `localLabel` is the save time in park-local words ("10.10. um 06:05 Uhr"). */
  origin: ForecastOrigin & { at: string | null; localLabel: string };
  /** The park's hours that day, park-local; null when no schedule is known. */
  openingHours: { open: string; close: string } | null;
  /** `HH:MM`, park-local. */
  slots: string[];
  /** The measured wait per slot; null where the ride was not running. */
  truth: (number | null)[];
  series: { model: string; label: string; values: (number | null)[] }[];
  /** Ascending by error, best first. */
  scores: { model: string; label: string; mae: number; n: number }[];
}
