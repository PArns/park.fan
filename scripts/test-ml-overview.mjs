/**
 * Unit tests for the ML overview helpers (`lib/admin/ml-overview.ts`) and the sample payload the
 * page shows with `?beispiel=1`.
 *
 * Run: `pnpm test:ml-overview`
 */
import assert from 'node:assert/strict';
import {
  componentRoleLabel,
  componentStatusMeta,
  decisionStateMeta,
  driftStatusMeta,
  formatInterval,
  formatLastRun,
  formatShare,
  formatSigned,
  noProgressLabel,
  progressDaysLabel,
  progressParksLabel,
  progressPercent,
  reportCellTone,
  sortComponentsProblemsFirst,
  sortDecisionsReadyFirst,
} from '../lib/admin/ml-overview.ts';
import { FIXTURE_OVERVIEW } from '../lib/admin/ml-overview-fixture.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

test('every decision state has its pill, and a new one reads neutral', () => {
  assert.deepEqual(decisionStateMeta('ready'), { label: 'bereit', tone: 'success' });
  assert.equal(decisionStateMeta('waiting_live').label, 'wartet auf Live');
  assert.equal(decisionStateMeta('open').label, 'offen');
  assert.equal(decisionStateMeta('later').label, 'später');
  assert.deepEqual(decisionStateMeta('owner'), { label: 'Entscheidung offen', tone: 'danger' });
  assert.deepEqual(decisionStateMeta('vertagt'), { label: 'unbekannt', tone: 'muted' });
});

test('every component status has its word, and a new one counts as unknown', () => {
  assert.equal(componentStatusMeta('ok').label, 'läuft');
  assert.equal(componentStatusMeta('late').label, 'verspätet');
  assert.equal(componentStatusMeta('failed').label, 'fehlgeschlagen');
  assert.equal(componentStatusMeta('warming').label, 'wärmt auf');
  assert.equal(componentStatusMeta('unknown').label, 'unbekannt');
  assert.deepEqual(componentStatusMeta('paused'), componentStatusMeta('unknown'));
});

test('roles read as where the output goes, and a new role gets no label', () => {
  assert.equal(componentRoleLabel('served'), 'in der App');
  assert.equal(componentRoleLabel('shadow'), 'nur Schatten');
  assert.equal(componentRoleLabel('measurement'), 'Messung');
  assert.equal(componentRoleLabel('canary'), null);
});

test('problems sort to the top, and the rest keeps the backend order', () => {
  const row = (id, status) => ({ id, status });
  const sorted = sortComponentsProblemsFirst([
    row('a', 'ok'),
    row('b', 'warming'),
    row('c', 'late'),
    row('d', 'ok'),
    row('e', 'failed'),
    row('f', 'mystery'),
    row('g', 'late'),
  ]);
  assert.deepEqual(
    sorted.map((component) => component.id),
    ['e', 'c', 'g', 'f', 'b', 'a', 'd']
  );
});

test('a ready decision moves to the top, the others keep their order', () => {
  const sorted = sortDecisionsReadyFirst([
    { id: 'a', state: 'waiting_live' },
    { id: 'b', state: 'later' },
    { id: 'c', state: 'ready' },
    { id: 'd', state: 'owner' },
  ]);
  assert.deepEqual(
    sorted.map((decision) => decision.id),
    ['c', 'a', 'b', 'd']
  );
});

test('the progress bar follows whichever of days and parks is further from done', () => {
  assert.equal(progressPercent({ liveDays: 1, liveParks: 10, needDays: 14, needParks: 10 }), 7);
  assert.equal(progressPercent({ liveDays: 14, liveParks: 5, needDays: 14, needParks: 10 }), 50);
  assert.equal(progressPercent({ liveDays: 20, liveParks: 12, needDays: 14, needParks: 10 }), 100);
  assert.equal(progressPercent({ liveDays: 0, liveParks: 0, needDays: 14, needParks: 10 }), 0);
  assert.equal(progressPercent({ liveDays: 3, liveParks: 0, needDays: 6, needParks: 0 }), 50);
});

test('progress and its absence read as sentences', () => {
  const progress = { liveDays: 1, liveParks: 3, needDays: 14, needParks: 10 };
  assert.equal(progressDaysLabel(progress), 'live gemessen: 1 von 14 Tagen');
  assert.equal(progressParksLabel(progress), 'in 3 von 10 Parks');
  assert.equal(noProgressLabel('owner'), 'deine Entscheidung');
  assert.equal(noProgressLabel('later'), 'wartet auf andere Punkte');
  assert.equal(noProgressLabel('open'), 'noch keine Live-Messung');
});

test('a last run reads as day and time in UTC unless a zone is given, a scored day as that day', () => {
  assert.equal(formatLastRun('2026-10-11T20:16:00Z'), '11.10. 20:16');
  assert.equal(formatLastRun('2026-10-11T20:16:00Z', 'Europe/Berlin'), '11.10. 22:16');
  assert.equal(formatLastRun('2026-10-11T23:30:00Z', 'Europe/Berlin'), '12.10. 01:30');
  assert.equal(formatLastRun('2026-01-05T07:03:00Z', 'UTC'), '05.01. 07:03');
  assert.equal(formatLastRun('2026-10-10', 'UTC'), 'Tag 10.10.');
  assert.equal(formatLastRun(null), 'noch nie');
  assert.equal(formatLastRun('kaputt'), 'kaputt');
});

test('the sample holds the mockup: six decisions, eight components, its counters', () => {
  assert.equal(FIXTURE_OVERVIEW.decisions.length, 6);
  assert.equal(FIXTURE_OVERVIEW.components.length, 8);
  assert.deepEqual(FIXTURE_OVERVIEW.matrixSummary, {
    better: 0,
    pending: 17,
    unclear: 16,
    worse: 11,
  });
  const ids = new Set(FIXTURE_OVERVIEW.decisions.map((decision) => decision.id));
  assert.equal(ids.size, FIXTURE_OVERVIEW.decisions.length);
  for (const decision of FIXTURE_OVERVIEW.decisions) {
    assert.notEqual(decisionStateMeta(decision.state).label, 'unbekannt', decision.id);
  }
  assert.equal(sortComponentsProblemsFirst(FIXTURE_OVERVIEW.components).at(-1).id, 'scoring');
});

test('report figures carry their sign, intervals and shares read in German', () => {
  assert.equal(formatSigned(-0.4219), '−0,42');
  assert.equal(formatSigned(2.6), '+2,60');
  assert.equal(formatSigned(null), '—');
  assert.equal(formatInterval(-0.8, -0.1), '−0,80 bis −0,10');
  assert.equal(formatInterval(-0.8, null), '—');
  assert.equal(formatShare(0.405), '41 %');
  assert.equal(formatShare(null), '—');
  assert.equal(reportCellTone('better'), 'success');
  assert.equal(reportCellTone('neu'), 'muted');
});

test('drift statuses have their word, and a new one reads like no data', () => {
  assert.deepEqual(driftStatusMeta('drift'), { label: 'Abweichung', tone: 'danger' });
  assert.equal(driftStatusMeta('ok').label, 'stabil');
  assert.equal(driftStatusMeta('neu').label, 'zu wenig Daten');
});

test('the sample shows a frozen report with a warning and a drift watch', () => {
  const reported = FIXTURE_OVERVIEW.decisions.filter((decision) => decision.report);
  assert.equal(reported.length, 1);
  const { report } = reported[0];
  assert.equal(reported[0].state, report.verdict);
  assert.equal(
    report.warning,
    report.checks.some((check) => !check.ok)
  );
  assert.equal(report.weekdays.length, 7);
  assert.ok(Math.abs(report.weekdays.reduce((sum, day) => sum + day.share, 0) - 1) < 0.01);
  assert.ok(FIXTURE_OVERVIEW.decisions.some((d) => d.evaluateOn && !d.report));
  assert.deepEqual(
    FIXTURE_OVERVIEW.drift.models.map((model) => model.status),
    ['drift', 'ok', 'no_data']
  );
});

console.log(`\n${passed} assertions passed.`);
