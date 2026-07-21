'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import type { ParkAttraction, ParkShow } from '@/lib/api/types';

/** Seasonal entities count as in season unless the API explicitly says otherwise. */
const isInSeason = (x: { isCurrentlyInSeason?: boolean | null }) => x.isCurrentlyInSeason !== false;

interface UseAttractionFilterOptions {
  attractionsByLand: Record<string, ParkAttraction[]>;
  shows: ParkShow[] | undefined;
  /** Currently active tab — the type-to-focus shortcut only applies on 'attractions'. */
  activeTab: string;
}

/**
 * Search + seasonal filtering for the park page's attractions and shows tabs:
 * Fuse fuzzy search over all attractions, off-season hiding (attractions + shows, with
 * counts for the "N off season" toggles), the wait-time-sorted headliners section, and
 * the global keyboard wiring for the search input (Escape clears, typing focuses).
 */
export function useAttractionFilter({
  attractionsByLand,
  shows,
  activeTab,
}: UseAttractionFilterOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showOffSeasonAttractions, setShowOffSeasonAttractions] = useState(false);
  const [showOffSeasonShows, setShowOffSeasonShows] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear search on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
        // Optional: blur input if desired, but keeping focus is usually better for UX
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  // Auto-focus on typing
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only trigger if attractions tab is active
      if (activeTab !== 'attractions') return;

      // Ignore if user is already typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ignore modifiers
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Only trigger on single character keys (letters, numbers, etc.)
      if (e.key.length === 1) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeTab]);

  // Headliner attractions sorted by wait time (operating first, then no-wait, then closed)
  const headliners = useMemo(() => {
    const all = Object.values(attractionsByLand)
      .flat()
      .filter((a) => a.isHeadliner && (showOffSeasonAttractions || isInSeason(a)));

    // Pre-calculate wait times to avoid repeated find() calls in sort comparator (Schwartzian transform)
    return all
      .map((a) => ({
        a,
        wait: a.queues?.find((q) => q.queueType === 'STANDBY')?.waitTime ?? null,
      }))
      .sort((a, b) => {
        if (a.wait !== null && b.wait !== null) return b.wait - a.wait;
        if (a.wait !== null) return -1;
        if (b.wait !== null) return 1;
        return 0;
      })
      .map((item) => item.a);
  }, [attractionsByLand, showOffSeasonAttractions]);

  // Reverse map: attraction id → land key as used in attractionsByLand (preserves translated fallback label)
  const attractionLandKey = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(attractionsByLand).forEach(([land, attractions]) => {
      attractions.forEach((a) => {
        map[a.id] = land;
      });
    });
    return map;
  }, [attractionsByLand]);

  const fuse = useMemo(() => {
    const allAttractions = Object.values(attractionsByLand).flat();
    return new Fuse(allAttractions, {
      keys: [
        { name: 'name', weight: 0.8 },
        { name: 'slug', weight: 0.8 },
        { name: 'land', weight: 0.5 },
        { name: 'queues.queueType', weight: 0.3 },
      ],
      threshold: 0.3,
      distance: 100,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [attractionsByLand]);

  // Off-season filtering
  const offSeasonAttractionCount = useMemo(
    () =>
      Object.values(attractionsByLand)
        .flat()
        .filter((a) => !isInSeason(a)).length,
    [attractionsByLand]
  );

  const offSeasonShowCount = useMemo(
    () => (shows ?? []).filter((s) => !isInSeason(s)).length,
    [shows]
  );

  const inSeasonAttractionsByLand = useMemo(() => {
    if (showOffSeasonAttractions || offSeasonAttractionCount === 0) return attractionsByLand;
    const result: Record<string, ParkAttraction[]> = {};
    for (const [land, attractions] of Object.entries(attractionsByLand)) {
      const filtered = attractions.filter(isInSeason);
      if (filtered.length > 0) result[land] = filtered;
    }
    return result;
  }, [attractionsByLand, showOffSeasonAttractions, offSeasonAttractionCount]);

  const visibleShows = useMemo(() => {
    if (showOffSeasonShows || offSeasonShowCount === 0) return shows ?? [];
    return (shows ?? []).filter(isInSeason);
  }, [shows, showOffSeasonShows, offSeasonShowCount]);

  // Keep typing responsive on big parks: the input updates `searchQuery` synchronously, but the
  // expensive Fuse search + full attraction-grid re-render run against a DEFERRED copy at lower
  // priority, so each keystroke paints immediately instead of blocking on the filter. This was the
  // dominant mobile-INP cost (~700 ms/keystroke on a 96-attraction park): it used to run unmemoized
  // in the render body, so every keystroke re-ran the fuzzy search + re-rendered every land before
  // the next paint. `useMemo` also stops it recomputing on unrelated re-renders (the 5-min poll).
  const deferredQuery = useDeferredValue(searchQuery);
  const isSearching = deferredQuery.trim() !== '';

  const filteredAttractionsByLand = useMemo(() => {
    const q = deferredQuery.trim();
    if (q === '') return inSeasonAttractionsByLand;
    return fuse
      .search(q)
      .map((result) => result.item)
      .filter((a) => showOffSeasonAttractions || isInSeason(a))
      .reduce(
        (acc, attraction) => {
          const land = attractionLandKey[attraction.id] ?? attraction.land ?? 'Other';
          (acc[land] ??= []).push(attraction);
          return acc;
        },
        {} as Record<string, ParkAttraction[]>
      );
  }, [deferredQuery, inSeasonAttractionsByLand, fuse, showOffSeasonAttractions, attractionLandKey]);

  const hasSearchResults = Object.keys(filteredAttractionsByLand).length > 0;

  return {
    // Search
    inputRef,
    searchQuery,
    setSearchQuery,
    isSearching,
    filteredAttractionsByLand,
    hasSearchResults,
    // Attractions
    headliners,
    offSeasonAttractionCount,
    showOffSeasonAttractions,
    setShowOffSeasonAttractions,
    // Shows
    visibleShows,
    offSeasonShowCount,
    showOffSeasonShows,
    setShowOffSeasonShows,
  };
}
