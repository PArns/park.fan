import type { ChipTone } from '@/app/admin/_ui/primitives';
import type { MlComponent, MlDecision, MlDecisionProgress } from '@/lib/api/admin-ml-overview';
import { getDateTimeFormat, getNumberFormat } from '@/lib/utils/intl-format';

/**
 * The pure half of the ML overview (`app/admin/ml`): wording, colours, order and time formatting,
 * kept apart from the page so they can be tested.
 */

const DECISION_STATES: Record<string, { label: string; tone: ChipTone }> = {
  ready: { label: 'bereit', tone: 'success' },
  waiting_live: { label: 'wartet auf Live', tone: 'warning' },
  open: { label: 'offen', tone: 'muted' },
  later: { label: 'später', tone: 'muted' },
  owner: { label: 'Entscheidung offen', tone: 'danger' },
};

/** The pill for a decision state; a state this build does not know reads neutral. */
export function decisionStateMeta(state: string): { label: string; tone: ChipTone } {
  return DECISION_STATES[state] ?? { label: 'unbekannt', tone: 'muted' };
}

const COMPONENT_STATUSES: Record<string, { label: string; tone: ChipTone; rank: number }> = {
  failed: { label: 'fehlgeschlagen', tone: 'danger', rank: 0 },
  late: { label: 'verspätet', tone: 'warning', rank: 1 },
  unknown: { label: 'unbekannt', tone: 'muted', rank: 2 },
  warming: { label: 'wärmt auf', tone: 'primary', rank: 3 },
  ok: { label: 'läuft', tone: 'success', rank: 4 },
};

/**
 * The dot and word for a component status, and its place in the table: failures first, then
 * late runs, then anything nobody can vouch for. An unknown status counts as unknown.
 */
export function componentStatusMeta(status: string): {
  label: string;
  tone: ChipTone;
  rank: number;
} {
  return COMPONENT_STATUSES[status] ?? COMPONENT_STATUSES.unknown;
}

const ROLE_LABELS: Record<string, string> = {
  served: 'in der App',
  shadow: 'nur Schatten',
  measurement: 'Messung',
};

/** Whether the app shows what a component delivers, in two or three words; null for a new role. */
export function componentRoleLabel(role: string): string | null {
  return ROLE_LABELS[role] ?? null;
}

/** The components with problems on top, otherwise in the backend's order. */
export function sortComponentsProblemsFirst(components: MlComponent[]): MlComponent[] {
  return components
    .map((component, index) => ({ component, index }))
    .sort(
      (a, b) =>
        componentStatusMeta(a.component.status).rank -
          componentStatusMeta(b.component.status).rank || a.index - b.index
    )
    .map(({ component }) => component);
}

/** The decisions ready to take on top, otherwise in the backend's order. */
export function sortDecisionsReadyFirst(decisions: MlDecision[]): MlDecision[] {
  return decisions
    .map((decision, index) => ({ decision, index }))
    .sort(
      (a, b) =>
        Number(b.decision.state === 'ready') - Number(a.decision.state === 'ready') ||
        a.index - b.index
    )
    .map(({ decision }) => decision);
}

/**
 * How full the live-measurement bar is, 0 to 100. The switch rule needs both the days and the
 * parks, so the bar follows whichever is further from done.
 */
export function progressPercent(progress: MlDecisionProgress): number {
  const share = (have: number, need: number) => (need > 0 ? have / need : 1);
  const fraction = Math.min(
    share(progress.liveDays, progress.needDays),
    share(progress.liveParks, progress.needParks)
  );
  return Math.round(Math.min(Math.max(fraction, 0), 1) * 100);
}

/** "live gemessen: 1 von 14 Tagen". */
export function progressDaysLabel(progress: MlDecisionProgress): string {
  return `live gemessen: ${progress.liveDays} von ${progress.needDays} ${progress.needDays === 1 ? 'Tag' : 'Tagen'}`;
}

/** "in 3 von 10 Parks". */
export function progressParksLabel(progress: MlDecisionProgress): string {
  return `in ${progress.liveParks} von ${progress.needParks} ${progress.needParks === 1 ? 'Park' : 'Parks'}`;
}

/** What stands where the bar would be when a decision has no live measurement. */
export function noProgressLabel(state: string): string {
  if (state === 'owner') return 'deine Entscheidung';
  if (state === 'later') return 'wartet auf andere Punkte';
  if (state === 'ready') return 'alle Prüfungen erfüllt';
  return 'noch keine Live-Messung';
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A last run as "11.10. 20:16" in UTC, the clock the backend states every cadence in ("täglich
 * 06:00"), so the two columns can be compared; no park's zone, since a model runs for all of them.
 * A bare day reads "Tag 10.10.": a job that scores a whole day.
 */
export function formatLastRun(value: string | null, timeZone = 'UTC'): string {
  if (!value) return 'noch nie';
  const day = DATE_ONLY.exec(value);
  if (day) return `Tag ${day[3]}.${day[2]}.`;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const parts = getDateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(parsed);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? '';
  return `${part('day')}.${part('month')}. ${part('hour')}:${part('minute')}`;
}

const DRIFT_STATUSES: Record<string, { label: string; tone: ChipTone }> = {
  drift: { label: 'Abweichung', tone: 'danger' },
  ok: { label: 'stabil', tone: 'success' },
  no_data: { label: 'zu wenig Daten', tone: 'muted' },
};

/** The dot and word for a drift status; a status this build does not know reads like no data. */
export function driftStatusMeta(status: string): { label: string; tone: ChipTone } {
  return DRIFT_STATUSES[status] ?? DRIFT_STATUSES.no_data;
}

const REPORT_CELL_TONES: Record<string, ChipTone> = {
  better: 'success',
  worse: 'danger',
  unclear: 'muted',
  pending: 'warning',
};

/** The chip tone for a report cell's matrix state (`better`, `worse`, …); muted for anything else. */
export function reportCellTone(state: string): ChipTone {
  return REPORT_CELL_TONES[state] ?? 'muted';
}

/**
 * A report figure with its sign, `−0,42`, `—` when missing. The report does not carry the
 * question's unit, so the figure goes out bare rather than with a guessed one.
 */
export function formatSigned(value: number | null): string {
  if (value == null) return '—';
  return getNumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'exceptZero',
  })
    .format(value)
    .replace('-', '−');
}

/** An interval as `−0,80 bis −0,10`, `—` when either end is missing. */
export function formatInterval(low: number | null, high: number | null): string {
  return low == null || high == null ? '—' : `${formatSigned(low)} bis ${formatSigned(high)}`;
}

/** A share 0 to 1 as a whole percentage, `18 %`; `—` when missing. */
export function formatShare(value: number | null): string {
  return value == null ? '—' : `${Math.round(value * 100)} %`;
}
