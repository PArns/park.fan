'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SearchResult, SearchResultItem } from '@/lib/api/types';
import { trackSearchNoResults } from '@/lib/analytics/umami';
import { useHeroBrowseParks, type HeroBrowseParks } from '@/lib/hooks/use-hero-browse-parks';

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
  /** What to list before anything is typed (nearby parks, this park's rides, or popular parks). */
  browse: HeroBrowseParks;
  /** Sort results within a category by match score (exact matches first), then OPERATING first. */
  sortResultsByMatch: (items: SearchResultItem[]) => { item: SearchResultItem; score: number }[];
}

/**
 * Data layer for the search palette: debounces the query and runs the three live queries
 * (main search, glossary search, nearby parks) plus the match scoring/sorting used to
 * order categories. Pure data — all rendering stays in <SearchDialog>.
 */
export function useSearchResults(query: string): UseSearchResultsReturn {
  const locale = useLocale();
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // React Query for search with caching
  const { data: results, isLoading: loading } = useQuery<SearchResult>({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = (await response.json()) as SearchResult;

      // Track no results (no query text for privacy — only length)
      if (data.results.length === 0) {
        trackSearchNoResults({ queryLength: debouncedQuery.length });
      }

      return data;
    },
    enabled: debouncedQuery.length >= 3,
    // Keep the previous query's results on screen while the next ones load — without this,
    // every debounced keystroke resets `data` to undefined and the dialog flashes
    // results → skeleton → results on each typed batch.
    placeholderData: keepPreviousData,
    staleTime: 60_000, // 1 min cache
    gcTime: 5 * 60_000, // 5 min garbage collection
    retry: 1,
  });

  // Glossary search
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

  // Pre-query list (nearby parks / this park's rides / popular parks). Shared with the hero's
  // in-place search and its bubbles, so every surface lists the same thing — and React Query
  // dedupes them all into one backend request.
  const browse = useHeroBrowseParks();

  // Calculate match score for exact matches: name should be compared with query
  const calculateMatchScore = (item: SearchResultItem): number => {
    const lowerName = item.name.toLowerCase();
    const lowerQuery = debouncedQuery.toLowerCase();

    // Exact name match = 100 points
    if (lowerName === lowerQuery) {
      return 100;
    }

    // Name starts with query = 50 points
    if (lowerName.startsWith(lowerQuery)) {
      return 50;
    }

    // Substring match = 30 points
    if (lowerName.includes(lowerQuery)) {
      return 30;
    }

    return 0;
  };

  // Sort results within each category by match score (exact matches first), then by status (OPERATING first)
  const sortResultsByMatch = (
    items: SearchResultItem[]
  ): { item: SearchResultItem; score: number }[] => {
    return items
      .map((item) => ({ item, score: calculateMatchScore(item) }))
      .sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;
        // Prefer OPERATING over non-OPERATING when scores are equal
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
    browse,
    sortResultsByMatch,
  };
}
