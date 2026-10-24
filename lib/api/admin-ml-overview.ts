/**
 * The ML overview (`/v1/admin/ml-overview`, reached through `/api/admin/…`): what is up for a
 * decision, the model matrix in four numbers, and whether every model and job ran when it should.
 */

/** Where a decision stands. `owner` means the measurements are done and the call is the owner's. */
export type MlDecisionState = 'ready' | 'waiting_live' | 'open' | 'later' | 'owner';

/** How far the live measurement behind a decision has got, against what the switch rule needs. */
export interface MlDecisionProgress {
  liveDays: number;
  liveParks: number;
  needDays: number;
  needParks: number;
}

/** One pending change to what the app serves. */
export interface MlDecision {
  id: string;
  title: string;
  detail: string;
  state: MlDecisionState | string;
  progress: MlDecisionProgress | null;
  /** When the decision can be taken at the earliest; `label` is already plain German. */
  earliest: { date: string; label: string } | null;
  /** The matrix cells (`/admin/ml/vergleich`) the decision rests on. */
  /**
   * `expect: 'not_better'`: the decision is to switch the model off, so the cell is met when the
   * model does NOT beat what is served (live check `no`).
   */
  cells: { questionId: string; modelId: string; expect?: 'not_better' }[];
  /** Fixed evaluation date (`YYYY-MM-DD`); never `ready` before it. Absent from older backends. */
  evaluateOn?: string;
  /** From `evaluateOn` on: judged on the window ending the day before, no longer moves. */
  evaluated?: boolean;
  /** The verdict frozen on `evaluateOn`; once present, `state` is its verdict. Absent before then. */
  report?: MlDecisionReport;
}

/** One matrix cell as the frozen report copied it. `diff` is model minus today, negative is better. */
export interface MlDecisionReportCell {
  questionId: string;
  modelId: string;
  state: string;
  /** In the question's unit (minutes, or percentage points for a rate). */
  diff: number | null;
  /** The interval the gate decides on (parks × days). */
  ciLow: number | null;
  ciHigh: number | null;
  /** The interval over parks only, shown beside it. */
  parkCiLow: number | null;
  parkCiHigh: number | null;
  parks: number;
  days: number;
  n: number;
  jointRows: number | null;
  cellRows: number | null;
}

/**
 * A decision judged once on its `evaluateOn`, with everything the verdict rested on. `warning`
 * means a check failed, so a green verdict must not be read as a silent one.
 */
export interface MlDecisionReport {
  decisionId: string;
  evaluateOn: string;
  createdAt: string;
  window: { firstDate: string | null; lastDate: string | null };
  verdict: MlDecisionState | string;
  cells: MlDecisionReportCell[];
  parks: number;
  days: number;
  /** Paired park × date cells, Monday first. */
  weekdays: { weekday: string; count: number; share: number }[];
  /** Share 0 to 1 on a holiday, school break or bridge day; null when unknown. */
  holidayShare: number | null;
  /** Plain German, e.g. "Herbst". */
  season: string;
  checks: { id: string; ok: boolean; label: string }[];
  warning: boolean;
  /** Plain German, one line per failed check. */
  warnings: string[];
}

/** Whether a served model's error moved: `drift`, `ok`, or not enough data. */
export type MlDriftStatus = 'ok' | 'drift' | 'no_data';

/** One window of the drift watch: its MAE against the weekday median on the same slots. */
export interface MlDriftWindow {
  n: number;
  mae: number | null;
  baselineMae: number | null;
  /** mae ÷ baselineMae; below 1 beats the weekday median. */
  skill: number | null;
  /** Share of actuals at or below q0.8 / q0.95; null where no quantile is stored. */
  coverageQ80: number | null;
  coverageQ95: number | null;
}

/** One served model in the drift watch: the last 7 days against the 28 before. */
export interface MlDriftModel {
  model: string;
  label: string;
  status: MlDriftStatus | string;
  recent: MlDriftWindow;
  previous: MlDriftWindow;
  /** Plain German, one line per threshold crossed. */
  reasons: string[];
}

/** The daily drift watch over the served models. */
export interface MlDriftWatch {
  computedAt: string;
  status: MlDriftStatus | string;
  models: MlDriftModel[];
}

/** What a model or job is for: serving the app, running in the shadow, or measuring the others. */
export type MlComponentRole = 'served' | 'shadow' | 'measurement';

/** Whether a model or job ran when it should have. */
export type MlComponentStatus = 'ok' | 'late' | 'failed' | 'warming' | 'unknown';

/** One model or job and its last run. */
export interface MlComponent {
  id: string;
  name: string;
  /** What it delivers, in plain German. */
  delivers: string;
  role: MlComponentRole | string;
  /** An instant, or a bare `YYYY-MM-DD` for a job that runs over a whole day. */
  lastRunAt: string | null;
  /** The cadence it is expected to run at, in plain German ("alle 15 Min."). */
  expected: string;
  status: MlComponentStatus | string;
  note: string | null;
}

/** `GET /api/admin/ml-overview`. */
export interface MlOverview {
  generatedAt: string;
  decisions: MlDecision[];
  matrixSummary: { better: number; pending: number; unclear: number; worse: number };
  components: MlComponent[];
  /** The CatBoost hourly band's current factors; null before the first run or once expired. */
  bandCalibration?: MlBandCalibration | null;
  /** Absent until the drift watch first ran, or when its last run is over three days old. */
  drift?: MlDriftWatch;
}

/** One band calibration cell: the factor `k` on `q0.95 − q0.5` and the coverage it buys. */
export interface MlBandCalibrationCell {
  /** Scored slots. */
  n: number;
  /** Null = the band is served raw. */
  k: number | null;
  /** Share of actuals at or below served + band, before and after `k`; 0 to 1. */
  coverageRaw: number;
  coverageCalibrated: number | null;
}

/**
 * The daily split-conformal fit of CatBoost's hourly band per lead bucket (`h0-2`, `h2-6`,
 * `h6-24`, `h24+`) and predicted-wait segment, so the band holds `target` (0.95).
 */
export interface MlBandCalibration {
  computedAt: string;
  target: number;
  windowDays: number;
  minSample: number;
  /** Pooled over segments, per lead bucket. */
  pooledByLead: Record<string, MlBandCalibrationCell>;
  /** Keyed `lead|segment`; `pooled` = too few slots, borrowed from the lead bucket's pool. */
  cells: Record<string, MlBandCalibrationCell & { source: 'cell' | 'pooled' }>;
}
