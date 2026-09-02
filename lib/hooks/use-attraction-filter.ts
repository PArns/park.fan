'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import type { ParkAttraction, ParkShow, ParkStatus } from '@/lib/api/types';
import { isInSeason } from '@/lib/utils/season';
import { getLiveAttractionStatus } from '@/lib/utils/park-utils';
import { canRideAtHeight, riderHeightStops } from '@/lib/utils/rider-height';

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
  /** The park's own live status — a shut park closes every ride in it. */
  parkStatus?: ParkStatus;
}

/**
 * Whether a ride counts as open for the "open now" toggle.
 *
 * Strictly OPERATING, and UNKNOWN is not it. The card renders a wait time for an
 * UNKNOWN ride and its badge says "Unbekannt", which is the honest reading of a
 * feed that has not spoken: a filter promising "open" must not answer with rides
 * nobody has heard from. Fifty of Europa-Park's ninety-six sit there before the
 * gates open.
 */
const isOpenNow = (attraction: ParkAttraction, parkStatus?: ParkStatus): boolean =>
  getLiveAttractionStatus(attraction, parkStatus) === 'OPERATING';

/** Whether a ride is one you may get off wet. Absent/null is unknown, never "dry". */
const mayGetWet = (attraction: ParkAttraction): boolean => attraction.mayGetWet === true;

/**
 * What the wet-ride pill is set to. `null` is off.
 *
 * Three states rather than two because both directions are a real errand: looking
 * for the water rides on a hot afternoon, and keeping a dry set of clothes for the
 * evening.
 */
export type WetMode = 'only' | 'hide' | null;

/**
 * The three answers, and the asymmetry between the two active ones.
 *
 * `only` demands `=== true`, `hide` only rejects `=== true` — so a ride nobody has
 * checked stays in the list when hiding and stays out when showing. It has to be
 * that way round: `mayGetWet` is absent on 93 of Europa-Park's 96 rides, and a
 * `hide` that also dropped the unknowns would answer a park of 96 with three.
 */
const matchesWet = (attraction: ParkAttraction, mode: WetMode): boolean =>
  mode === null ? true : mode === 'only' ? mayGetWet(attraction) : !mayGetWet(attraction);

/** The cycle the pill walks: off → the water rides → everything but them → off. */
export const nextWetMode = (mode: WetMode): WetMode =>
  mode === null ? 'only' : mode === 'only' ? 'hide' : null;

/**
 * Whether a ride sells a queue-jump product, tested exactly as `FastPassBadge`
 * tests it — the filter and the badge answer one question and must not disagree
 * about which rides carry it.
 *
 * Absent is "nobody checked, or the park sells none", and the payload does not
 * separate the two. Which is why there is no "without" state here: it would turn
 * most of the catalogue into a claim.
 */
const hasFastPass = (attraction: ParkAttraction): boolean => Boolean(attraction.fastPass?.name);

/** `hasSingleRider` is three-valued and `SingleRiderBadge` renders only `true`; same here. */
const hasSingleRider = (attraction: ParkAttraction): boolean => attraction.hasSingleRider === true;

/**
 * Search, rider-height, live-status, wet-ride, queue-jump, single-rider and seasonal
 * filtering for the park page's attractions and shows tabs: Fuse fuzzy search over all
 * attractions, the rider-height filter (stops derived from the park's own limits), the
 * four narrowing pills, off-season hiding (attractions + shows, with counts for the
 * "N off season" toggles), the wait-time-sorted headliners section, and the global
 * keyboard wiring for the search input (Escape clears, typing focuses).
 *
 * The filters compose in one order and it is the order they are declared in: height,
 * then the four pills, then season, then search — each reading the previous one's
 * output, so the headliner row, the land grid and the panel's counts can never
 * disagree.
 */
export function useAttractionFilter({
  attractionsByLand,
  shows,
  activeTab,
  parkStatus,
}: UseAttractionFilterOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  /** Rider height in cm, or `null` while the height filter is off. */
  const [riderHeight, setRiderHeight] = useState<number | null>(null);
  const [showOffSeasonAttractions, setShowOffSeasonAttractions] = useState(false);
  /** Show only rides that are OPERATING right now. */
  const [onlyOpen, setOnlyOpen] = useState(false);
  /** Show only the water rides, everything but them, or make no claim. */
  const [wetMode, setWetMode] = useState<WetMode>(null);
  /** Show only rides that sell a queue-jump product. */
  const [onlyFastPass, setOnlyFastPass] = useState(false);
  /** Show only rides with a single-rider line. */
  const [onlySingleRider, setOnlySingleRider] = useState(false);
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
          (riderHeight === null || canRideAtHeight(a, riderHeight)) &&
          (!onlyOpen || isOpenNow(a, parkStatus)) &&
          matchesWet(a, wetMode) &&
          (!onlyFastPass || hasFastPass(a)) &&
          (!onlySingleRider || hasSingleRider(a))
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
  }, [
    attractionsByLand,
    showOffSeasonAttractions,
    riderHeight,
    onlyOpen,
    wetMode,
    onlyFastPass,
    onlySingleRider,
    parkStatus,
  ]);

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
   * The heights the slider may be set to, or `null` when this park publishes no
   * minimum height on any ride — which is the panel's signal to render no height
   * filter at all rather than an empty one. Roughly a third of the catalogue has
   * nothing on file here, and a control whose every position returns the same 40
   * rides is worse than no control.
   */
  const heightStops = useMemo(
    () => riderHeightStops(Object.values(attractionsByLand).flat()),
    [attractionsByLand]
  );

  /**
   * What each narrowing pill has to work with, counted over the whole park.
   *
   * They gate whether a pill is RENDERED at all, which is the alternative to
   * offering a filter whose only possible outcome is "no attractions found". Most
   * of the catalogue has none of these on file: `mayGetWet` on 3 of Europa-Park's
   * 96 rides and 1 of Toverland's 45, `fastPass` on 7 of Europa-Park and none at
   * all at Efteling or Toverland, `hasSingleRider` on 6 and 7 and none — and at
   * 04:00 nothing anywhere is open.
   */
  const openAttractionCount = useMemo(
    () =>
      Object.values(attractionsByLand)
        .flat()
        .filter((a) => isOpenNow(a, parkStatus)).length,
    [attractionsByLand, parkStatus]
  );
  const wetAttractionCount = useMemo(
    () => Object.values(attractionsByLand).flat().filter(mayGetWet).length,
    [attractionsByLand]
  );
  const fastPassAttractionCount = useMemo(
    () => Object.values(attractionsByLand).flat().filter(hasFastPass).length,
    [attractionsByLand]
  );
  const singleRiderAttractionCount = useMemo(
    () => Object.values(attractionsByLand).flat().filter(hasSingleRider).length,
    [attractionsByLand]
  );

  /**
   * The park's own name for its queue-jump product, when it has exactly one.
   *
   * Europa-Park sells "VirtualLine" and that is the word on every sign, in the app
   * and in the mouth of anybody who has been — a pill saying it is a pill a visitor
   * recognizes, where a generic "Quickpass" is a word the park does not use. Two or
   * more distinct names (a park with a per-ride override) fall back to the generic
   * label, because a pill filtering for three products cannot be titled after one
   * of them.
   */
  const fastPassLabel = useMemo(() => {
    const names = new Set<string>();
    for (const a of Object.values(attractionsByLand).flat()) {
      if (a.fastPass?.name) names.add(a.fastPass.name);
      if (names.size > 1) return null;
    }
    return names.size === 1 ? [...names][0] : null;
  }, [attractionsByLand]);

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

  /**
   * "Open now" and "you may get wet", applied after the height and before the
   * season — and, unlike the height, NOT applied while searching.
   *
   * Same split as the off-season toggle, for the same reason: both are ways of
   * decluttering a park somebody is browsing, and neither is a statement about the
   * person queuing. Typing "Black Mamba" is asking for one ride, and the answer to
   * it is that ride, shut or dry; the card says "Geschlossen" on its own.
   */
  const narrowedByLand = useMemo(() => {
    if (!onlyOpen && wetMode === null && !onlyFastPass && !onlySingleRider) {
      return heightFilteredByLand;
    }
    const result: Record<string, ParkAttraction[]> = {};
    for (const [land, attractions] of Object.entries(heightFilteredByLand)) {
      const filtered = attractions.filter(
        (a) =>
          (!onlyOpen || isOpenNow(a, parkStatus)) &&
          matchesWet(a, wetMode) &&
          (!onlyFastPass || hasFastPass(a)) &&
          (!onlySingleRider || hasSingleRider(a))
      );
      if (filtered.length > 0) result[land] = filtered;
    }
    return result;
  }, [heightFilteredByLand, onlyOpen, wetMode, onlyFastPass, onlySingleRider, parkStatus]);

  const inSeasonAttractionsByLand = useMemo(() => {
    if (showOffSeasonAttractions || offSeasonAttractionCount === 0) return narrowedByLand;
    const result: Record<string, ParkAttraction[]> = {};
    for (const [land, attractions] of Object.entries(narrowedByLand)) {
      const filtered = attractions.filter(isInSeason);
      if (filtered.length > 0) result[land] = filtered;
    }
    return result;
  }, [narrowedByLand, showOffSeasonAttractions, offSeasonAttractionCount]);

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
    /** The heights the slider may take, or `null` when the park publishes no minimum at all. */
    heightStops,
    riderHeight,
    setRiderHeight,
    totalAttractionCount,
    rideableAttractionCount,
    // Narrowing pills
    onlyOpen,
    setOnlyOpen,
    wetMode,
    setWetMode,
    onlyFastPass,
    setOnlyFastPass,
    onlySingleRider,
    setOnlySingleRider,
    openAttractionCount,
    wetAttractionCount,
    fastPassAttractionCount,
    singleRiderAttractionCount,
    /** The park's own brand for its queue-jump product, or `null` when it sells several. */
    fastPassLabel,
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
