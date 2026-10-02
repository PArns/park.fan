/**
 * Every translation of a post carries the same `updatedAt`.
 *
 * Run: pnpm check:blog-updated-at   (pure local data, no API, no server)
 *
 * A post, guide or news item ships in all six languages in the same pull request, and so does every
 * later update to it (docs/rules/a-post-ships-in-six-languages-in-one-pull-request.md). `updatedAt`
 * moves only when a post gets new content (docs/rules/updated-at-is-for-new-content.md), so two
 * translations with different dates mean one of them got content the other did not.
 *
 * It happened on 2026-09-29: PAR-582 added Alton Towers and PortAventura to the German Halloween
 * guide and moved its `updatedAt`, and the other five stayed on 2026-09-25 without either park
 * until PAR-620. Every existing check was green: all six files existed, `generate:blog-manifest`
 * compares `date` but not `updatedAt`, and `check:untranslated` only reads `messages/`.
 *
 * A group where no file has `updatedAt` (every news post) passes. A group where some files have it
 * and some do not fails: that is the same gap, with the missing date standing for the old one.
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const BLOG_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../content/blog');
const LOCALES = ['de', 'en', 'nl', 'fr', 'es', 'it'];

/** gray-matter turns an unquoted date into a Date; compare both forms as YYYY-MM-DD. */
function day(value) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

/** translationKey → [{ locale, file, updatedAt }] */
const groups = new Map();
for (const locale of LOCALES) {
  const dir = path.join(BLOG_DIR, locale);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const { data } = matter(readFileSync(path.join(dir, file), 'utf8'));
    if (!data.translationKey) continue;
    if (!groups.has(data.translationKey)) groups.set(data.translationKey, []);
    groups.get(data.translationKey).push({ locale, file, updatedAt: day(data.updatedAt) });
  }
}

const mismatches = [];
let withDate = 0;
for (const [key, entries] of groups) {
  const dates = new Set(entries.map((e) => e.updatedAt));
  if (dates.size > 1) mismatches.push({ key, entries });
  else if (!dates.has(null)) withDate += 1;
}

if (mismatches.length === 0) {
  console.log(
    `✅ updatedAt agrees across translations in all ${groups.size} translationKey groups ` +
      `(${withDate} carry an updatedAt, ${groups.size - withDate} have none).`
  );
  process.exit(0);
}

console.error(
  `❌ ${mismatches.length} of ${groups.size} translationKey groups disagree on updatedAt:\n`
);
for (const { key, entries } of mismatches) {
  console.error(`  ${key}`);
  for (const { locale, file, updatedAt } of entries) {
    console.error(`      ${locale}/${file}   ${updatedAt ?? '(none)'}`);
  }
}
console.error(
  `\nOne translation got new content the others did not. Bring the others up to it in the same\n` +
    `pull request and give all of them the same updatedAt\n` +
    `(docs/rules/a-post-ships-in-six-languages-in-one-pull-request.md).`
);
process.exit(1);
