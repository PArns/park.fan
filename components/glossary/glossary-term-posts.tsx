import { getTranslations } from 'next-intl/server';
import { Newspaper } from 'lucide-react';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { hasPublishedPosts } from '@/lib/blog/listing';
import { getPostsForGlossaryTerm } from '@/lib/blog/backlinks';
import type { Locale } from '@/i18n/config';

/**
 * "This term in our blog": the posts that embed a term's `glossary-widget`, which is the author
 * saying the article explains it (prose auto-links do not count; see `extractGlossaryRefs` in
 * `lib/blog/derive.mjs`). Renders nothing for the many terms no post covers and reserves no
 * height: it is manifest data, inline in the first HTML.
 */
interface GlossaryTermPostsProps {
  termId: string;
  /**
   * The term as the reader sees it, for the heading, which is often the page's first h2, so it
   * names the term rather than a generic "on the blog".
   */
  termName: string;
  locale: Locale;
  /** 2 fits the term page's narrower column; the park pages use 3 across their full width. */
  limit?: number;
}

/**
 * The blog posts that embed a term's `glossary-widget`, as cards under a heading naming the term.
 * Renders nothing when no post covers it or the locale has no blog.
 */
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
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
        {posts.map((post) => (
          <BlogPostCard key={post.translationKey} post={post} />
        ))}
      </div>
    </section>
  );
}
