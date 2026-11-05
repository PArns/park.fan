'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SearchResult, SearchResultItem } from '@/lib/api/types';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useSiteSearch } from '@/lib/hooks/use-site-search';
import { useHeroBrowseParks, type HeroBrowseParks } from '@/lib/hooks/use-hero-browse-parks';
import { usePostSearchIndex } from '@/lib/hooks/use-post-search-index';
import { searchPostsBySection, type PostSearchSection } from '@/lib/navigation/post-search';
import { rankByMatch } from '@/lib/utils/search-ranking';
import { SEARCH_SETTLE_MS } from '@/lib/analytics/search-session';

/** Guides and news a section keeps: what their own tab lists. "All" shows the first few of them. */
const POSTS_PER_SECTION = 20;

/** Shape of a single glossary hit returned by /api/glossary-search. */
export interface GlossarySearchItem {
  type: 'glossary';
  id: string;
  name: string;
  slug: string;
  shortDefinition: string;
  category: string;
}

export interface UseSearchResultsReturn {
  /** Debounced (300 ms) version of the live query — drives all fetches. */
  debouncedQuery: string;
  /** Main search results (parks/attractions/shows/restaurants/locations). */
  results: SearchResult | undefined;
  loading: boolean;
  /** Glossary term hits for the same debounced query. */
  glossaryData: { results: GlossarySearchItem[] } | undefined;
  /** Guides and news matching the debounced query, once the post list has arrived. */
  posts: { articles: PostSearchSection; news: PostSearchSection } | null;
  /** The post list is still on its way for a query that will need it. */
  postsPending: boolean;
  /** What to list before anything is typed (nearby parks, this park's rides, or popular parks). */
  browse: HeroBrowseParks;
  /** Sort results within a category by match score (exact matches first), then OPERATING first. */
  sortResultsByMatch: (items: SearchResultItem[]) => { item: SearchResultItem; score: number }[];
}

/**
 * Data layer for the search palette: debounces the query and runs the three live queries
 * (main search, glossary search, nearby parks), searches the guides and news in the browser, and
 * scores the matches used to order categories. Pure data — all rendering stays in <SearchDialog>.
 */
export function useSearchResults(query: string): UseSearchResultsReturn {
  const locale = useLocale();
  const debouncedQuery = useDebouncedValue(query, SEARCH_SETTLE_MS);
  const { data: results, isLoading: loading } = useSiteSearch(debouncedQuery);

  const { data: glossaryData } = useQuery<{ results: GlossarySearchItem[] }>({
    queryKey: ['glossary-search', debouncedQuery, locale],
    queryFn: async () => {
      const response = await fetch(
        `/api/glossary-search?q=${encodeURIComponent(debouncedQuery)}&locale=${locale}`
      );
      if (!response.ok) throw new Error('Glossary search failed');
      return response.json() as Promise<{ results: GlossarySearchItem[] }>;
    },
    enabled: debouncedQuery.length >= 3,
    // Same as the main search: don't blank the glossary group between debounced queries.
    placeholderData: keepPreviousData,
    staleTime: 300_000,
  });

  // The post list is asked for at the first typed letter rather than with the palette: the hero
  // mounts this hook on every homepage view, and most of them never search.
  const postIndex = usePostSearchIndex(query.trim().length > 0);
  const postIndexData = postIndex.data;
  const posts = useMemo(
    () =>
      postIndexData && debouncedQuery.trim().length >= 3
        ? searchPostsBySection(postIndexData, debouncedQuery, POSTS_PER_SECTION)
        : null,
    [postIndexData, debouncedQuery]
  );

  // Pre-query list (nearby parks / this park's rides / popular parks). Shared with the hero's
  // lists on both viewports, so every surface lists the same thing — and React Query dedupes them
  // all into one backend request.
  const browse = useHeroBrowseParks();

  const sortResultsByMatch = (items: SearchResultItem[]) => rankByMatch(items, debouncedQuery);

  return {
    debouncedQuery,
    results,
    loading,
    glossaryData,
    posts,
    postsPending: postIndex.isLoading,
    browse,
    sortResultsByMatch,
  };
}
