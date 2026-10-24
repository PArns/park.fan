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
  /** `park_date`: `ciLow`/`ciHigh` resample parks and dates (the gate's interval). Absent: parks only. */
  ci?: 'park_date';
  /** The parks-only interval beside the gate's one; null with fewer than 2 parks. */
  parkCiLow?: number | null;
  parkCiHigh?: number | null;
  /** `equal`: every lead weighs the same in `diff`, the errors and the interval. */
  leadWeighting?: 'equal';
  /** Per lead ("h0-1", "d3", …); the cell's figures are their mean. */
  leads?: {
    lead: string;
    n: number;
    days: number;
    parks: number;
    diff: number;
    modelMae: number;
    referenceMae: number;
  }[];
}

/** The offline benchmark behind a cell, kept apart from the live figures. */
export interface ModelCellOffline {
  diff?: number;
  ciLow?: number;
  ciHigh?: number;
  source: string;
  period?: string;
  /** What the offline figure was measured against: `served`, or a bench reference; null = not recorded. */
  reference?: string | null;
  referenceIsServed?: boolean;
  /** `slot_mae`, `besttime_regret`, `daypeak_mae`, `hit_rate`; null = not recorded. */
  metric?: string | null;
  /** The ml-bench results directory of the run; null = not recorded. */
  runId?: string | null;
}

/** A direct model-vs-model comparison beside the cells; no cell state depends on it. */
export interface ModelComparisonPair {
  /** `live.diff` is `model` minus `reference`, negative = `model` better. */
  model: string;
  reference: string;
  /** German, what the comparison covers. */
  note: string;
  live: ModelCellLive | null;
  enoughData: boolean;
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
  /** `min` = minutes; `rate` = percentage points (share of wrongly ordered day pairs). */
  metric: { unit: 'min' | 'rate'; lowerIsBetter: boolean };
  /** Keyed by model id. A model with no key does not answer this question. */
  cells: Record<string, ModelCell>;
  /** Direct comparisons that are not "against served"; absent when there are none. */
  comparisons?: ModelComparisonPair[];
  /** Paired rows per cell and the rows every core candidate shared; absent without data. */
  coverage?: { jointRows: number; cells: Record<string, number> };
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
  /** Days with a complete archive, newest first. */
  dates: string[];
  /** Parks by data richness, richest first; each park's rides headliners first. */
  parks: {
    id: string;
    name: string;
    timezone: string;
    city?: string | null;
    country?: string | null;
    rides: { id: string; name: string; isHeadliner: boolean }[];
  }[];
  origins: ForecastOrigin[];
  /**
   * A day, park and ride that have both forecasts and measurements, for the first view. Absent
   * from older backends and null when no day qualifies.
   */
  suggested?: { date: string; parkId: string; attractionId: string } | null;
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
  /**
   * `HH:MM`, park-local, clipped to the operating window. A window past midnight runs on in
   * order (`23:45`, `00:00`), so a slot's position is its index, never its clock value.
   */
  slots: string[];
  /** The measured wait per slot; null where the ride was not running. */
  truth: (number | null)[];
  /** Share of slots with a measured wait, 0 to 1. Absent from older backends. */
  truthCoverage?: number;
  series: { model: string; label: string; values: (number | null)[] }[];
  /** Ascending by error, best first. */
  scores: { model: string; label: string; mae: number; n: number }[];
}
