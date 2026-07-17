import type { Locale } from '@/i18n/config';

export type BlogMode = 'published' | 'hidden' | 'draft';

export interface BlogAuthorLinks {
  website?: string;
  x?: string;
  mastodon?: string;
  github?: string;
  instagram?: string;
  linkedin?: string;
}

export interface BlogAuthor {
  name: string;
  avatar?: string;
  bio?: string;
  /** Primary website (also used as the author's rel=author URL). */
  url?: string;
  /** Short role/title, e.g. "Founder of park.fan". */
  role?: string;
  /** Free-form location, e.g. "Cologne, Germany". */
  location?: string;
  /** Social / external profile links rendered on the author page. */
  links?: BlogAuthorLinks;
}

export interface BlogImage {
  src: string;
  alt?: string;
  caption?: string;
  credit?: string;
  /** Intrinsic pixel width, baked into the manifest so layouts can reserve space (CLS). */
  width?: number;
  /** Intrinsic pixel height, baked into the manifest so layouts can reserve space (CLS). */
  height?: number;
}

export interface BlogParkRef {
  /** Park slug (e.g. magic-kingdom-park). */
  slug: string;
  /** Optional override label; otherwise the resolved name is used. */
  label?: string;
}

export interface BlogAttractionRef {
  /** Park slug the attraction belongs to. */
  parkSlug: string;
  /** Attraction slug. */
  slug: string;
  label?: string;
}

export interface BlogSeo {
  title?: string;
  description?: string;
  ogImage?: string;
  /** Optional canonical URL override. Leave undefined to use the default. */
  canonical?: string;
  /** Extra SEO keywords beyond what `tags` contributes (comma-separated or array). */
  keywords?: string | string[];
  /**
   * Opt this post out of search indexing entirely (e.g. drafts that
   * accidentally went live, internal-only posts).
   */
  noindex?: boolean;
}

export interface BlogFrontmatter {
  /** Display title. */
  title: string;
  /**
   * Stable cross-locale identifier. Translations of the same post must
   * share this key so we can build hreflang alternates and fall back to EN.
   * Defaults to the file slug if omitted.
   */
  translationKey?: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Optional last-updated date. */
  updatedAt?: string;
  author: BlogAuthor | string;
  mode?: BlogMode;
  excerpt: string;
  tags?: string[];
  /** Slash-separated category path: "reports/orlando/disney-world/magic-kingdom". */
  category?: string;
  coverImage?: BlogImage;
  /**
   * Either an explicit list of images, a folder path under /public (all images
   * in the folder become the gallery, sorted by filename), or { folder: '...' }.
   * A `captions.json` file in the folder may override alt/caption/credit per image.
   */
  gallery?: BlogImage[] | string | { folder: string };
  relatedParks?: string[];
  relatedAttractions?: BlogAttractionRef[];
  seo?: BlogSeo;
  /** Auto-calculated if omitted. */
  readingTime?: number;
  /** Mark this post as featured — promoted in listings and feeds. */
  featured?: boolean;
}

export interface BlogPost {
  /** Filename slug (without .md). Same across locales. */
  slug: string;
  /** translationKey or slug. */
  translationKey: string;
  /** Locale this post was actually loaded from (may be EN even if locale=DE due to fallback). */
  loadedLocale: Locale;
  /** Locale that was requested. */
  requestedLocale: Locale;
  /** True when the requested locale had no translation and EN was used. */
  isFallback: boolean;
  /** Available locales for this translationKey. */
  availableLocales: Locale[];
  frontmatter: BlogFrontmatter;
  /** Raw markdown body. */
  content: string;
  /** Word/character based reading time in minutes (>= 1). */
  readingTimeMinutes: number;
}

export interface CategoryNode {
  /** Full slash path, e.g. "reports/orlando/disney-world". */
  path: string;
  /** Last segment, e.g. "disney-world". */
  segment: string;
  /** Resolved display label for the requested locale. */
  label: string;
  /** Number of posts in this node (not including descendants). */
  directPostCount: number;
  /** Total posts in this node and all descendants. */
  totalPostCount: number;
  children: CategoryNode[];
}

export interface BlogListItem extends Pick<
  BlogPost,
  'slug' | 'translationKey' | 'loadedLocale' | 'isFallback'
> {
  frontmatter: BlogFrontmatter;
  readingTimeMinutes: number;
}
