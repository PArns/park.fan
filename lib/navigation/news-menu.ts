import 'server-only';
import type { Locale } from '@/i18n/config';
import { resolveCategoryLabel } from '@/lib/blog/categories';
import { listNewsByDate, NEWS_CATEGORY } from '@/lib/blog/listing';
import { NEWS_INDEX_PATH } from '@/lib/blog/paths';
import { objectPositionForSrc, versionedPath } from '@/lib/media/focus';
import { trimExcerpt } from '@/lib/navigation/blog-menu';

/**
 * The news menu: its own bar entry beside "Backstage", and the only place in the header news
 * appears.
 *
 * It used to be a strip of three at the bottom of the blog panel, which filed news as one more
 * blog category — the same mistake `/blog` made by listing both. News has a section of its own
 * (`/news`), so it gets an entry of its own, and the blog panel lists articles only.
 *
 * Drawn differently from the blog panel on purpose. An article is chosen by its topic and its
 * length, so the blog panel is covers, teasers and reading times. A news item is chosen by what
 * happened and when, so this panel is one lead with its cover and teaser, and after it a column of
 * headlines on a time line, each led by its age (`NewsAge`) with a small cover on the right.
 * No image is fetched until the panel opens: the band is `hidden`, and `next/image` is lazy.
 *
 * No API call — the generated blog manifest, read synchronously, like the blog menu.
 */

/** The lead plus five headlines. Six links, and six is what the time line fits beside the lead. */
const NEWS_MENU_LIMIT = 6;

/** The lead's teaser, cut on the server for the same reason the blog panel cuts its own. */
const LEAD_EXCERPT_CHARS = 220;

export interface NewsMenuItem {
  slug: string;
  title: string;
  /** Publication date, `YYYY-MM-DD` — `NewsAge` formats it and adds the age after hydration. */
  date: string;
  /** The lead only: its teaser, already cut. */
  excerpt?: string;
  /** Its cover, versioned — the lead's large, a headline's as a thumbnail on the right. */
  image?: string;
  /** The cover's focal point as a CSS `object-position` — the panel cannot read the manifest. */
  imagePosition?: string;
}

export interface NewsMenu {
  /** The news category's label in this locale ("News", "Actualités"), also the bar entry's label. */
  label: string;
  /** The news overview's locale-relative path. */
  path: string;
  /** Newest first. Empty when the locale lists no news — the header then draws no entry. */
  items: NewsMenuItem[];
  /** How many news posts the overview lists. */
  total: number;
}

export function getNewsMenu(locale: Locale): NewsMenu {
  const news = listNewsByDate(locale);
  return {
    label: resolveCategoryLabel(NEWS_CATEGORY, locale, 'News'),
    path: NEWS_INDEX_PATH,
    total: news.length,
    items: news.slice(0, NEWS_MENU_LIMIT).map((post, index) => {
      const src = post.frontmatter.coverImage?.src;
      const item: NewsMenuItem = {
        slug: post.slug,
        title: post.frontmatter.title,
        date: post.frontmatter.date,
        image: versionedPath(src) ?? src,
        imagePosition: objectPositionForSrc(src, '50% 50%'),
      };
      return index > 0
        ? item
        : { ...item, excerpt: trimExcerpt(post.frontmatter.excerpt, LEAD_EXCERPT_CHARS) };
    }),
  };
}
