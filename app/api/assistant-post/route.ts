import { NextResponse, type NextRequest } from 'next/server';
import { routing, type Locale } from '@/i18n/routing';
import { SITE_URL } from '@/i18n/config';
import { getPostByLocaleSlug } from '@/lib/blog';
import { postPath } from '@/lib/blog/paths';
import { cdnCacheHeaders, NO_STORE } from '@/lib/api/cdn-cache-headers';
import { postPlainText, postSections, postTextForQuery } from '@/lib/assistant/post-text';

/**
 * One post's text for Parky, the chat assistant on api.park.fan: plain text without Markdown,
 * shortened, so a question about a post costs a few thousand tokens rather than the whole article.
 * With the visitor's question in `q` it keeps the sections that answer it instead of the start, so
 * the second half of a long guide can reach the model too.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const QUERY_MAX = 200;

/**
 * Answers `?locale=&slug=&q=` with the post's title, URL, text and headings (`sections`), or 404;
 * with `q`, also the headings whose sections the text leaves out (`omitted`).
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const locale = params.get('locale') ?? '';
  const slug = params.get('slug') ?? '';
  const query = (params.get('q') ?? '').trim();
  if (
    !routing.locales.includes(locale as Locale) ||
    !SLUG.test(slug) ||
    slug.length > 160 ||
    query.length > QUERY_MAX
  ) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400, headers: NO_STORE });
  }

  const post = getPostByLocaleSlug(slug, locale as Locale);
  if (!post) return NextResponse.json({ found: false }, { status: 404, headers: NO_STORE });

  return NextResponse.json(
    {
      title: post.frontmatter.title,
      date: post.frontmatter.date,
      url: `${SITE_URL}/${post.loadedLocale}${postPath(post)}`,
      ...(query
        ? postTextForQuery(post.content, query)
        : {
            ...postPlainText(post.content),
            sections: postSections(post.content).sections.map((section) => section.heading),
          }),
    },
    {
      headers: cdnCacheHeaders('public, max-age=600, s-maxage=600, stale-while-revalidate=86400'),
    }
  );
}
