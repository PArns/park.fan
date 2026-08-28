/**
 * `GLOSSARY_CONTENT_DATE` against what the glossary actually says.
 *
 * Run: pnpm check:glossary-content-date   (pure local data, no API, no server)
 *
 * The date in `lib/glossary/content-date.ts` is hand-maintained, and it is the one number two
 * crawler-facing surfaces read: `<lastmod>` on all 1,608 glossary URLs in the sitemap and
 * `dateModified` on the `DefinedTerm`/`DefinedTermSet` JSON-LD. Nothing recomputes it, so nothing
 * notices when it stops being true — the build stays green, the sitemap keeps serving the old date,
 * and a crawler is told not to come back for content that did change.
 *
 * It stopped being true almost immediately. The constant said `2026-03-17`; the glossary went from
 * **133 terms to 267** across the five months after that, and neither the new terms
 * (`cobra loop`, `jojo roll`, `flying snake dive`, `Testing`, `KUKA`, and the April batch) nor the
 * four dead `relatedTermIds` nor a Spanish slug rename moved it. The file's own comment already
 * warned about exactly this: "A stale date here is worse than none."
 *
 * **Why a hash and not a file mtime.** The obvious check — is `content/glossary/*.ts` newer than the
 * constant — fires on commits that changed nothing a reader can see. The 2026-08-18 maintenance pass
 * rewrote every `"…"` to `'…'` across all six locale files and touched 142 lines without altering a
 * single string's value; an mtime check would have demanded a date bump for a prettier run, and a
 * check that cries wolf gets bumped reflexively, which is the failure it was written to prevent. So
 * this hashes the *parsed* content instead: quote style, key order and whitespace are invisible to
 * it, and a renamed slug or a reworded definition is not.
 *
 * What counts as glossary content, and therefore as a reason to bump the date:
 *   - the term set itself: id, category, and the 3-D player element when a term has one
 *   - every slug in all six locales   → a slug rename is a URL change (`arnés-hombros` →
 *                                       `arnes-hombros` shipped on 2026-08-23 and moved a page)
 *   - every locale's name, shortDefinition, definition, relatedTermIds, aliases, alternateNames
 *
 * Deliberately outside the hash: anything that does not reach the page. There is nothing else in
 * these files today, so the exclusion list is empty on purpose — if one appears, it belongs here
 * with a note, the way `lib/seo/content-changes/fingerprint.ts` documents its own exclusions.
 *
 * Exits non-zero with the new hash to paste in when the two disagree.
 */

import { createHash } from 'node:crypto';
import { GLOSSARY_TERMS } from '../lib/glossary/data.ts';
import { GLOSSARY_CONTENT_DATE, GLOSSARY_CONTENT_HASH } from '../lib/glossary/content-date.ts';

const LOCALES = ['en', 'de', 'fr', 'it', 'nl', 'es'];

/** `undefined` and an absent key are the same thing to a hash; an empty array is not. */
const nn = (value) => value ?? null;

const translations = Object.fromEntries(
  await Promise.all(
    LOCALES.map(async (locale) => {
      const mod = await import(`../content/glossary/${locale}.ts`);
      const list = mod.default ?? mod;
      return [locale, new Map(list.map((t) => [t.id, t]))];
    })
  )
);

/**
 * Terms in declaration order, locales in a fixed order: the hash must not move because someone
 * reordered an array, only because a value changed.
 */
const content = GLOSSARY_TERMS.map((term) => ({
  id: term.id,
  category: term.category,
  player: nn(term.player?.element),
  slugs: LOCALES.map((locale) => [locale, nn(term.slugs?.[locale])]),
  text: LOCALES.map((locale) => {
    const t = translations[locale].get(term.id);
    if (!t) return [locale, null];
    return [
      locale,
      {
        name: t.name,
        shortDefinition: t.shortDefinition,
        definition: t.definition,
        relatedTermIds: nn(t.relatedTermIds),
        aliases: nn(t.aliases),
        alternateNames: nn(t.alternateNames),
      },
    ];
  }),
}));

const actual = createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 16);

if (actual === GLOSSARY_CONTENT_HASH) {
  console.log(
    `✅ Glossary content matches its date — ${GLOSSARY_TERMS.length} terms × ${LOCALES.length} ` +
      `locales, hash ${actual}, last reviewed ${GLOSSARY_CONTENT_DATE}.`
  );
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
console.error(
  `❌ The glossary changed since it was last dated.\n\n` +
    `  GLOSSARY_CONTENT_DATE   ${GLOSSARY_CONTENT_DATE}\n` +
    `  stored hash             ${GLOSSARY_CONTENT_HASH}\n` +
    `  actual hash             ${actual}\n\n` +
    `Update both constants in lib/glossary/content-date.ts:\n\n` +
    `  export const GLOSSARY_CONTENT_DATE = '${today}';\n` +
    `  export const GLOSSARY_CONTENT_HASH = '${actual}';\n\n` +
    `Use the date the content actually changed, not necessarily today — it becomes <lastmod> on\n` +
    `1,608 sitemap URLs and dateModified on the glossary JSON-LD. If you only reformatted the\n` +
    `files, this check would not have fired: it hashes parsed values, not their spelling.`
);
process.exit(1);
