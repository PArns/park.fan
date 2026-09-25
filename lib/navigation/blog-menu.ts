import 'server-only';
import type { Locale } from '@/i18n/config';
import { buildCategoryTree, resolveCategoryLabel } from '@/lib/blog/categories';
import { listArticlesByRecency } from '@/lib/blog/listing';
import { postPath } from '@/lib/blog/paths';
import { objectPositionForSrc, versionedPath } from '@/lib/media/focus';

/**
 * What the blog menu shows, and what it deliberately leaves out.
 *
 * The blog currently holds 16 articles per locale across **3 categories** (guides, behind-the-
 * scenes, new on park.fan), a few dozen tags and one author. News is not in it: news has its own
 * bar entry and panel (`lib/navigation/news-menu.ts`), and neither panel lists the other's posts.
 * So:
 *
 * - **Categories are in.** Three stable hubs; that is what a template link is for. The news
 *   category is not one of them — `buildCategoryTree` holds articles only.
 * - **The newest articles are in.** Five links (`RECENT_LIMIT` below), server-rendered. At this
 *   publishing rate the "the template's link set changes with every post" objection costs
 *   nothing — it is five URLs, and news, the part that turns over fast, is not among them. If the
 *   blog ever reaches the point where the front of the list turns over weekly, move this pane to a
 *   fetch the way the parks menu does with its cities.
 * - **Tags are out, and this is the whole reason the panel is small.** 31 tag pages for 7 posts
 *   means most of them are one post's teaser under a different URL. Promoting that set into a
 *   template that runs on ~35,000 pages would hand sitewide weight to precisely the pages worth
 *   the least, and would dilute what the three category hubs get. Tags stay where they belong: on
 *   the posts that carry them.
 *
 * No API call anywhere in here — both sources are the generated blog manifest, read synchronously
 * at render time. Imported from `@/lib/blog/listing`, never `@/lib/blog`, which would drag every
 * post body into the layout's bundle.
 */

/**
 * Articles in the panel.
 *
 * Five: an opener plus four rows. Four rows end level with the opener, so the band fits without
 * scrolling. What this may NOT become is the whole blog — see the note above on why the tags stayed
 * out.
 */
const RECENT_LIMIT = 5;

/**
 * How much of a post's teaser reaches the header.
 *
 * The excerpts in this blog run 200–300 characters, and this text is repeated in the chrome of
 * every page on the site — so it is cut here, on the server, rather than clamped in CSS: a line
 * clamp hides the bytes, it does not stop shipping them.
 *
 * The opener gets more of it than the rows do: it has a column to itself and its own cover above,
 * so three lines sit in space that was otherwise empty, while a row has one line beside a 70 px
 * picture. One number for both would either starve the opener or bloat five rows.
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
  /** ISO date — the panel formats it in the reader's locale. */
  date: string;
  readingTimeMinutes: number;
  /** The post's own teaser, cut on the server — longer for the opener than for a row. */
  excerpt?: string;
  /** The post's category, resolved to its label. Every post carries it — the rows show it too. */
  category?: string;
  /** Cover image, where the post has one. All seven currently do. */
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
    recent: listArticlesByRecency(locale)
      .slice(0, RECENT_LIMIT)
      .map((post, index) => ({
        path: postPath(post),
        title: post.frontmatter.title,
        date: post.frontmatter.date,
        readingTimeMinutes: post.readingTimeMinutes,
        excerpt: trimExcerpt(
          post.frontmatter.excerpt,
          index === 0 ? LEAD_EXCERPT_CHARS : EXCERPT_CHARS
        ),
        // Every post, not just the opener. This used to stop at `index === 0` because only the
        // opener drew it, and the rows were the one place on the site that lists posts without
        // their category. The five extra strings are the labels of three categories repeated —
        // the panel prints "Guides" five times out of six here — which is what brotli is for:
        // measured on a park page, the whole row change is under a tenth of a KB compressed.
        category: post.frontmatter.category
          ? resolveCategoryLabel(
              post.frontmatter.category,
              locale,
              post.frontmatter.category.split('/').filter(Boolean).pop() ?? ''
            )
          : undefined,
        // The cover is already a 16:9 crop for every post that has one, so the panel needs no
        // optimizer pass — but it does need the version token. Retargeting a focal point rewrites
        // a crop's bytes at an unchanged URL, so a bare path serves the old framing out of cache
        // until someone clears it. This rail sits in the header, i.e. on ~35,000 pages, which is
        // why it was the largest source of unversioned media URLs on the site.
        image: versionedPath(post.frontmatter.coverImage?.src) ?? post.frontmatter.coverImage?.src,
        imagePosition: objectPositionForSrc(post.frontmatter.coverImage?.src, '50% 50%'),
      })),
  };
}
