import { getGlossaryTerms } from '@/lib/glossary/translations';
import type { Locale } from '@/i18n/config';
import { locales, SITE_URL } from '@/i18n/config';
import { buildGlossaryTermHref } from '@/lib/glossary/segments';

/** Below this many characters a query is not looked for in the long definitions. */
const DEFINITION_MIN_CHARS = 5;

/** Where `word` first starts a word in `text`, or -1: "bremse" is not found inside "Blockbremse". */
function wordStartIn(text: string, word: string): number {
  for (let at = text.indexOf(word); at !== -1; at = text.indexOf(word, at + 1)) {
    if (at === 0 || !/[\p{L}\p{N}]/u.test(text[at - 1])) return at;
  }
  return -1;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  const rawLocale = searchParams.get('locale') ?? 'en';
  const locale = (locales.includes(rawLocale as Locale) ? rawLocale : 'en') as Locale;

  if (q.length < 3) return Response.json({ results: [] });

  const terms = await getGlossaryTerms(locale);
  const query = q.toLowerCase();

  // Load English names for cross-language search (cached — no extra I/O for EN locale)
  const enTerms = locale !== 'en' ? await getGlossaryTerms('en') : terms;
  const enNameMap = new Map(enTerms.map((t) => [t.id, t.name]));

  // Exact matches rank first (name, English name, alias), then substrings, a prefix above the rest.
  interface ScoredTerm {
    term: (typeof terms)[0];
    score: number;
  }

  const scored: ScoredTerm[] = terms
    .map((t) => {
      const lowerName = t.name.toLowerCase();
      const enName = enNameMap.get(t.id);
      const lowerEnName = enName?.toLowerCase();
      const lowerQuery = query;

      if (lowerName === lowerQuery) {
        return { term: t, score: 100 };
      }

      // The English name ranks just below the localized one.
      if (lowerEnName && lowerEnName === lowerQuery) {
        return { term: t, score: 95 };
      }

      const otherNames = [...(t.aliases ?? []), ...(t.alternateNames ?? [])];
      if (otherNames.some((name) => name.toLowerCase() === lowerQuery)) {
        return { term: t, score: 90 };
      }

      if (lowerName.includes(lowerQuery)) {
        const score = lowerName.startsWith(lowerQuery) ? 50 : 30;
        return { term: t, score };
      }

      if (lowerEnName && lowerEnName.includes(lowerQuery)) {
        const score = lowerEnName.startsWith(lowerQuery) ? 25 : 15;
        return { term: t, score };
      }

      if (t.shortDefinition.toLowerCase().includes(lowerQuery)) {
        return { term: t, score: 20 };
      }

      // Many terms keep their English name in every language ("Block Brake"), and the reader's
      // own word sits only in the long text ("Eine Blockbremse teilt …"): the lowest rank, the
      // term that names it earliest first. Short queries would match half the glossary.
      if (lowerQuery.length >= DEFINITION_MIN_CHARS) {
        const at = wordStartIn(t.definition.toLowerCase(), lowerQuery);
        if (at >= 0) return { term: t, score: 10 - Math.min(at, 5000) / 1000 };
      }

      return null;
    })
    .filter((x): x is ScoredTerm => x !== null)
    .sort((a, b) => b.score - a.score);

  return Response.json({
    results: scored.slice(0, 5).map(({ term: t }) => ({
      type: 'glossary',
      id: t.id,
      name: t.name,
      slug: t.slug,
      shortDefinition: t.shortDefinition,
      category: t.category,
      // The canonical page, so a link from Parky lands without the `/glossary/` redirect.
      url: `${SITE_URL}${buildGlossaryTermHref(locale, t.slug)}`,
    })),
  });
}
