import type { MetadataRoute } from 'next';
import { getGeoStructure } from '@/lib/api/discovery';
import { getContentLastmodIndex } from '@/lib/seo/content-changes/store';
import { getParkImageSet } from '@/lib/utils/park-assets';
import { locales, SITE_URL } from '@/i18n/config';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { GLOSSARY_CONTENT_DATE } from '@/lib/glossary/content-date';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
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
  const [geo, lastmodIndex] = await Promise.all([getGeoStructure(86400), getContentLastmodIndex()]);
  const routes: MetadataRoute.Sitemap = [];

  /**
   * `<lastmod>` for a catalog URL, as the daily content-change crawl observed it.
   *
   * Returns `undefined` for a path the crawl has not seen yet — a park added
   * since the last run — which leaves the entry exactly as it was before this
   * existed. Never a guess and never today's date: a value that is identical on
   * every URL is what gets a sitemap's `lastmod` discounted wholesale. See
   * `lib/seo/content-changes/fingerprint.ts`.
   */
  const lastModified = (contentPath: string): Date | undefined => {
    const changedAt = lastmodIndex.get(contentPath);
    return changedAt ? new Date(changedAt) : undefined;
  };

  // ── Static pages ──────────────────────────────────────────────────────────
  // Impressum/Datenschutz are intentionally absent: they are noindex pages,
  // and noindex URLs in a sitemap trigger Search Console errors.
  const homepageAlternates = buildAlternates(() => '');
  const parksAlternates = buildAlternates(() => '/parks');
  const searchAlternates = buildAlternates(() => '/search');
  const fancastAlternates = buildAlternates(() => '/fancast');
  const contributeAlternates = buildAlternates(() => '/contribute');

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
        lastModified: lastModified('/parks'),
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
        url: `${BASE_URL}/${locale}/fancast`,
        changeFrequency: 'weekly',
        priority: 0.5,
        alternates: fancastAlternates,
      },
      // `index, follow` and canonical-per-locale, but it was missing here — an indexable page
      // that no sitemap lists is discoverable only via internal links.
      {
        url: `${BASE_URL}/${locale}/contribute`,
        changeFrequency: 'monthly',
        priority: 0.4,
        alternates: contributeAlternates,
      }
    );
  }

  // ── "How park.fan works" guide ────────────────────────────────────────────
  // Its own loop rather than a line in the static block above: the URL segment
  // differs per locale, so the alternates map has to be built from the segment
  // table. Priority 0.8 — it is the page every other surface links to when it
  // needs to explain what a badge, a percentile or a forecast means.
  const howtoAlternates = buildAlternates(
    (l) => `/${HOWTO_SEGMENTS[l as keyof typeof HOWTO_SEGMENTS]}`
  );

  for (const locale of locales) {
    routes.push({
      url: `${BASE_URL}/${locale}/${HOWTO_SEGMENTS[locale as keyof typeof HOWTO_SEGMENTS]}`,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: howtoAlternates,
    });
  }

  // ── Best time to visit hub ────────────────────────────────────────────────
  const bestTimeAlternates = buildAlternates(
    (l) => `/${BEST_TIME_SEGMENTS[l as keyof typeof BEST_TIME_SEGMENTS]}`
  );

  for (const locale of locales) {
    routes.push({
      url: `${BASE_URL}/${locale}/${BEST_TIME_SEGMENTS[locale as keyof typeof BEST_TIME_SEGMENTS]}`,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: bestTimeAlternates,
    });
  }

  // ── Glossary pages ────────────────────────────────────────────────────────
  const glossaryIndexAlternates = buildAlternates(
    (l) => `/${GLOSSARY_SEGMENTS[l as keyof typeof GLOSSARY_SEGMENTS]}`
  );

  for (const locale of locales) {
    routes.push({
      url: `${BASE_URL}/${locale}/${GLOSSARY_SEGMENTS[locale as keyof typeof GLOSSARY_SEGMENTS]}`,
      // Hand-maintained rather than observed: the glossary is prerendered from files
      // in this repo, so the review date is simply known — see
      // lib/glossary/content-date.ts. Park and ride URLs get theirs from the daily
      // content-change crawl instead, because nothing writes their date down.
      lastModified: new Date(GLOSSARY_CONTENT_DATE),
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
        lastModified: new Date(GLOSSARY_CONTENT_DATE),
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates: { languages: termAlternates },
      });
    }
  }

  // ── Geo hub + park pages ──────────────────────────────────────────────────
  // Hub pages target head terms ("freizeitparks deutschland", "theme parks
  // florida") that competitors rank overview pages for — they were previously
  // excluded for crawl budget, but the SERP evidence (July 2026) showed the
  // country/city intent is real. Single-park cities are excluded: the city
  // page 308s to its only park (thin-duplicate rule in the city page).
  for (const continent of geo.continents) {
    const continentPath = `/parks/${continent.slug}`;
    const continentAlternates = buildAlternates(() => continentPath);
    const continentLastModified = lastModified(continentPath);
    for (const locale of locales) {
      routes.push({
        url: `${BASE_URL}/${locale}${continentPath}`,
        lastModified: continentLastModified,
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: continentAlternates,
      });
    }

    for (const country of continent.countries) {
      const countryPath = `/parks/${continent.slug}/${country.slug}`;
      const countryAlternates = buildAlternates(() => countryPath);
      const countryLastModified = lastModified(countryPath);
      for (const locale of locales) {
        routes.push({
          url: `${BASE_URL}/${locale}${countryPath}`,
          lastModified: countryLastModified,
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: countryAlternates,
        });
      }

      for (const city of country.cities) {
        if (city.parks.length > 1) {
          const cityPath = `/parks/${continent.slug}/${country.slug}/${city.slug}`;
          const cityAlternates = buildAlternates(() => cityPath);
          const cityLastModified = lastModified(cityPath);
          for (const locale of locales) {
            routes.push({
              url: `${BASE_URL}/${locale}${cityPath}`,
              lastModified: cityLastModified,
              changeFrequency: 'weekly',
              priority: 0.6,
              alternates: cityAlternates,
            });
          }
        }

        for (const park of city.parks) {
          const parkPath = `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`;
          const parkAlternates = buildAlternates(() => parkPath);
          const parkLastModified = lastModified(parkPath);
          // Image sitemap extension: associates the park's hero photo(s) with its URL so Google can
          // pick one as the SERP thumbnail (Google-recommended over relying on in-page discovery
          // alone). Uses the full aspect-ratio set when present, else the single base image.
          const parkImageSet = getParkImageSet(park.slug);
          const parkImages = parkImageSet.length
            ? parkImageSet.map((src) => `${BASE_URL}${src}`)
            : undefined;

          for (const locale of locales) {
            routes.push({
              url: `${BASE_URL}/${locale}${parkPath}`,
              lastModified: parkLastModified,
              changeFrequency: 'daily',
              priority: 1.0,
              alternates: parkAlternates,
              ...(parkImages && { images: parkImages }),
            });
          }
        }
      }
    }
  }

  // Attraction pages live in a separate lean sitemap (app/sitemap-attractions.xml/
  // route.ts, referenced from robots.ts): ~35k locale URLs would blow this file up
  // past sitemap size limits if they carried the full hreflang alternate set.

  // ── Blog pages ────────────────────────────────────────────────────────────
  const { listPosts, buildPostAlternates, getTranslationIndex, hasPublishedPosts } =
    await import('@/lib/blog');
  const { buildCategoryTree, filterPostsByCategory, parseCategoryPath } =
    await import('@/lib/blog/categories');

  /**
   * When a blog LISTING page last changed: the newest post it shows.
   *
   * These pages carry no date of their own — an index, a category, a tag and an
   * author profile are all just a filtered list — but they change the moment a
   * post lands in them, and that is a date the frontmatter already states. It is
   * the same claim the posts' own entries make, so it costs nothing to be right
   * about. `undefined` for an empty list rather than today's date.
   */
  const newestPostDate = (
    posts: readonly { frontmatter: { date: string; updatedAt?: string } }[]
  ): Date | undefined => {
    let newest = '';
    for (const post of posts) {
      const dated = post.frontmatter.updatedAt ?? post.frontmatter.date;
      if (dated > newest) newest = dated;
    }
    return newest ? new Date(newest) : undefined;
  };

  // The blog only exists for the frontend once something is published —
  // keep the index + posts + category/tag pages out of the sitemap until then.
  if (!hasPublishedPosts()) return routes;

  // German-first rollout: blog surfaces (index, categories, tags, authors,
  // feeds) exist ONLY in locales that actually list posts. Locales without
  // posts 404 their blog routes, so they must stay out of the sitemap and
  // out of each other's hreflang alternates.
  const blogLocales = locales.filter((l) => hasPublishedPosts(l));
  const buildBlogAlternates = (
    pathFn: (locale: string) => string
  ): { languages: Record<string, string> } => ({
    languages: Object.fromEntries([
      ...blogLocales.map((l) => [l, `${BASE_URL}/${l}${pathFn(l)}`]),
      ...(blogLocales.includes('en') ? [['x-default', `${BASE_URL}/en${pathFn('en')}`]] : []),
    ]),
  });

  const blogIndexAlternates = buildBlogAlternates(() => '/blog');
  for (const locale of blogLocales) {
    routes.push({
      url: `${BASE_URL}/${locale}/blog`,
      lastModified: newestPostDate(listPosts(locale as import('@/i18n/config').Locale)),
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
  for (const locale of blogLocales) {
    const posts = listPosts(locale as import('@/i18n/config').Locale);
    const { flat } = buildCategoryTree(locale as import('@/i18n/config').Locale);
    for (const path of flat.keys()) {
      routes.push({
        url: `${BASE_URL}/${locale}/blog/category/${path}`,
        // Descendants included, exactly as the page lists them.
        lastModified: newestPostDate(filterPostsByCategory(posts, parseCategoryPath(path))),
        changeFrequency: 'weekly',
        priority: 0.4,
        alternates: buildBlogAlternates(() => `/blog/category/${path}`),
      });
    }
  }

  // Blog tag pages. Unlike categories, tag slugs are TRANSLATED per locale
  // ("wartezeiten" / "wait-times"), so `buildBlogAlternates` — which reuses one path for
  // every locale — would emit alternates that 404. `buildTagAlternates` resolves each
  // locale's real slug and drops locales where the tag has no page.
  // Only tags at or above TAG_INDEX_MIN_POSTS: the thin ones render `noindex`, and a
  // sitemap advertising a page that asks not to be indexed is a contradiction we would
  // be sending on purpose. Both sides read the same threshold from `@/lib/blog/tags`,
  // so a tag crossing it reappears here and drops its robots meta in the same build.
  const { listTags, buildTagAlternates, normalizeTagSlug, TAG_INDEX_MIN_POSTS } =
    await import('@/lib/blog/tags');
  for (const locale of blogLocales) {
    const posts = listPosts(locale as import('@/i18n/config').Locale);
    for (const tag of listTags(locale as import('@/i18n/config').Locale)) {
      if (tag.count < TAG_INDEX_MIN_POSTS) continue;
      const tagAlternates = buildTagAlternates(locale as import('@/i18n/config').Locale, tag.slug);
      if (tagAlternates['en']) tagAlternates['x-default'] = tagAlternates['en'];
      routes.push({
        url: `${BASE_URL}/${locale}/blog/tag/${tag.slug}`,
        lastModified: newestPostDate(
          posts.filter((p) =>
            (p.frontmatter.tags ?? []).some((t) => normalizeTagSlug(t) === tag.slug)
          )
        ),
        changeFrequency: 'weekly',
        priority: 0.4,
        alternates: { languages: tagAlternates },
      });
    }
  }

  // Blog author pages
  const { listAuthorKeys, resolveAuthor } = await import('@/lib/blog/authors');
  for (const locale of blogLocales) {
    const posts = listPosts(locale as import('@/i18n/config').Locale);
    for (const author of listAuthorKeys()) {
      routes.push({
        url: `${BASE_URL}/${locale}/blog/authors/${author}`,
        lastModified: newestPostDate(
          posts.filter(
            (p) =>
              resolveAuthor(p.frontmatter.author, locale as import('@/i18n/config').Locale).key ===
              author
          )
        ),
        changeFrequency: 'weekly',
        priority: 0.4,
        alternates: buildBlogAlternates(() => `/blog/authors/${author}`),
      });
    }
  }

  return routes;
}
