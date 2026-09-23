import { NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { listPosts } from '@/lib/blog/listing';
import { resolveCategoryLabel } from '@/lib/blog/categories';
import { versionedPath } from '@/lib/media/focus';
import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';
import type { LatestPost, LatestPostsPayload } from '@/lib/blog/new-posts';

/**
 * The newest blog posts of one locale, for the "new since your last visit" toast
 * (`components/blog/new-posts-watcher.tsx`, logic in `lib/blog/new-posts.ts`).
 *
 * Fetched, not rendered into the layout: the toast shows on a small share of page views, and
 * the RSC payload of every page is paid by every request, the crawler's included. The browser
 * asks for this at most once per ten minutes, after the page is idle.
 *
 * Built from the generated manifest only, so nothing here changes until the next deployment —
 * one static file per locale. News is in it like every other post: the toast announces what
 * arrived, it is not one of the teaser lists that keep news apart.
 *
 * Ten minutes at the edge, not an hour: nothing can purge Cloudflare, and a news post ("from
 * Saturday") is worth announcing mostly in the hours after it goes live. The file is static,
 * so a revalidation costs the origin no function call.
 */

/**
 * Enough to compare a return visit against, not an archive. More than this many posts
 * published between two visits still shows as "this one and N more"; the N is capped here.
 */
const LIMIT = 6;

export const dynamic = 'force-static';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!routing.locales.includes(rawLocale as Locale)) {
    return NextResponse.json({ error: 'Unknown locale' }, { status: 404 });
  }
  const locale = rawLocale as Locale;

  // Publication order, not `listPostsByRecency`: an edited post is not a new one, and
  // `listPosts` puts `featured` posts first, which is a listing decision, not a date.
  const posts: LatestPost[] = [...listPosts(locale)]
    .sort((a, b) =>
      a.frontmatter.date === b.frontmatter.date
        ? a.translationKey.localeCompare(b.translationKey)
        : a.frontmatter.date < b.frontmatter.date
          ? 1
          : -1
    )
    .slice(0, LIMIT)
    .map((post) => {
      const category = post.frontmatter.category;
      const cover = post.frontmatter.coverImage?.src;
      return {
        key: post.translationKey,
        slug: post.slug,
        title: post.frontmatter.title,
        date: post.frontmatter.date,
        category: category
          ? resolveCategoryLabel(category, locale, category.split('/').filter(Boolean).pop() ?? '')
          : undefined,
        image: versionedPath(cover) ?? cover,
      };
    });

  const t = await getTranslations({ locale, namespace: 'blogToast' });
  const payload: LatestPostsPayload = {
    labels: {
      eyebrow: t('eyebrow'),
      read: t('read'),
      close: t('close'),
      // Raw: `{count}` is filled in by the browser, which is the side that knows the count.
      moreOne: t.raw('moreOne') as string,
      moreOther: t.raw('moreOther') as string,
      allPosts: t('allPosts'),
    },
    posts,
  };

  return NextResponse.json(payload, {
    headers: cdnCacheHeaders('public, max-age=600, s-maxage=600, stale-while-revalidate=86400'),
  });
}
