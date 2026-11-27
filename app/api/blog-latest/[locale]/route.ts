import { NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { listPosts } from '@/lib/blog/listing';
import { resolveCategoryLabel } from '@/lib/blog/categories';
import { objectPositionForSrc, versionedPath } from '@/lib/media/focus';
import { cdnCacheHeaders, NO_STORE } from '@/lib/api/cdn-cache-headers';
import { latestPostKind, type LatestPost, type LatestPostsPayload } from '@/lib/blog/new-posts';
import { postPath } from '@/lib/blog/paths';
import { newestPublishedFirst } from '@/lib/blog/published-at';
import { resolveAuthor } from '@/lib/blog/authors';
import { resolveNewsPark } from '@/lib/blog/news-park';

/**
 * The newest blog posts of one locale, for the "new since your last visit" toast
 * (`components/blog/new-posts-watcher.tsx`). Fetched rather than rendered into the layout, because
 * every page's RSC payload is paid by every request. Static per deployment and news included,
 * since the toast announces what arrived. Ten minutes, because a deploy purges Cloudflare
 * but not a browser's copy, and news is worth announcing early.
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

/** The name a post's byline shows, as the post header draws it. */
function byline(author: Parameters<typeof resolveAuthor>[0], locale: Locale): string | undefined {
  const resolved = resolveAuthor(author, locale);
  return resolved.shortName ?? resolved.name;
}

async function newsParkName(translationKey: string): Promise<string | undefined> {
  const park = await resolveNewsPark(translationKey).catch(() => null);
  return park?.name;
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!routing.locales.includes(rawLocale as Locale)) {
    return NextResponse.json({ error: 'Unknown locale' }, { status: 404, headers: NO_STORE });
  }
  const locale = rawLocale as Locale;

  // Publication order, not `listPostsByRecency`: an edited post is not a new one, and
  // `listPosts` puts `featured` posts first, which is a listing decision, not a date. The toast
  // leads with the first post, so a day with several news posts has to sort by their `time`.
  const posts: LatestPost[] = await Promise.all(
    [...listPosts(locale)]
      .sort(
        (a, b) =>
          newestPublishedFirst(a.frontmatter, b.frontmatter) ||
          a.translationKey.localeCompare(b.translationKey)
      )
      .slice(0, LIMIT)
      .map(async (post) => {
        const category = post.frontmatter.category;
        const kind = latestPostKind(category);
        const cover = post.frontmatter.coverImage?.src;
        const root = category?.split('/')[0];
        // "News · today" under a "News" eyebrow says it twice; a subcategory still adds something.
        const namedByEyebrow = !category?.includes('/');
        return {
          key: post.translationKey,
          path: postPath(post),
          title: post.frontmatter.title,
          date: post.frontmatter.date,
          kind,
          categoryRoot:
            kind === 'post' && root ? resolveCategoryLabel(root, locale, root) : undefined,
          category:
            category && !namedByEyebrow
              ? resolveCategoryLabel(
                  category,
                  locale,
                  category.split('/').filter(Boolean).pop() ?? ''
                )
              : undefined,
          image: versionedPath(cover) ?? cover,
          imagePosition: objectPositionForSrc(cover, '50% 50%'),
          excerpt: post.frontmatter.excerpt?.trim() || undefined,
          readingMinutes: post.readingTimeMinutes > 0 ? post.readingTimeMinutes : undefined,
          author: byline(post.frontmatter.author, locale),
          // Without a park (none named, or the API unreachable at build) the card leaves it out.
          park: kind === 'news' ? await newsParkName(post.translationKey) : undefined,
        };
      })
  );

  const [t, tBlog] = await Promise.all([
    getTranslations({ locale, namespace: 'blogToast' }),
    getTranslations({ locale, namespace: 'blog' }),
  ]);
  const payload: LatestPostsPayload = {
    labels: {
      eyebrow: t('eyebrow'),
      eyebrowNews: t('eyebrowNews'),
      eyebrowGuide: t('eyebrowGuide'),
      read: t('read'),
      // Raw, like the counts: the browser fills in `{minutes}` per post.
      readingTime: tBlog.raw('readingTime') as string,
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
