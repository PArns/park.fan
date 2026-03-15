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
  const results = terms.filter(
    (t) => t.name.toLowerCase().includes(query) || t.shortDefinition.toLowerCase().includes(query)
  );

  return Response.json({
    results: results.slice(0, 5).map((t) => ({
      type: 'glossary',
      id: t.id,
      name: t.name,
      slug: t.slug,
      shortDefinition: t.shortDefinition,
      category: t.category,
    })),
  });
}
