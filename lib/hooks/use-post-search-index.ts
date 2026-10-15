'use client';

import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import type { PostSearchEntry } from '@/lib/navigation/blog-menu';

/** Which posts a surface searches: `/blog` and the guides panel the articles, `/news` the news. */
export type PostSearchScope = 'all' | 'articles' | 'news';

// Module-level, so React Query keeps each `select` result while the data stays the same, and the
// search's fold cache, keyed by the array, holds across renders.
const SELECT: Record<
  PostSearchScope,
  ((posts: PostSearchEntry[]) => PostSearchEntry[]) | undefined
> = {
  all: undefined,
  articles: (posts) => posts.filter((post) => !post.news),
  news: (posts) => posts.filter((post) => post.news),
};

/**
 * Every post of the reader's locale from `/api/nav/posts/[locale]`, once `enabled`, narrowed to
 * `scope`. One query key for every surface that searches posts, so a tab asks once however many of
 * them it opens; the list is static per deployment, so it never goes stale.
 */
export function usePostSearchIndex(enabled: boolean, scope: PostSearchScope = 'all') {
  const locale = useLocale();
  return useQuery({
    queryKey: ['post-search-index', locale],
    queryFn: async () => {
      const response = await fetch(`/api/nav/posts/${locale}`);
      if (!response.ok) throw new Error(`nav posts ${response.status}`);
      return ((await response.json()) as { posts: PostSearchEntry[] }).posts;
    },
    select: SELECT[scope],
    enabled,
    staleTime: Infinity,
  });
}
