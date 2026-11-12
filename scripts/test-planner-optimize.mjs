/**
 * The day optimiser in the browser: the gates that decide whether its buttons are drawn, and the
 * request that asks the API.
 *
 * The search runs in the API (`POST …/plan/optimize`), and its checks are there: the brute force
 * over every order, the lunch break, the clock, the headliner that has to stay in and the rest are
 * `src/planner/day-optimizer/optimize.vectors.spec.ts`, and `browser-parity.spec.ts` holds the
 * port to answers recorded from this repo's engine. What these checks pin is that a button appears
 * where a press can mean something, and that a press sends the day as the API reads it.
 *
 *     pnpm test:planner-optimize
 */

import { buildDayGrid } from '../lib/planner/day-grid.ts';
import {
  canOptimize,
  headlinersSkipped,
  headlinersToAdd,
  movableEntries,
} from '../lib/planner/optimize.ts';
import {
  OptimizeError,
  optimizeKeyOf,
  requestOptimize,
  wishesWithRides,
} from '../lib/planner/optimize-remote.ts';
import { fitChoiceAll, toggleWish } from '../lib/planner/fit.ts';

let passed = 0;
const failures = [];
function check(name, ok, detail = '') {
  if (ok) {
    passed++;
    console.log(`✅ ${name}`);
  } else {
    failures.push(name);
    console.log(`❌ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function ride(slug, options = {}) {
  const hours = [];
  for (let hour = 9; hour <= 21; hour++) hours.push({ hour, wait: options.wait ?? 20 });
  return {
    attractionSlug: slug,
    attractionName: slug,
    hours,
    dayPeak: options.wait ?? 20,
    sampleDays: 90,
    latitude: 50.8,
    longitude: 6.87,
    land: 'X',
    uncertaintyMinutes: null,
    opensAt: null,
    isHeadliner: options.headliner ?? false,
    minimumHeight: options.minimumHeight,
    mayGetWet: options.mayGetWet,
  };
}

function day(rides, context = {}) {
  return {
    parkSlug: 'test-park',
    timezone: 'Europe/Berlin',
    tier: 'measured',
    leadDays: 1,
    rides,
    shows: [],
    context: { date: '2026-09-05', status: 'OPERATING', openHour: 9, closeHour: 21, ...context },
  };
}

const entry = (id, slug, startMinute, extra = {}) => ({
  id,
  attractionSlug: slug,
  attractionName: slug,
  startMinute,
  ...extra,
});
const grid = (payload) => buildDayGrid(payload.context.openHour, payload.context.closeHour);

// ── The headliner button, and who it leaves out ─────────────────────────────
{
  const payload = day([
    ride('big-1', { headliner: true, minimumHeight: 140 }),
    ride('big-2', { headliner: true, mayGetWet: true }),
    ride('big-3', { headliner: true }),
    ride('small'),
  ]);
  const entries = [entry('small-1', 'small', 10 * 60)];
  check(
    'ohne Angaben zur Gruppe kommen alle Headliner infrage',
    headlinersToAdd(payload, entries, undefined).length === 3
  );
  const withChild = headlinersToAdd(payload, entries, { riderHeightCm: 120, avoidWet: true });
  check(
    'zu klein und nass fallen nach dem Filter raus',
    withChild.length === 1 && withChild[0].attractionSlug === 'big-3',
    withChild.map((r) => r.attractionSlug).join(', ')
  );
  check(
    'und die Übersprungenen werden gezählt',
    headlinersSkipped(payload, entries, { riderHeightCm: 120, avoidWet: true }) === 2
  );
  check(
    'ein Headliner, der schon im Tag ist, wird nicht noch einmal angeboten',
    headlinersToAdd(payload, [entry('b', 'big-3', 600)], undefined).every(
      (r) => r.attractionSlug !== 'big-3'
    )
  );
}

// ── A park nobody can read gets no button ───────────────────────────────────
{
  const unread = day([ride('a'), ride('b')], {
    liveWaitTimes: { available: false, reason: 'app-only' },
  });
  check(
    'ein Park ohne lesbare Wartezeiten wird nicht optimiert',
    !canOptimize(unread, grid(unread))
  );
  const readable = day([ride('a'), ride('b')]);
  check('ein Park mit Wartezeiten schon', canOptimize(readable, grid(readable)));
  check('ohne Achse nicht', !canOptimize(readable, null));
  check('ohne Bahnen nicht', !canOptimize(day([]), grid(day([]))));
}

// ── What a press may move ───────────────────────────────────────────────────
{
  const payload = {
    ...day([ride('a'), ride('b')]),
    ridesInWorks: [
      {
        attractionSlug: 'shut',
        attractionName: 'shut',
        worksPeriod: { from: '2026-09-01', to: '2026-09-30', toUncertain: false },
      },
    ],
  };
  const entries = [
    entry('a-1', 'a', 15 * 60),
    entry('shut-1', 'shut', 10 * 60),
    entry('b-1', 'b', 11 * 60),
    entry('done', 'a', 9 * 60, { done: true }),
    {
      id: 'lunch',
      custom: { label: 'Essen', icon: 'food', durationMinutes: 60 },
      startMinute: 780,
    },
  ];
  check(
    'Wartung, Abgehaktes und freie Blöcke sind nicht verschiebbar',
    movableEntries(entries, undefined, payload)
      .map((e) => e.id)
      .join(',') === 'a-1,b-1'
  );
  check(
    'eine Bahn, deren Zeit schon läuft, auch nicht',
    movableEntries(entries, { phase: 'today', nowMinute: 11 * 60 + 5 }, payload)
      .map((e) => e.id)
      .join(',') === 'a-1'
  );
}

// ── The request ─────────────────────────────────────────────────────────────

/** Runs `read` with `fetch` answering `respond(url, init)`, and hands back what was sent. */
async function withFetch(respond, read) {
  const saved = globalThis.fetch;
  const sent = [];
  globalThis.fetch = async (url, init) => {
    sent.push({ url: String(url), init, body: init?.body ? JSON.parse(init.body) : undefined });
    return respond(url, init);
  };
  try {
    return { result: await read().catch((error) => error), sent };
  } finally {
    globalThis.fetch = saved;
  }
}

const target = {
  geo: { continent: 'europe', country: 'germany', city: 'bruehl' },
  parkSlug: 'phantasialand',
  date: '2099-07-01',
  timezone: 'Europe/Berlin',
};
const ok = (body) => new Response(JSON.stringify(body), { status: 200 });

{
  const { result, sent } = await withFetch(
    () => ok({ status: 'unchanged' }),
    () =>
      requestOptimize(target, {
        mode: 'fit',
        entries: [entry('a-1', 'a', 600, { hour: 10 })],
        prefs: { riderHeightCm: 110, avoidWet: false, earlyEntry: true },
        add: ['taron'],
        choice: toggleWish(fitChoiceAll(), 'e:a-1'),
        levers: true,
      })
  );
  const body = sent[0]?.body ?? {};
  check(
    'die Anfrage geht an das Relais des Parks',
    sent[0]?.url === '/api/parks/europe/germany/bruehl/phantasialand/plan/optimize' &&
      sent[0]?.init?.method === 'POST',
    sent[0]?.url
  );
  check('die Antwort kommt durch', result?.status === 'unchanged');
  check(
    'der Tag geht ohne den veralteten Stundenspiegel',
    body.entries?.length === 1 && !('hour' in body.entries[0]),
    JSON.stringify(body.entries)
  );
  check(
    'die Wahl geht als Listen',
    JSON.stringify(body.choice) ===
      JSON.stringify({ dropped: ['e:a-1'], droppedBlocks: [], shortBlocks: [], priority: [] })
  );
  check('ein Tag in der Zukunft schickt keine Uhrzeit', !('nowMinute' in body));
  check(
    'und alles andere wie gefragt',
    body.mode === 'fit' && body.date === '2099-07-01' && body.add?.[0] === 'taron' && body.levers
  );
}

{
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
  const { sent } = await withFetch(
    () => ok({ status: 'unchanged' }),
    () => requestOptimize({ ...target, date: today }, { mode: 'day', entries: [] })
  );
  const minute = sent[0]?.body?.nowMinute;
  check(
    'heute geht die Minute des Parks mit',
    Number.isInteger(minute) && minute >= 0 && minute < 1440,
    String(minute)
  );
  const { sent: pinned } = await withFetch(
    () => ok({ status: 'unchanged' }),
    () => requestOptimize({ ...target, date: today }, { mode: 'day', entries: [], nowMinute: 600 })
  );
  check('eine gehaltene Minute geht so mit', pinned[0]?.body?.nowMinute === 600);
}

{
  const { result } = await withFetch(
    () => new Response('{}', { status: 503 }),
    () => requestOptimize(target, { mode: 'day', entries: [] })
  );
  check(
    'eine Fehlerantwort wird ein OptimizeError mit ihrem Status',
    result instanceof OptimizeError && result.status === 503
  );
  const { result: offline } = await withFetch(
    () => {
      throw new TypeError('network');
    },
    () => requestOptimize(target, { mode: 'day', entries: [] })
  );
  check('ohne Netz Status 0', offline instanceof OptimizeError && offline.status === 0);
}

{
  // The API leaves every null field out of its JSON.
  const { result } = await withFetch(
    () =>
      ok({
        status: 'optimized',
        plan: {
          stops: [
            { attractionSlug: 'taron', attractionName: 'Taron', startMinute: 600, fits: true },
          ],
          totalWaitMinutes: 0,
          idleMinutes: 0,
          endMinute: 615,
          overflow: 0,
          capped: 0,
        },
      }),
    () => requestOptimize(target, { mode: 'headliners', entries: [] })
  );
  check(
    'ein Stopp ohne entryId ist eine neue Bahn, mit null wie im Typ',
    result.plan.stops[0].entryId === null && result.plan.stops[0].waitMinutes === null
  );
  check('fehlende Felder werden null', result.before === null && result.fit === null);
}

// ── What makes a new question ───────────────────────────────────────────────
{
  const block = (label) => ({
    id: 'b',
    custom: { label, icon: 'food', durationMinutes: 60 },
    startMinute: 780,
  });
  check(
    'ein neuer Name für einen Block ist keine neue Frage',
    optimizeKeyOf([block('Essen')]) === optimizeKeyOf([block('Mittag')])
  );
  check(
    'eine neue Länge schon',
    optimizeKeyOf([block('Essen')]) !==
      optimizeKeyOf([
        { ...block('Essen'), custom: { ...block('Essen').custom, durationMinutes: 30 } },
      ])
  );
  check(
    'ein Häkchen auch',
    optimizeKeyOf([entry('a', 'a', 600)]) !== optimizeKeyOf([entry('a', 'a', 600, { done: true })])
  );
}

{
  const payload = day([ride('a', { wait: 35 })]);
  const joined = wishesWithRides(
    [
      {
        key: 'a:a',
        entryId: null,
        attractionSlug: 'a',
        attractionName: 'a',
        headliner: false,
        replannable: true,
      },
      {
        key: 'a:x',
        entryId: null,
        attractionSlug: 'x',
        attractionName: 'x',
        headliner: false,
        replannable: true,
      },
    ],
    payload
  );
  check(
    'die Wünsche bekommen ihre Zeile aus dem Tag zurück',
    joined[0].ride?.dayPeak === 35 && joined[1].ride === null
  );
}

console.log(`\n${passed}/${passed + failures.length} bestanden`);
if (failures.length > 0) {
  console.log(failures.map((f) => `  · ${f}`).join('\n'));
  process.exit(1);
}
