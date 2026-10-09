import 'server-only';
import type { Locale } from '@/i18n/config';
import { resolveCategoryLabel } from '@/lib/blog/categories';
import { listNewsByDate, NEWS_CATEGORY } from '@/lib/blog/listing';
import { NEWS_INDEX_PATH } from '@/lib/blog/paths';
import { objectPositionForSrc, versionedPath } from '@/lib/media/focus';
import { trimExcerpt } from '@/lib/navigation/blog-menu';

/**
 * The news menu: its own bar entry beside "Guides", and the only place in the header news
 * appears. A news item is chosen by what happened and when, so the panel is one lead with its
 * cover and teaser, then a time line of headlines each led by its age (`NewsAge`). No image loads
 * until the panel opens: the band is `hidden` and `next/image` is lazy. See
 * docs/rules/news-is-set-apart-from-the-articles.md.
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

const NEWS_MENU = new Map<Locale, NewsMenu>();

/**
 * The header's news panel for a locale, memoised per process: the manifest is fixed for the
 * deployment, and the layout and the homepage hero both ask for it.
 */
export function getNewsMenu(locale: Locale): NewsMenu {
  const memo = NEWS_MENU.get(locale);
  if (memo) return memo;
  const menu = buildNewsMenu(locale);
  NEWS_MENU.set(locale, menu);
  return menu;
}

function buildNewsMenu(locale: Locale): NewsMenu {
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
        ...(src && {
          image: versionedPath(src) ?? src,
          imagePosition: objectPositionForSrc(src, '50% 50%'),
        }),
      };
      return index > 0
        ? item
        : { ...item, excerpt: trimExcerpt(post.frontmatter.excerpt, LEAD_EXCERPT_CHARS) };
    }),
  };
}
