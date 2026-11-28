// The news and guides half of the native app's export (see publish-media-r2.mjs): per locale the
// list `news/<locale>.json` and one body per post `news/<locale>/<slug>.json`, and the same two
// shapes under `guides/` for every post that is not news. Both are built from the site's own
// loaders. A cover or inline photo the card export does not hold yet is added to `chosen`, so it
// is uploaded like any other photo.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

import { SITE_URL, locales } from '../i18n/config.ts';
import { resolveAuthor } from '../lib/blog/authors.ts';
import { galleryWidgetImages } from '../lib/blog/gallery.ts';
import { BLOG_POSTS_META } from '../lib/blog/manifest.ts';
import { getParkSlugsOfPost, getNewsParkRef } from '../lib/blog/backlinks.ts';
import { parseRefKey } from '../lib/blog/derive.mjs';
import { getListItemByLocaleSlug, listPosts } from '../lib/blog/listing.ts';
import { BLOG_POST_BODIES } from '../lib/blog/manifest-bodies.ts';
import { markdownToBlocks, selectGuides, selectNews } from '../lib/blog/news-blocks.ts';
import { postPath } from '../lib/blog/paths.ts';
import { withZoneOffset } from '../lib/blog/published-at.ts';
import { buildGlossaryTermHref } from '../lib/glossary/segments.ts';
import { getGlossaryTerms } from '../lib/glossary/translations.ts';
import { getCreditLine, needsAttribution } from '../lib/media/credit.ts';
import { getMediaImageForPath } from '../lib/media/index.ts';
import { MEDIA_PARK_PATH_BY_SLUG } from '../lib/media/manifest-parks.ts';
import { getMediaAlt } from '../lib/media/text.ts';
import { getPostSearchIndex } from '../lib/navigation/blog-menu.ts';
import { queryWords } from '../lib/navigation/post-search.ts';

/** The bucket's public host; the avatar URLs and the photo index both start here. */
export const MEDIA_BASE = 'https://media.park.fan';
/** The two edge lengths an author avatar ships at, small first. */
export const AVATAR_SIZES = [96, 192];

// A park without photos is not in the media catalog, but any post that links it by its full path
// pins its `continent/country/city`. A slug two parks share is pinned by the post's own path only.
const PINNED = {};
for (const post of BLOG_POSTS_META) {
  for (const ref of post.parkRefs) if (ref.geo?.length === 1) PINNED[ref.slug] ??= ref.geo[0];
}

/** The geo path the photo index keys a park by: the post's own `continent/country/city`, the media catalog's or a pinned one. */
function parkPath(slug, geo) {
  if (geo) return `${geo}/${slug}`;
  if (Object.hasOwn(MEDIA_PARK_PATH_BY_SLUG, slug)) return MEDIA_PARK_PATH_BY_SLUG[slug];
  return Object.hasOwn(PINNED, slug) ? `${PINNED[slug]}/${slug}` : null;
}

/**
 * The parks a news post is about: its label park first, then the parks whose pages list it.
 * `parks` holds the geo paths that are known; `parkSlugs` every slug, for the app to match against
 * its own park list where no path is known.
 */
function parksOf(translationKey) {
  const primary = getNewsParkRef(translationKey);
  const slugs = [
    ...new Set([primary?.slug, ...getParkSlugsOfPost(translationKey)].filter(Boolean)),
  ];
  const paths = [];
  if (primary) paths.push(parkPath(primary.slug, primary.geo?.[0]));
  for (const slug of slugs) paths.push(parkPath(slug));
  return { parks: [...new Set(paths.filter(Boolean))], parkSlugs: slugs };
}

/**
 * The byline as the article header shows it: short name, role and the avatar's URLs in the bucket.
 * The avatar files are registered in `avatars` (key → source file under `public/`, edge length);
 * the key carries a hash of the source, so it is immutable.
 */
function authorOf(key, locale, avatars) {
  const a = resolveAuthor(key, locale);
  let avatar = null;
  let avatarSmall = null;
  if (a.avatar) {
    const src = a.avatar.split('?')[0];
    const hash = createHash('sha1')
      .update(readFileSync(join('public', src)))
      .digest('hex')
      .slice(0, 8);
    const slug = basename(src, extname(src));
    const [small, large] = AVATAR_SIZES.map((w) => {
      const file = `authors/${slug}-${hash}-${w}.webp`;
      avatars.set(file, { src, width: w });
      return `${MEDIA_BASE}/${file}`;
    });
    avatarSmall = small;
    avatar = large;
  }
  return { name: a.shortName ?? a.name, role: a.role ?? null, avatar, avatarSmall };
}

/**
 * A post's search terms without the words its title already holds as whole words. The title counts
 * twice as much as the terms, so the same posts match in the same order, and the list stays an
 * index. Words are compared as the search splits and folds them (`queryWords`).
 */
export function termsBeyondTitle(terms, title) {
  const inTitle = new Set(queryWords(title));
  return terms
    .split(' ')
    .filter((term) => !queryWords(term).every((word) => inTitle.has(word)))
    .join(' ');
}

/** The rides a post lists in `rideLinks`, as `<park geo path>/<ride slug>` where the park is known. */
function ridesOf(rideLinks) {
  const out = [];
  for (const raw of Array.isArray(rideLinks) ? rideLinks : []) {
    const { kind, key, geoPath } = parseRefKey(raw);
    if (kind !== 'ride') continue;
    const [parkSlug, rideSlug] = key.split('/');
    const path = parkPath(parkSlug, geoPath);
    if (path) out.push(`${path}/${rideSlug}`);
  }
  return out;
}

/**
 * @param {Map<string, import('../lib/media/types.ts').MediaImage>} chosen photos to upload; grows
 * @param {Map<string, { src: string; width: number }>} avatars author avatar files to upload, by key; grows
 * @returns {Promise<{ files: { key: string; json: unknown }[]; stats: Record<'news' | 'guides', Record<string, { posts: number; skipped: Record<string, number> }>> }>}
 */
export async function buildNewsExport(chosen, avatars) {
  const generatedAt = new Date().toISOString();
  const files = [];
  const lists = [];
  const stats = {};

  /** The exported photo behind a `/media/…` path, registering it for upload. */
  const photo = (src) => {
    const image = src ? getMediaImageForPath(src) : null;
    if (!image || image.credit.license === 'unknown') return null;
    chosen.set(image.id, image);
    return image;
  };

  for (const locale of locales) {
    const site = `${SITE_URL}/${locale}`;
    const glossary = await getGlossaryTerms(locale);
    const ctx = {
      site,
      refUrl(href) {
        const [value] = href.replace(/^(ref|park|attraction):/, '').split('?');
        const { key, geoPath } = parseRefKey(value);
        const [parkSlug, rideSlug] = key.split('/');
        const path = parkPath(parkSlug, geoPath);
        return path ? `${site}/parks/${path}${rideSlug ? `/${rideSlug}` : ''}` : null;
      },
      postUrl(slug) {
        const item = getListItemByLocaleSlug(slug, locale);
        return item ? `${site}${postPath(item)}` : null;
      },
      parkPath(ref) {
        const { kind, key, geoPath } = parseRefKey(ref.trim());
        return kind === 'park' ? parkPath(key, geoPath) : null;
      },
      postPage: site,
      image(src) {
        const image = photo(src);
        return image
          ? { id: image.id, credit: needsAttribution(image) ? getCreditLine(image) : null }
          : null;
      },
      // The widget's own lookup: the slug in the locale first, then the stable id.
      glossary(ref) {
        const term = glossary.find((t) => t.slug === ref) ?? glossary.find((t) => t.id === ref);
        if (!term) return null;
        return {
          name: term.name,
          alternateNames: term.alternateNames ?? [],
          definition: term.definition,
          url: `${SITE_URL}${buildGlossaryTermHref(locale, term.slug)}`,
        };
      },
      gallery(attrs, body) {
        return galleryWidgetImages(attrs, body, locale).flatMap((i) => {
          const image = ctx.image(i.src.split('?')[0]);
          if (!image) return [];
          return [
            {
              imageId: image.id,
              alt: i.alt ?? '',
              caption: i.caption ?? null,
              credit: image.credit,
            },
          ];
        });
      },
    };

    const all = listPosts(locale);
    // The website's own search entries by post path, so the app matches the same words and label.
    const search = new Map(getPostSearchIndex(locale).map((entry) => [entry.path, entry]));
    // Both kinds go through the same serializer; only the folder and the selection differ.
    for (const [dir, select] of [
      ['news', selectNews],
      ['guides', selectGuides],
    ]) {
      const posts = [];
      const skipped = {};
      for (const post of select(all)) {
        const fm = post.frontmatter;
        const cover = photo(fm.coverImage?.src);
        const found = search.get(postPath(post));
        const terms = termsBeyondTitle(found?.terms ?? '', fm.title);
        const meta = {
          slug: post.slug,
          url: `${site}${postPath(post)}`,
          title: fm.title,
          teaser: fm.excerpt.replace(/\s+/g, ' ').trim(),
          publishedAt: withZoneOffset(fm.date, fm.time),
          ...(fm.updatedAt ? { updatedAt: withZoneOffset(fm.updatedAt) } : {}),
          category: fm.category,
          ...(found?.category ? { categoryLabel: found.category } : {}),
          ...(terms ? { terms } : {}),
          ...parksOf(post.translationKey),
          rides: ridesOf(fm.rideLinks),
          cover: cover?.id ?? null,
          coverAlt: cover ? (fm.coverImage?.alt ?? getMediaAlt(cover.id, locale)) : null,
          readingMinutes: post.readingTimeMinutes,
        };
        posts.push(meta);
        const { blocks, skipped: left } = markdownToBlocks(
          BLOG_POST_BODIES[`${post.loadedLocale}/${post.slug}`] ?? '',
          { ...ctx, postPage: meta.url }
        );
        for (const name of left) skipped[name] = (skipped[name] ?? 0) + 1;
        files.push({
          key: `${dir}/${locale}/${post.slug}.json`,
          json: {
            schema: 1,
            locale,
            ...meta,
            author: authorOf(fm.author, locale, avatars),
            blocks,
          },
        });
      }
      lists.push({ key: `${dir}/${locale}.json`, json: { schema: 1, generatedAt, locale, posts } });
      (stats[dir] ??= {})[locale] = { posts: posts.length, skipped };
    }
  }
  // The lists last: a list never names a body that is not there yet.
  return { files: [...files, ...lists], stats };
}
