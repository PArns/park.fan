import type { MetadataRoute } from 'next';
import { getGeoStructure, getSitemapAttractions } from '@/lib/api/discovery';
import { locales } from '@/i18n/config';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/translations';
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

export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }];
}

export default async function sitemap({
  id,
}: {
  id: Promise<string | number> | string | number;
}): Promise<MetadataRoute.Sitemap> {
  const resolvedId = String(await id);
  const routes: MetadataRoute.Sitemap = [];

  if (resolvedId === '0') {
    // ── Static pages ──────────────────────────────────────────────────────────
    const homepageAlternates = buildAlternates(() => '');
    const parksListingAlternates = buildAlternates(() => '/parks');
    const howtoAlternates = buildAlternates(() => '/howto');
    const searchAlternates = buildAlternates(() => '/search');
    const impressumAlternates = buildAlternates(() => '/impressum');
    const datenschutzAlternates = buildAlternates(() => '/datenschutz');

    for (const locale of locales) {
      routes.push(
        {
          url: `${BASE_URL}/${locale}`,
          changeFrequency: 'daily',
          priority: 1.0,
          alternates: homepageAlternates,
        },
        {
          url: `${BASE_URL}/${locale}/parks`,
          changeFrequency: 'daily',
          priority: 0.9,
          alternates: parksListingAlternates,
        },
        {
          url: `${BASE_URL}/${locale}/howto`,
          changeFrequency: 'monthly',
          priority: 0.6,
          alternates: howtoAlternates,
        },
        {
          url: `${BASE_URL}/${locale}/search`,
          changeFrequency: 'monthly',
          priority: 0.5,
          alternates: searchAlternates,
        },
        {
          url: `${BASE_URL}/${locale}/impressum`,
          changeFrequency: 'yearly',
          priority: 0.4,
          alternates: impressumAlternates,
        },
        {
          url: `${BASE_URL}/${locale}/datenschutz`,
          changeFrequency: 'yearly',
          priority: 0.4,
          alternates: datenschutzAlternates,
        }
      );
    }

    // ── Glossary pages ────────────────────────────────────────────────────────
    const glossaryIndexAlternates = buildAlternates(
      (l) => `/${GLOSSARY_SEGMENTS[l as keyof typeof GLOSSARY_SEGMENTS]}`
    );

    for (const locale of locales) {
      routes.push({
        url: `${BASE_URL}/${locale}/${GLOSSARY_SEGMENTS[locale as keyof typeof GLOSSARY_SEGMENTS]}`,
        changeFrequency: 'monthly',
        priority: 0.5,
        alternates: glossaryIndexAlternates,
      });
    }

    // Import lazily to avoid circular dependencies
    const { getGlossaryTerms } = await import('@/lib/glossary/translations');

    // Fetch all locale terms in parallel
    const termsByLocale = new Map<string, GlossaryTerm[]>();
    await Promise.all(
      locales.map(async (locale) => {
        const terms = await getGlossaryTerms(locale as import('@/i18n/config').Locale);
        termsByLocale.set(locale, terms);
      })
    );

    // Use EN terms as the canonical set (all locales share the same term IDs)
    const enTerms = termsByLocale.get('en')!;
    for (const enTerm of enTerms) {
      // Build alternates: each locale's URL for this term
      const termAlternates: Record<string, string> = {};
      for (const l of locales) {
        const localTerms = termsByLocale.get(l)!;
        const localTerm = localTerms.find((term) => term.id === enTerm.id);
        if (localTerm) {
          termAlternates[l] =
            `${BASE_URL}/${l}/${GLOSSARY_SEGMENTS[l as keyof typeof GLOSSARY_SEGMENTS]}/${localTerm.slug}`;
        }
      }
      termAlternates['x-default'] = termAlternates['en'];

      for (const locale of locales) {
        const localTerms = termsByLocale.get(locale)!;
        const localTerm = localTerms.find((term) => term.id === enTerm.id);
        if (!localTerm) continue;

        routes.push({
          url: `${BASE_URL}/${locale}/${GLOSSARY_SEGMENTS[locale as keyof typeof GLOSSARY_SEGMENTS]}/${localTerm.slug}`,
          changeFrequency: 'yearly',
          priority: 0.3,
          alternates: { languages: termAlternates },
        });
      }
    }

    // ── Park pages ────────────────────────────────────────────────────────────
    const geo = await getGeoStructure(86400);
    for (const continent of geo.continents) {
      for (const country of continent.countries) {
        for (const city of country.cities) {
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
  } else if (resolvedId === '1') {
    // ── Attraction pages (long-tail SEO) ──────────────────────────────────────
    const attractions = await getSitemapAttractions();
    for (const attraction of attractions) {
      // Variant slugs (e.g. "blue-fire-2") are noindex — skip
      if (VARIANT_SLUG_RE.test(attraction.slug)) continue;

      const frontendPath = attraction.url
        .replace(/^\/v1\/parks\//, '/parks/')
        .replace(/\/attractions\//, '/');

      for (const locale of locales) {
        routes.push({
          url: `${BASE_URL}/${locale}${frontendPath}`,
          changeFrequency: 'daily',
          priority: 0.7,
        });
      }
    }
  } else if (resolvedId === '2') {
    // ── Hub Pages (Continents, Countries, Cities) ─────────────────────────────
    const geo = await getGeoStructure(86400);
    for (const continent of geo.continents) {
      // Continent Pages
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
        // Country Pages
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
          // City Pages (Skip single-park cities)
          if (city.parks.length <= 1) continue;

          const cityPath = `/parks/${continent.slug}/${country.slug}/${city.slug}`;
          const cityAlternates = buildAlternates(() => cityPath);

          for (const locale of locales) {
            routes.push({
              url: `${BASE_URL}/${locale}${cityPath}`,
              changeFrequency: 'weekly',
              priority: 0.6,
              alternates: cityAlternates,
            });
          }
        }
      }
    }
  }

  return routes;
}
