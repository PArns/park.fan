import type { MetadataRoute } from 'next';
import { getGeoStructure } from '@/lib/api/discovery';
import { CACHE_TTL } from '@/lib/api/cache-config';
import { getContentLastmodIndex } from '@/lib/seo/content-changes/store';
import { getChangelogEntries } from '@/lib/changelog';
import { getParkImageSet } from '@/lib/utils/park-assets';
import { locales, SITE_URL, type Locale } from '@/i18n/config';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { GLOSSARY_CONTENT_DATE } from '@/lib/glossary/content-date';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import { PARK_CALENDAR_SEGMENTS } from '@/lib/parks/calendar-segments';
import { PARK_STATS_SEGMENTS } from '@/lib/parks/stats-segments';
import { PARK_KIDS_SEGMENTS } from '@/lib/parks/kids-segments';
import { parksWithKidsPage } from '@/lib/api/kids-page';
import { parkGeoKey, parksWithStatsPage, type ParkGeoPath } from '@/lib/api/stats';
import { categoryPath, NEWS_INDEX_PATH, postPath } from '@/lib/blog/paths';
import { brandParksByCountry, PARK_BRANDS } from '@/lib/parks/park-brands';
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
  const [geo, lastmodIndex] = await Promise.all([
    getGeoStructure(CACHE_TTL.geoSitemap),
    getContentLastmodIndex(),
  ]);
  const routes: MetadataRoute.Sitemap = [];

  /**
   * Every park in the catalogue, collected as the geo loop walks it, so the wait-time record's
   * availability can be resolved in one batched pass afterwards instead of park by park inside
   * four nested loops.
   */
  const catalogue: ParkGeoPath[] = [];

  /**
   * `<lastmod>` for a catalog URL, as the daily content-change crawl observed it, or `undefined`
   * for a path the crawl has not seen. Never today's date: a value identical on every URL gets a
   * sitemap's `lastmod` discounted wholesale. See `lib/seo/content-changes/fingerprint.ts`.
   */
  const lastModified = (contentPath: string): Date | undefined => {
    const changedAt = lastmodIndex.get(contentPath);
    return changedAt ? new Date(changedAt) : undefined;
  };

  // Impressum/Datenschutz are intentionally absent: they are noindex pages,
  // and noindex URLs in a sitemap trigger Search Console errors.
  const homepageAlternates = buildAlternates(() => '');
  const parksAlternates = buildAlternates(() => '/parks');
  // Without a park of the brand the page is a 404, and a sitemap entry never is.
  const brandPages = PARK_BRANDS.filter((brand) => brandParksByCountry(geo, brand).length > 0).map(
    (brand) => {
      const path = `/parks/${brand.slug}`;
      return { path, alternates: buildAlternates(() => path) };
    }
  );
  const fancastAlternates = buildAlternates(() => '/fancast');
  const contributeAlternates = buildAlternates(() => '/contribute');

  for (const locale of locales) {
    routes.push(
      {
        url: `${BASE_URL}/${locale}`,
        alternates: homepageAlternates,
      },
      {
        url: `${BASE_URL}/${locale}/parks`,
        lastModified: lastModified('/parks'),
        alternates: parksAlternates,
      },
      ...brandPages.map(({ path, alternates }) => ({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: lastModified(path),
        alternates,
      })),
      {
        url: `${BASE_URL}/${locale}/fancast`,
        alternates: fancastAlternates,
      },
      {
        url: `${BASE_URL}/${locale}/contribute`,
        alternates: contributeAlternates,
      }
    );
  }

  // One URL without `alternates`: the changelog is English only and the other five spellings are
  // 301s. Its date is the newest published entry's, and with no entry the page is a 404, so it is
  // not listed.
  const changelogEntries = getChangelogEntries();
  if (changelogEntries.length > 0) {
    routes.push({
      url: `${BASE_URL}/en/changelog`,
      lastModified: new Date(`${changelogEntries[0].date}T00:00:00Z`),
    });
  }

  // Priority 0.8: the guide is what every other surface links to when it explains a badge, a
  // percentile or a forecast.
  const howtoAlternates = buildAlternates(
    (l) => `/${HOWTO_SEGMENTS[l as keyof typeof HOWTO_SEGMENTS]}`
  );

  for (const locale of locales) {
    routes.push({
      url: `${BASE_URL}/${locale}/${HOWTO_SEGMENTS[locale as keyof typeof HOWTO_SEGMENTS]}`,
      alternates: howtoAlternates,
    });
  }

  const plannerAlternates = buildAlternates(
    (l) => `/${PLANNER_SEGMENTS[l as keyof typeof PLANNER_SEGMENTS]}`
  );

  for (const locale of locales) {
    routes.push({
      url: `${BASE_URL}/${locale}/${PLANNER_SEGMENTS[locale as keyof typeof PLANNER_SEGMENTS]}`,
      alternates: plannerAlternates,
    });
  }

  const bestTimeAlternates = buildAlternates(
    (l) => `/${BEST_TIME_SEGMENTS[l as keyof typeof BEST_TIME_SEGMENTS]}`
  );

  for (const locale of locales) {
    routes.push({
      url: `${BASE_URL}/${locale}/${BEST_TIME_SEGMENTS[locale as keyof typeof BEST_TIME_SEGMENTS]}`,
      alternates: bestTimeAlternates,
    });
  }

  const glossaryIndexAlternates = buildAlternates(
    (l) => `/${GLOSSARY_SEGMENTS[l as keyof typeof GLOSSARY_SEGMENTS]}`
  );

  for (const locale of locales) {
    routes.push({
      url: `${BASE_URL}/${locale}/${GLOSSARY_SEGMENTS[locale as keyof typeof GLOSSARY_SEGMENTS]}`,
      // Known rather than observed: the glossary is prerendered from files in this repo, so its
      // review date is written down in lib/glossary/content-date.ts.
      lastModified: new Date(GLOSSARY_CONTENT_DATE),
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
        alternates: { languages: termAlternates },
      });
    }
  }

  // Hub pages target head terms ("freizeitparks deutschland", "theme parks florida").
  // Single-park cities are left out: that city page 308s to its only park.
  for (const continent of geo.continents) {
    const continentPath = `/parks/${continent.slug}`;
    const continentAlternates = buildAlternates(() => continentPath);
    const continentLastModified = lastModified(continentPath);
    for (const locale of locales) {
      routes.push({
        url: `${BASE_URL}/${locale}${continentPath}`,
        lastModified: continentLastModified,
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
              alternates: cityAlternates,
            });
          }
        }

        for (const park of city.parks) {
          const parkPath = `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`;
          catalogue.push({
            continent: continent.slug,
            country: country.slug,
            city: city.slug,
            parkSlug: park.slug,
          });
          const parkAlternates = buildAlternates(() => parkPath);
          const parkLastModified = lastModified(parkPath);
          // Image sitemap extension, so Google can pick the park's hero photo as the result
          // thumbnail.
          const parkImageSet = getParkImageSet(park.slug);
          const parkImages = parkImageSet.length
            ? parkImageSet.map((src) => `${BASE_URL}${src}`)
            : undefined;

          for (const locale of locales) {
            routes.push({
              url: `${BASE_URL}/${locale}${parkPath}`,
              lastModified: parkLastModified,
              alternates: parkAlternates,
              ...(parkImages && { images: parkImages }),
            });
          }

          // The crowd calendar answers "wann ist es leer", with far less competition than
          // "wartezeiten", so it is listed on its own. Weekly: a forecast three weeks out barely
          // moves. No `lastModified`: `parkLastModified` dates the park's editorial content, which
          // this page does not render, and its forecast moves on every park at once.
          const calendarAlternates = buildAlternates(
            (locale) => `${parkPath}/${PARK_CALENDAR_SEGMENTS[locale as Locale]}`
          );
          for (const locale of locales) {
            routes.push({
              url: `${BASE_URL}/${locale}${parkPath}/${PARK_CALENDAR_SEGMENTS[locale]}`,
              alternates: calendarAlternates,
            });
          }
          // The month pages under this hub live in `/sitemap-calendar.xml`, which keeps this file
          // under the 50 MB limit. See docs/seo/sitemaps.md.
        }
      }
    }
  }

  // The wait-time record, gated on `meta.displayable`, the same flag the route 404s on, so the
  // sitemap never advertises a 404. See `docs/seo/park-sub-pages.md#average-wait-times-par-371`. No
  // `lastModified`: the aggregate is recomputed daily on every park at once, so a date would be
  // one identical value across the class. Monthly, because a two-year window barely moves in a
  // week. The probes read the `CACHE_TTL.stats` entries the record and calendar pages read.
  const statsParks = await parksWithStatsPage(catalogue);
  for (const park of catalogue) {
    if (!statsParks.has(parkGeoKey(park))) continue;
    const parkPath = `/parks/${park.continent}/${park.country}/${park.city}/${park.parkSlug}`;
    const statsAlternates = buildAlternates(
      (locale) => `${parkPath}/${PARK_STATS_SEGMENTS[locale as Locale]}`
    );
    for (const locale of locales) {
      routes.push({
        url: `${BASE_URL}/${locale}${parkPath}/${PARK_STATS_SEGMENTS[locale]}`,
        alternates: statsAlternates,
      });
    }
  }

  // The "with kids" page, gated on `kidsPageData`, the same predicate the route 404s on. The probe
  // reads the park payload the park pages already read. No `lastModified`, for the reason the
  // record above has none.
  const kidsParks = await parksWithKidsPage(catalogue);
  for (const park of catalogue) {
    if (!kidsParks.has(parkGeoKey(park))) continue;
    const parkPath = `/parks/${park.continent}/${park.country}/${park.city}/${park.parkSlug}`;
    const kidsAlternates = buildAlternates(
      (locale) => `${parkPath}/${PARK_KIDS_SEGMENTS[locale as Locale]}`
    );
    for (const locale of locales) {
      routes.push({
        url: `${BASE_URL}/${locale}${parkPath}/${PARK_KIDS_SEGMENTS[locale]}`,
        alternates: kidsAlternates,
      });
    }
  }

  // Attraction pages live in `/sitemap-attractions.xml`, without hreflang: with the alternate set
  // they would push this file past the sitemap size limits.

  const {
    listPosts,
    listArticles,
    listNewsByDate,
    buildPostAlternates,
    getTranslationIndex,
    hasPublishedPosts,
  } = await import('@/lib/blog');
  const { buildCategoryTree, filterPostsByCategory, parseCategoryPath } =
    await import('@/lib/blog/categories');

  /**
   * When a blog listing page last changed: the date of the newest post it shows, or `undefined`
   * for an empty list rather than today's date.
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

  // Blog surfaces exist only in locales that list posts. The others 404 their blog routes, so
  // they stay out of the sitemap and out of each other's hreflang alternates.
  const blogLocales = locales.filter((l) => hasPublishedPosts(l));
  const buildBlogAlternates = (
    pathFn: (locale: string) => string
  ): { languages: Record<string, string> } => ({
    languages: Object.fromEntries([
      ...blogLocales.map((l) => [l, `${BASE_URL}/${l}${pathFn(l)}`]),
      ...(blogLocales.includes('en') ? [['x-default', `${BASE_URL}/en${pathFn('en')}`]] : []),
    ]),
  });

  // The blog index lists the articles and the news overview the news — two sections that never
  // share a post — so each one's date is the newest post IT shows.
  const blogIndexAlternates = buildBlogAlternates(() => '/blog');
  for (const locale of blogLocales) {
    routes.push({
      url: `${BASE_URL}/${locale}/blog`,
      lastModified: newestPostDate(listArticles(locale as import('@/i18n/config').Locale)),
      alternates: blogIndexAlternates,
    });
  }

  const newsLocales = blogLocales.filter(
    (l) => listNewsByDate(l as import('@/i18n/config').Locale).length > 0
  );
  const newsIndexAlternates = {
    languages: Object.fromEntries([
      ...newsLocales.map((l) => [l, `${BASE_URL}/${l}${NEWS_INDEX_PATH}`]),
      ...(newsLocales.includes('en') ? [['x-default', `${BASE_URL}/en${NEWS_INDEX_PATH}`]] : []),
    ]),
  };
  for (const locale of newsLocales) {
    routes.push({
      url: `${BASE_URL}/${locale}${NEWS_INDEX_PATH}`,
      lastModified: newestPostDate(listNewsByDate(locale as import('@/i18n/config').Locale)),
      alternates: newsIndexAlternates,
    });
  }

  // Only locales with a real translation: EN-fallback URLs (/de/blog/<en-slug>) canonicalize to
  // the EN original and must not appear in the sitemap or in hreflang alternates.
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
        url: alternates[locale] ?? `${BASE_URL}/${locale}${postPath(post)}`,
        lastModified: new Date(lastMod),
        alternates: { languages: alternates },
      });
    }
  }

  // Articles only: news is not a blog category.
  for (const locale of blogLocales) {
    const posts = listArticles(locale as import('@/i18n/config').Locale);
    const { flat } = buildCategoryTree(locale as import('@/i18n/config').Locale);
    for (const path of flat.keys()) {
      routes.push({
        url: `${BASE_URL}/${locale}${categoryPath(path)}`,
        // Descendants included, exactly as the page lists them.
        lastModified: newestPostDate(filterPostsByCategory(posts, parseCategoryPath(path))),
        alternates: buildBlogAlternates(() => categoryPath(path)),
      });
    }
  }

  // Tag slugs are translated per locale ("wartezeiten" / "wait-times"), so `buildBlogAlternates`
  // would emit alternates that 404; `buildTagAlternates` resolves each locale's slug. Tags below
  // TAG_INDEX_MIN_POSTS render `noindex` and stay out; the page reads the same threshold.
  const { listIndexableTags, buildTagAlternates, normalizeTagSlug } =
    await import('@/lib/blog/tags');
  for (const locale of blogLocales) {
    const posts = listArticles(locale as import('@/i18n/config').Locale);
    for (const tag of listIndexableTags(locale as import('@/i18n/config').Locale)) {
      const tagAlternates = buildTagAlternates(locale as import('@/i18n/config').Locale, tag.slug);
      if (tagAlternates['en']) tagAlternates['x-default'] = tagAlternates['en'];
      routes.push({
        url: `${BASE_URL}/${locale}/blog/tag/${tag.slug}`,
        lastModified: newestPostDate(
          posts.filter((p) =>
            (p.frontmatter.tags ?? []).some((t) => normalizeTagSlug(t) === tag.slug)
          )
        ),
        alternates: { languages: tagAlternates },
      });
    }
  }

  const { listAuthorKeys, resolveAuthor } = await import('@/lib/blog/authors');
  for (const locale of blogLocales) {
    const posts = listArticles(locale as import('@/i18n/config').Locale);
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
        alternates: buildBlogAlternates(() => `/blog/authors/${author}`),
      });
    }
  }

  return routes;
}
