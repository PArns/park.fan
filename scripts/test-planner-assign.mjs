/**
 * Unit tests for the trip assistant's park-to-day assignment (`lib/planner/assign.ts`), and for the
 * one field it adds to a stored plan (`PlannerDay.reserved`).
 *
 * The cases are the PO's decision on PAR-9, one each: the quietest free day wins, a tie keeps the
 * earlier day, `unknown` ranks behind every known level, `closed` is never proposed, a country is
 * a block with a free day at its edges, a plan's own days are never moved, and a park whose day is
 * `high` or worse is offered a second one. The last block reads a plan that was written before
 * `reserved` existed, which is the case that must not break.
 *
 * Run: pnpm test:planner-assignment
 */

import { assignParks, levelOn, windowDates } from '../lib/planner/assign.ts';
import { parsePlannerPayload } from '../lib/planner/store.ts';
import { hasAnyPlan, isPlannedDay } from '../lib/planner/types.ts';
import { clearDay, reserveDays } from '../lib/planner/actions.ts';
import { nextPlannedDay } from '../lib/planner/park-time.ts';

const cases = [];
const test = (name, actual, expected) => cases.push({ name, actual, expected });
const show = (result) => result.days.map((d) => `${d.date}:${d.parkSlug}${d.second ? '+' : ''}`);

/** A park with a forecast from `from`, one level per day; short lists leave the rest unknown. */
function park(slug, country, from, levels) {
  const map = new Map();
  levels.forEach((level, i) => {
    if (level !== undefined) map.set(windowDates(from, '2099-01-01').at(i), level);
  });
  return { slug, country, levels: map };
}
const base = { from: '2026-10-01', to: '2026-10-05', fixed: [], travelDays: true };

// ── 1. One park, one day: the quietest ──────────────────────────────────────
{
  const a = park('a', 'de', '2026-10-01', ['high', 'moderate', 'low', 'moderate', 'high']);
  test('the quietest free day', show(assignParks({ ...base, parks: [a] })), ['2026-10-03:a']);
}

// ── 2. A tie keeps the earlier day ──────────────────────────────────────────
{
  const a = park('a', 'de', '2026-10-01', ['low', 'low', 'low', 'low', 'low']);
  test('tie → earliest', show(assignParks({ ...base, parks: [a] })), ['2026-10-01:a']);
}

// ── 3. Two parks in one country take the two quietest days, not the same day ─
{
  const a = park('a', 'de', '2026-10-01', ['low', 'high', 'moderate', 'high', 'high']);
  const b = park('b', 'de', '2026-10-01', ['high', 'high', 'moderate', 'low', 'high']);
  const out = assignParks({ ...base, parks: [a, b] });
  // a is low on the 1st and b is low on the 4th. Same country, so no gap is needed.
  test('two parks, cheapest pair', show(out), ['2026-10-01:a', '2026-10-04:b']);
  test('nobody left over', out.unplaced, []);
}

// ── 4. unknown is not low ───────────────────────────────────────────────────
{
  const a = park('a', 'de', '2026-10-01', [
    'unknown',
    'unknown',
    'very_high',
    'unknown',
    'unknown',
  ]);
  const out = assignParks({ ...base, parks: [a] });
  test('a known very_high day beats days with no forecast', show(out), ['2026-10-03:a']);
  test('and it is very_high', out.days[0].level, 'very_high');
}
{
  const a = park('a', 'de', '2026-10-01', []);
  const out = assignParks({ ...base, parks: [a] });
  test('all-unknown: still placed, on the first day', show(out), ['2026-10-01:a']);
  test('all-unknown: the row says unknown', out.days[0].level, 'unknown');
  test('a date outside the snapshot reads unknown', levelOn(a, '2026-12-24'), 'unknown');
}

// ── 5. closed is never proposed ─────────────────────────────────────────────
{
  const a = park('a', 'de', '2026-10-01', ['closed', 'closed', 'closed', 'closed', 'closed']);
  const out = assignParks({ ...base, parks: [a] });
  test('a park shut all week gets no day', out.days, []);
  test('and is reported unplaced', out.unplaced, ['a']);
}

// ── 6. Country blocks and travel days ───────────────────────────────────────
{
  // Two German parks and one Dutch: every day is equally quiet, so only the rules place them.
  const flat = ['low', 'low', 'low', 'low', 'low', 'low', 'low'];
  const de1 = park('de1', 'de', '2026-10-01', flat);
  const nl = park('nl', 'nl', '2026-10-01', flat);
  const de2 = park('de2', 'de', '2026-10-01', flat);
  const win = { ...base, to: '2026-10-07' };
  const out = assignParks({ ...win, parks: [de1, nl, de2] });
  const order = out.days.map((d) => d.parkSlug);
  test('the two German parks are not split by the Dutch one', order.join(','), 'de1,de2,nl');
  const gap = out.days.at(1).date < out.days.at(2).date;
  test(
    'and a free day sits between the countries',
    out.days[1].date === '2026-10-02' && out.days[2].date === '2026-10-04',
    true
  );
  test('ordered by date', gap, true);

  const loose = assignParks({ ...win, travelDays: false, parks: [de1, nl, de2] });
  test('with travel days off the block stays, the gap goes', show(loose), [
    '2026-10-01:de1',
    '2026-10-02:de2',
    '2026-10-03:nl',
  ]);
}
{
  // Three days, three countries, needs two gaps: five days. Three days cannot hold it.
  const flat = ['low', 'low', 'low'];
  const out = assignParks({
    ...base,
    to: '2026-10-03',
    parks: [
      park('a', 'de', '2026-10-01', flat),
      park('b', 'nl', '2026-10-01', flat),
      park('c', 'fr', '2026-10-01', flat),
    ],
  });
  test('too few days for the gaps: fewer parks are placed', out.days.length, 2);
  test('and the one left over is named', out.unplaced.length, 1);
}

// ── 7. A plan's own days stay, and count for the gap ────────────────────────
{
  const a = park('a', 'de', '2026-10-01', ['low', 'low', 'low', 'low', 'low']);
  const out = assignParks({
    ...base,
    parks: [a],
    fixed: [{ date: '2026-10-01', country: 'de' }],
  });
  test('a fixed day is not offered again', show(out), ['2026-10-02:a']);
  const near = assignParks({
    ...base,
    parks: [a],
    fixed: [{ date: '2026-10-01', country: 'nl' }],
  });
  test('next to a fixed day of another country needs the gap', show(near), ['2026-10-03:a']);
  const before = assignParks({
    ...base,
    parks: [park('a', 'de', '2026-10-01', ['low', 'low', 'low', 'low', 'low'])],
    fixed: [{ date: '2026-10-02', country: 'nl' }],
  });
  test('and the gap holds on the other side too', show(before), ['2026-10-04:a']);
}

{
  const a = park('a', 'de', '2026-10-01', ['low', 'low', 'low', 'low', 'low']);
  const before = assignParks({
    ...base,
    parks: [a],
    fixed: [{ date: '2026-09-30', country: 'nl' }],
  });
  test('a fixed day of another country the day before the window needs the gap', show(before), [
    '2026-10-02:a',
  ]);
  const after = assignParks({
    ...base,
    parks: [a],
    fixed: [{ date: '2026-10-06', country: 'nl' }],
  });
  test('and the day after the window', show(after), ['2026-10-01:a']);
}
{
  const a = park('a', 'de', '2026-10-01', ['low', 'low', 'low', 'low', 'low']);
  const only = assignParks({
    ...base,
    to: '2026-10-02',
    parks: [a],
    fixed: [{ date: '2026-10-03', country: 'nl' }],
  });
  test('the last window day is refused beside a foreign fixed day', show(only), ['2026-10-01:a']);
}

// ── 8. A second day for a busy first day ────────────────────────────────────
{
  const a = park('a', 'de', '2026-10-01', [
    'very_high',
    'very_high',
    'high',
    'very_high',
    'very_high',
  ]);
  const out = assignParks({ ...base, parks: [a] });
  test(
    'busy first day gets a second, on the quieter neighbour',
    show(out),
    ['2026-10-02:a+', '2026-10-03:a'].sort()
  );
  test('the second is marked', out.days.filter((d) => d.second).length, 1);
}
{
  const a = park('a', 'de', '2026-10-01', ['low', 'low', 'low', 'low', 'low']);
  const out = assignParks({ ...base, parks: [a] });
  test('a quiet day gets no second day', out.days.length, 1);
}
{
  const a = park('a', 'de', '2026-10-01', ['closed', 'extreme', 'closed', undefined, undefined]);
  const out = assignParks({ ...base, parks: [a] });
  test('a closed or unforecast neighbour is never the second day', out.days.length, 1);
}
{
  // The neighbour is free, open and forecast, but it is the gap before the Dutch block.
  const a = park('a', 'de', '2026-10-01', ['low', 'extreme', 'low', 'low', 'low']);
  const out = assignParks({
    ...base,
    parks: [a],
    from: '2026-10-02',
    fixed: [{ date: '2026-10-04', country: 'nl' }],
  });
  test('a second day may not eat the gap', out.days.filter((d) => d.second).length, 0);
}

// ── 9. Limits ───────────────────────────────────────────────────────────────
{
  test('the window is capped', windowDates('2026-10-01', '2027-01-01').length, 31);
  test('an inverted window is empty', windowDates('2026-10-05', '2026-10-01'), []);
  const parks = Array.from({ length: 10 }, (_, i) => park(`p${i}`, 'de', '2026-10-01', ['low']));
  const out = assignParks({ ...base, from: '2026-10-01', to: '2026-10-31', parks });
  test('parks past the cap are reported, not searched', out.unplaced.slice(-2), ['p8', 'p9']);
}
{
  const t0 = Date.now();
  const countries = ['de', 'nl', 'fr', 'es'];
  const parks = Array.from({ length: 8 }, (_, i) =>
    park(
      `p${i}`,
      countries[i % 4],
      '2026-10-01',
      Array.from({ length: 31 }, (_, d) => ['low', 'moderate', 'high'][(i + d) % 3])
    )
  );
  const out = assignParks({ ...base, to: '2026-10-31', parks });
  test('eight parks in four countries over 31 days place every park', out.unplaced, []);
  test('and finish quickly', Date.now() - t0 < 5000, true);
}

// ── 9b. reserveDays ─────────────────────────────────────────────────────────
{
  const geo = { continent: 'europe', country: 'germany', city: 'x' };
  const entry = { id: 'e', attractionSlug: 'r', attractionName: 'R', startMinute: 600, hour: 10 };
  const state = {
    parks: {
      a: {
        slug: 'a',
        name: 'A',
        geo,
        days: { '2026-10-01': { date: '2026-10-01', entries: [entry], prefs: { avoidWet: true } } },
      },
    },
    activeParkSlug: null,
    activeDate: null,
    version: 1,
  };
  const next = reserveDays(state, [
    { park: { slug: 'a', name: 'A', geo }, date: '2026-10-01' },
    { park: { slug: 'a', name: 'A', geo }, date: '2026-10-02' },
    { park: { slug: 'b', name: 'B', geo }, date: '2026-10-03' },
  ]);
  test(
    'a day with entries is left alone',
    next.parks.a.days['2026-10-01'],
    state.parks.a.days['2026-10-01']
  );
  test(
    'a new day is reserved and empty',
    [next.parks.a.days['2026-10-02'].reserved, next.parks.a.days['2026-10-02'].entries],
    [true, []]
  );
  test('a new park is filed', next.parks.b.days['2026-10-03'].reserved, true);
  test('the active day does not move', next.activeParkSlug, null);
  const cleared = clearDay(next, 'b', '2026-10-03');
  test('clearing a reserved day removes it', cleared.parks.b, undefined);
}

// ── 10. `reserved` on a stored plan ─────────────────────────────────────────
{
  const old = JSON.stringify({
    payload: {
      parks: {
        a: {
          slug: 'a',
          name: 'A',
          geo: { continent: 'europe', country: 'germany', city: 'x' },
          days: { '2026-10-01': { date: '2026-10-01', entries: [] } },
        },
      },
      version: 3,
    },
  });
  const plan = parsePlannerPayload(old);
  const day = plan.parks.a.days['2026-10-01'];
  test('a plan without the field still reads', day.entries, []);
  test('and its empty day is not a planned day', isPlannedDay(day), false);
  test('so it does not make a plan', hasAnyPlan(plan), false);

  const fresh = parsePlannerPayload(
    JSON.stringify({
      payload: {
        parks: {
          a: {
            slug: 'a',
            name: 'A',
            geo: { continent: 'europe', country: 'germany', city: 'x' },
            days: {
              '2026-10-01': { date: '2026-10-01', entries: [], reserved: true },
              '2026-10-02': { date: '2026-10-02', entries: [], reserved: 'yes' },
            },
          },
        },
        version: 4,
      },
    })
  );
  test('reserved survives the parser', fresh.parks.a.days['2026-10-01'].reserved, true);
  test('only a real true does', fresh.parks.a.days['2026-10-02'].reserved, undefined);
  test('a reserved day is a planned day', isPlannedDay(fresh.parks.a.days['2026-10-01']), true);
  test('and makes a plan', hasAnyPlan(fresh), true);
  const next = nextPlannedDay(fresh, Date.parse('2026-09-29T12:00:00Z'));
  test('and the countdown counts to it', next && next.date, '2026-10-01');
  const none = nextPlannedDay(plan, Date.parse('2026-09-29T12:00:00Z'));
  test('an opened empty day is still no countdown', none, null);
}

// ── Report ───────────────────────────────────────────────────────────────────
let failed = 0;
for (const { name, actual, expected } of cases) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(
    `${ok ? '✅' : '❌'} ${name}${ok ? '' : ` — erwartet ${JSON.stringify(expected)}, bekommen ${JSON.stringify(actual)}`}`
  );
}
console.log(`\n${cases.length - failed}/${cases.length} bestanden`);
process.exit(failed === 0 ? 0 : 1);
