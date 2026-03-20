import type { MetadataRoute } from 'next';
import { getGeoStructure, getSitemapAttractions } from '@/lib/api/discovery';
import { locales } from '@/i18n/config';
import type { GlossaryTerm } from '@/lib/glossary/types';

const BASE_URL = 'https://park.fan';

// Variant slugs like "taron-2", "coaster-3" are noindex pages — exclude from sitemap
const VARIANT_SLUG_RE = /^.+-\d+$/;

export const revalidate = 86400; // 24h

/** Build hreflang alternates for a page that uses the same path across all locales. */
function buildAlternates(pathFn: (locale: string) => string): {
  languages: Record<string, string>;
} {
  return {
    languages: Object.fromEntries([
      ...locales.map((l) => [l, `${BASE_URL}/${l}${pathFn(l)}`]),
      ['x-default', `${BASE_URL}/en${pathFn('en')}`],
    ]),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [geo, attractions] = await Promise.all([getGeoStructure(86400), getSitemapAttractions()]);
  const routes: MetadataRoute.Sitemap = [];

  // ── Static pages ──────────────────────────────────────────────────────────
  const homepageAlternates = buildAlternates(() => '');
  const howtoAlternates = buildAlternates(() => '/howto');

  for (const locale of locales) {
    routes.push(
      {
        url: `${BASE_URL}/${locale}`,
        changeFrequency: 'daily',
        priority: 1.0,
        alternates: homepageAlternates,
      },
      {
        url: `${BASE_URL}/${locale}/howto`,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: howtoAlternates,
      }
    );
  }

  // ── Glossary pages ────────────────────────────────────────────────────────
  const glossarySegments: Record<string, string> = {
    en: 'glossary',
    de: 'glossar',
    fr: 'glossaire',
    it: 'glossario',
    nl: 'woordenlijst',
    es: 'glosario',
  };

  const glossaryIndexAlternates = buildAlternates((l) => `/${glossarySegments[l]}`);

  for (const locale of locales) {
    routes.push({
      url: `${BASE_URL}/${locale}/${glossarySegments[locale]}`,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: glossaryIndexAlternates,
    });
  }

  // Import lazily to avoid circular dependencies
  const { getGlossaryTerms } = await import('@/lib/glossary/translations');

  // Fetch all locale terms once; use slugs map for cross-locale alternates
  const termsByLocale = new Map<string, GlossaryTerm[]>();
  for (const locale of locales) {
    termsByLocale.set(locale, await getGlossaryTerms(locale as import('@/i18n/config').Locale));
  }

  // Use EN terms as the canonical set (all locales share the same term IDs)
  const enTerms = termsByLocale.get('en')!;
  for (const enTerm of enTerms) {
    // Build alternates: each locale's URL for this term
    const termAlternates: Record<string, string> = {};
    for (const l of locales) {
      const localTerms = termsByLocale.get(l)!;
      const localTerm = localTerms.find((term) => term.id === enTerm.id);
      if (localTerm) {
        termAlternates[l] = `${BASE_URL}/${l}/${glossarySegments[l]}/${localTerm.slug}`;
      }
    }
    termAlternates['x-default'] = termAlternates['en'];

    for (const locale of locales) {
      const localTerms = termsByLocale.get(locale)!;
      const localTerm = localTerms.find((term) => term.id === enTerm.id);
      if (!localTerm) continue;

      routes.push({
        url: `${BASE_URL}/${locale}/${glossarySegments[locale]}/${localTerm.slug}`,
        changeFrequency: 'monthly',
        priority: 0.5,
        alternates: { languages: termAlternates },
      });
    }
  }

  // ── Park hierarchy pages ──────────────────────────────────────────────────
  const parksListingAlternates = buildAlternates(() => '/parks');
  for (const locale of locales) {
    routes.push({
      url: `${BASE_URL}/${locale}/parks`,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: parksListingAlternates,
    });
  }

  for (const continent of geo.continents) {
    const continentPath = `/parks/${continent.slug}`;
    const continentAlternates = buildAlternates(() => continentPath);
    for (const locale of locales) {
      routes.push({
        url: `${BASE_URL}/${locale}${continentPath}`,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: continentAlternates,
      });
    }

    for (const country of continent.countries) {
      const countryPath = `/parks/${continent.slug}/${country.slug}`;
      const countryAlternates = buildAlternates(() => countryPath);
      for (const locale of locales) {
        routes.push({
          url: `${BASE_URL}/${locale}${countryPath}`,
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: countryAlternates,
        });
      }

      for (const city of country.cities) {
        const cityPath = `/parks/${continent.slug}/${country.slug}/${city.slug}`;
        const cityAlternates = buildAlternates(() => cityPath);
        for (const locale of locales) {
          routes.push({
            url: `${BASE_URL}/${locale}${cityPath}`,
            changeFrequency: 'weekly',
            priority: 0.7,
            alternates: cityAlternates,
          });
        }

        for (const park of city.parks) {
          const parkPath = `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`;
          const parkAlternates = buildAlternates(() => parkPath);

          for (const locale of locales) {
            routes.push({
              url: `${BASE_URL}/${locale}${parkPath}`,
              changeFrequency: 'hourly',
              priority: 1.0,
              alternates: parkAlternates,
            });
          }
        }
      }
    }
  }

  // ── Attraction pages (long-tail SEO) ──────────────────────────────────────
  // No sitemap alternates here: 5000+ attractions × 6 locales × 7 alternate URLs
  // would exceed the 19 MB ISR body limit. HTML hreflang tags in <head> cover
  // language signals for these pages.
  for (const attraction of attractions) {
    // Variant slugs (e.g. "blue-fire-2") are noindex — skip
    if (VARIANT_SLUG_RE.test(attraction.slug)) continue;

    const frontendPath = attraction.url
      .replace(/^\/v1\/parks\//, '/parks/')
      .replace(/\/attractions\//, '/');

    for (const locale of locales) {
      routes.push({
        url: `${BASE_URL}/${locale}${frontendPath}`,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  return routes;
}
