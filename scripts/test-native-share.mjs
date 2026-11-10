/**
 * Unit tests for `lib/utils/native-share.ts`, the system share sheet behind the share row and the
 * planner's share link: how each ending of `navigator.share` is reported, and that a browser
 * without one is told to copy the link instead.
 *
 * Run: pnpm test:native-share
 */
import assert from 'node:assert/strict';
import { canShareNatively, shareNatively } from '../lib/utils/native-share.ts';

let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

/** Puts a `navigator` with the given `share` (or none) on the global object. */
function withShare(share) {
  Object.defineProperty(globalThis, 'navigator', {
    value: share === undefined ? {} : { share },
    configurable: true,
    writable: true,
  });
}

await test('a browser without navigator.share has no sheet and is told to copy', async () => {
  withShare(undefined);
  assert.equal(canShareNatively(), false);
  assert.equal(await shareNatively({ url: 'https://park.fan/de' }), 'unavailable');
});

await test('a picked target is shared, with the data passed through', async () => {
  const calls = [];
  withShare(async (data) => {
    calls.push(data);
  });
  assert.equal(canShareNatively(), true);
  const data = { title: 'Phantasialand', url: 'https://park.fan/de/parks/europe/germany' };
  assert.equal(await shareNatively(data), 'shared');
  assert.deepEqual(calls, [data]);
});

await test('closing the sheet is dismissed, and nothing is copied', async () => {
  withShare(async () => {
    throw new DOMException('Share canceled', 'AbortError');
  });
  assert.equal(await shareNatively({ url: 'https://park.fan/de' }), 'dismissed');
});

await test('any other refusal is unavailable, so the caller copies the link', async () => {
  for (const error of [
    new DOMException('Not allowed', 'NotAllowedError'),
    new TypeError('Invalid share data'),
  ]) {
    withShare(async () => {
      throw error;
    });
    assert.equal(await shareNatively({ url: 'https://park.fan/de' }), 'unavailable', error.name);
  }
});

console.log(`\n${passed} cases passed.`);
