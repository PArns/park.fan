/**
 * Every glossary slug, checked for the three ways a term can vanish from one locale.
 *
 * Run: pnpm check:glossary-slugs   (pure local data, no API, no server)
 *
 * A glossary slug is a URL segment, and `/[locale]/glossar/[term]` looks it up exactly. So a slug
 * that is not URL-safe does not degrade — the page 404s, while the other five locales keep
 * advertising it as their `hreflang="es"` alternate. Nothing catches that today: the build is
 * green (the slug is a valid string), the sitemap happily emits the dead `<loc>`, and the term
 * renders fine in every language except the broken one.
 *
 * It shipped twice, both in Spanish: `arnés-hombros` and `montaña-rusa-carrera` were the only two
 * non-ASCII URLs among all 3,474 sitemap entries. Every form 404'd — raw UTF-8, NFC and NFD alike —
 * while the ASCII siblings (`montana-rusa-madera`, `montana-rusa-acero`) served 200. Ten indexable
 * pages pointed an `hreflang` at a 404 each, and the German column had been folding umlauts to
 * `schulterbuegel` all along, so the convention existed and these two simply missed it.
 *
 * Checked here:
 *   - every slug is a URL-safe ASCII kebab segment      → the accented-slug 404
 *   - every term carries a slug in all six locales      → `buildGlossaryTerms` uses `flatMap` and
 *                                                          silently drops a term whose translation
 *                                                          is missing, leaving the other five
 *                                                          locales pointing an hreflang at nothing
 *   - no two terms share a slug inside one locale       → the second one is unreachable
 *
 * Exits non-zero listing every offending term, locale and slug.
 */

import { GLOSSARY_TERMS } from '../lib/glossary/data.ts';

const LOCALES = ['en', 'de', 'fr', 'it', 'nl', 'es'];

/** Lowercase ASCII kebab-case: what survives a round-trip through a URL unencoded. */
const URL_SAFE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const problems = [];
/** locale → slug → term ids using it */
const seen = new Map(LOCALES.map((locale) => [locale, new Map()]));

let checked = 0;

for (const term of GLOSSARY_TERMS) {
  for (const locale of LOCALES) {
    const slug = term.slugs?.[locale];

    if (typeof slug !== 'string' || slug.length === 0) {
      problems.push({
        kind: 'missing',
        detail: `${term.id} has no ${locale} slug`,
        hint: 'the term disappears from this locale and the other five keep linking to it',
      });
      continue;
    }

    checked++;

    if (!URL_SAFE.test(slug)) {
      const offending = [...slug].filter((ch) => !/[a-z0-9-]/.test(ch));
      problems.push({
        kind: 'unsafe',
        detail: `${term.id} → ${locale}: "${slug}"`,
        hint:
          offending.length > 0
            ? `not URL-safe: ${[...new Set(offending)].map((c) => `"${c}"`).join(', ')} — fold to ASCII (ü→ue, ñ→n, é→e)`
            : 'not lowercase ASCII kebab-case',
      });
      continue;
    }

    const bucket = seen.get(locale);
    if (!bucket.has(slug)) bucket.set(slug, []);
    bucket.get(slug).push(term.id);
  }
}

for (const locale of LOCALES) {
  for (const [slug, ids] of seen.get(locale)) {
    if (ids.length > 1) {
      problems.push({
        kind: 'duplicate',
        detail: `${locale}: "${slug}" claimed by ${ids.join(', ')}`,
        hint: 'only the first term is reachable at this URL',
      });
    }
  }
}

if (problems.length === 0) {
  console.log(
    `✅ Glossary slugs are URL-safe — ${checked} slugs across ` +
      `${GLOSSARY_TERMS.length} terms × ${LOCALES.length} locales, no gaps, no collisions.`
  );
  process.exit(0);
}

const order = { unsafe: 0, missing: 1, duplicate: 2 };
console.error(`❌ ${problems.length} glossary slug problem(s):\n`);
for (const problem of problems.sort((a, b) => order[a.kind] - order[b.kind])) {
  console.error(`  ${problem.detail}`);
  console.error(`      ${problem.hint}`);
}
console.error(
  '\nA glossary slug is a URL segment looked up exactly. A slug that is not URL-safe 404s in that\n' +
    'locale while the other five keep advertising it as their hreflang alternate — green build,\n' +
    'live sitemap entry, dead page. Fold to ASCII the way the German column already does.'
);
process.exit(1);
