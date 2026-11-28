/**
 * Unit tests for `parkGeoSegments` (`lib/admin/park-geo-path.ts`), the `?path=` guard of the admin
 * routes that read a park by its geo path: the API's, the site's and the bare spelling name one
 * park, and anything but four slugs is refused before it reaches a backend URL.
 *
 * Run: `pnpm test:admin-park-geo-path`
 */
import assert from 'node:assert/strict';
import { parkGeoSegments } from '../lib/admin/park-geo-path.ts';
import { reportPassed, test } from './lib/run-cases.mjs';

const park = ['europe', 'germany', 'bruehl', 'phantasialand'];

test('the API, site and bare spellings name the same park', () => {
  for (const raw of [
    '/v1/parks/europe/germany/bruehl/phantasialand',
    '/parks/europe/germany/bruehl/phantasialand',
    'europe/germany/bruehl/phantasialand',
    'europe/germany/bruehl/phantasialand/',
  ]) {
    assert.deepEqual(parkGeoSegments(raw), park, raw);
  }
});

test('no path, a short or a long one is refused', () => {
  assert.equal(parkGeoSegments(null), null);
  assert.equal(parkGeoSegments(''), null);
  assert.equal(parkGeoSegments('europe/germany/bruehl'), null);
  assert.equal(parkGeoSegments('europe/germany/bruehl/phantasialand/taron'), null);
});

test('a segment that is not a slug is refused', () => {
  assert.equal(parkGeoSegments('europe/germany/..%2F/phantasialand'), null);
  assert.equal(parkGeoSegments('europe/germany/Bruehl/phantasialand'), null);
  assert.equal(parkGeoSegments('europe/germany/bruehl/phantasia land'), null);
  assert.equal(parkGeoSegments('europe/germany/bruehl/phantasialand?x=1'), null);
});

reportPassed();
