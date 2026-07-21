'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import type { SearchResult, SearchResultItem, ParkStatus, CrowdLevel } from '@/lib/api/types';
import { trackSearchNoResults } from '@/lib/analytics/umami';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import type { NearbyResponse, NearbyParksData, NearbyAttractionsData } from '@/types/nearby';

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
  /** Raw nearby response — needed for the "in park" heading. */
  nearbyData: NearbyResponse | undefined;
  /** Nearby parks/rides mapped to search-result items (pre-populates the empty dialog). */
  nearbyItems: (SearchResultItem & { distanceM?: number })[];
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
    staleTime: 300_000,
  });

  // Nearby parks for pre-populating the dialog when no query is entered. Shares the
  // canonical homepage query (radius 200, limit 6) so header/hero/card/search-bar all
  // dedupe into a single backend request instead of firing a separate limit-5 query.
  const { data: nearbyData } = useHomeNearbyParks();

  const nearbyItems = useMemo((): (SearchResultItem & { distanceM?: number })[] => {
    if (!nearbyData) return [];

    if (nearbyData.type === 'in_park') {
      const d = nearbyData.data as NearbyAttractionsData;
      return [
        {
          type: 'park',
          id: d.park.id,
          name: d.park.name,
          slug: d.park.slug,
          url: d.park.url,
          status: d.park.status as ParkStatus,
          load: d.park.analytics?.crowdLevel as CrowdLevel | undefined,
          distanceM: d.park.distance,
        },
        ...d.rides.slice(0, 3).map((ride) => ({
          type: 'attraction' as const,
          id: ride.id,
          name: ride.name,
          slug: ride.slug,
          url: ride.url,
          status: ride.status,
          waitTime: ride.waitTime ?? undefined,
          parentPark: {
            id: d.park.id,
            name: d.park.name,
            slug: d.park.slug,
            url: d.park.url ?? '',
          },
          distanceM: ride.distance,
        })),
      ];
    }

    if (nearbyData.type === 'nearby_parks') {
      const d = nearbyData.data as NearbyParksData;
      return d.parks.slice(0, 5).map((park) => ({
        type: 'park' as const,
        id: park.id,
        name: park.name,
        slug: park.slug,
        url: park.url,
        city: park.city,
        country: park.country,
        continent: park.continent,
        status: park.status as ParkStatus,
        load: park.analytics?.crowdLevel as CrowdLevel | undefined,
        distanceM: park.distance,
      }));
    }

    return [];
  }, [nearbyData]);

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
    nearbyData,
    nearbyItems,
    sortResultsByMatch,
  };
}
