import type {
  DataQualityReport,
  HostCpu,
  QueueEntry,
  QueueStatusResponse,
  SystemHealthResponse,
} from '@/lib/api/admin';
import type { MlOverview } from '@/lib/api/admin-ml-overview';
import type { SubmissionSummary } from '@/lib/contribute/types';
import { getNumberFormat } from '@/lib/utils/intl-format';

/**
 * The admin's situation in one derivation: the monitoring answers (host, feeds, queues, models,
 * the site statistic, the data-quality detectors, the photo inbox) folded into areas with their
 * checks, a list of what needs a person, and the dot each sidebar entry shows. Pure, so the
 * overview, the sidebar and the tests read the same verdicts; `app/admin/_lib/use-admin-health.ts`
 * feeds it.
 */

/** How a check or an area stands: fine, worth a look, broken, or not known. */
export type HealthTone = 'ok' | 'warn' | 'bad' | 'unknown';

/** One source of the overview: still loading, not this account's to read, failed, or its answer. */
export type Reading<T> =
  | { state: 'loading' }
  | { state: 'forbidden' }
  | { state: 'failed'; message: string }
  | { state: 'ok'; data: T };

/** A figure that turns amber at `warn` and red at `bad`. */
export interface Threshold {
  warn: number;
  bad: number;
}

/** CPU load in percent of all cores. */
export const CPU_LOAD_PCT: Threshold = { warn: 60, bad: 80 };
/** A chip's temperature in °C where nothing better is known: the GPU and the sensors beside the CPU. */
export const CHIP_TEMP_C: Threshold = { warn: 70, bad: 85 };
/**
 * The CPU's temperature in °C while the API sends no limits: 15 and 5 °C under an assumed TjMax of
 * 100 °C, the API's own rule for a sensor that reports none.
 */
export const CPU_TEMP_C: Threshold = { warn: 85, bad: 95 };

/** The limits the CPU temperature is judged by: the chip's own from the API, else `CPU_TEMP_C`. */
export function cpuTempThreshold(cpu: HostCpu): Threshold {
  const limits = cpu.temperatureLimits;
  return limits ? { warn: limits.warnC, bad: limits.badC } : CPU_TEMP_C;
}

/** Memory and disk use in percent. */
export const STORAGE_PCT: Threshold = { warn: 85, bad: 95 };
/** Postgres connections in percent of the maximum. */
export const CONNECTIONS_PCT: Threshold = { warn: 80, bad: 95 };
/** Minutes since the newest wait-time row: a stalled cron goes unnoticed for months otherwise. */
export const FEED_STALE_MINUTES: Threshold = { warn: 20, bad: 60 };
/**
 * Days of weather forecast ahead of today; the table holds about 16, so fewer than a week means
 * the import has stopped. Lower is worse: amber below `warn`, red at `bad` or below.
 */
export const WEATHER_DAYS_AHEAD: Threshold = { warn: 7, bad: 0 };

/** The tone of a figure where more is worse; `unknown` without a figure. */
export function levelAbove(value: number | null | undefined, threshold: Threshold): HealthTone {
  if (value == null || Number.isNaN(value)) return 'unknown';
  if (value >= threshold.bad) return 'bad';
  return value >= threshold.warn ? 'warn' : 'ok';
}

/** The tone of a figure where less is worse; `unknown` without a figure. */
export function levelBelow(value: number | null | undefined, threshold: Threshold): HealthTone {
  if (value == null || Number.isNaN(value)) return 'unknown';
  if (value <= threshold.bad) return 'bad';
  return value < threshold.warn ? 'warn' : 'ok';
}

const TONE_RANK: Record<HealthTone, number> = { ok: 0, unknown: 1, warn: 2, bad: 3 };

/** The worst of several tones; `ok` for none. An unknown outranks ok and nothing else. */
export function worstTone(tones: readonly HealthTone[]): HealthTone {
  return tones.reduce<HealthTone>(
    (worst, tone) => (TONE_RANK[tone] > TONE_RANK[worst] ? tone : worst),
    'ok'
  );
}

/** One thing an area checks: drawn as one bar in the overview's table and one line when it opens. */
export interface HealthCheck {
  id: string;
  label: string;
  tone: HealthTone;
  /** The reading, already in words: `7 %`, `vor 2 Min.`, `connected`. */
  value: string;
}

/** The areas the overview watches, in the order its table lists them. */
export type HealthAreaId = 'server' | 'feeds' | 'queues' | 'models' | 'statistic' | 'quality';

/** One row of the overview's table: a part of the system, its checks and its key figure. */
export interface HealthArea {
  id: HealthAreaId;
  label: string;
  /** The page that shows the area in full. */
  href: string;
  tone: HealthTone;
  checks: HealthCheck[];
  /** The one figure the table shows beside the checks, with what it counts. */
  figure: { value: string; label: string } | null;
  /** Set while the source has not answered or when it failed; `checks` is then empty. */
  pending?: 'loading' | 'failed';
}

/**
 * One thing that needs a person, with the button that leads to its answer. `bad` is a fault (a
 * service down, a job failing), `warn` is work waiting (a decision, a photo to moderate).
 */
export interface HealthProblem {
  id: string;
  tone: 'warn' | 'bad';
  area: HealthAreaId | 'contributions';
  /** What is wrong or waiting, in one line. */
  title: string;
  /** The question it asks, or the evidence in words. */
  detail: string;
  /** The machine's own words, such as an error message, shown in monospace. */
  evidence?: string;
  /** When it started, ISO, where the source says so. */
  since?: string | null;
  /** Where the answer is given. */
  href: string;
  /** Names what the button does there: „Entscheiden“, „Stack in Queues ansehen“. */
  action: string;
  /** A source that did not answer: the button asks it again instead of leading away. */
  retry?: HealthAreaId;
}

/** What a sidebar entry shows on its right: a dot in its tone, or a count in it. */
export interface NavSignal {
  tone: HealthTone;
  count?: number;
}

/** Everything the overview and the sidebar show about the state of things. */
export interface AdminHealth {
  areas: HealthArea[];
  problems: HealthProblem[];
  /** The worst problem's tone; `ok` with none. */
  tone: HealthTone;
  /** Keyed by nav href. An entry without a signal is absent. */
  signals: Record<string, NavSignal>;
}

/** Every answer the derivation reads. A source the account cannot read is `forbidden`. */
export interface HealthSources {
  system: Reading<SystemHealthResponse>;
  queues: Reading<QueueStatusResponse>;
  quality: Reading<DataQualityReport>;
  ml: Reading<MlOverview>;
  contributions: Reading<SubmissionSummary>;
  /** Epoch ms, from the shared minute clock. */
  now: number;
}

const integer = getNumberFormat('de-DE', { maximumFractionDigits: 0 });
const oneDecimal = getNumberFormat('de-DE', { maximumFractionDigits: 1 });

/** A count in German digits: `7.932`. */
function count(value: number): string {
  return integer.format(value);
}

/** A share in percent, rounded: `55 %`. */
function percent(value: number): string {
  return `${integer.format(value)} %`;
}

/** A span of minutes in words, rounded down to its largest unit: `2 Min.`, `3 Std.`, `2 Tage`. */
export function durationLabel(minutes: number): string {
  if (minutes < 60) return `${integer.format(Math.floor(minutes))} Min.`;
  const hours = minutes / 60;
  if (hours < 48) return `${integer.format(Math.floor(hours))} Std.`;
  return `${integer.format(Math.floor(hours / 24))} Tage`;
}

/** Minutes since something happened, in words: `gerade eben`, `vor 2 Min.`, `vor 2 Tagen`. */
export function minutesAgoLabel(minutes: number): string {
  if (minutes < 1) return 'gerade eben';
  const span = durationLabel(minutes);
  return `vor ${span.endsWith(' Tage') ? `${span}n` : span}`;
}

function minutesSince(iso: string | null | undefined, now: number): number | null {
  if (!iso) return null;
  const at = Date.parse(iso);
  return Number.isFinite(at) ? Math.max(0, (now - at) / 60_000) : null;
}

/** A list of names cut after three: `A, B, C und 4 weitere`. */
function nameList(names: readonly string[]): string {
  const shown = names.slice(0, 3).join(', ');
  return names.length > 3 ? `${shown} und ${count(names.length - 3)} weitere` : shown;
}

function connected(status: string): boolean {
  return status.toLowerCase() === 'connected';
}

const AREA_META: Record<HealthAreaId, { label: string; href: string }> = {
  server: { label: 'Server', href: '/admin/system' },
  feeds: { label: 'Wartezeiten', href: '/admin/system' },
  queues: { label: 'Queues', href: '/admin/queues' },
  models: { label: 'Modelle', href: '/admin/ml' },
  statistic: { label: 'Statistik', href: '/admin/system' },
  quality: { label: 'Datenqualität', href: '/admin/data-quality' },
};

/** The name of the part a problem comes from, for the line under its title. */
export function problemSourceLabel(area: HealthProblem['area']): string {
  return area === 'contributions' ? 'Einsendungen' : AREA_META[area].label;
}

/** An area that has nothing to show yet, or whose source failed. */
function pendingArea(id: HealthAreaId, reading: Reading<unknown>): HealthArea {
  return {
    id,
    ...AREA_META[id],
    tone: 'unknown',
    checks: [],
    figure: null,
    pending: reading.state === 'failed' ? 'failed' : 'loading',
  };
}

function area(id: HealthAreaId, checks: HealthCheck[], figure: HealthArea['figure']): HealthArea {
  return { id, ...AREA_META[id], tone: worstTone(checks.map((c) => c.tone)), checks, figure };
}

/** The problem a source that failed to answer raises: its button asks again. */
function silentSource(id: HealthAreaId, reading: Reading<unknown>): HealthProblem[] {
  if (reading.state !== 'failed') return [];
  return [
    {
      id: `${id}:silent`,
      tone: 'warn',
      area: id,
      title: `${AREA_META[id].label}: keine Antwort`,
      detail: 'Die Werte kamen nicht an. Das Backend kann trotzdem laufen.',
      evidence: reading.message,
      href: AREA_META[id].href,
      action: 'Erneut fragen',
      retry: id,
    },
  ];
}

function serverArea(system: SystemHealthResponse): HealthArea {
  const { host, postgres, redis } = system;
  const checks: HealthCheck[] = [
    {
      id: 'cpu',
      label: 'CPU-Last',
      tone: levelAbove(host.cpu.loadPct, CPU_LOAD_PCT),
      value: host.cpu.loadPct == null ? '–' : percent(host.cpu.loadPct),
    },
    {
      id: 'memory',
      label: 'Arbeitsspeicher',
      tone: levelAbove(host.memory.usedPct, STORAGE_PCT),
      value: percent(host.memory.usedPct),
    },
    'usedPct' in host.disk
      ? {
          id: 'disk',
          label: 'Festplatte',
          tone: levelAbove(host.disk.usedPct, STORAGE_PCT),
          value: percent(host.disk.usedPct),
        }
      : { id: 'disk', label: 'Festplatte', tone: 'unknown', value: 'nicht lesbar' },
  ];
  // Null where the host exposes no sensor, which is not a fault.
  if (host.cpu.temperatureC != null) {
    checks.push({
      id: 'temperature',
      label: 'CPU-Temperatur',
      tone: levelAbove(host.cpu.temperatureC, cpuTempThreshold(host.cpu)),
      value: `${integer.format(host.cpu.temperatureC)} °C`,
    });
  }
  checks.push(
    {
      id: 'postgres',
      label: 'Postgres',
      tone: connected(postgres.status)
        ? postgres.connectionsPct == null
          ? 'ok'
          : levelAbove(postgres.connectionsPct, CONNECTIONS_PCT)
        : 'bad',
      value: connected(postgres.status)
        ? `${count(postgres.connections)} von ${count(postgres.maxConnections)} Verbindungen`
        : postgres.status,
    },
    {
      id: 'redis',
      label: 'Redis',
      tone: connected(redis.status) ? 'ok' : 'bad',
      value: connected(redis.status)
        ? `${oneDecimal.format(redis.usedMemoryMB / 1024)} GB, ${count(redis.connectedClients)} Clients`
        : redis.status,
    }
  );
  return area('server', checks, {
    value: host.cpu.loadPct == null ? '–' : percent(host.cpu.loadPct),
    label: 'CPU-Last',
  });
}

function feedsArea(system: SystemHealthResponse): HealthArea | null {
  const fresh = system.freshness;
  if (!fresh) return null;
  const weatherDays =
    fresh.weatherStaleHours == null ? null : Math.round(-fresh.weatherStaleHours / 24);
  const checks: HealthCheck[] = [
    {
      id: 'newest',
      label: 'Neueste Wartezeit',
      tone: levelAbove(fresh.queueStaleMinutes, FEED_STALE_MINUTES),
      value:
        fresh.queueStaleMinutes == null ? 'noch keine' : minutesAgoLabel(fresh.queueStaleMinutes),
    },
    {
      id: 'rows',
      label: 'Zeilen in der letzten Stunde',
      tone: fresh.queueRowsLastHour > 0 ? 'ok' : 'warn',
      value: count(fresh.queueRowsLastHour),
    },
    {
      id: 'weather',
      label: 'Wetter voraus',
      tone: levelBelow(weatherDays, WEATHER_DAYS_AHEAD),
      value: weatherDays == null ? '–' : `${count(weatherDays)} Tage`,
    },
  ];
  return area('feeds', checks, {
    value: fresh.queueStaleMinutes == null ? '–' : minutesAgoLabel(fresh.queueStaleMinutes),
    label: 'neueste Wartezeit',
  });
}

function feedProblems(feeds: HealthArea, system: SystemHealthResponse): HealthProblem[] {
  const problems: HealthProblem[] = [];
  const newest = feeds.checks.find((c) => c.id === 'newest');
  if (newest?.tone === 'bad') {
    problems.push({
      id: 'feeds:stale',
      tone: 'bad',
      area: 'feeds',
      title: 'Keine neuen Wartezeiten',
      detail: `Die neueste Zeile ist ${durationLabel(system.freshness?.queueStaleMinutes ?? 0)} alt. Steht der Abruf?`,
      since: system.freshness?.latestQueueTime ?? null,
      href: '/admin/queues',
      action: 'Queue wait-times ansehen',
    });
  }
  const weather = feeds.checks.find((c) => c.id === 'weather');
  if (weather?.tone === 'bad') {
    problems.push({
      id: 'feeds:weather',
      tone: 'bad',
      area: 'feeds',
      title: 'Der Wetter-Import steht',
      detail: 'Es liegt keine Vorhersage für die kommenden Tage mehr vor.',
      href: '/admin/system',
      action: 'In System ansehen',
    });
  }
  return problems;
}

function statisticArea(system: SystemHealthResponse, now: number): HealthArea | null {
  const stats = system.siteAnalytics;
  if (!stats) return null;
  if ('error' in stats) {
    return area(
      'statistic',
      [{ id: 'flush', label: 'Schreiben', tone: 'unknown', value: 'nicht lesbar' }],
      null
    );
  }
  const sinceFlush = minutesSince(stats.lastFlushAt, now);
  const checks: HealthCheck[] = [
    {
      id: 'flush',
      label: 'Schreiben',
      tone: stats.healthy ? 'ok' : 'bad',
      value: sinceFlush == null ? 'noch nie' : minutesAgoLabel(sinceFlush),
    },
    {
      id: 'parked',
      label: 'Beiseitegelegte Fenster',
      tone: stats.parkedWindows > 0 ? 'bad' : 'ok',
      value: count(stats.parkedWindows),
    },
    {
      id: 'pending',
      label: 'Wartende Fenster',
      tone: 'ok',
      value: count(stats.pendingWindows),
    },
  ];
  return area('statistic', checks, {
    value: sinceFlush == null ? '–' : minutesAgoLabel(sinceFlush),
    label: 'zuletzt geschrieben',
  });
}

function statisticProblems(system: SystemHealthResponse): HealthProblem[] {
  const stats = system.siteAnalytics;
  if (!stats || 'error' in stats || stats.healthy) return [];
  const oldest =
    stats.oldestPendingMinutes == null
      ? ''
      : `, das älteste seit ${count(stats.oldestPendingMinutes)} Min.`;
  return [
    {
      id: 'statistic:behind',
      tone: 'bad',
      area: 'statistic',
      title: 'Die Statistik kommt nicht hinterher',
      detail: `${count(stats.pendingWindows)} Fenster warten auf das Schreiben${oldest}; ${count(stats.parkedWindows)} beiseitegelegt.`,
      since: stats.lastFlushAt,
      href: '/admin/system',
      action: 'In System ansehen',
    },
  ];
}

/** The failures of a queue no later run has made up for; an older API sends no split. */
export function openFailures(queue: QueueEntry): number {
  return queue.failedOpen ?? queue.failed;
}

function queueCheck(queue: QueueEntry): HealthCheck {
  const open = openFailures(queue);
  const value =
    open > 0
      ? `${count(open)} offen fehlgeschlagen`
      : queue.active > 0
        ? `${count(queue.active)} aktiv`
        : queue.pending > 0
          ? `${count(queue.pending)} wartend`
          : 'ruhig';
  return { id: queue.name, label: queue.name, tone: open > 0 ? 'bad' : 'ok', value };
}

function queuesArea(status: QueueStatusResponse): HealthArea {
  const checks = status.queues.map(queueCheck);
  const open = status.queues.reduce((sum, q) => sum + openFailures(q), 0);
  return area('queues', checks, { value: count(open), label: 'offene Fehler' });
}

function queueProblems(status: QueueStatusResponse): HealthProblem[] {
  const failing = status.queues.filter((q) => openFailures(q) > 0);
  if (failing.length === 0) return [];
  return [
    {
      id: 'queues:failed',
      tone: 'bad',
      area: 'queues',
      title:
        failing.length === 1
          ? `Queue ${failing[0].name}: Jobs fehlgeschlagen`
          : `${count(failing.length)} Queues mit fehlgeschlagenen Jobs`,
      detail: `Seitdem lief kein Job derselben Art durch: ${nameList(
        failing.map((q) => `${q.name} (${count(openFailures(q))})`)
      )}.`,
      href: '/admin/queues',
      action: 'Fehlerursachen ansehen',
    },
  ];
}

const COMPONENT_TONES: Record<string, HealthTone> = {
  ok: 'ok',
  // Freshly deployed and not yet through its first run: nothing anybody has to do.
  warming: 'ok',
  late: 'warn',
  failed: 'bad',
};

/** The tone of an ML component's status; a status this build does not know is unknown. */
export function componentTone(status: string): HealthTone {
  return COMPONENT_TONES[status] ?? 'unknown';
}

function modelsArea(ml: MlOverview): HealthArea {
  const checks: HealthCheck[] = ml.components.map((component) => ({
    id: component.id,
    label: component.name,
    tone: componentTone(component.status),
    value: component.delivers,
  }));
  if (ml.drift) {
    checks.push({
      id: 'drift',
      label: 'Drift-Wache',
      tone: ml.drift.status === 'drift' ? 'warn' : 'ok',
      value: ml.drift.status === 'drift' ? 'ein Modell wird schlechter' : 'stabil',
    });
  }
  const served = ml.components.filter((c) => c.role === 'served');
  const servedOk = served.filter((c) => componentTone(c.status) === 'ok').length;
  return area('models', checks, {
    value: `${count(servedOk)} von ${count(served.length)}`,
    label: 'in der App laufen',
  });
}

function modelProblems(ml: MlOverview): HealthProblem[] {
  const problems: HealthProblem[] = [];
  for (const component of ml.components) {
    const tone = componentTone(component.status);
    if (tone !== 'bad' && tone !== 'warn') continue;
    problems.push({
      id: `models:${component.id}`,
      tone,
      area: 'models',
      title: `${component.name} ${tone === 'bad' ? 'ist fehlgeschlagen' : 'ist verspätet'}`,
      detail: `${component.delivers}. Erwartet ${component.expected}.`,
      evidence: component.note ?? undefined,
      since: component.lastRunAt,
      href: '/admin/ml',
      action: 'In der ML-Zentrale ansehen',
    });
  }
  const drifting = ml.drift?.models.filter((model) => model.status === 'drift') ?? [];
  for (const model of drifting) {
    problems.push({
      id: `models:drift:${model.model}`,
      tone: 'warn',
      area: 'models',
      title: `${model.label} wird schlechter`,
      detail: model.reasons[0] ?? 'Die letzten 7 Tage treffen schlechter als die 28 davor.',
      since: ml.drift?.computedAt ?? null,
      href: '/admin/ml',
      action: 'Drift ansehen',
    });
  }
  for (const decision of ml.decisions) {
    if (decision.state !== 'ready' && decision.state !== 'owner') continue;
    problems.push({
      id: `models:decision:${decision.id}`,
      tone: 'warn',
      area: 'models',
      title: `Entscheidung fällig: ${decision.title}`,
      detail: decision.detail,
      href: '/admin/ml',
      action: 'Entscheiden',
    });
  }
  return problems;
}

function qualityArea(report: DataQualityReport): HealthArea {
  const unreviewed = report.absenceRetiredUnreviewed;
  const checks: HealthCheck[] = [
    {
      id: 'silenced',
      label: 'Verstummte Parks',
      tone: report.silencedClusters.length > 0 ? 'warn' : 'ok',
      value: count(report.silencedClusters.length),
    },
    {
      id: 'failing',
      label: 'Scheiternde Jobs',
      tone: report.failingJobs.length > 0 ? 'warn' : 'ok',
      value: count(report.failingJobs.length),
    },
  ];
  if (unreviewed) {
    checks.push({
      id: 'unreviewed',
      label: 'Stilllegungen ohne Saison',
      tone: unreviewed.length > 0 ? 'warn' : 'ok',
      value: count(unreviewed.length),
    });
  }
  return area('quality', checks, { value: count(qualityCases(report)), label: 'offene Fälle' });
}

/** Every card the data-quality page asks a person to answer. */
function qualityCases(report: DataQualityReport): number {
  return (
    report.silencedClusters.length +
    report.failingJobs.length +
    (report.absenceRetiredUnreviewed?.length ?? 0)
  );
}

function qualityProblems(report: DataQualityReport): HealthProblem[] {
  const problems: HealthProblem[] = [];
  const clusters = report.silencedClusters;
  if (clusters.length > 0) {
    const rides = clusters.reduce((sum, c) => sum + c.attractionCount, 0);
    problems.push({
      id: 'quality:silenced',
      tone: 'warn',
      area: 'quality',
      title:
        clusters.length === 1
          ? `${clusters[0].parkName}: ${count(clusters[0].attractionCount)} Bahnen gleichzeitig verstummt`
          : `${count(clusters.length)} Parks: ${count(rides)} Bahnen gleichzeitig verstummt`,
      detail: `Saisonende oder abgerissener Feed? ${nameList(
        clusters.map((c) => `${c.parkName} (${count(c.attractionCount)})`)
      )}`,
      href: '/admin/data-quality',
      action: 'Entscheiden',
    });
  }
  for (const job of report.failingJobs) {
    problems.push({
      id: `quality:job:${job.queue}:${job.jobName}`,
      tone: 'warn',
      area: 'quality',
      title: `${job.jobName} scheitert`,
      detail: `Queue ${job.queue}, ${count(job.failures)}× fehlgeschlagen`,
      evidence: job.lastReason,
      since: job.lastFailedAt,
      href: '/admin/queues',
      action: 'Stack in Queues ansehen',
    });
  }
  const unreviewed = report.absenceRetiredUnreviewed ?? [];
  if (unreviewed.length > 0) {
    const parks = [...new Set(unreviewed.map((row) => row.parkName))];
    problems.push({
      id: 'quality:unreviewed',
      tone: 'warn',
      area: 'quality',
      title: `${count(unreviewed.length)} Bahnen stillgelegt, ohne dass jemand die Saison prüfte`,
      detail: `Saison oder weg? ${nameList(parks)}`,
      href: '/admin/data-quality',
      action: 'Entscheiden',
    });
  }
  return problems;
}

function contributionProblems(summary: SubmissionSummary): HealthProblem[] {
  const pending = summary.pending;
  if (pending.length === 0) return [];
  const photos = pending.reduce((sum, s) => sum + s.photos, 0);
  return [
    {
      id: 'contributions:pending',
      tone: 'warn',
      area: 'contributions',
      title:
        pending.length === 1
          ? 'Eine Einsendung wartet'
          : `${count(pending.length)} Einsendungen warten`,
      detail: `${count(photos)} ${photos === 1 ? 'Foto' : 'Fotos'} von ${nameList(pending.map((s) => s.name))}`,
      since: pending[pending.length - 1]?.createdAt ?? null,
      href: '/admin/contributions',
      action: 'Moderieren',
    },
  ];
}

const PROBLEM_RANK = { bad: 0, warn: 1 } as const;

/**
 * Folds the sources into areas, problems and sidebar signals. A source that is forbidden leaves
 * its area out; one that is loading or failed keeps its row, empty, so the table does not jump.
 * Faults sort before waiting work, otherwise the order is the areas'.
 */
export function deriveAdminHealth(sources: HealthSources): AdminHealth {
  const { system, queues, quality, ml, contributions, now } = sources;
  const areas: HealthArea[] = [];
  const problems: HealthProblem[] = [];

  if (system.state === 'ok') {
    const server = serverArea(system.data);
    areas.push(server);
    for (const check of server.checks) {
      if (check.tone !== 'bad') continue;
      problems.push({
        id: `server:${check.id}`,
        tone: 'bad',
        area: 'server',
        title: `${check.label}: ${check.value}`,
        detail: 'Der Server meldet einen Wert im roten Bereich.',
        href: '/admin/system',
        action: 'In System ansehen',
      });
    }
    const feeds = feedsArea(system.data);
    if (feeds) {
      areas.push(feeds);
      problems.push(...feedProblems(feeds, system.data));
    }
  } else if (system.state !== 'forbidden') {
    areas.push(pendingArea('server', system), pendingArea('feeds', system));
    problems.push(...silentSource('server', system));
  }

  if (queues.state === 'ok') {
    areas.push(queuesArea(queues.data));
    problems.push(...queueProblems(queues.data));
  } else if (queues.state !== 'forbidden') {
    areas.push(pendingArea('queues', queues));
    problems.push(...silentSource('queues', queues));
  }

  if (ml.state === 'ok') {
    areas.push(modelsArea(ml.data));
    problems.push(...modelProblems(ml.data));
  } else if (ml.state !== 'forbidden') {
    areas.push(pendingArea('models', ml));
    problems.push(...silentSource('models', ml));
  }

  if (system.state === 'ok') {
    const statistic = statisticArea(system.data, now);
    if (statistic) {
      areas.push(statistic);
      problems.push(...statisticProblems(system.data));
    }
  }

  if (quality.state === 'ok') {
    areas.push(qualityArea(quality.data));
    problems.push(...qualityProblems(quality.data));
  } else if (quality.state !== 'forbidden') {
    areas.push(pendingArea('quality', quality));
    problems.push(...silentSource('quality', quality));
  }

  if (contributions.state === 'ok') problems.push(...contributionProblems(contributions.data));

  // A stable sort: faults first, the areas' order within each.
  problems.sort((a, b) => PROBLEM_RANK[a.tone] - PROBLEM_RANK[b.tone]);
  const tone = problems.length === 0 ? 'ok' : problems[0].tone;

  return {
    areas,
    problems,
    tone,
    signals: navSignals(areas, problems, sources),
  };
}

function areaTone(areas: readonly HealthArea[], ids: readonly HealthAreaId[]): HealthTone | null {
  const matching = areas.filter((a) => ids.includes(a.id) && !a.pending);
  return matching.length === 0 ? null : worstTone(matching.map((a) => a.tone));
}

function navSignals(
  areas: readonly HealthArea[],
  problems: readonly HealthProblem[],
  sources: HealthSources
): Record<string, NavSignal> {
  const signals: Record<string, NavSignal> = {};
  if (problems.length > 0) {
    signals['/admin'] = { tone: problems[0].tone, count: problems.length };
  }
  const dot = (href: string, ids: HealthAreaId[]) => {
    const tone = areaTone(areas, ids);
    if (tone) signals[href] = { tone };
  };
  dot('/admin/system', ['server', 'feeds', 'statistic']);
  dot('/admin/queues', ['queues']);
  dot('/admin/ml', ['models']);

  if (sources.quality.state === 'ok') {
    const cases = qualityCases(sources.quality.data);
    signals['/admin/data-quality'] = cases > 0 ? { tone: 'warn', count: cases } : { tone: 'ok' };
  }
  if (sources.contributions.state === 'ok' && sources.contributions.data.pending.length > 0) {
    signals['/admin/contributions'] = {
      tone: 'warn',
      count: sources.contributions.data.pending.length,
    };
  }
  return signals;
}
