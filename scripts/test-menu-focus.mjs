/**
 * Unit tests for the header menu's blur rule (`lib/utils/menu-focus.ts`).
 *
 * The rule guards a fault that is invisible from the outside: the favorites band closed itself
 * when a remove button inside it went `disabled` while holding the focus, because a blur to
 * nothing (`relatedTarget = null`) went through `!root.contains(next)` as a blur to somewhere
 * outside. What a visitor saw was a menu that swallowed one alert per opening and hid the proof
 * that the removal had worked.
 *
 * A DOM node here is any object with `contains` — that is the whole surface the rule touches, and
 * the alternative is a browser to assert one boolean in.
 *
 * Run: pnpm test:menu-focus
 */

import { focusLeftMenu } from '../lib/utils/menu-focus.ts';

const cases = [];
const test = (name, actual, expected) => cases.push({ name, actual, expected });

/** A menu wrapper holding `inside`; anything else counts as outside it. */
const inside = { name: 'a link in the band' };
const root = { contains: (node) => node === root || node === inside };
const outside = { name: 'a link in the page' };

// ── The fault this exists for ────────────────────────────────────────────────
// The remove button sets `disabled` for the length of its own DELETE. A focused element that
// becomes disabled loses the focus to NOTHING, and `contains(null)` is false.
test('a blur that goes nowhere did not leave the menu', focusLeftMenu(root, null), false);

// ── What still has to close it ───────────────────────────────────────────────
test('focus moving into the page left the menu', focusLeftMenu(root, outside), true);

// ── What must not close it ───────────────────────────────────────────────────
// Moving between two controls inside the band — the X of one row to the X of the next — raises a
// blur on each hop, and every one of them stays in.
test('focus moving within the menu stayed', focusLeftMenu(root, inside), false);
test('focus landing on the wrapper itself stayed', focusLeftMenu(root, root), false);

// ---------------------------------------------------------------------------

console.log('\n🧪 Menu focus rule\n');
console.log('='.repeat(80) + '\n');

let passed = 0;
let failed = 0;
for (const testCase of cases) {
  if (testCase.actual === testCase.expected) {
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(testCase.actual)}`);
    failed++;
  }
}

console.log('='.repeat(80));
console.log(`\n📊 Results: ${passed}/${cases.length} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
