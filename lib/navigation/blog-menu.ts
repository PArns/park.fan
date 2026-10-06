import 'server-only';
import type { Locale } from '@/i18n/config';
import { buildCategoryTree, resolveCategoryLabel } from '@/lib/blog/categories';
import { lastTouched, listArticlesByRecency } from '@/lib/blog/listing';
import { postPath } from '@/lib/blog/paths';
import { objectPositionForSrc, versionedPath } from '@/lib/media/focus';

/**
 * What the blog menu shows, and what it leaves out. The article categories (stable hubs) and the
 * newest articles are in; news has its own panel (`lib/navigation/news-menu.ts`). Tags are out:
 * most tag pages are one post's teaser at another URL, and a sitewide template would hand them
 * the weight the category hubs should get. See
 * docs/rules/the-header-menu-is-three-kinds-of-content-and-the-split-is.md.
 *
 * Both sources are the generated blog manifest, imported from `@/lib/blog/listing`, never
 * `@/lib/blog`, which would drag every post body into the layout's bundle.
 */

/** Articles in the panel: an opener plus four rows, which end level with it, so no scrolling. */
const RECENT_LIMIT = 5;

/**
 * How much of a post's teaser reaches the header: cut on the server rather than clamped in CSS,
 * because the text is repeated in the chrome of every page. The opener has a column of its own
 * and gets more than a row.
 */
const EXCERPT_CHARS = 170;
const LEAD_EXCERPT_CHARS = 300;

/** Cut on a word boundary, never mid-word, and only when there is something to cut. */
export function trimExcerpt(text: string | undefined, limit: number): string | undefined {
  if (!text) return undefined;
  const clean = text.trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export interface BlogMenuCategory {
  path: string;
  label: string;
  postCount: number;
}

export interface BlogMenuPost {
  /** Locale-relative URL of the post, from `postPath` (`lib/blog/paths.ts`). */
  path: string;
  title: string;
  /**
   * When the post last changed, ISO — `updatedAt` where it has one, else its publication date
   * (`lastTouched`). The panel formats it in the reader's locale.
   */
  date: string;
  /** True when `date` is an update rather than the publication date: the row says so. */
  updated: boolean;
  readingTimeMinutes: number;
  /** The post's own teaser, cut on the server — longer for the opener than for a row. */
  excerpt?: string;
  /** The post's category, resolved to its label. Every post carries it — the rows show it too. */
  category?: string;
  /** Cover image, where the post has one. */
  image?: string;
  /** The cover's focal point as a CSS `object-position` — the panel cannot read the manifest. */
  imagePosition?: string;
}

export interface BlogMenu {
  /** The blog's categories. Never the news category — see `buildCategoryTree`. */
  categories: BlogMenuCategory[];
  /** Articles only — news has its own panel (`getNewsMenu`). */
  recent: BlogMenuPost[];
}

/**
 * Builds the header's blog panel for a locale: the article categories by post count and the five
 * most recently touched articles with trimmed excerpts and covers.
 */
export function getBlogMenu(locale: Locale): BlogMenu {
  const { root } = buildCategoryTree(locale);

  return {
    categories: root.children
      .map((node) => ({
        path: node.path,
        label: node.label,
        postCount: node.totalPostCount,
      }))
      .sort((a, b) => b.postCount - a.postCount || a.label.localeCompare(b.label)),
    // By last change, like the homepage strips, and every row prints that date: a guide that got
    // new content is new again. Only new content moves `updatedAt`, never a wording pass
    // (docs/rules/updated-at-is-for-new-content.md).
    recent: listArticlesByRecency(locale)
      .slice(0, RECENT_LIMIT)
      .map((post, index) => ({
        path: postPath(post),
        title: post.frontmatter.title,
        date: lastTouched(post.frontmatter),
        updated: lastTouched(post.frontmatter) !== post.frontmatter.date,
        readingTimeMinutes: post.readingTimeMinutes,
        excerpt: trimExcerpt(
          post.frontmatter.excerpt,
          index === 0 ? LEAD_EXCERPT_CHARS : EXCERPT_CHARS
        ),
        // Every row, like every other list of posts on the site; the repeated labels compress
        // to almost nothing.
        category: post.frontmatter.category
          ? resolveCategoryLabel(
              post.frontmatter.category,
              locale,
              post.frontmatter.category.split('/').filter(Boolean).pop() ?? ''
            )
          : undefined,
        // Already a 16:9 crop, so no optimizer pass, but versioned: retargeting a focal point
        // rewrites a crop's bytes at an unchanged URL.
        image: versionedPath(post.frontmatter.coverImage?.src) ?? post.frontmatter.coverImage?.src,
        imagePosition: objectPositionForSrc(post.frontmatter.coverImage?.src, '50% 50%'),
      })),
  };
}
