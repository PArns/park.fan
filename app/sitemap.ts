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
import { parkGeoKey, parksWithStatsPage, type ParkGeoPath } from '@/lib/api/stats';
import { categoryPath, NEWS_INDEX_PATH, postPath } from '@/lib/blog/paths';
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

  // ── Changelog ─────────────────────────────────────────────────────────────
  // One URL, outside the locale loop and without an `alternates` map: the page
  // is English only (`app/[locale]/changelog/page.tsx`), and the other five
  // spellings are 301s. Listing them as hreflang alternates would advertise
  // five URLs that answer with a redirect.
  //
  // `lastModified` is the date of the newest published entry, which is the day
  // that page last changed — no crawl needed, the content carries its own date.
  //
  // Listed only while there is something to list: with no published entry the
  // page answers `notFound()`, and a sitemap that advertises a 404 is worse
  // than one that omits the URL.
  const changelogEntries = getChangelogEntries();
  if (changelogEntries.length > 0) {
    routes.push({
      url: `${BASE_URL}/en/changelog`,
      lastModified: new Date(`${changelogEntries[0].date}T00:00:00Z`),
      changeFrequency: 'monthly',
      priority: 0.4,
    });
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

  // ── Trip planner ──────────────────────────────────────────────────────────
  const plannerAlternates = buildAlternates(
    (l) => `/${PLANNER_SEGMENTS[l as keyof typeof PLANNER_SEGMENTS]}`
  );

  for (const locale of locales) {
    routes.push({
      url: `${BASE_URL}/${locale}/${PLANNER_SEGMENTS[locale as keyof typeof PLANNER_SEGMENTS]}`,
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: plannerAlternates,
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
          catalogue.push({
            continent: continent.slug,
            country: country.slug,
            city: city.slug,
            parkSlug: park.slug,
          });
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

          // The crowd calendar, which was `#calendar` on the park page and therefore in no
          // sitemap at all — a hash is not a URL. It answers "wann ist es leer", a question with
          // far less competition than "wartezeiten", so it belongs in the index on its own.
          // Weekly rather than daily: the forecast for a day three weeks out barely moves, and
          // the park page above already carries the daily signal for this park.
          //
          // No `lastModified`, deliberately. `parkLastModified` is the day this park's EDITORIAL
          // content changed — a ride renamed, a photo swapped — and none of that is what this
          // page renders, so repeating it here would be a date about a different page. The
          // calendar's own content is a forecast that moves a little every day on all 212 parks
          // at once, which is precisely the identical-date-everywhere value the fingerprint
          // detector exists to avoid emitting. Absent is the honest answer until there is a
          // fingerprint for what a calendar actually shows.
          const calendarAlternates = buildAlternates(
            (locale) => `${parkPath}/${PARK_CALENDAR_SEGMENTS[locale as Locale]}`
          );
          for (const locale of locales) {
            routes.push({
              url: `${BASE_URL}/${locale}${parkPath}/${PARK_CALENDAR_SEGMENTS[locale]}`,
              changeFrequency: 'weekly',
              priority: 0.8,
              alternates: calendarAlternates,
            });
          }
          // The month pages under this hub live in `/sitemap-calendar.xml`, not here. One build
          // with them inline measured this file at 39.5 MB against a 50 MB limit — see that
          // route for the arithmetic and why the split mirrors the attractions one.
        }
      }
    }
  }

  // ── The wait-time record, for the parks that have one ─────────────────────
  // Gated on `meta.displayable`, the same flag the route 404s on: 119 of the 201 parks with
  // attractions passed on 2026-09-21, which is 714 URLs rather than 1,206. The other 492 would
  // have been tables built from a handful of measured days, 222 of them from none at all — and
  // every one of them a 404 advertised in a sitemap, which is the one thing worse than not
  // advertising the page at all. See `docs/seo/dedicated-landing-pages.md` §5.
  //
  // No `lastModified`, for the same reason the calendar hub above carries none: the aggregate
  // behind these pages is recomputed daily on every park at once, so a date here would be one
  // identical value across the whole class — precisely the signal that gets a sitemap's `lastmod`
  // discounted wholesale. Monthly, because a two-year window barely moves in a week.
  //
  // This is 201 probes on a cold Data Cache and none on a warm one: the answers are the very
  // entries the record pages and the calendar pages read, all on `CACHE_TTL.stats`.
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
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: statsAlternates,
      });
    }
  }

  // Attraction pages live in a separate lean sitemap (app/sitemap-attractions.xml/
  // route.ts, referenced from robots.ts): ~35k locale URLs would blow this file up
  // past sitemap size limits if they carried the full hreflang alternate set.

  // ── Blog pages ────────────────────────────────────────────────────────────
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

  // The blog index lists the articles and the news overview the news — two sections that never
  // share a post — so each one's date is the newest post IT shows.
  const blogIndexAlternates = buildBlogAlternates(() => '/blog');
  for (const locale of blogLocales) {
    routes.push({
      url: `${BASE_URL}/${locale}/blog`,
      lastModified: newestPostDate(listArticles(locale as import('@/i18n/config').Locale)),
      changeFrequency: 'daily',
      priority: 0.7,
      alternates: blogIndexAlternates,
    });
  }

  // The news overview. It used to come out of the category loop below as the news category's
  // page; the category tree holds articles only now, so it is listed here on its own.
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
      changeFrequency: 'daily',
      priority: 0.7,
      alternates: newsIndexAlternates,
    });
  }

  // Blog posts — alternates per translationKey use locale-specific slugs, and
  // news posts sit under `/news` (`postPath`, lib/blog/paths.ts).
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
        url: alternates[locale] ?? `${BASE_URL}/${locale}${postPath(post)}`,
        lastModified: new Date(lastMod),
        changeFrequency: 'monthly',
        priority: 0.6,
        alternates: { languages: alternates },
      });
    }
  }

  // Blog category pages — articles only; news is not a blog category (see the news overview above).
  for (const locale of blogLocales) {
    const posts = listArticles(locale as import('@/i18n/config').Locale);
    const { flat } = buildCategoryTree(locale as import('@/i18n/config').Locale);
    for (const path of flat.keys()) {
      routes.push({
        url: `${BASE_URL}/${locale}${categoryPath(path)}`,
        // Descendants included, exactly as the page lists them.
        lastModified: newestPostDate(filterPostsByCategory(posts, parseCategoryPath(path))),
        changeFrequency: 'weekly',
        priority: 0.4,
        alternates: buildBlogAlternates(() => categoryPath(path)),
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
    const posts = listArticles(locale as import('@/i18n/config').Locale);
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
        changeFrequency: 'weekly',
        priority: 0.4,
        alternates: buildBlogAlternates(() => `/blog/authors/${author}`),
      });
    }
  }

  return routes;
}
