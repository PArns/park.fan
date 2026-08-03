import 'server-only';
import { listPosts } from './listing';
import {
  BLOG_POSTS_META,
  type ManifestParkRef,
  type ManifestPostMeta,
  type ManifestRideRef,
} from './manifest';
import { parseRefKey } from './derive.mjs';
import { normalizeTagSlug } from './tags';
import type { BlogFrontmatter, BlogListItem } from './types';
import type { Locale } from '@/i18n/config';

/**
 * Reverse index: park slug → the posts about that park, and `parkSlug/rideSlug`
 * → the posts about that ride.
 *
 * The blog already links *into* the catalog (`ref:europa-park`,
 * `ref:phantasialand/taron`, spotlight cards, widgets). This module builds the
 * other direction so a park or ride page can surface the articles that mention
 * it — without authors having to maintain a second list by hand.
 *
 * A post lands on a page when either
 *   1. its body references that park/ride — the `parkRefs` / `rideRefs` the
 *      manifest generator extracted at build time from the `ref:`/`park:`/
 *      `attraction:` links and the widget fences (a ride reference also counts
 *      for its parent park), or
 *   2. its frontmatter names it in `relatedParks` / `relatedAttractions`, or
 *   3. its frontmatter names it in `parkLinks` / `rideLinks` (see below).
 *
 * Frontmatter control — `parkLinks` for park pages, `rideLinks` for ride pages,
 * independent of each other (a guide can be right for the park page and far too
 * broad for twelve ride pages):
 *   - omitted / `true` → automatic (rules 1 + 2). This is what a post like the
 *     Halloween round-up wants: it references ten parks and shows up on all ten.
 *   - `false` → never surfaced on those pages (the post still renders its own
 *     references as usual).
 *   - `[slug, …]` → exactly these, ignoring what the body happens to mention.
 *     Entries accept the bare form (`europa-park`, `europa-park/voltron-nevera`)
 *     or the full path form (`/parks/europe/france/paris/disneyland-park`),
 *     which pins the entry for slugs that exist more than once. `rideLinks`
 *     additionally takes `parkSlug/*` — every ride of that park the article
 *     links — so a park guide keeps its own rides without listing twelve of
 *     them, while a comparison table's foreign rides stay out.
 *
 * Nothing here reads a post body: park and ride pages are the highest-
 * cardinality routes on the site, and the refs baked into the (frontmatter-
 * sized) manifest keep the ~900 KB of markdown out of their bundles entirely.
 */

interface Mentioned {
  translationKey: string;
  /**
   * `continent/country/city` paths the references pinned this entry to. Empty
   * means "any park with this slug" — bare-slug references carry no geo, and
   * park slugs are unique except for a handful (`disneyland-park` in Paris and
   * Anaheim), which is exactly what the full-path form is for.
   */
  geoPaths: Set<string>;
  /** Relevance within one page: explicit config first, then topical signals. */
  score: number;
}

/** Explicit configuration outranks a passing mention in the body. */
const EXPLICIT_SCORE = 100;
/** The slug shows up in the post's tags — the post is *about* it. */
const TAG_SCORE = 25;
/** …or in its category path (e.g. `reports/europe/europa-park`). */
const CATEGORY_SCORE = 25;
/** For a park: the post links one of its rides, not only the park itself. */
const RIDE_SCORE = 5;

interface Mention {
  geoPaths: Set<string>;
  explicit: boolean;
  viaRide: boolean;
}

interface Index {
  parks: Map<string, Mentioned[]>;
  rides: Map<string, Mentioned[]>;
}

/**
 * Module-level memo rather than React `cache()`: the source is the generated
 * manifest, i.e. static for the lifetime of the deployment, so there is nothing
 * request-scoped to isolate and every render reuses the same index.
 */
let INDEX: Index | null = null;

function translationKeyOf(slug: string, fm: BlogFrontmatter): string {
  return fm.translationKey?.trim() || slug;
}

/**
 * Normalise a configured entry to the index key for `kind`: the park slug, or
 * the `parkSlug/rideSlug` pair. A bare park slug can never identify a ride, so
 * it is dropped from the ride index (a ride entry, in turn, still names its
 * park and counts for the park index).
 */
function parseConfigured(value: string, kind: 'park' | 'ride'): ManifestParkRef | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = parseRefKey(trimmed);
  if (kind === 'ride' && parsed.kind !== 'ride') return null;
  const key = kind === 'park' ? parsed.key.split('/')[0] : parsed.key;
  if (!key) return null;
  return parsed.geoPath ? { slug: key, geo: [parsed.geoPath] } : { slug: key };
}

function scoreFor(fm: BlogFrontmatter, slug: string, explicit: boolean, viaRide: boolean): number {
  // For rides the key is `park/ride` — the ride half is what a tag would name.
  const ownSlug = slug.includes('/') ? slug.split('/')[1] : slug;
  let score = explicit ? EXPLICIT_SCORE : 0;
  if ((fm.tags ?? []).some((tag) => normalizeTagSlug(tag) === ownSlug)) score += TAG_SCORE;
  if ((fm.category ?? '').split('/').includes(ownSlug)) score += CATEGORY_SCORE;
  if (viaRide) score += RIDE_SCORE;
  return score;
}

function addMention(
  out: Map<string, Mention>,
  ref: ManifestParkRef | ManifestRideRef,
  explicit: boolean
): void {
  const existing = out.get(ref.slug) ?? {
    geoPaths: new Set<string>(),
    explicit: false,
    viaRide: false,
  };
  existing.explicit ||= explicit;
  existing.viaRide ||= 'viaRide' in ref && ref.viaRide === true;
  for (const geo of ref.geo ?? []) existing.geoPaths.add(geo);
  out.set(ref.slug, existing);
}

/**
 * Collect what ONE post points at, across all of its translations.
 *
 * The configuration is deliberately resolved per post, not per locale: a
 * `parkLinks`/`rideLinks` entry in any translation governs the post everywhere,
 * so a translator who rewrites a paragraph (dropping a `ref:` on the way) can't
 * quietly change which pages link the article — and `false` can't be undone by
 * forgetting it in one of six files. Automatic detection, in turn, unions every
 * translation's references for the same reason.
 */
function collectMentions(
  entries: ManifestPostMeta[],
  kind: 'park' | 'ride'
): { suppressed: boolean; mentions: Map<string, Mention> } {
  const field = kind === 'park' ? 'parkLinks' : 'rideLinks';
  const mentions = new Map<string, Mention>();

  if (entries.some((entry) => entry.frontmatter[field] === false)) {
    return { suppressed: true, mentions };
  }

  const configured = entries.flatMap((entry) => {
    const value = entry.frontmatter[field];
    return Array.isArray(value) ? value : [];
  });
  if (configured.length > 0) {
    for (const value of configured) {
      const raw = String(value).trim();
      // `rideLinks: [toverland/*]` — every ride of that park the article links,
      // so a park guide doesn't have to repeat its own twelve rides by hand.
      // The full `/parks/…/<park>/*` form resolves to the same park slug (the
      // generator accepts both, so both have to work here).
      if (kind === 'ride' && raw.endsWith('/*')) {
        const base = raw.slice(0, -2);
        const parkSlug = base.startsWith('/parks/')
          ? (base.split('/').filter(Boolean).pop() ?? '')
          : base;
        if (!parkSlug) continue;
        for (const entry of entries) {
          for (const ref of entry.rideRefs) {
            if (ref.slug.startsWith(`${parkSlug}/`)) addMention(mentions, ref, true);
          }
        }
        continue;
      }
      const parsed = parseConfigured(raw, kind);
      if (parsed) addMention(mentions, parsed, true);
    }
    return { suppressed: false, mentions };
  }

  for (const entry of entries) {
    if (kind === 'park') {
      for (const ref of entry.parkRefs) addMention(mentions, ref, false);
      for (const related of entry.frontmatter.relatedParks ?? []) {
        const parsed = parseConfigured(String(related), 'park');
        if (parsed) addMention(mentions, parsed, true);
      }
    } else {
      for (const ref of entry.rideRefs) addMention(mentions, ref, false);
      for (const related of entry.frontmatter.relatedAttractions ?? []) {
        if (!related?.parkSlug || !related?.slug) continue;
        addMention(mentions, { slug: `${related.parkSlug}/${related.slug}` }, true);
      }
    }
  }
  return { suppressed: false, mentions };
}

function buildIndex(): Index {
  if (INDEX) return INDEX;

  // Group the manifest by post first — see collectMentions on why the
  // configuration is a property of the post, not of a single translation.
  const byPost = new Map<string, ManifestPostMeta[]>();
  for (const entry of BLOG_POSTS_META) {
    const translationKey = translationKeyOf(entry.slug, entry.frontmatter);
    const group = byPost.get(translationKey) ?? [];
    group.push(entry);
    byPost.set(translationKey, group);
  }

  const build = (kind: 'park' | 'ride'): Map<string, Mentioned[]> => {
    // slug → translationKey → mention.
    const bySlug = new Map<string, Map<string, Mentioned>>();

    for (const [translationKey, entries] of byPost) {
      // Visibility (draft/hidden, per locale) is NOT filtered here — `listPosts`
      // already applies it when the index is queried, and it differs per locale.
      const { suppressed, mentions } = collectMentions(entries, kind);
      if (suppressed) continue;

      for (const [slug, mention] of mentions) {
        const posts = bySlug.get(slug) ?? new Map<string, Mentioned>();
        // Topical signals (tags, category) are per translation — take the best.
        const score = Math.max(
          ...entries.map((entry) =>
            scoreFor(entry.frontmatter, slug, mention.explicit, mention.viaRide)
          )
        );
        posts.set(translationKey, { translationKey, geoPaths: mention.geoPaths, score });
        bySlug.set(slug, posts);
      }
    }

    return new Map([...bySlug].map(([slug, posts]) => [slug, [...posts.values()]]));
  };

  INDEX = { parks: build('park'), rides: build('ride') };
  return INDEX;
}

export interface BacklinkOptions {
  /** `continent/country/city` of the page, used to disambiguate shared slugs. */
  geoPath?: string;
  /** Maximum number of posts to return (0 / undefined → all). */
  limit?: number;
}

function resolveMentions(
  mentions: Mentioned[] | undefined,
  locale: Locale,
  { geoPath, limit }: BacklinkOptions
): BlogListItem[] {
  if (!mentions || mentions.length === 0) return [];

  const visible = new Map(listPosts(locale).map((post) => [post.translationKey, post]));

  const ranked = mentions
    // A reference that pinned a full geo path only counts for that park; without
    // one (or without a geo path on the page) the bare slug decides, as before.
    .filter((mention) => {
      if (mention.geoPaths.size === 0 || !geoPath) return true;
      return mention.geoPaths.has(geoPath);
    })
    .map((mention) => ({ mention, post: visible.get(mention.translationKey) }))
    .filter((entry): entry is { mention: Mentioned; post: BlogListItem } => entry.post != null)
    .sort((a, b) =>
      b.mention.score !== a.mention.score
        ? b.mention.score - a.mention.score
        : (b.post.frontmatter.date ?? '').localeCompare(a.post.frontmatter.date ?? '')
    )
    .map(({ post }) => post);

  return limit && limit > 0 ? ranked.slice(0, limit) : ranked;
}

/**
 * Posts to link from a park page, most relevant first (explicit configuration
 * and topical posts before passing mentions, newest first within the same
 * relevance). Resolved in the requested locale with the blog's usual EN
 * fallback, so a page never links a post the reader can't read.
 */
export function getPostsForPark(
  locale: Locale,
  parkSlug: string,
  options: BacklinkOptions = {}
): BlogListItem[] {
  return resolveMentions(buildIndex().parks.get(parkSlug), locale, options);
}

/** The same for a single ride. Ranking and locale semantics as above. */
export function getPostsForRide(
  locale: Locale,
  parkSlug: string,
  rideSlug: string,
  options: BacklinkOptions = {}
): BlogListItem[] {
  return resolveMentions(buildIndex().rides.get(`${parkSlug}/${rideSlug}`), locale, options);
}
