// The weather card marks gusts and visibility only above the named thresholds, and only in the
// steps whose slot has not passed. A calm window must come back empty so the card draws nothing.
import assert from 'node:assert/strict';
import {
  LOW_VISIBILITY_M,
  NOTABLE_GUST_KMH,
  nowcastOutlook,
} from '../lib/utils/nowcast-conditions.ts';

const TZ = 'Europe/Berlin';
// 12:07 Berlin (summer time) is 10:07Z; the 12:00 slot is still running, 11:45 has passed.
const OBSERVED_AT = '2026-07-14T10:07:00.000Z';

function step(time, windGusts, visibility) {
  return {
    time,
    precipitation: 0,
    precipitationProbability: 0,
    snowfall: 0,
    weatherCode: 0,
    windSpeed: 10,
    windDirection: 180,
    windGusts,
    visibility,
  };
}

const times = ['11:45', '12:00', '12:15', '12:30', '12:45'].map((h) => `2026-07-14T${h}`);

let runs = 0;
const check = (name, fn) => {
  fn();
  runs += 1;
  console.log(`ok  ${name}`);
};

check('a calm window has neither gust nor visibility', () => {
  const o = nowcastOutlook(
    times.map((t) => step(t, 20, 24000)),
    OBSERVED_AT,
    TZ
  );
  assert.equal(o.gust, null);
  assert.equal(o.visibility, null);
});

check('slots that have passed are dropped, the running one stays', () => {
  const o = nowcastOutlook(
    times.map((t) => step(t, 20, 24000)),
    OBSERVED_AT,
    TZ
  );
  assert.equal(o.steps.length, 4);
  assert.equal(o.steps[0].time, '2026-07-14T12:00');
});

check('a gust that passed does not count', () => {
  const o = nowcastOutlook(
    times.map((t, i) => step(t, i === 0 ? 90 : 20, 24000)),
    OBSERVED_AT,
    TZ
  );
  assert.equal(o.gust, null);
});

check('the strongest gust wins and sits at its own time', () => {
  const o = nowcastOutlook(
    times.map((t, i) => step(t, [10, 55, 72, 61, 30][i], 24000)),
    OBSERVED_AT,
    TZ
  );
  assert.deepEqual(o.gust, { kmh: 72, time: '2026-07-14T12:15' });
});

check('the gust threshold is inclusive, the visibility threshold is not', () => {
  const edge = nowcastOutlook(
    times.map((t) => step(t, NOTABLE_GUST_KMH, LOW_VISIBILITY_M)),
    OBSERVED_AT,
    TZ
  );
  assert.equal(edge.gust?.kmh, NOTABLE_GUST_KMH);
  assert.equal(edge.visibility, null);
});

check('the lowest visibility wins; null readings are skipped', () => {
  const o = nowcastOutlook(
    times.map((t, i) => step(t, null, [null, 900, 240, null, 500][i])),
    OBSERVED_AT,
    TZ
  );
  assert.deepEqual(o.visibility, { meters: 240, time: '2026-07-14T12:15' });
  assert.equal(o.gust, null);
});

console.log(`\n${runs} checks passed`);
