import type { MetadataRoute } from 'next';
import { getGeoStructure } from '@/lib/api/discovery';
import { locales, SITE_URL } from '@/i18n/config';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import type { GlossaryTerm } from '@/lib/glossary/types';

const BASE_URL = SITE_URL;

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
  // Impressum/Datenschutz are intentionally absent: they are noindex pages,
  // and noindex URLs in a sitemap trigger Search Console errors.
  const homepageAlternates = buildAlternates(() => '');
  const parksAlternates = buildAlternates(() => '/parks');
  const searchAlternates = buildAlternates(() => '/search');
  const howtoAlternates = buildAlternates(() => '/howto');

  for (const locale of locales) {
    routes.push(
      {
        url: `${BASE_URL}/${locale}`,
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: homepageAlternates,
      },
      {
        url: `${BASE_URL}/${locale}/parks`,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: parksAlternates,
      },
      {
        url: `${BASE_URL}/${locale}/search`,
        changeFrequency: 'monthly',
        priority: 0.5,
        alternates: searchAlternates,
      },
      {
        url: `${BASE_URL}/${locale}/howto`,
        changeFrequency: 'monthly',
        priority: 0.4,
        alternates: howtoAlternates,
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
      priority: 0.5,
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

  const termMapsByLocale = new Map<string, Map<string, GlossaryTerm>>();
  for (const [locale, terms] of termsByLocale) {
    termMapsByLocale.set(locale, new Map(terms.map((t) => [t.id, t])));
  }

  const enTerms = termsByLocale.get('en')!;
  for (const enTerm of enTerms) {
    const termAlternates: Record<string, string> = {};
    for (const l of locales) {
      const localTerm = termMapsByLocale.get(l)!.get(enTerm.id);
      if (localTerm) {
        termAlternates[l] =
          `${BASE_URL}/${l}/${GLOSSARY_SEGMENTS[l as keyof typeof GLOSSARY_SEGMENTS]}/${localTerm.slug}`;
      }
    }
    termAlternates['x-default'] = termAlternates['en'];

    for (const locale of locales) {
      const localTerm = termMapsByLocale.get(locale)!.get(enTerm.id);
      if (!localTerm) continue;

      routes.push({
        url: `${BASE_URL}/${locale}/${GLOSSARY_SEGMENTS[locale as keyof typeof GLOSSARY_SEGMENTS]}/${localTerm.slug}`,
        changeFrequency: 'monthly',
        priority: 0.8,
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

  // ── Blog pages ────────────────────────────────────────────────────────────
  const { listPosts, buildPostAlternates, getTranslationIndex, hasPublishedPosts } =
    await import('@/lib/blog');
  const { buildCategoryTree } = await import('@/lib/blog/categories');

  // The blog only exists for the frontend once something is published —
  // keep the index + posts + category/tag pages out of the sitemap until then.
  if (!hasPublishedPosts()) return routes;

  const blogIndexAlternates = buildAlternates(() => '/blog');
  for (const locale of locales) {
    routes.push({
      url: `${BASE_URL}/${locale}/blog`,
      changeFrequency: 'daily',
      priority: 0.7,
      alternates: blogIndexAlternates,
    });
  }

  // Blog posts — alternates per translationKey use locale-specific slugs.
  // Only locales with a real translation are listed: EN-fallback URLs
  // (e.g. /de/blog/<en-slug>) canonicalize to the EN original and must not
  // appear in the sitemap or in hreflang alternates.
  const translationIndex = getTranslationIndex();
  for (const [translationKey, localeMap] of translationIndex) {
    const alternates = buildPostAlternates(translationKey);
    if (alternates['en']) alternates['x-default'] = alternates['en'];

    for (const locale of locales) {
      if (!localeMap.get(locale as import('@/i18n/config').Locale)) continue;
      const posts = listPosts(locale as import('@/i18n/config').Locale);
      const post = posts.find((p) => p.translationKey === translationKey);
      if (!post) continue;
      const lastMod = post.frontmatter.updatedAt ?? post.frontmatter.date;
      routes.push({
        url: alternates[locale] ?? `${BASE_URL}/${locale}/blog/${post.slug}`,
        lastModified: new Date(lastMod),
        changeFrequency: 'monthly',
        priority: 0.6,
        alternates: { languages: alternates },
      });
    }
  }

  // Blog category pages
  for (const locale of locales) {
    const { flat } = buildCategoryTree(locale as import('@/i18n/config').Locale);
    for (const path of flat.keys()) {
      routes.push({
        url: `${BASE_URL}/${locale}/blog/category/${path}`,
        changeFrequency: 'weekly',
        priority: 0.4,
        alternates: buildAlternates(() => `/blog/category/${path}`),
      });
    }
  }

  // Blog tag pages
  const { listTags } = await import('@/lib/blog/tags');
  for (const locale of locales) {
    for (const tag of listTags(locale as import('@/i18n/config').Locale)) {
      routes.push({
        url: `${BASE_URL}/${locale}/blog/tag/${tag.slug}`,
        changeFrequency: 'weekly',
        priority: 0.4,
        alternates: buildAlternates(() => `/blog/tag/${tag.slug}`),
      });
    }
  }

  // Blog author pages
  const { listAuthorKeys } = await import('@/lib/blog/authors');
  for (const locale of locales) {
    for (const author of listAuthorKeys()) {
      routes.push({
        url: `${BASE_URL}/${locale}/blog/authors/${author}`,
        changeFrequency: 'weekly',
        priority: 0.4,
        alternates: buildAlternates(() => `/blog/authors/${author}`),
      });
    }
  }

  return routes;
}
