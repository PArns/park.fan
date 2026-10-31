import { NextResponse, type NextRequest } from 'next/server';
import { routing, type Locale } from '@/i18n/routing';
import { SITE_URL } from '@/i18n/config';
import { getPostByLocaleSlug } from '@/lib/blog';
import { postPath } from '@/lib/blog/paths';
import { cdnCacheHeaders, NO_STORE } from '@/lib/api/cdn-cache-headers';
import { postPlainText } from '@/lib/assistant/post-text';

/**
 * One post's text for Parky, the chat assistant on api.park.fan: plain text without Markdown,
 * shortened, so a question about a post costs a few thousand tokens rather than the whole article.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Answers `?locale=&slug=` with the post's title, URL and text, or 404. */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const locale = params.get('locale') ?? '';
  const slug = params.get('slug') ?? '';
  if (!routing.locales.includes(locale as Locale) || !SLUG.test(slug) || slug.length > 160) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400, headers: NO_STORE });
  }

  const post = getPostByLocaleSlug(slug, locale as Locale);
  if (!post) return NextResponse.json({ found: false }, { status: 404, headers: NO_STORE });

  return NextResponse.json(
    {
      title: post.frontmatter.title,
      date: post.frontmatter.date,
      url: `${SITE_URL}/${post.loadedLocale}${postPath(post)}`,
      ...postPlainText(post.content),
    },
    {
      headers: cdnCacheHeaders('public, max-age=600, s-maxage=600, stale-while-revalidate=86400'),
    }
  );
}
