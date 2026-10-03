/**
 * Pins the length of the meta descriptions that are not built from a template (SEO run,
 * 2026-10-03):
 *
 *   - every glossary term's description (`fitSentences` over the definition's first paragraph)
 *     is at most 155 characters in all six locales and does not end on a dangling colon
 *   - `fitSentences` keeps abbreviations ("z. B.", "Dr.") inside their sentence
 *   - every blog post's `seo.description` is at most 155 characters. 137 of 228 were longer, up
 *     to 268, and Google cut each of them mid-sentence in the result.
 *
 * Run: pnpm test:meta-descriptions
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { fitSentences } from '../lib/utils/metadata.ts';
import { getGlossaryTerms } from '../lib/glossary/translations.ts';

const LIMIT = 155;
const LOCALES = ['en', 'de', 'fr', 'it', 'nl', 'es'];

let failures = 0;
let checks = 0;
function test(name, fn) {
  checks++;
  try {
    fn();
  } catch (error) {
    failures++;
    console.error(`✗ ${name}\n  ${error.message}`);
  }
}

test('fitSentences keeps whole sentences and abbreviations together', () => {
  const text =
    'Airtime is the moment you lift out of the seat on a hill, z. B. on Taron at Phantasialand. ' +
    'It comes in two kinds: floater and ejector. Floater airtime is gentle and lasts long.';
  const out = fitSentences(text, 155);
  assert.ok(out.length <= 155, `length ${out.length}`);
  assert.ok(out.endsWith('ejector.'), out);
  assert.ok(out.includes('z. B. on Taron'), out);
});

test('fitSentences clips one long sentence at a word with an ellipsis', () => {
  const out = fitSentences('word '.repeat(60).trim(), 155);
  assert.ok(out.length <= 155 && out.endsWith('…') && !out.endsWith(' …'), out);
});

for (const locale of LOCALES) {
  const terms = await getGlossaryTerms(locale);
  test(`glossary ${locale}: ${terms.length} descriptions fit`, () => {
    for (const term of terms) {
      const description = fitSentences(term.definition.split('\n\n')[0], LIMIT);
      assert.ok(description.length <= LIMIT, `${term.id}: ${description.length}`);
      assert.ok(!/[:,]…$/.test(description), `${term.id} ends mid-clause: ${description}`);
    }
  });
}

for (const locale of LOCALES) {
  const dir = path.join('content/blog', locale);
  const long = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ f, d: matter(fs.readFileSync(path.join(dir, f), 'utf8')).data }))
    .map(({ f, d }) => ({ f, len: (d.seo?.description ?? d.excerpt ?? '').length }))
    .filter(({ len }) => len > LIMIT);
  test(`blog ${locale}: seo.description at most ${LIMIT} characters`, () => {
    assert.deepEqual(
      long.map(({ f, len }) => `${f} (${len})`),
      []
    );
  });
}

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) process.exit(1);
