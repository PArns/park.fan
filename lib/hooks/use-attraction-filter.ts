'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import type { ParkAttraction, ParkShow, ParkStatus } from '@/lib/api/types';
import { isInSeason } from '@/lib/utils/season';
import { getLiveAttractionStatus } from '@/lib/utils/park-utils';
import { canRideAtHeight, riderHeightStops } from '@/lib/utils/rider-height';
import { coveredOfferReady, isCovered } from '@/lib/utils/covered-rides';
import type { ClosedRideSearchItem } from '@/components/parks/closed-ride-matches';

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
  /**
   * The rider height the filter starts on, in cm — from `?height=` on the park's URL, which a
   * park's "with kids" page links with. The server has already checked it against the park's own
   * posted minima (`initialRiderHeightFromParam`), so it is always a stop of the slider.
   */
  initialRiderHeight?: number | null;
  /**
   * The park's rides that closed for good. Never part of the grid; the search looks through them
   * too, so a name the park page no longer lists as a live ride still answers — see
   * `ClosedRideMatches`.
   */
  closedRides?: readonly ClosedRideSearchItem[];
}

const NO_CLOSED_RIDES: readonly ClosedRideSearchItem[] = [];

/**
 * Whether a ride counts as open for the "open now" toggle.
 *
 * Strictly OPERATING, and UNKNOWN is not it: a filter promising "open" must not answer with rides
 * nobody has heard from.
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
 * `only` demands `=== true` and `hide` only rejects `=== true`, so a ride nobody has checked stays
 * in the list when hiding. `mayGetWet` is absent on most rides, and a `hide` that dropped the
 * unknowns would leave almost nothing.
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

/** Focus is on the page itself, not on a control somebody moved to. */
function nothingFocused(active: Element | null): boolean {
  return active === null || active === document.body || active === document.documentElement;
}

/**
 * Filters the park page's attractions and shows by search, rider height, the five pills and
 * season, and returns the filtered lists, counts, headliners and every filter's state and setter.
 * The filters compose in declaration order (height, pills, season, search), each reading the
 * previous one's output, so the headliner row, the land grid and the panel's counts agree.
 */
export function useAttractionFilter({
  attractionsByLand,
  shows,
  activeTab,
  parkStatus,
  initialRiderHeight = null,
  closedRides = NO_CLOSED_RIDES,
}: UseAttractionFilterOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  /** Rider height in cm, or `null` while the height filter is off. */
  const [riderHeight, setRiderHeight] = useState<number | null>(initialRiderHeight);
  const [showOffSeasonAttractions, setShowOffSeasonAttractions] = useState(false);
  /** Show only rides that are OPERATING right now. */
  const [onlyOpen, setOnlyOpen] = useState(false);
  /** Show only the water rides, everything but them, or make no claim. */
  const [wetMode, setWetMode] = useState<WetMode>(null);
  /** Show only rides that sell a queue-jump product. */
  const [onlyFastPass, setOnlyFastPass] = useState(false);
  /** Show only rides with a single-rider line. */
  const [onlySingleRider, setOnlySingleRider] = useState(false);
  /** Show only rides that keep you dry: indoors, or behind a roofed queue. */
  const [onlyCovered, setOnlyCovered] = useState(false);
  const [showOffSeasonShows, setShowOffSeasonShows] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // A pill's own state stays urgent so it lights up on the tap; everything derived from it reads
  // a deferred copy, so the grid re-renders at lower priority instead of in the tap's commit. See
  // docs/rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md. All six come from
  // one update, so a render sees every old value or every new one.
  const deferredOnlyOpen = useDeferredValue(onlyOpen);
  const deferredWetMode = useDeferredValue(wetMode);
  const deferredOnlyFastPass = useDeferredValue(onlyFastPass);
  const deferredOnlySingleRider = useDeferredValue(onlySingleRider);
  const deferredOnlyCovered = useDeferredValue(onlyCovered);
  const deferredShowOffSeasonAttractions = useDeferredValue(showOffSeasonAttractions);
  // The rider height too: a press on the slider, its reset and arrow keys are all interactions.
  // The thumb, its label and the "23 of 40" readout keep the live value.
  const deferredRiderHeight = useDeferredValue(riderHeight);

  // Escape clears the search. The updater form reads the current query, so the listener needs no
  // dependencies and is not re-attached on every keystroke. Only from the field itself or with
  // nothing focused: an Escape that closes a dialog must not clear the filter behind it.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const active = document.activeElement;
      if (active !== inputRef.current && !nothingFocused(active)) return;
      // Keep focus in the input — clearing without blurring is the better UX here.
      setSearchQuery((q) => (q ? '' : q));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Typing focuses the search, only when nothing is focused and never for Space. See
  // docs/rules/a-keyboard-shortcut-waits-for-an-unfocused-page.md.
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'attractions') return;
      if (!nothingFocused(document.activeElement)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Single printable characters only, and Space stays with the page.
      if (e.key.length !== 1 || e.key === ' ') return;
      inputRef.current?.focus();
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeTab]);

  // Headliners, longest wait first, rides without a wait after them.
  const headliners = useMemo(() => {
    const all = Object.values(attractionsByLand)
      .flat()
      .filter(
        (a) =>
          a.isHeadliner &&
          (deferredShowOffSeasonAttractions || isInSeason(a)) &&
          (deferredRiderHeight === null || canRideAtHeight(a, deferredRiderHeight)) &&
          (!deferredOnlyOpen || isOpenNow(a, parkStatus)) &&
          matchesWet(a, deferredWetMode) &&
          (!deferredOnlyFastPass || hasFastPass(a)) &&
          (!deferredOnlySingleRider || hasSingleRider(a)) &&
          (!deferredOnlyCovered || isCovered(a))
      );

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
    deferredShowOffSeasonAttractions,
    deferredRiderHeight,
    deferredOnlyOpen,
    deferredWetMode,
    deferredOnlyFastPass,
    deferredOnlySingleRider,
    deferredOnlyCovered,
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
   * The heights the slider may be set to, or `null` when this park publishes no minimum height on
   * any ride, in which case the panel renders no height filter: a control whose every position
   * returns the same rides is worse than none.
   */
  const heightStops = useMemo(
    () => riderHeightStops(Object.values(attractionsByLand).flat()),
    [attractionsByLand]
  );

  /**
   * What each narrowing pill has to work with, counted over the whole park. A pill with nothing to
   * find is not rendered, rather than offering "no attractions found" as its only outcome; most
   * parks have none of these fields on file.
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
   * Rides the „Überdacht" pill would keep, and 0 unless the park has curated enough of its rides
   * to say so (`coveredOfferReady`), the same gate as the nowcast banner's. A count alone is not
   * enough here: three rides marked indoor among ninety unchecked would read, in the rain, as the
   * whole list.
   */
  const coveredAttractionCount = useMemo(() => {
    const all = Object.values(attractionsByLand).flat();
    return coveredOfferReady(all) ? all.filter(isCovered).length : 0;
  }, [attractionsByLand]);

  /**
   * The park's own name for its queue-jump product when it has exactly one ("VirtualLine" is the
   * word on Europa-Park's signs); with several, the pill keeps the generic label.
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
   * Height filtering, applied before the season filter and, unlike the season, also while
   * searching: a rider height is a statement about the person queuing, and a child does not
   * grow because a parent typed "Taron". The empty state offers to clear it by name.
   */
  const heightFilteredByLand = useMemo(() => {
    if (deferredRiderHeight === null) return attractionsByLand;
    const result: Record<string, ParkAttraction[]> = {};
    for (const [land, attractions] of Object.entries(attractionsByLand)) {
      const filtered = attractions.filter((a) => canRideAtHeight(a, deferredRiderHeight));
      if (filtered.length > 0) result[land] = filtered;
    }
    return result;
  }, [attractionsByLand, deferredRiderHeight]);

  /** Denominator and numerator of the panel's "23 of 40" readout. */
  const totalAttractionCount = useMemo(
    () => Object.values(attractionsByLand).flat().length,
    [attractionsByLand]
  );
  // Counted off the LIVE height: it is the slider's own readout and paints with the thumb.
  const rideableAttractionCount = useMemo(() => {
    if (riderHeight === null) return totalAttractionCount;
    let count = 0;
    for (const attractions of Object.values(attractionsByLand)) {
      for (const a of attractions) if (canRideAtHeight(a, riderHeight)) count++;
    }
    return count;
  }, [attractionsByLand, riderHeight, totalAttractionCount]);

  /**
   * The five pills, applied after the height and before the season, and not while searching:
   * like the off-season toggle they declutter browsing, and typing a ride's name asks for that
   * ride, shut or dry.
   */
  const narrowedByLand = useMemo(() => {
    if (
      !deferredOnlyOpen &&
      deferredWetMode === null &&
      !deferredOnlyFastPass &&
      !deferredOnlySingleRider &&
      !deferredOnlyCovered
    ) {
      return heightFilteredByLand;
    }
    const result: Record<string, ParkAttraction[]> = {};
    for (const [land, attractions] of Object.entries(heightFilteredByLand)) {
      const filtered = attractions.filter(
        (a) =>
          (!deferredOnlyOpen || isOpenNow(a, parkStatus)) &&
          matchesWet(a, deferredWetMode) &&
          (!deferredOnlyFastPass || hasFastPass(a)) &&
          (!deferredOnlySingleRider || hasSingleRider(a)) &&
          (!deferredOnlyCovered || isCovered(a))
      );
      if (filtered.length > 0) result[land] = filtered;
    }
    return result;
  }, [
    heightFilteredByLand,
    deferredOnlyOpen,
    deferredWetMode,
    deferredOnlyFastPass,
    deferredOnlySingleRider,
    deferredOnlyCovered,
    parkStatus,
  ]);

  const inSeasonAttractionsByLand = useMemo(() => {
    if (deferredShowOffSeasonAttractions || offSeasonAttractionCount === 0) return narrowedByLand;
    const result: Record<string, ParkAttraction[]> = {};
    for (const [land, attractions] of Object.entries(narrowedByLand)) {
      const filtered = attractions.filter(isInSeason);
      if (filtered.length > 0) result[land] = filtered;
    }
    return result;
  }, [narrowedByLand, deferredShowOffSeasonAttractions, offSeasonAttractionCount]);

  // The shows tab's off-season toggle stays urgent: a handful of light show cards, not the
  // attraction grid.
  const visibleShows = useMemo(() => {
    if (showOffSeasonShows || offSeasonShowCount === 0) return shows ?? [];
    return (shows ?? []).filter(isInSeason);
  }, [shows, showOffSeasonShows, offSeasonShowCount]);

  // The input updates `searchQuery` synchronously; the Fuse search and the grid re-render run
  // against a deferred copy, so each keystroke paints at once. A one-character query counts as
  // not searching, because Fuse cannot match below `minMatchCharLength`.
  const deferredQuery = useDeferredValue(searchQuery);
  const searchTerm = deferredQuery.trim();
  const isSearching = searchTerm.length >= MIN_QUERY_LENGTH;

  const filteredAttractionsByLand = useMemo(() => {
    if (!isSearching) return inSeasonAttractionsByLand;
    // Not filtered by season: typing a name asks for that ride whatever month it is, and an
    // exact search for an off-season ride must not answer "no attractions found". The cards say
    // "Nur im Winter" on their own. The height filter stays applied (`heightFilteredByLand`).
    return fuse
      .search(searchTerm)
      .map((result) => result.item)
      .filter((a) => deferredRiderHeight === null || canRideAtHeight(a, deferredRiderHeight))
      .reduce(
        (acc, attraction) => {
          const land = attractionLandKey[attraction.id] ?? attraction.land ?? 'Other';
          (acc[land] ??= []).push(attraction);
          return acc;
        },
        {} as Record<string, ParkAttraction[]>
      );
  }, [
    isSearching,
    searchTerm,
    inSeasonAttractionsByLand,
    fuse,
    attractionLandKey,
    deferredRiderHeight,
  ]);

  const hasSearchResults = Object.keys(filteredAttractionsByLand).length > 0;

  // The closed rides, searched with the grid's own options and its deferred term. None of the
  // pills or the rider height apply: they narrow the rides you can board today, and none of these
  // is one. A park without closed rides builds no index.
  const closedFuse = useMemo(
    () =>
      closedRides.length > 0
        ? new Fuse(closedRides, {
            keys: [
              { name: 'name', weight: 0.8 },
              { name: 'slug', weight: 0.8 },
              { name: 'land', weight: 0.5 },
            ],
            threshold: 0.3,
            distance: 100,
            ignoreLocation: true,
            minMatchCharLength: MIN_QUERY_LENGTH,
          })
        : null,
    [closedRides]
  );
  const closedRideMatches = useMemo(
    () =>
      isSearching && closedFuse
        ? closedFuse.search(searchTerm).map((result) => result.item)
        : NO_CLOSED_RIDES,
    [isSearching, searchTerm, closedFuse]
  );

  /**
   * Whether anything is currently cutting the grid down, from every filter's deferred reading so
   * it describes the grid on screen. It gates the rope-drop block, advice about the whole park
   * that must not sit over a grid that no longer matches it.
   */
  const isNarrowing =
    isSearching ||
    deferredRiderHeight !== null ||
    deferredOnlyOpen ||
    deferredWetMode !== null ||
    deferredOnlyFastPass ||
    deferredOnlySingleRider ||
    deferredOnlyCovered;

  return {
    inputRef,
    searchQuery,
    setSearchQuery,
    isSearching,
    filteredAttractionsByLand,
    hasSearchResults,
    closedRideMatches,
    /** The heights the slider may take, or `null` when the park publishes no minimum at all. */
    heightStops,
    riderHeight,
    setRiderHeight,
    totalAttractionCount,
    rideableAttractionCount,
    onlyOpen,
    setOnlyOpen,
    wetMode,
    setWetMode,
    onlyFastPass,
    setOnlyFastPass,
    onlySingleRider,
    setOnlySingleRider,
    onlyCovered,
    setOnlyCovered,
    /**
     * The pills as the GRID currently reads them, for anything that describes the grid instead of
     * the controls — the empty state's escape hatches, which belong to the list they explain. The
     * panel keeps the urgent values above, so a pill lights up on the tap.
     */
    appliedPills: {
      onlyOpen: deferredOnlyOpen,
      wetMode: deferredWetMode,
      onlyFastPass: deferredOnlyFastPass,
      onlySingleRider: deferredOnlySingleRider,
      onlyCovered: deferredOnlyCovered,
    },
    isNarrowing,
    openAttractionCount,
    wetAttractionCount,
    fastPassAttractionCount,
    singleRiderAttractionCount,
    coveredAttractionCount,
    /** The park's own brand for its queue-jump product, or `null` when it sells several. */
    fastPassLabel,
    headliners,
    offSeasonAttractionCount,
    showOffSeasonAttractions,
    setShowOffSeasonAttractions,
    visibleShows,
    offSeasonShowCount,
    showOffSeasonShows,
    setShowOffSeasonShows,
  };
}
