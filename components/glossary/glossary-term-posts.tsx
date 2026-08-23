import { getTranslations } from 'next-intl/server';
import { Newspaper } from 'lucide-react';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { hasPublishedPosts } from '@/lib/blog/listing';
import { getPostsForGlossaryTerm } from '@/lib/blog/backlinks';
import type { Locale } from '@/i18n/config';

/**
 * "This term in our blog" — the return path that was missing from the link graph.
 *
 * A post reaches into the glossary in two ways: `GlossaryInject` links the first occurrence of
 * every known term in its prose, and an author can embed a term's card with a `glossary-widget`
 * fence. Only the second counts here. The first is a reading aid that would put nearly every post
 * on `wait-time` and `queue`; embedding the widget is the author saying the article explains this
 * term. See `extractGlossaryRefs` in `lib/blog/derive.mjs`.
 *
 * Renders nothing at all when no post covers the term, which today is 248 of 267 of them. That is
 * the intended shape, not a gap to pad: the sibling `GlossaryTermRides` slot carries a long
 * comment about why this page reserves no height for content that most terms do not have — a
 * fixed fallback would tear a permanent hole in the majority of the glossary. This block is pure
 * manifest data (no API call, no clock), so it resolves inline in the first HTML and never
 * arrives late enough to shift anything.
 */
interface GlossaryTermPostsProps {
  termId: string;
  /**
   * The term as the reader sees it, for the heading.
   *
   * This is often the FIRST h2 on the page — glossary terms otherwise ship an h1 and no heading
   * structure below it — so it carries the term rather than a generic "on the blog".
   */
  termName: string;
  locale: Locale;
  /** 2 fits the term page's narrower column; the park pages use 3 across their full width. */
  limit?: number;
}

export async function GlossaryTermPosts({
  termId,
  termName,
  locale,
  limit = 2,
}: GlossaryTermPostsProps) {
  // Locale-scoped: a language with no published posts hides its blog entirely, and a term page
  // must not be the one place that links into it.
  if (!hasPublishedPosts(locale)) return null;

  const posts = getPostsForGlossaryTerm(locale, termId, { limit });
  if (posts.length === 0) return null;

  const t = await getTranslations('glossary.blogPosts');

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Newspaper className="text-primary h-5 w-5" aria-hidden="true" />
        <h2 className="text-lg font-bold">{t('title', { term: termName })}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <BlogPostCard key={post.translationKey} post={post} />
        ))}
      </div>
    </section>
  );
}
