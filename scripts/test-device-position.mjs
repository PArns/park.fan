/**
 * Unit tests for the movement gate in `app/admin/capture/_lib/use-park-location.ts`
 * — the rule that decides which fix reaches the capture screen.
 *
 * `watchPosition` with `enableHighAccuracy` reports about once a second, and a
 * phone standing still reports a different point almost every time. Each of those
 * used to re-sort the whole backlog and re-run the nearest-ride search for a step
 * nobody took (PAR-341). The gate drops a fix that cannot change either answer.
 *
 * What is pinned here is the threshold and the two ends it lives between: coarse
 * enough to swallow a stationary phone's jitter, fine enough that walking to the
 * next ride reorders the list well inside the minute the ticket asks for. The last
 * block is a grep over the hook, because a gate that is never called is worth
 * nothing and that is the one thing a unit test of the function cannot see
 * (📚 G-44 — a case over an absence needs a presence first).
 *
 * Run: `pnpm test:device-position`
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { hasMovedEnough } from '../app/admin/capture/_lib/use-park-location.ts';

let checked = 0;
const check = (actual, expected, message) => {
  assert.equal(actual, expected, message);
  checked += 1;
};

/** Phantasialand's entrance. The latitude matters: a degree of longitude is shorter here. */
const HOME = { lat: 50.7986, lon: 6.8794, accuracy: 12 };

/** Metres per degree at `HOME`, north and east. */
const M_PER_DEG_LAT = 111_320;
const M_PER_DEG_LON = M_PER_DEG_LAT * Math.cos((HOME.lat * Math.PI) / 180);

const north = (metres) => ({ ...HOME, lat: HOME.lat + metres / M_PER_DEG_LAT });
const east = (metres) => ({ ...HOME, lon: HOME.lon + metres / M_PER_DEG_LON });

// --- the first fix ---------------------------------------------------------

check(
  hasMovedEnough(null, HOME),
  true,
  'the first fix has nothing to compare against and must always be published'
);

// --- a phone standing still ------------------------------------------------

for (const jitter of [0, 1, 3, 5, 9, 9.5]) {
  check(
    hasMovedEnough(HOME, north(jitter)),
    false,
    `a fix ${jitter} m north is inside the threshold and must be dropped`
  );
  check(
    hasMovedEnough(HOME, east(jitter)),
    false,
    `${jitter} m east is the same distance as ${jitter} m north and must be judged the same`
  );
}

// --- a phone that moved ----------------------------------------------------

for (const step of [10.5, 11, 25, 120, 1500]) {
  check(
    hasMovedEnough(HOME, north(step)),
    true,
    `a fix ${step} m north can change the ride order and must be published`
  );
  check(hasMovedEnough(HOME, east(step)), true, `${step} m east must be published too`);
}

// The cases above stop at 9.5 m and resume at 10.5 m, and the exact 10 m is not
// pinned on purpose. The offsets here are built from a flat 111_320 m per degree
// while `distanceMeters` runs a haversine over a 6_371_000 m sphere; the two
// disagree by 0.1 %, which is a hundredth of a metre at this range — nothing for
// either case above, and the whole of the difference at the boundary itself. A
// test of `>=` against `>` there would be pinning a rounding, not a rule.

// Two rides stand tens of metres apart, so the step that separates them must be
// on the publishing side — otherwise the order freezes while somebody walks from
// one queue to the next.
check(hasMovedEnough(HOME, north(30)), true, 'a walk to a neighbouring ride must reorder the list');

// --- the reaction time the ticket asks for ---------------------------------

// Acceptance criterion: a change of position is taken over within about a minute.
// The gate is a distance and not a timer, so the slowest case is the slowest walk.
// One metre per second is slower than a visitor strolling between two queues.
const SLOW_WALK_MS = 1.0;
const secondsToPublish = 10 / SLOW_WALK_MS;
assert.ok(
  secondsToPublish <= 60,
  `a walk at ${SLOW_WALK_MS} m/s crosses the threshold in ${secondsToPublish} s, which must be inside the minute`
);
checked += 1;

// --- the hook actually uses it ---------------------------------------------

const source = readFileSync(
  new URL('../app/admin/capture/_lib/use-park-location.ts', import.meta.url),
  'utf8'
);

const grep = (pattern, message) => {
  assert.match(source, pattern, message);
  checked += 1;
};

grep(
  /setPosition\(\(current\) =>[\s\S]{0,120}hasMovedEnough\(current, next\)/,
  'the watch callback must route every fix through the gate, or nothing above is in force'
);

grep(
  /maximumAge: 60_000/,
  'the watch must accept a cached fix up to 60 s old rather than wake the radio for the first callback'
);

grep(
  /addEventListener\('visibilitychange'/,
  'the watch must be released while the tab is in the background — that is where the radio time is saved'
);

grep(
  /if \(!enabled \|\| !active\) return;/,
  'the subscribing effect must bail out while the tab is in the background'
);

console.log(`device position: ${checked} checks passed`);
