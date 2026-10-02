/**
 * `ChapterPanel`'s body padding comes off when a call site asks for that, at every width.
 *
 * The default is `p-4 @min-[768px]/page:p-6`. A `p-0` in `bodyClassName` cannot cancel it:
 * `twMerge('p-4 @min-[768px]/page:p-6', 'p-0')` drops only the unprefixed `p-4` and keeps the
 * container variant, so a body that asked for no padding still had 24 px of it from a 768 px
 * container up, and a `PanelGrid`'s trailing hairlines stood inside the box with 24 px of nothing
 * under them (PAR-135). That is why the component has `bodyPadding="none"`. Nothing else notices
 * when someone swaps the prop back for a class: lint, `tsc` and the build all stay green.
 *
 * So this reads the padding classes and the `cn(…)` order from the component's source, rebuilds
 * the body's class list with the real `cn`, and pins it for three cases: `bodyPadding="none"`,
 * the default, and `RideProfileSection`'s own `p-5 sm:p-6`. Then it reads every `<ChapterPanel`
 * call in `components/` and `app/` and checks the class list each one produces. Text, not an
 * import: the component is TSX, and what is checked is the class list, which the source says
 * literally.
 *
 * Pure local data, no server, no network. Run: pnpm test:chapter-panel-padding
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { cn } from '../lib/utils.ts';

const COMPONENT = 'components/common/chapter-panel.tsx';
const RIDE_PROFILE = 'components/parks/ride-profile-section.tsx';

let failures = 0;
let checks = 0;

function check(name, fn) {
  checks++;
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (error) {
    failures++;
    console.error(`  FAIL ${name}\n       ${error.message.split('\n').join('\n       ')}`);
  }
}

// --- What the component says --------------------------------------------------------------------

const source = readFileSync(COMPONENT, 'utf8');

const defaultMatch = source.match(/bodyPadding\s*===\s*'default'\s*&&\s*'([^']+)'/);
assert.ok(defaultMatch, `${COMPONENT}: no \`bodyPadding === 'default' && '…'\` in the body's cn()`);
const DEFAULT_PADDING = defaultMatch[1];

const fallbackMatch = source.match(/bodyPadding\s*=\s*'(default|none)'/);
assert.ok(fallbackMatch, `${COMPONENT}: no default value for bodyPadding in the signature`);
const BODY_PADDING_FALLBACK = fallbackMatch[1];

// `bodyClassName` has to come after the default in the same cn() call, or it cannot override it.
const defaultAt = source.indexOf(defaultMatch[0]);
const classNameAt = source.indexOf('bodyClassName\n', defaultAt);
assert.ok(
  classNameAt > defaultAt && !source.slice(defaultAt, classNameAt).includes(')'),
  `${COMPONENT}: bodyClassName is not the argument after the default padding in the body's cn()`
);

/** The padding-relevant part of the body's class list, as the component builds it. */
function bodyClasses({ bodyPadding = BODY_PADDING_FALLBACK, bodyClassName } = {}) {
  return cn(bodyPadding === 'default' && DEFAULT_PADDING, bodyClassName)
    .split(/\s+/)
    .filter(Boolean);
}

/** `p-4`, `px-2`, `sm:p-6`, `@min-[768px]/page:p-6`, `-pt-1` … — any padding, any variant. */
const isPadding = (cls) => /^-?p[xytrblse]?-/.test(cls.split(':').pop());
const variantOf = (cls) => cls.split(':').slice(0, -1).join(':');

const [DEFAULT_BASE, DEFAULT_CONTAINER] = DEFAULT_PADDING.split(/\s+/);

// --- The three pinned cases ---------------------------------------------------------------------

console.log('ChapterPanel body padding');

check(`default padding is one plain and one container class (${DEFAULT_PADDING})`, () => {
  assert.equal(DEFAULT_PADDING.split(/\s+/).length, 2);
  assert.ok(isPadding(DEFAULT_BASE) && variantOf(DEFAULT_BASE) === '', DEFAULT_BASE);
  assert.ok(
    isPadding(DEFAULT_CONTAINER) && variantOf(DEFAULT_CONTAINER).startsWith('@'),
    DEFAULT_CONTAINER
  );
});

check('bodyPadding="none" leaves no padding class, plain or container', () => {
  const classes = bodyClasses({ bodyPadding: 'none' });
  assert.deepEqual(classes.filter(isPadding), [], classes.join(' '));
});

check('bodyPadding="none" with a non-padding bodyClassName still leaves none', () => {
  const classes = bodyClasses({ bodyPadding: 'none', bodyClassName: 'space-y-4' });
  assert.deepEqual(classes.filter(isPadding), [], classes.join(' '));
});

check(`default (prop omitted) keeps both ${DEFAULT_BASE} and ${DEFAULT_CONTAINER}`, () => {
  assert.equal(BODY_PADDING_FALLBACK, 'default');
  assert.deepEqual(bodyClasses().filter(isPadding), [DEFAULT_BASE, DEFAULT_CONTAINER]);
  assert.deepEqual(bodyClasses({ bodyPadding: 'default' }).filter(isPadding), [
    DEFAULT_BASE,
    DEFAULT_CONTAINER,
  ]);
});

check('a p-0 in bodyClassName does NOT cancel the container variant (the trap this pins)', () => {
  const classes = bodyClasses({ bodyClassName: 'p-0' });
  assert.ok(classes.includes(DEFAULT_CONTAINER), `twMerge changed: ${classes.join(' ')}`);
});

const rideMatch = readFileSync(RIDE_PROFILE, 'utf8').match(/bodyClassName="([^"]+)"/);
check(`RideProfileSection's own p-5 sm:p-6 outranks the default`, () => {
  assert.ok(rideMatch, `${RIDE_PROFILE}: no bodyClassName="…"`);
  const own = rideMatch[1].split(/\s+/).filter(isPadding);
  assert.deepEqual(own, ['p-5', 'sm:p-6'], `${RIDE_PROFILE} changed its padding: ${rideMatch[1]}`);
  const classes = bodyClasses({ bodyClassName: rideMatch[1] });
  assert.ok(!classes.includes(DEFAULT_BASE), classes.join(' '));
  assert.ok(classes.includes('p-5') && classes.includes('sm:p-6'), classes.join(' '));
});

// --- Every call site ----------------------------------------------------------------------------

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (path.endsWith('.tsx') && path !== COMPONENT) yield path;
  }
}

/** The opening tag's attribute text, skipping `>` inside `{…}` (a JSX `badge={<X>…</X>}`). */
function openingTag(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return text.slice(start, i);
  }
  throw new Error('unterminated <ChapterPanel');
}

const sites = [];
for (const file of [...walk('components'), ...walk('app')]) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/<ChapterPanel\b/g)) {
    const tag = openingTag(text, m.index + m[0].length);
    const line = text.slice(0, m.index).split('\n').length;
    const bodyPadding = tag.match(/\bbodyPadding="([^"]+)"/)?.[1];
    const bodyClassName = tag.match(/\bbodyClassName="([^"]+)"/)?.[1];
    if (/\bbodyPadding=\{/.test(tag) || /\bbodyClassName=\{/.test(tag)) {
      throw new Error(
        `${file}:${line}: padding props as an expression — teach this test to read it`
      );
    }
    sites.push({ where: `${file}:${line}`, bodyPadding, bodyClassName });
  }
}

check(`found the call sites (${sites.length}), at least one with bodyPadding="none"`, () => {
  assert.ok(sites.length >= 5, `only ${sites.length} <ChapterPanel> calls found`);
  assert.ok(sites.some((s) => s.bodyPadding === 'none'));
  assert.ok(
    sites.some((s) => s.bodyClassName === rideMatch?.[1]),
    'RideProfileSection not among them'
  );
});

for (const site of sites) {
  const classes = bodyClasses(site);
  const own = (site.bodyClassName ?? '').split(/\s+/).filter(isPadding);
  check(`${site.where} → ${classes.filter(isPadding).join(' ') || '(no padding)'}`, () => {
    // Zero padding asked for with a class: the default's container variant survives it.
    assert.ok(
      !own.some((cls) => /^p-0$/.test(cls)),
      `bodyClassName="${site.bodyClassName}" — a p-0 keeps ${DEFAULT_CONTAINER}` +
        ` (24 px from a 768 px container up). Use bodyPadding="none".`
    );
    if (site.bodyPadding === 'none') {
      assert.deepEqual(
        classes.filter(isPadding).filter((c) => !own.includes(c)),
        [],
        classes.join(' ')
      );
    }
    // The default either applies whole or is replaced: its container variant alone is the trap,
    // unless the site's own padding reaches the same 24 px with a breakpoint variant
    // (`RideProfileSection`'s `sm:p-6`).
    if (classes.includes(DEFAULT_CONTAINER) && !classes.includes(DEFAULT_BASE)) {
      assert.ok(
        own.some((cls) => variantOf(cls) !== '' && cls.endsWith(':p-6')),
        `${DEFAULT_CONTAINER} survives without ${DEFAULT_BASE}: ${classes.join(' ')}`
      );
    }
  });
}

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) process.exit(1);
