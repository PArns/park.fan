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
import { defaultLocale, type Locale } from '@/i18n/config';

/**
 * Reverse index: park slug → the posts about that park, `parkSlug/rideSlug` → the posts about
 * that ride, term id → the posts that explain it. A post lands on a page when its body references
 * it (a ride counts for its park) or its frontmatter names it in `relatedParks` /
 * `relatedAttractions`; `parkLinks` / `rideLinks` override both. See
 * docs/rules/parkride-page-and-blog-link.md.
 *
 * Nothing here reads a post body: the refs are baked into the manifest, so park and ride pages,
 * the highest-cardinality routes, ship none of the markdown.
 */

interface Mentioned {
  translationKey: string;
  /**
   * `continent/country/city` paths the references pinned this entry to; empty means any park
   * with this slug. Only a handful of slugs repeat (`disneyland-park` in Paris and Anaheim).
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
  glossary: Map<string, Mentioned[]>;
}

/**
 * Module-level memo rather than React `cache()`: the source is the generated manifest, static for
 * the lifetime of the deployment.
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
 * Collects what one post points at, across all of its translations. Resolved per post, not per
 * locale, so a translator dropping a `ref:` cannot change which pages link the article, and a
 * `false` in any one file holds everywhere.
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
      // `rideLinks: [toverland/*]`: every ride of that park the article links. The full
      // `/parks/…/<park>/*` form resolves to the same park slug, since the generator accepts both.
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

  // Glossary terms take the simple path: a term id is unique site-wide and there is nothing to
  // rank by, so the score stays 0 and `resolveMentions` sorts by date.
  const buildGlossary = (): Map<string, Mentioned[]> => {
    const byTerm = new Map<string, Map<string, Mentioned>>();
    for (const [translationKey, entries] of byPost) {
      for (const entry of entries) {
        for (const termId of entry.glossaryRefs ?? []) {
          const posts = byTerm.get(termId) ?? new Map<string, Mentioned>();
          posts.set(translationKey, { translationKey, geoPaths: new Set(), score: 0 });
          byTerm.set(termId, posts);
        }
      }
    }
    return new Map([...byTerm].map(([termId, posts]) => [termId, [...posts.values()]]));
  };

  INDEX = { parks: build('park'), rides: build('ride'), glossary: buildGlossary() };
  return INDEX;
}

export interface BacklinkOptions {
  /** `continent/country/city` of the page, used to disambiguate shared slugs. */
  geoPath?: string;
  /** Maximum number of posts to return (0 / undefined → all). */
  limit?: number;
}

function resolveRanked(
  mentions: Mentioned[] | undefined,
  locale: Locale,
  { geoPath }: BacklinkOptions
): { post: BlogListItem; score: number }[] {
  if (!mentions || mentions.length === 0) return [];

  const visible = new Map(listPosts(locale).map((post) => [post.translationKey, post]));

  const ranked = mentions
    // A reference that pinned a full geo path only counts for that park; without one (or without
    // a geo path on the page) the bare slug decides.
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
    .map(({ mention, post }) => ({ post, score: mention.score }));

  return ranked;
}

function resolveMentions(
  mentions: Mentioned[] | undefined,
  locale: Locale,
  options: BacklinkOptions
): BlogListItem[] {
  const ranked = resolveRanked(mentions, locale, options).map(({ post }) => post);
  const { limit } = options;
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

/** One post's translations, English first and the rest alphabetical — see {@link getNewsParkRef}. */
function entriesOfPost(translationKey: string): ManifestPostMeta[] {
  return BLOG_POSTS_META.filter(
    (entry) => translationKeyOf(entry.slug, entry.frontmatter) === translationKey
  ).sort((a, b) =>
    a.locale === b.locale
      ? 0
      : a.locale === defaultLocale
        ? -1
        : b.locale === defaultLocale
          ? 1
          : a.locale.localeCompare(b.locale)
  );
}

/**
 * The most `parkLinks` a guide can carry and still be one park's primer: the park guides list one
 * or two, the round-ups six or more.
 */
export const MAX_PRIMER_PARK_LINKS = 3;

/**
 * The park a visit guide is the primer for: the first entry of its `parkLinks`, or `null`. Only
 * configuration decides, because the round-ups tag a dozen parks and would become each one's
 * guide. A round-up listing more than {@link MAX_PRIMER_PARK_LINKS} parks is nobody's primer.
 * `pnpm test:park-guide`.
 */
function guidePrimaryPark(translationKey: string): ManifestParkRef | null {
  for (const entry of entriesOfPost(translationKey)) {
    const links = entry.frontmatter.parkLinks;
    if (!Array.isArray(links)) continue;
    if (links.length > MAX_PRIMER_PARK_LINKS) return null;
    const first = links.map((value) => parseConfigured(String(value), 'park')).find(Boolean);
    if (first) return first;
  }
  return null;
}

/**
 * The visit guide for one park in the reader's locale, or `null` — the post the park page opens
 * with instead of listing it among the others. See {@link guidePrimaryPark} for what makes a post
 * one. Locale-scoped like every lookup here: a post that is not published in the reader's locale
 * (or its English fallback) is not offered.
 */
export function getGuideForPark(
  locale: Locale,
  parkSlug: string,
  options: BacklinkOptions = {}
): BlogListItem | null {
  const guide = resolveRanked(buildIndex().parks.get(parkSlug), locale, options).find(
    ({ post }) => {
      if ((post.frontmatter.category ?? '').split('/')[0] !== 'guides') return false;
      const primary = guidePrimaryPark(post.translationKey);
      if (primary?.slug !== parkSlug) return false;
      return !primary.geo || !options.geoPath || primary.geo.includes(options.geoPath);
    }
  );
  return guide?.post ?? null;
}

/**
 * The one park a news post is about, for its label and the park filter on `/news`: the first
 * `parkLinks` entry in the author's order (English first, then the other locales alphabetically,
 * so the answer does not depend on file order), else the best-scored park the post mentions.
 */
export function getNewsParkRef(translationKey: string): ManifestParkRef | null {
  const entries = entriesOfPost(translationKey);
  if (entries.length === 0) return null;
  const { suppressed, mentions } = collectMentions(entries, 'park');
  if (suppressed || mentions.size === 0) return null;

  let best: { slug: string; mention: Mention; score: number } | null = null;
  for (const [slug, mention] of mentions) {
    if (mention.explicit) {
      best = { slug, mention, score: Infinity };
      break;
    }
    const score = Math.max(
      ...entries.map((entry) => scoreFor(entry.frontmatter, slug, false, mention.viaRide))
    );
    if (!best || score > best.score) best = { slug, mention, score };
  }
  if (!best) return null;
  const geo = [...best.mention.geoPaths];
  return geo.length > 0 ? { slug: best.slug, geo } : { slug: best.slug };
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

/**
 * Posts to link from a glossary term page, newest first, in the reader's locale. Most terms
 * return `[]`, and the caller renders nothing for them.
 */
export function getPostsForGlossaryTerm(
  locale: Locale,
  termId: string,
  options: BacklinkOptions = {}
): BlogListItem[] {
  return resolveMentions(buildIndex().glossary.get(termId), locale, options);
}
