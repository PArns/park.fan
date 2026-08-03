import 'server-only';
import { listPosts } from './listing';
import { BLOG_POSTS_META, type ManifestParkRef, type ManifestPostMeta } from './manifest';
import { parseRefKey } from './derive.mjs';
import { normalizeTagSlug } from './tags';
import type { BlogFrontmatter, BlogListItem } from './types';
import type { Locale } from '@/i18n/config';

/**
 * Reverse index: park slug → the posts that talk about that park.
 *
 * The blog already links *into* the catalog (`ref:europa-park`, spotlight
 * cards, widgets). This module builds the other direction so a park page can
 * surface the articles that mention it — without authors having to maintain a
 * second list by hand.
 *
 * A post lands on a park page when either
 *   1. its body references the park — the `parkRefs` the manifest generator
 *      extracted at build time from the `ref:`/`park:`/`attraction:` links and
 *      the widget fences (a ride reference counts for its parent park), or
 *   2. its frontmatter names the park in `relatedParks`, or
 *   3. its frontmatter names the park in `parkLinks` (see below).
 *
 * Frontmatter control (`parkLinks`):
 *   - omitted / `true` → automatic (rules 1 + 2). This is what a post like the
 *     Halloween round-up wants: it references ten parks and shows up on all ten.
 *   - `false` → never surfaced on any park page (the post still renders its own
 *     park references as usual).
 *   - `[slug, …]` → exactly these parks, ignoring what the body happens to
 *     mention. Entries accept the bare slug (`europa-park`) or the full path
 *     form (`/parks/europe/france/paris/disneyland-park`), which pins the park
 *     for slugs that exist more than once.
 *
 * Nothing here reads a post body: the park page is the highest-cardinality
 * route on the site, and `parkRefs` in the (frontmatter-sized) manifest keeps
 * the ~900 KB of markdown out of its bundle entirely.
 */

interface ParkMention {
  translationKey: string;
  /**
   * `continent/country/city` paths the references pinned this park to. Empty
   * means "any park with this slug" — bare-slug references carry no geo, and
   * park slugs are unique except for a handful (`disneyland-park` in Paris and
   * Anaheim), which is exactly what the full-path form is for.
   */
  geoPaths: Set<string>;
  /** Relevance within one park page: explicit config first, then topical signals. */
  score: number;
}

/** Explicit configuration outranks a passing mention in the body. */
const EXPLICIT_SCORE = 100;
/** The park slug shows up in the post's tags — the post is *about* that park. */
const TAG_SCORE = 25;
/** …or in its category path (e.g. `reports/europe/europa-park`). */
const CATEGORY_SCORE = 25;
/** The post links one of the park's rides, not just the park itself. */
const RIDE_SCORE = 5;

/**
 * Module-level memo rather than React `cache()`: the source is the generated
 * manifest, i.e. static for the lifetime of the deployment, so there is nothing
 * request-scoped to isolate and every park render reuses the same index.
 */
let INDEX: Map<string, ParkMention[]> | null = null;

function translationKeyOf(slug: string, fm: BlogFrontmatter): string {
  return fm.translationKey?.trim() || slug;
}

/** Split a configured entry (`europa-park` or `/parks/…/europa-park[/ride]`). */
function parseConfiguredPark(value: string): ManifestParkRef | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const { key, geoPath } = parseRefKey(trimmed);
  // A ride entry still identifies its park — take the park half.
  const slug = key.split('/')[0];
  if (!slug) return null;
  return geoPath ? { slug, geo: [geoPath] } : { slug };
}

function scoreFor(fm: BlogFrontmatter, slug: string, explicit: boolean, viaRide: boolean): number {
  let score = explicit ? EXPLICIT_SCORE : 0;
  if ((fm.tags ?? []).some((tag) => normalizeTagSlug(tag) === slug)) score += TAG_SCORE;
  if ((fm.category ?? '').split('/').includes(slug)) score += CATEGORY_SCORE;
  if (viaRide) score += RIDE_SCORE;
  return score;
}

/** One park a post points at, accumulated over the post's translations. */
interface Mention {
  geoPaths: Set<string>;
  explicit: boolean;
  viaRide: boolean;
}

function addMention(out: Map<string, Mention>, ref: ManifestParkRef, explicit: boolean): void {
  const existing = out.get(ref.slug) ?? {
    geoPaths: new Set<string>(),
    explicit: false,
    viaRide: false,
  };
  existing.explicit ||= explicit;
  existing.viaRide ||= ref.viaRide === true;
  for (const geo of ref.geo ?? []) existing.geoPaths.add(geo);
  out.set(ref.slug, existing);
}

/**
 * Collect the parks ONE post points at, across all of its translations.
 *
 * The configuration is deliberately resolved per post, not per locale: a
 * `parkLinks` entry in any translation governs the post everywhere, so a
 * translator who rewrites a paragraph (dropping a `ref:` on the way) can't
 * quietly change which park pages link the article — and `parkLinks: false`
 * can't be undone by forgetting it in one of six files. Automatic detection,
 * in turn, unions every translation's references for the same reason.
 */
function collectMentions(entries: ManifestPostMeta[]): {
  suppressed: boolean;
  mentions: Map<string, Mention>;
} {
  const mentions = new Map<string, Mention>();
  if (entries.some((entry) => entry.frontmatter.parkLinks === false)) {
    return { suppressed: true, mentions };
  }

  const configured = entries.flatMap((entry) =>
    Array.isArray(entry.frontmatter.parkLinks) ? entry.frontmatter.parkLinks : []
  );
  if (configured.length > 0) {
    for (const value of configured) {
      const parsed = parseConfiguredPark(String(value));
      if (parsed) addMention(mentions, parsed, true);
    }
    return { suppressed: false, mentions };
  }

  for (const entry of entries) {
    for (const ref of entry.parkRefs) addMention(mentions, ref, false);
    for (const related of entry.frontmatter.relatedParks ?? []) {
      const parsed = parseConfiguredPark(String(related));
      if (parsed) addMention(mentions, parsed, true);
    }
  }
  return { suppressed: false, mentions };
}

function buildIndex(): Map<string, ParkMention[]> {
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

  // parkSlug → translationKey → mention.
  const byPark = new Map<string, Map<string, ParkMention>>();

  for (const [translationKey, entries] of byPost) {
    // Visibility (draft/hidden, per locale) is NOT filtered here — `listPosts`
    // already applies it when the index is queried, and it differs per locale.
    const { suppressed, mentions } = collectMentions(entries);
    if (suppressed) continue;

    for (const [slug, mention] of mentions) {
      const posts = byPark.get(slug) ?? new Map<string, ParkMention>();
      // Topical signals (tags, category) are per translation — take the best.
      const score = Math.max(
        ...entries.map((entry) =>
          scoreFor(entry.frontmatter, slug, mention.explicit, mention.viaRide)
        )
      );
      posts.set(translationKey, { translationKey, geoPaths: mention.geoPaths, score });
      byPark.set(slug, posts);
    }
  }

  INDEX = new Map([...byPark].map(([slug, posts]) => [slug, [...posts.values()]]));
  return INDEX;
}

export interface ParkPostsOptions {
  /** `continent/country/city` of the park page, used to disambiguate shared slugs. */
  geoPath?: string;
  /** Maximum number of posts to return (0 / undefined → all). */
  limit?: number;
}

/**
 * Posts to link from a park page, most relevant first (explicit configuration
 * and topical posts before passing mentions, newest first within the same
 * relevance). Resolved in the requested locale with the blog's usual EN
 * fallback, so a park page never links a post the reader can't read.
 */
export function getPostsForPark(
  locale: Locale,
  parkSlug: string,
  { geoPath, limit }: ParkPostsOptions = {}
): BlogListItem[] {
  const mentions = buildIndex().get(parkSlug);
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
    .filter((entry): entry is { mention: ParkMention; post: BlogListItem } => entry.post != null)
    .sort((a, b) =>
      b.mention.score !== a.mention.score
        ? b.mention.score - a.mention.score
        : (b.post.frontmatter.date ?? '').localeCompare(a.post.frontmatter.date ?? '')
    )
    .map(({ post }) => post);

  return limit && limit > 0 ? ranked.slice(0, limit) : ranked;
}
