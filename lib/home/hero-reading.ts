import 'server-only';
import { resolveMostRead } from '@/lib/blog/most-read';
import { listArticlesByRecency, listNewsByDate } from '@/lib/blog/listing';
import { trimExcerpt } from '@/lib/navigation/blog-menu';
import type { HeroReading } from '@/lib/home/hero-search';
import type { Locale } from '@/i18n/config';

/** A teaser's length: two lines of the hero's post row, cut at a word. */
const EXCERPT_CHARS = 110;

/**
 * The hero's two posts: the newest news post and the newest guide, from the manifest. Both are in
 * the static shell and nothing swaps them after load, so the hero is where a visitor finds the
 * news that came out since the last visit.
 */
export function getHeroReading(locale: Locale): HeroReading {
  const newest = [listNewsByDate(locale)[0], listArticlesByRecency(locale)[0]];
  const excerpts: Record<string, string> = {};
  for (const post of newest) {
    const excerpt = post && trimExcerpt(post.frontmatter.excerpt, EXCERPT_CHARS);
    if (excerpt) excerpts[post.translationKey] = excerpt;
  }
  // An empty ranking resolves to the posts in the order given, which is the row shape wanted here.
  const [news, guide] = newest.map(
    (post, index) => (post && resolveMostRead([], [post], locale, index === 0)[0]) ?? null
  );
  return { news, guide, excerpts };
}
