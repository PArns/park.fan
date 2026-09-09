/**
 * Unit tests for `isUuid` (`lib/utils.ts`) — the guard `attraction-card.tsx`
 * uses before rendering `RideAlertBell`, since a blog fallback card's id is
 * `attractionSlug`, not a UUID, and `POST /push/ride-alerts` 400s on that.
 *
 * Run: `pnpm test:is-uuid`
 */
import assert from 'node:assert/strict';
import { isUuid } from '../lib/utils.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

test('accepts a real UUID', () => {
  assert.equal(isUuid('a1b2c3d4-e5f6-4789-a012-3456789abcde'), true);
});

test('is case-insensitive, since a UUID may arrive upper-cased', () => {
  assert.equal(isUuid('A1B2C3D4-E5F6-4789-A012-3456789ABCDE'), true);
});

test('refuses the slug a blog fallback card substitutes for the id', () => {
  assert.equal(isUuid('taron'), false);
  assert.equal(isUuid('winjas-fear'), false);
});

test('refuses an empty string, not the same as no id at all but still not a UUID', () => {
  assert.equal(isUuid(''), false);
});

test('refuses a UUID missing a hyphen or with the wrong segment lengths', () => {
  assert.equal(isUuid('a1b2c3d4e5f64789a0123456789abcde'), false);
  assert.equal(isUuid('a1b2c3d-e5f6-4789-a012-3456789abcde'), false);
});

console.log(`\n${passed} assertions passed.`);
