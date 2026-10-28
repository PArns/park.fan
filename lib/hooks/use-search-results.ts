'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SearchResult, SearchResultItem } from '@/lib/api/types';
import { useHeroBrowseParks, type HeroBrowseParks } from '@/lib/hooks/use-hero-browse-parks';
import { usePostSearchIndex } from '@/lib/hooks/use-post-search-index';
import { searchPostsBySection, type PostSearchSection } from '@/lib/navigation/post-search';
import { foldText } from '@/lib/utils/text-fold';
import { SEARCH_SETTLE_MS } from '@/lib/analytics/search-session';

/** Guides and news a section keeps: what their own tab lists. "All" shows the first few of them. */
const POSTS_PER_SECTION = 20;

/**
 * `foldText` plus punctuation removal — "F.L.Y." becomes "fly". `foldText` folds accents the way
 * the API's matcher does, so the scoring here agrees with the order the API sorted the results into.
 */
const foldAlphanumeric = (value: string): string => foldText(value).replace(/[^a-z0-9]/g, '');

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
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_SETTLE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading: loading } = useQuery<SearchResult>({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return (await response.json()) as SearchResult;
    },
    enabled: debouncedQuery.length >= 3,
    // Keep the previous query's results on screen while the next ones load — without this,
    // every debounced keystroke resets `data` to undefined and the dialog flashes
    // results → skeleton → results on each typed batch.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });

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

  const calculateMatchScore = (item: SearchResultItem): number => {
    const name = foldText(item.name);
    const query = foldText(debouncedQuery);
    const plainName = foldAlphanumeric(item.name);
    const plainQuery = foldAlphanumeric(debouncedQuery);
    const hasPlainQuery = plainQuery.length > 0;

    // Also without the punctuation the name carries: "fly" for "F.L.Y.".
    if (name === query || (hasPlainQuery && plainName === plainQuery)) {
      return 100;
    }

    if (name.startsWith(query) || (hasPlainQuery && plainName.startsWith(plainQuery))) {
      return 50;
    }

    if (name.includes(query) || (hasPlainQuery && plainName.includes(plainQuery))) {
      return 30;
    }

    return 0;
  };

  const sortResultsByMatch = (
    items: SearchResultItem[]
  ): { item: SearchResultItem; score: number }[] => {
    return items
      .map((item) => ({ item, score: calculateMatchScore(item) }))
      .sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;
        const aOperating = a.item.status === 'OPERATING' ? 0 : 1;
        const bOperating = b.item.status === 'OPERATING' ? 0 : 1;
        return aOperating - bOperating;
      });
  };

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
