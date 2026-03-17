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

  // Calculate match score: exact name match = 100, alias match = 90, substring match = varies by position
  interface ScoredTerm {
    term: typeof terms[0];
    score: number;
  }

  const scored: ScoredTerm[] = terms
    .map((t) => {
      const lowerName = t.name.toLowerCase();
      const enName = enNameMap.get(t.id);
      const lowerEnName = enName?.toLowerCase();
      const lowerQuery = query;

      // Exact match on name = 100 points
      if (lowerName === lowerQuery) {
        return { term: t, score: 100 };
      }

      // Exact match on English name = 95 points (slightly lower than localized name)
      if (lowerEnName && lowerEnName === lowerQuery) {
        return { term: t, score: 95 };
      }

      // Exact match on alias = 90 points
      if (t.aliases?.some((alias) => alias.toLowerCase() === lowerQuery)) {
        return { term: t, score: 90 };
      }

      // Substring matches in name
      if (lowerName.includes(lowerQuery)) {
        // Name starts with query = 50 points, otherwise 30 points
        const score = lowerName.startsWith(lowerQuery) ? 50 : 30;
        return { term: t, score };
      }

      // Substring matches in English name = lower priority (25 or 15 points)
      if (lowerEnName && lowerEnName.includes(lowerQuery)) {
        const score = lowerEnName.startsWith(lowerQuery) ? 25 : 15;
        return { term: t, score };
      }

      // Substring in short definition = 20 points
      if (t.shortDefinition.toLowerCase().includes(lowerQuery)) {
        return { term: t, score: 20 };
      }

      // No match
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
