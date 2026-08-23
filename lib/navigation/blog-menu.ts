import 'server-only';
import type { Locale } from '@/i18n/config';
import { buildCategoryTree } from '@/lib/blog/categories';
import { listPostsByRecency } from '@/lib/blog/listing';
import { versionedPath } from '@/lib/media/focus';

/**
 * What the blog menu shows, and what it deliberately leaves out.
 *
 * The blog currently holds 7 posts per locale across **3 categories** (guides 5, behind-the-scenes
 * 1, news 1), **31 tags** and one author. So:
 *
 * - **Categories are in.** Three stable hubs; that is what a template link is for.
 * - **The newest posts are in.** Four links, server-rendered. At this publishing rate the "the
 *   template's link set changes with every post" objection costs nothing — it is four URLs on a
 *   site that publishes a handful of times a year. If the blog ever reaches the point where the
 *   front of the list turns over weekly, move this pane to a fetch the way the parks menu does
 *   with its cities.
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

/** Posts in the panel. Four fills the column beside three categories without scrolling. */
const RECENT_LIMIT = 4;

export interface BlogMenuCategory {
  path: string;
  label: string;
  postCount: number;
}

export interface BlogMenuPost {
  slug: string;
  title: string;
  /** ISO date — the panel formats it in the reader's locale. */
  date: string;
  readingTimeMinutes: number;
  /** Cover image, where the post has one. All seven currently do. */
  image?: string;
}

export interface BlogMenu {
  categories: BlogMenuCategory[];
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
    recent: listPostsByRecency(locale)
      .slice(0, RECENT_LIMIT)
      .map((post) => ({
        slug: post.slug,
        title: post.frontmatter.title,
        date: post.frontmatter.date,
        readingTimeMinutes: post.readingTimeMinutes,
        // The cover is already a 16:9 crop for every post that has one, so the panel needs no
        // optimizer pass — but it does need the version token. Retargeting a focal point rewrites
        // a crop's bytes at an unchanged URL, so a bare path serves the old framing out of cache
        // until someone clears it. This rail sits in the header, i.e. on ~35,000 pages, which is
        // why it was the largest source of unversioned media URLs on the site.
        image: versionedPath(post.frontmatter.coverImage?.src) ?? post.frontmatter.coverImage?.src,
      })),
  };
}
