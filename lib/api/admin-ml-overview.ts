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
  cells: { questionId: string; modelId: string }[];
  /** Fixed evaluation date (`YYYY-MM-DD`); never `ready` before it. Absent from older backends. */
  evaluateOn?: string;
  /** From `evaluateOn` on: judged on the window ending the day before, no longer moves. */
  evaluated?: boolean;
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
}
