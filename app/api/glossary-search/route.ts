import { getGlossaryTerms } from '@/lib/glossary/translations';
import type { Locale } from '@/i18n/config';
import { locales } from '@/i18n/config';

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

      if (t.aliases?.some((alias) => alias.toLowerCase() === lowerQuery)) {
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
    })),
  });
}
