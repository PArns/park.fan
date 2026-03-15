import type { MetadataRoute } from 'next';
import { getGeoStructure, getSitemapAttractions } from '@/lib/api/discovery';
import { locales } from '@/i18n/config';

const BASE_URL = 'https://park.fan';

// Variant slugs like "taron-2", "coaster-3" are noindex pages — exclude from sitemap
const VARIANT_SLUG_RE = /^.+-\d+$/;

export const revalidate = 86400; // 24h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [geo, attractions] = await Promise.all([getGeoStructure(86400), getSitemapAttractions()]);
  const routes: MetadataRoute.Sitemap = [];

  // ── Static pages ──────────────────────────────────────────────────────────
  for (const locale of locales) {
    routes.push(
      { url: `${BASE_URL}/${locale}`, changeFrequency: 'daily', priority: 1.0 },

      { url: `${BASE_URL}/${locale}/howto`, changeFrequency: 'weekly', priority: 0.8 }
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

  for (const locale of locales) {
    routes.push({
      url: `${BASE_URL}/${locale}/${glossarySegments[locale]}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  // Import lazily to avoid circular dependencies
  const { getGlossaryTerms } = await import('@/lib/glossary/translations');
  for (const locale of locales) {
    const terms = await getGlossaryTerms(locale as import('@/i18n/config').Locale);
    for (const term of terms) {
      routes.push({
        url: `${BASE_URL}/${locale}/${glossarySegments[locale]}/${term.slug}`,
        changeFrequency: 'monthly',
        priority: 0.5,
      });
    }
  }

  // ── Park pages ────────────────────────────────────────────────────────────
  for (const continent of geo.continents) {
    for (const country of continent.countries) {
      for (const city of country.cities) {
        for (const park of city.parks) {
          for (const locale of locales) {
            routes.push({
              url: `${BASE_URL}/${locale}/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`,
              changeFrequency: 'hourly',
              priority: 1.0,
            });
          }
        }
      }
    }
  }

  // ── Attraction pages (long-tail SEO) ──────────────────────────────────────
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
