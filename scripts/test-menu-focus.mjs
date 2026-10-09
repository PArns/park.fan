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
 * the alternative is a browser to assert one boolean in. What the rule does NOT decide is what
 * closes the band instead — `onPointerLeave`, the outside `pointerdown` and Escape, all three in
 * `useMenuTrigger` and all three measured in a real browser rather than here.
 *
 * Run: pnpm test:menu-focus
 */

import { escapeRefocusesTrigger, focusLeftMenu, holdsTextEntry } from '../lib/utils/menu-focus.ts';

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

// ── Escape: where the focus goes after the band closes (PAR-77) ──────────────
// Escape always closes the band; the trigger only gets the focus back when the focus was in the
// band or nowhere. A field elsewhere on the page keeps it, because a band also opens on hover.
const body = { name: 'body' };
const html = { name: 'html' };
const nowhere = [body, html];
test(
  'Escape with the focus in the band refocuses the trigger',
  escapeRefocusesTrigger(root, inside, nowhere),
  true
);
test(
  'Escape with the focus on <body> refocuses the trigger',
  escapeRefocusesTrigger(root, body, nowhere),
  true
);
test(
  'Escape with the focus on <html> refocuses the trigger',
  escapeRefocusesTrigger(root, html, nowhere),
  true
);
test(
  'Escape with no active element refocuses the trigger',
  escapeRefocusesTrigger(root, null, nowhere),
  true
);
test(
  'Escape with the focus in a field elsewhere leaves it there',
  escapeRefocusesTrigger(root, outside, nowhere),
  false
);

// ── Leaving for the page while typing: the guides panel's search field ───────
// A pointer that drifts off the band mid-word must not throw the query away. Only a text field
// holds it: a focused link or button in the band closes on leave as before.
const field = { tagName: 'INPUT' };
const link = { tagName: 'A' };
const fieldRoot = { contains: (node) => node === fieldRoot || node === field || node === link };
const fieldElsewhere = { tagName: 'INPUT' };
test('a field in the band holds it open', holdsTextEntry(fieldRoot, field), true);
test('a link in the band does not', holdsTextEntry(fieldRoot, link), false);
test('a field elsewhere on the page does not', holdsTextEntry(fieldRoot, fieldElsewhere), false);
test('no focus does not', holdsTextEntry(fieldRoot, null), false);

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
