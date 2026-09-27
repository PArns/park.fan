import { getTranslations } from 'next-intl/server';
import { BlogPostCard } from './blog-post-card';
import { listArticles, listNewsByDate } from '@/lib/blog/listing';
import { parseCategoryPath } from '@/lib/blog/categories';
import { isNewsCategory } from '@/lib/blog/paths';
import type { Locale } from '@/i18n/config';
import type { BlogListItem } from '@/lib/blog/types';

interface BlogRelatedPostsProps {
  locale: Locale;
  /** translationKey of the current post (excluded from results). */
  currentTranslationKey: string;
  /** Category path of the current post. */
  category?: string;
  /** Tags of the current post (used as secondary signal). */
  tags?: string[];
  limit?: number;
  title?: string;
}

function scorePost(post: BlogListItem, category: string | undefined, tags: string[]): number {
  let score = 0;
  if (category && post.frontmatter.category) {
    const target = parseCategoryPath(category);
    const actual = parseCategoryPath(post.frontmatter.category);
    let depth = 0;
    while (depth < target.length && depth < actual.length && target[depth] === actual[depth]) {
      depth++;
    }
    score += depth * 10;
  }
  if (tags.length > 0 && post.frontmatter.tags) {
    const overlap = post.frontmatter.tags.filter((tag) => tags.includes(tag)).length;
    score += overlap;
  }
  return score;
}

/**
 * "Keep reading" under a post, from the post's own section: an article is followed by articles,
 * a news post by news. The two sections are kept apart everywhere a list of posts appears (see
 * `docs/rules/news-is-set-apart-from-the-articles.md`). The cards stay the blog's on both: a news
 * post reads like an article (PAR-473), only what it recommends differs.
 */
export async function BlogRelatedPosts({
  locale,
  currentTranslationKey,
  category,
  tags = [],
  limit = 3,
  title,
}: BlogRelatedPostsProps) {
  const t = await getTranslations('blog');
  const isNews = isNewsCategory(category);
  const pool = isNews ? listNewsByDate(locale) : listArticles(locale);
  const all = pool.filter((p) => p.translationKey !== currentTranslationKey);

  // Rank the section by relevance — same-category posts score highest (category
  // depth is weighted heavily in scorePost), then shared tags, with recency as the
  // tiebreaker. Ranking across the whole section (instead of only the same-category
  // pool) means a thin category — e.g. a second "guides" post — still fills the row
  // instead of surfacing a single lonely card.
  const ranked = [...all]
    .map((post) => ({ post, score: scorePost(post, category, tags) }))
    .sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : (b.post.frontmatter.date ?? '').localeCompare(a.post.frontmatter.date ?? '')
    )
    .slice(0, limit)
    .map(({ post }) => post);

  if (ranked.length === 0) return null;

  return (
    <section className="my-12">
      <h2 className="text-foreground mb-5 text-xl font-bold">
        {title ?? (isNews ? t('related.news') : t('related.title'))}
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-5 @min-[1024px]/page:grid-cols-3">
        {ranked.map((post) => (
          <BlogPostCard key={post.translationKey} post={post} />
        ))}
      </div>
    </section>
  );
}
