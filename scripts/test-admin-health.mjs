/**
 * Unit tests for the admin's situation (`lib/admin/health.ts`): which readings turn an area amber or
 * red, which of them become a problem with a button, the order of the problems, and the dots the
 * sidebar shows.
 *
 * Run: pnpm test:admin-health
 */
import assert from 'node:assert/strict';
import {
  deriveAdminHealth,
  levelAbove,
  levelBelow,
  minutesAgoLabel,
  worstTone,
  FEED_STALE_MINUTES,
  WEATHER_DAYS_AHEAD,
} from '../lib/admin/health.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const NOW = Date.parse('2026-11-03T11:00:00Z');
const ok = (data) => ({ state: 'ok', data });

/** The production answers of 2026-11-03, 11:00 UTC, trimmed to what the derivation reads. */
function system(overrides = {}) {
  return {
    timestamp: '2026-11-03T11:00:00Z',
    host: {
      cpu: {
        cores: 24,
        model: 'Intel',
        load: { '1m': 1, '5m': 1, '15m': 1 },
        loadPct: 7,
        temperatureC: 59,
      },
      memory: { totalGB: 29.9, usedGB: 16.5, usedPct: 55.1 },
      swap: null,
      disk: { totalGB: 1874, freeGB: 1636, usedPct: 12.7 },
      uptimeHours: 302,
    },
    postgres: {
      status: 'connected',
      connections: 118,
      activeQueries: 2,
      maxConnections: 200,
      connectionsPct: 59,
      dbSizeGB: 47.4,
      cacheHitPct: 99.6,
    },
    redis: {
      status: 'connected',
      usedMemoryMB: 973,
      maxMemoryMB: 2048,
      connectedClients: 186,
      keys: 100222,
      hitRatePct: 77.3,
      uptimeHours: 12,
    },
    freshness: {
      latestQueueTime: '2026-11-03T10:58:00Z',
      queueStaleMinutes: 2,
      queueRowsLastHour: 7932,
      latestWeatherDate: '2026-11-18',
      weatherStaleHours: -349,
    },
    siteAnalytics: {
      pendingWindows: 1,
      readyWindows: 0,
      oldestPendingMinutes: 2,
      parkedWindows: 0,
      openVisits: 31,
      lastFlushAt: '2026-11-03T10:59:00Z',
      dropsToday: {},
      dropsYesterday: {},
      healthy: true,
    },
    ml: {},
    ...overrides,
  };
}

const queue = (name, extra = {}) => ({
  name,
  active: 0,
  pending: 0,
  failed: 0,
  failedOpen: 0,
  delayed: 1,
  completed: 100,
  ...extra,
});

const quiet = {
  windowDays: 14,
  silencedClusters: [],
  failingJobs: [],
  absenceRetiredUnreviewed: [],
};

const ml = (overrides = {}) => ({
  generatedAt: '2026-11-03T11:00:00Z',
  decisions: [],
  matrixSummary: { better: 2, pending: 9, unclear: 35, worse: 10 },
  components: [
    {
      id: 'pcn',
      name: 'PCN',
      delivers: 'Live-Wartezeiten',
      role: 'served',
      lastRunAt: '2026-11-03T10:45:00Z',
      expected: 'alle 15 Min.',
      status: 'ok',
      note: null,
    },
    {
      id: 'chronos',
      name: 'Chronos-2',
      delivers: 'Schatten',
      role: 'shadow',
      lastRunAt: '2026-11-03T10:05:00Z',
      expected: 'stündlich',
      status: 'ok',
      note: null,
    },
  ],
  ...overrides,
});

function sources(overrides = {}) {
  return {
    system: ok(system()),
    queues: ok({ timestamp: '', queues: [queue('wait-times'), queue('analytics')] }),
    quality: ok(quiet),
    ml: ok(ml()),
    contributions: ok({ pending: [] }),
    now: NOW,
    ...overrides,
  };
}

test('thresholds: more is worse above, less is worse below, nothing is unknown', () => {
  assert.equal(levelAbove(19, FEED_STALE_MINUTES), 'ok');
  assert.equal(levelAbove(20, FEED_STALE_MINUTES), 'warn');
  assert.equal(levelAbove(60, FEED_STALE_MINUTES), 'bad');
  assert.equal(levelAbove(null, FEED_STALE_MINUTES), 'unknown');
  assert.equal(levelBelow(15, WEATHER_DAYS_AHEAD), 'ok');
  assert.equal(levelBelow(6, WEATHER_DAYS_AHEAD), 'warn');
  assert.equal(levelBelow(0, WEATHER_DAYS_AHEAD), 'bad');
});

test('an unknown outranks ok and nothing else', () => {
  assert.equal(worstTone([]), 'ok');
  assert.equal(worstTone(['ok', 'unknown']), 'unknown');
  assert.equal(worstTone(['unknown', 'warn', 'ok']), 'warn');
  assert.equal(worstTone(['warn', 'bad']), 'bad');
});

test('minutes read as the admin says them', () => {
  assert.equal(minutesAgoLabel(0.4), 'gerade eben');
  assert.equal(minutesAgoLabel(2), 'vor 2 Min.');
  assert.equal(minutesAgoLabel(75), 'vor 1 Std.');
  assert.equal(minutesAgoLabel(3 * 24 * 60), 'vor 3 Tagen');
});

test('a quiet morning has every area green, no problem and no badge on the overview', () => {
  const health = deriveAdminHealth(sources());
  assert.deepEqual(
    health.areas.map((a) => [a.id, a.tone]),
    [
      ['server', 'ok'],
      ['feeds', 'ok'],
      ['queues', 'ok'],
      ['models', 'ok'],
      ['statistic', 'ok'],
      ['quality', 'ok'],
    ]
  );
  assert.equal(health.problems.length, 0);
  assert.equal(health.tone, 'ok');
  assert.equal(health.signals['/admin'], undefined);
  assert.deepEqual(health.signals['/admin/system'], { tone: 'ok' });
  assert.equal(health.areas.find((a) => a.id === 'feeds').figure.value, 'vor 2 Min.');
});

test('an open queue failure is a fault, sorts first and colours the overview badge', () => {
  const health = deriveAdminHealth(
    sources({
      queues: ok({
        timestamp: '',
        queues: [
          queue('wait-times', { failed: 4, failedOpen: 3 }),
          queue('analytics', { failed: 2, failedOpen: 0 }),
        ],
      }),
      contributions: ok({
        pending: [{ id: 'a', createdAt: '2026-11-03T09:00:00Z', name: 'Anna', photos: 3 }],
      }),
    })
  );
  assert.equal(health.problems[0].id, 'queues:failed');
  assert.equal(health.problems[0].tone, 'bad');
  assert.match(health.problems[0].title, /wait-times/);
  // A failure a later run made up for does not count.
  assert.doesNotMatch(health.problems[0].detail, /analytics/);
  assert.equal(health.problems[1].id, 'contributions:pending');
  assert.deepEqual(health.signals['/admin'], { tone: 'bad', count: 2 });
  assert.deepEqual(health.signals['/admin/queues'], { tone: 'bad' });
  assert.deepEqual(health.signals['/admin/contributions'], { tone: 'warn', count: 1 });
});

test('a stale feed and a stopped weather import are faults with their own button', () => {
  const health = deriveAdminHealth(
    sources({
      system: ok(
        system({
          freshness: {
            latestQueueTime: '2026-11-03T09:40:00Z',
            queueStaleMinutes: 80,
            queueRowsLastHour: 0,
            latestWeatherDate: '2026-11-02',
            weatherStaleHours: 30,
          },
        })
      ),
    })
  );
  const ids = health.problems.map((p) => p.id);
  assert.deepEqual(ids, ['feeds:stale', 'feeds:weather']);
  assert.match(health.problems[0].detail, /1 Std\. alt/);
  assert.equal(health.areas.find((a) => a.id === 'feeds').tone, 'bad');
});

test('the detectors ask their questions, and the sidebar counts every card', () => {
  const health = deriveAdminHealth(
    sources({
      quality: ok({
        windowDays: 14,
        silencedClusters: [
          {
            parkId: '1',
            parkName: 'Walibi Holland',
            attractionCount: 11,
            lastOperating: '2026-10-23',
            sampleNames: [],
          },
          {
            parkId: '2',
            parkName: 'Cedar Point',
            attractionCount: 10,
            lastOperating: '2026-10-30',
            sampleNames: [],
          },
        ],
        failingJobs: [
          {
            queue: 'live-cache-warmup',
            jobName: 'warmup-after-sync',
            failures: 1,
            lastReason: 'job stalled more than allowable limit',
            lastFailedAt: '2026-11-02T15:45:47Z',
          },
        ],
        absenceRetiredUnreviewed: [
          {
            attractionId: 'x',
            name: 'Asylum',
            slug: 'asylum',
            parkId: '3',
            parkName: 'Parque de Atracciones de Madrid',
            retiredAt: '2026-10-03',
            lastReading: null,
          },
        ],
      }),
    })
  );
  const silenced = health.problems.find((p) => p.id === 'quality:silenced');
  assert.equal(silenced.title, '2 Parks: 21 Bahnen gleichzeitig verstummt');
  assert.match(
    silenced.detail,
    /^Saisonende oder abgerissener Feed\? Walibi Holland \(11\), Cedar Point \(10\)$/
  );
  const job = health.problems.find((p) => p.id.startsWith('quality:job'));
  assert.equal(job.evidence, 'job stalled more than allowable limit');
  assert.equal(job.action, 'Stack in Queues ansehen');
  assert.deepEqual(health.signals['/admin/data-quality'], { tone: 'warn', count: 4 });
  assert.equal(health.tone, 'warn');
});

test('a late model is waiting work, a failed one a fault, a ready decision asks for one', () => {
  const health = deriveAdminHealth(
    sources({
      ml: ok(
        ml({
          components: [
            {
              id: 'pcn',
              name: 'PCN',
              delivers: 'Live-Wartezeiten',
              role: 'served',
              lastRunAt: null,
              expected: 'alle 15 Min.',
              status: 'failed',
              note: 'timeout',
            },
            {
              id: 'tft',
              name: 'TFT',
              delivers: 'Kalender',
              role: 'served',
              lastRunAt: null,
              expected: 'täglich',
              status: 'late',
              note: null,
            },
            {
              id: 'h5',
              name: 'H5',
              delivers: 'Profile',
              role: 'shadow',
              lastRunAt: null,
              expected: 'stündlich',
              status: 'warming',
              note: null,
            },
          ],
          decisions: [
            {
              id: 'd',
              title: 'Chronos statt PCN',
              detail: 'besser',
              state: 'ready',
              progress: null,
              earliest: null,
              cells: [],
            },
          ],
        })
      ),
    })
  );
  assert.deepEqual(
    health.problems.map((p) => [p.id, p.tone]),
    [
      ['models:pcn', 'bad'],
      ['models:tft', 'warn'],
      ['models:decision:d', 'warn'],
    ]
  );
  const models = health.areas.find((a) => a.id === 'models');
  assert.equal(models.tone, 'bad');
  assert.deepEqual(models.figure, { value: '0 von 2', label: 'in der App laufen' });
});

test('a statistic that falls behind is a fault', () => {
  const stats = {
    ...system().siteAnalytics,
    healthy: false,
    pendingWindows: 9,
    oldestPendingMinutes: 42,
  };
  const health = deriveAdminHealth(sources({ system: ok(system({ siteAnalytics: stats })) }));
  assert.equal(health.problems[0].id, 'statistic:behind');
  assert.match(
    health.problems[0].detail,
    /9 Fenster warten auf das Schreiben, das älteste seit 42 Min\./
  );
});

test('a forbidden source leaves its area out, a failed one keeps the row and offers to ask again', () => {
  const health = deriveAdminHealth(
    sources({ ml: { state: 'forbidden' }, queues: { state: 'failed', message: '502 Bad Gateway' } })
  );
  assert.ok(!health.areas.some((a) => a.id === 'models'));
  const queues = health.areas.find((a) => a.id === 'queues');
  assert.equal(queues.pending, 'failed');
  assert.equal(queues.tone, 'unknown');
  assert.equal(health.problems[0].retry, 'queues');
  assert.equal(health.problems[0].evidence, '502 Bad Gateway');
  // A row without an answer gives the sidebar no dot rather than a green one.
  assert.equal(health.signals['/admin/queues'], undefined);
});

test('a loading source keeps its row and raises nothing', () => {
  const health = deriveAdminHealth(sources({ system: { state: 'loading' } }));
  assert.deepEqual(
    health.areas.slice(0, 2).map((a) => [a.id, a.pending]),
    [
      ['server', 'loading'],
      ['feeds', 'loading'],
    ]
  );
  assert.equal(health.problems.length, 0);
});

console.log(`\n${passed} cases passed.`);
