'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import type { ParkAttraction, ParkShow } from '@/lib/api/types';
import { isInSeason } from '@/lib/utils/season';
import { canRideAtHeight, riderHeightRange } from '@/lib/utils/rider-height';

/**
 * Shortest pattern Fuse can match, and therefore the shortest query worth running.
 *
 * It is Fuse's `minMatchCharLength`, read from one place so the two cannot drift: below
 * it every search returns nothing, so calling that "no attractions found" states
 * something we never checked. One character means the visitor is still typing.
 */
const MIN_QUERY_LENGTH = 2;

interface UseAttractionFilterOptions {
  attractionsByLand: Record<string, ParkAttraction[]>;
  shows: ParkShow[] | undefined;
  /** Currently active tab — the type-to-focus shortcut only applies on 'attractions'. */
  activeTab: string;
}

/**
 * Search, rider-height and seasonal filtering for the park page's attractions and shows
 * tabs: Fuse fuzzy search over all attractions, the rider-height filter (bounds derived
 * from the park's own limits), off-season hiding (attractions + shows, with counts for
 * the "N off season" toggles), the wait-time-sorted headliners section, and the global
 * keyboard wiring for the search input (Escape clears, typing focuses).
 *
 * The three filters compose in one order and it is the order they are declared in:
 * height, then season, then search — each reading the previous one's output, so the
 * headliner row, the land grid and the panel's counts can never disagree.
 */
export function useAttractionFilter({
  attractionsByLand,
  shows,
  activeTab,
}: UseAttractionFilterOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  /** Rider height in cm, or `null` while the height filter is off. */
  const [riderHeight, setRiderHeight] = useState<number | null>(null);
  const [showOffSeasonAttractions, setShowOffSeasonAttractions] = useState(false);
  const [showOffSeasonShows, setShowOffSeasonShows] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear search on Escape key. The updater form reads the current query, so the listener has
  // no dependencies — it used to depend on `searchQuery`, which tore down and re-attached a
  // global `keydown` listener on EVERY keystroke, right in the middle of the typing path this
  // hook otherwise works hard to keep responsive.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Keep focus in the input — clearing without blurring is the better UX here.
      setSearchQuery((q) => (q ? '' : q));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      .filter(
        (a) =>
          a.isHeadliner &&
          (showOffSeasonAttractions || isInSeason(a)) &&
          (riderHeight === null || canRideAtHeight(a, riderHeight))
      );

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
  }, [attractionsByLand, showOffSeasonAttractions, riderHeight]);

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
      minMatchCharLength: MIN_QUERY_LENGTH,
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

  /**
   * The slider's bounds and its tick marks, or `null` when this park publishes no
   * minimum height on any ride — which is the panel's signal to render no height
   * filter at all rather than an empty one. Roughly a third of the catalogue has
   * nothing on file here, and a control whose every position returns the same 40
   * rides is worse than no control.
   */
  const heightRange = useMemo(
    () => riderHeightRange(Object.values(attractionsByLand).flat()),
    [attractionsByLand]
  );

  /**
   * Height filtering, applied BEFORE the season filter and — unlike the season —
   * also while searching.
   *
   * That is the opposite of what the search does to the off-season toggle below,
   * and the difference is what the two filters are about. The season is a property
   * of the ride that the visitor never asked about, so typing a ride's name has to
   * reach past it. A rider height is a statement about the person who would be
   * queuing: a 105 cm child does not become tall enough because a parent typed
   * "Taron". So the filter holds, and the empty state offers to clear it by name.
   */
  const heightFilteredByLand = useMemo(() => {
    if (riderHeight === null) return attractionsByLand;
    const result: Record<string, ParkAttraction[]> = {};
    for (const [land, attractions] of Object.entries(attractionsByLand)) {
      const filtered = attractions.filter((a) => canRideAtHeight(a, riderHeight));
      if (filtered.length > 0) result[land] = filtered;
    }
    return result;
  }, [attractionsByLand, riderHeight]);

  /** Denominator and numerator of the panel's "23 of 40" readout. */
  const totalAttractionCount = useMemo(
    () => Object.values(attractionsByLand).flat().length,
    [attractionsByLand]
  );
  const rideableAttractionCount = useMemo(
    () => Object.values(heightFilteredByLand).flat().length,
    [heightFilteredByLand]
  );

  const inSeasonAttractionsByLand = useMemo(() => {
    if (showOffSeasonAttractions || offSeasonAttractionCount === 0) return heightFilteredByLand;
    const result: Record<string, ParkAttraction[]> = {};
    for (const [land, attractions] of Object.entries(heightFilteredByLand)) {
      const filtered = attractions.filter(isInSeason);
      if (filtered.length > 0) result[land] = filtered;
    }
    return result;
  }, [heightFilteredByLand, showOffSeasonAttractions, offSeasonAttractionCount]);

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
  //
  // A one-character query counts as "not searching" rather than as a search that found
  // nothing: Fuse cannot match a pattern shorter than `minMatchCharLength`, so the first
  // keystroke used to replace the whole grid with "no attractions found".
  const deferredQuery = useDeferredValue(searchQuery);
  const searchTerm = deferredQuery.trim();
  const isSearching = searchTerm.length >= MIN_QUERY_LENGTH;

  const filteredAttractionsByLand = useMemo(() => {
    if (!isSearching) return inSeasonAttractionsByLand;
    // Deliberately NOT filtered by season. The toggle above declutters BROWSING; typing a
    // name is not browsing, it is asking for one ride, and the answer to "maximus" is
    // Maximus' Blitz Bahn whatever month it is. Filtering the hits made every exact search
    // for one of Toverlands four off-season rides answer "no attractions found" — while
    // `ma` and `maxi` appeared to work, because Fuse drags in loose matches (Magiezijn,
    // Exploria Magica) that happen to be in season. So the search got emptier the more
    // precisely you typed, and the park looked like it had never heard of the ride it has
    // a whole page for. The cards say "Nur im Winter" and "Geschlossen" on their own.
    //
    // The HEIGHT filter is the exception and stays applied — see `heightFilteredByLand`.
    return fuse
      .search(searchTerm)
      .map((result) => result.item)
      .filter((a) => riderHeight === null || canRideAtHeight(a, riderHeight))
      .reduce(
        (acc, attraction) => {
          const land = attractionLandKey[attraction.id] ?? attraction.land ?? 'Other';
          (acc[land] ??= []).push(attraction);
          return acc;
        },
        {} as Record<string, ParkAttraction[]>
      );
  }, [isSearching, searchTerm, inSeasonAttractionsByLand, fuse, attractionLandKey, riderHeight]);

  const hasSearchResults = Object.keys(filteredAttractionsByLand).length > 0;

  return {
    // Search
    inputRef,
    searchQuery,
    setSearchQuery,
    isSearching,
    filteredAttractionsByLand,
    hasSearchResults,
    // Rider height
    /** Slider bounds + ticks, or `null` when the park publishes no minimum height at all. */
    heightRange,
    riderHeight,
    setRiderHeight,
    totalAttractionCount,
    rideableAttractionCount,
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
