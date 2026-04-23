import type { MetadataRoute } from 'next';
import { getGeoStructure } from '@/lib/api/discovery';
import { locales } from '@/i18n/config';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/translations';
import type { GlossaryTerm } from '@/lib/glossary/types';

const BASE_URL = 'https://park.fan';

export const revalidate = 86400; // 24h

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
  const geo = await getGeoStructure(86400);
  const routes: MetadataRoute.Sitemap = [];

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
        changeFrequency: 'weekly',
        priority: 1.0,
        alternates: homepageAlternates,
      },
      {
        url: `${BASE_URL}/${locale}/parks`,
        changeFrequency: 'weekly',
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
        changeFrequency: 'monthly',
        priority: 0.4,
        alternates: impressumAlternates,
      },
      {
        url: `${BASE_URL}/${locale}/datenschutz`,
        changeFrequency: 'monthly',
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
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: glossaryIndexAlternates,
    });
  }

  // Import lazily to avoid circular dependencies
  const { getGlossaryTerms } = await import('@/lib/glossary/translations');

  const termsByLocale = new Map<string, GlossaryTerm[]>();
  await Promise.all(
    locales.map(async (locale) => {
      const terms = await getGlossaryTerms(locale as import('@/i18n/config').Locale);
      termsByLocale.set(locale, terms);
    })
  );

  const enTerms = termsByLocale.get('en')!;
  for (const enTerm of enTerms) {
    const termAlternates: Record<string, string> = {};
    for (const l of locales) {
      const localTerms = termsByLocale.get(l)!;
      const localTerm = localTerms.find((term) => term.id === enTerm.id);
      if (localTerm) {
        termAlternates[l] = `${BASE_URL}/${l}/${GLOSSARY_SEGMENTS[l as keyof typeof GLOSSARY_SEGMENTS]}/${localTerm.slug}`;
      }
    }
    termAlternates['x-default'] = termAlternates['en'];

    for (const locale of locales) {
      const localTerms = termsByLocale.get(locale)!;
      const localTerm = localTerms.find((term) => term.id === enTerm.id);
      if (!localTerm) continue;

      routes.push({
        url: `${BASE_URL}/${locale}/${GLOSSARY_SEGMENTS[locale as keyof typeof GLOSSARY_SEGMENTS]}/${localTerm.slug}`,
        changeFrequency: 'weekly',
        priority: 0.5,
        alternates: { languages: termAlternates },
      });
    }
  }

  // ── Park pages ────────────────────────────────────────────────────────────
  // Continent/country/city hub pages excluded — crawl budget reserved for park detail pages.
  for (const continent of geo.continents) {
    for (const country of continent.countries) {
      for (const city of country.cities) {
        for (const park of city.parks) {
          const parkPath = `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`;
          const parkAlternates = buildAlternates(() => parkPath);

          for (const locale of locales) {
            routes.push({
              url: `${BASE_URL}/${locale}${parkPath}`,
              changeFrequency: 'daily',
              priority: 1.0,
              alternates: parkAlternates,
            });
          }
        }
      }
    }
  }

  // Attraction pages excluded — crawl budget focused on high-value park pages.

  return routes;
}
