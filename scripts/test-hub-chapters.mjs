/**
 * Every chapter the header's "more" band links is a chapter its page renders, under the same
 * number.
 *
 * The band lists the guide's eleven chapters and the best-travel-time hub's six as fragment links
 * (`/so-funktioniert-park-fan#zahl`), on every page of the site. A fragment that names no element
 * is not an error anywhere — the browser opens the page at the top, the crawler reads the URL
 * without it, the build is green — so a chapter renamed in a content module would leave the menu
 * pointing at nothing for as long as nobody clicked it. The guide's own rail had exactly that
 * failure once, from the other side: chapter 05 went into the page and not into the list, and
 * every number after 04 pointed at the wrong heading.
 *
 * So this reads the six content modules of each hub as text and compares the `<SectionShell
 * id=… index=…>` calls, in order, with `HOWTO_CHAPTERS` and `BEST_TIME_CHAPTERS`. Text, not an
 * import: the modules are TSX with a hundred component imports, and what is being checked is what
 * they would render, which the calls say literally.
 *
 * Pure local data, no server, no network. Run: pnpm test:hub-chapters
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { locales } from '../i18n/config.ts';
import { HOWTO_CHAPTERS } from '../lib/howto/chapters.ts';
import { BEST_TIME_CHAPTERS } from '../lib/best-time/chapters.ts';

const HUBS = [
  { name: 'guide', dir: 'app/[locale]/how-park-fan-works/content', chapters: HOWTO_CHAPTERS },
  {
    name: 'best time',
    dir: 'app/[locale]/best-time-to-visit/content',
    chapters: BEST_TIME_CHAPTERS,
  },
];

/** Both shapes the modules use: one attribute per line, and the whole call on one line. */
const SECTION_SHELL = /<SectionShell\s+id="([^"]+)"\s+index="(\d+)"/g;

let failures = 0;
let checks = 0;
let compared = 0;
function test(name, fn) {
  checks++;
  try {
    fn();
  } catch (error) {
    failures++;
    console.error(`✗ ${name}\n  ${error.message}`);
  }
}

for (const hub of HUBS) {
  for (const locale of locales) {
    const source = readFileSync(`${hub.dir}/${locale}.tsx`, 'utf8');
    const rendered = Array.from(source.matchAll(SECTION_SHELL), (m) => ({
      id: m[1],
      index: m[2],
    }));
    const listed = (hub.chapters[locale] ?? []).map(({ id, index }) => ({ id, index }));

    test(`${hub.name}, ${locale}: the page renders chapters at all`, () => {
      assert.ok(rendered.length > 0, `no <SectionShell id=… index=…> in ${hub.dir}/${locale}.tsx`);
    });

    test(`${hub.name}, ${locale}: the list is the page's chapters, in order`, () => {
      assert.deepEqual(listed, rendered);
    });

    test(`${hub.name}, ${locale}: every chapter has a label`, () => {
      const blank = (hub.chapters[locale] ?? []).filter((c) => !c.label.trim()).map((c) => c.id);
      assert.deepEqual(blank, []);
    });

    compared += listed.length;
  }
}

if (failures > 0) {
  console.error(`\n${failures}/${checks} checks failed.`);
  process.exit(1);
}
console.log(
  `✓ ${checks} checks passed (${compared} chapter links over ${HUBS.length} hubs × ${locales.length} locales).`
);
