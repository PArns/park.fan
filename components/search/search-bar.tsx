'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  TreePalm,
  Cog,
  Utensils,
  Music,
  MapPin,
  Clock,
  BookOpen,
  Leaf,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { stripNewPrefix } from '@/lib/utils';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import type { SearchResult, SearchResultItem, ParkStatus, CrowdLevel } from '@/lib/api/types';
import {
  trackSearchOpened,
  trackSearchResultClicked,
  trackSearchViewAll,
  trackSearchNoResults,
} from '@/lib/analytics/umami';
import { useNearbyParks } from '@/lib/hooks/use-nearby-parks';
import type { NearbyParksData, NearbyAttractionsData } from '@/types/nearby';

const typeIcons = {
  park: TreePalm,
  attraction: Cog,
  show: Music,
  restaurant: Utensils,
  location: MapPin,
  glossary: BookOpen,
};

function SkeletonItem({ width }: { width: string }) {
  return (
    <div className="flex items-center gap-4 rounded-lg px-3 py-3.5">
      <div className="bg-foreground/10 h-11 w-11 shrink-0 animate-pulse rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="bg-foreground/10 h-3.5 animate-pulse rounded-full" style={{ width }} />
          <div className="bg-foreground/[8%] h-4 w-14 animate-pulse rounded-full" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="bg-foreground/[8%] h-2.5 w-28 animate-pulse rounded-full" />
          <div className="bg-foreground/[8%] h-2.5 w-10 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}

interface SearchCommandProps {
  trigger?: 'button' | 'input' | 'hero';
  label?: string;
  placeholder?: string;
  isGlobal?: boolean;
  autoFocusOnType?: boolean;
  size?: 'sm' | 'lg'; // sm for header, lg for jumbotron
  /** When set, used as source for search_opened when this trigger opens the dialog (e.g. "hero" for hero search field). */
  searchOpenSource?: 'header' | 'hero';
  className?: string;
}

export function SearchCommand({
  trigger = 'button',
  label,
  placeholder,
  isGlobal = false,
  autoFocusOnType = false,
  size = 'lg',
  searchOpenSource = 'header',
  className,
}: SearchCommandProps) {
  const t = useTranslations('common');
  const tSearch = useTranslations('search');
  const tGeo = useTranslations('geo');
  const router = useRouter();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

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
  const { data: glossaryData } = useQuery<{
    results: Array<{
      type: 'glossary';
      id: string;
      name: string;
      slug: string;
      shortDefinition: string;
      category: string;
    }>;
  }>({
    queryKey: ['glossary-search', debouncedQuery, locale],
    queryFn: async () => {
      const response = await fetch(
        `/api/glossary-search?q=${encodeURIComponent(debouncedQuery)}&locale=${locale}`
      );
      if (!response.ok) throw new Error('Glossary search failed');
      return response.json() as Promise<{
        results: Array<{
          type: 'glossary';
          id: string;
          name: string;
          slug: string;
          shortDefinition: string;
          category: string;
        }>;
      }>;
    },
    enabled: debouncedQuery.length >= 3,
    staleTime: 300_000,
  });

  // Nearby parks for pre-populating the dialog when no query is entered
  const { data: nearbyData } = useNearbyParks({ radiusInMeters: 50000, limit: 5 });

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

  const nearbyHeading =
    nearbyData?.type === 'in_park'
      ? tSearch('headings.inPark', {
          park: stripNewPrefix((nearbyData.data as NearbyAttractionsData).park.name),
        })
      : tSearch('headings.nearby');

  // Handle dialog open/close and reset state
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset search when dialog closes
      setQuery('');
      setDebouncedQuery('');
    }
  };

  // Keyboard shortcut to open search (Cmd+K / Ctrl+K)
  useEffect(() => {
    if (!isGlobal) return;

    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const wasOpen = open;
        setOpen((open) => !open);
        // Track search opened via keyboard shortcut
        if (!wasOpen) {
          trackSearchOpened('keyboard');
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isGlobal, open]);

  // Auto-focus on type
  useEffect(() => {
    if (!autoFocusOnType) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
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
        const wasOpen = open;
        setOpen(true);
        setQuery((prev) => (open ? prev : e.key));
        // Track search opened via auto-focus
        if (!wasOpen) {
          trackSearchOpened('keyboard');
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [autoFocusOnType, open]);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle selecting a result
  const handleSelect = (result: SearchResultItem, position?: number) => {
    handleOpenChange(false);

    // Track the result click (NOT the search query content)
    trackSearchResultClicked({
      resultType: result.type,
      position,
      hasQuery: query.trim().length > 0,
      queryLength: query.trim().length,
    });

    if (result.url) {
      // Use centralized utility for URL conversion
      const cleanUrl = convertApiUrlToFrontendUrl(result.url);
      router.push(cleanUrl as '/parks/europe');
    } else if (result.type === 'park' && result.continent && result.country) {
      // Build URL from available data
      const citySlug = result.city?.toLowerCase().replace(/\s+/g, '-') || 'unknown';
      router.push(
        `/parks/${result.continent.toLowerCase()}/${result.country.toLowerCase()}/${citySlug}/${result.slug}` as '/parks/europe/germany/rust/europa-park'
      );
    } else if (result.type === 'glossary') {
      // Navigate to glossary term page — next-intl router adds locale prefix automatically
      const glossarySegments: Record<string, string> = {
        en: 'glossary',
        de: 'glossar',
        fr: 'glossaire',
        it: 'glossario',
        nl: 'woordenlijst',
        es: 'glosario',
      };
      const seg = glossarySegments[locale] ?? 'glossary';
      router.push(`/${seg}/${result.slug}` as '/parks/europe');
    } else if (result.parentPark && result.parentPark.url) {
      // Fallback for attractions/shows/restaurants without explicit URL
      const parkUrl = convertApiUrlToFrontendUrl(result.parentPark.url);

      if (result.type === 'restaurant') {
        router.push(`${parkUrl}#restaurants` as '/parks/europe');
      } else if (result.type === 'show') {
        router.push(`${parkUrl}#shows` as '/parks/europe');
      } else {
        router.push(`${parkUrl}/${result.slug}` as '/parks/europe');
      }
    }
  };

  // Render a search result item
  const renderResultItem = (
    result: SearchResultItem & { distanceM?: number },
    position?: number
  ) => {
    const Icon = typeIcons[result.type];

    const formatDistance = (m: number) =>
      m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;

    const isClosed = result.status && result.status !== 'OPERATING';

    return (
      <CommandItem
        key={result.id}
        value={`${stripNewPrefix(result.name)} ${result.type} ${result.id}`}
        onSelect={() => handleSelect(result, position)}
        className="flex cursor-pointer items-center gap-4"
      >
        {/* Icon */}
        <div className="bg-foreground/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
          <Icon className="text-foreground/65 h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {/* Row 1: Name + Status */}
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-[15px] leading-none font-semibold">
              {stripNewPrefix(result.name)}
            </span>
            {result.status && <ParkStatusBadge status={result.status} className="text-[11px]" />}
          </div>

          {/* Row 2: Location (left) + Crowd / Wait / Distance (right) */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-foreground/45 flex min-w-0 items-center gap-2 text-xs">
              {/* Location */}
              {(result.city || result.country) && (
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {[
                      result.city,
                      result.country
                        ? translateGeoSlug(tGeo, 'countries', result.country, result.country)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </span>
              )}

              {/* Parent Park for attractions */}
              {result.parentPark && (
                <span className="truncate">
                  {tSearch('at', { park: stripNewPrefix(result.parentPark.name) })}
                </span>
              )}
            </div>

            {/* Right: Wait Time + Crowd + Distance */}
            <div className="flex shrink-0 items-center gap-2">
              {result.isSeasonal && result.isCurrentlyInSeason === true && (
                <Leaf className="h-3.5 w-3.5 shrink-0 text-violet-400" />
              )}

              {result.type === 'attraction' && result.waitTime != null && (
                <span className="text-foreground/70 flex items-center gap-1 text-xs font-semibold">
                  <Clock className="h-3 w-3" />
                  {result.waitTime} min
                </span>
              )}

              {result.type === 'park' && result.load && !isClosed && (
                <CrowdLevelBadge level={result.load} className="text-[11px]" />
              )}

              {result.distanceM != null && (
                <span className="text-foreground/35 text-[11px] font-medium tabular-nums">
                  {formatDistance(result.distanceM)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CommandItem>
    );
  };

  const [isMobile, setIsMobile] = useState(false);
  const [isMac, setIsMac] = useState(true); // Default to Mac for SSR

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    const checkPlatform = () => {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
    };

    checkMobile();
    checkPlatform();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show skeleton as soon as user types ≥3 chars (covers debounce window + fetch)
  const isPending = loading || (query.trim().length >= 3 && debouncedQuery.trim().length < 3);

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

  return (
    <>
      {/* Trigger */}
      {trigger === 'button' && (
        <Button
          variant="outline"
          className="relative h-10 w-10 p-0 md:h-9 md:w-64 md:justify-start md:px-3 md:py-2"
          onClick={() => {
            handleOpenChange(true);
            trackSearchOpened(searchOpenSource);
          }}
          aria-label={t('search')}
        >
          <Search className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline-flex">
            {placeholder || t('searchPlaceholderShort')}
          </span>
          <kbd className="bg-primary/40 text-primary border-primary/40 pointer-events-none absolute top-2 right-2 hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-xs font-medium opacity-100 shadow-sm select-none md:flex">
            {isMac ? <span className="text-xs">⌘</span> : 'Ctrl'}K
          </kbd>
        </Button>
      )}

      {trigger === 'input' && (
        <div
          className="group relative w-full cursor-pointer"
          onClick={() => {
            handleOpenChange(true);
            trackSearchOpened(searchOpenSource);
          }}
        >
          {/* Animated idle ring — hero only, not in header */}
          {size === 'lg' && (
            <div className="border-primary/50 pointer-events-none absolute -inset-[2px] animate-[hero-search-pulse_2.5s_ease-in-out_infinite] rounded-[14px] border transition-opacity group-hover:opacity-0" />
          )}
          <Search
            className={`text-muted-foreground group-hover:text-primary absolute top-1/2 z-10 -translate-y-1/2 transition-colors ${
              size === 'sm' ? 'left-3 h-4 w-4' : 'left-4 h-5 w-5'
            }`}
          />
          <div
            className={`border-primary/20 hover:border-primary/40 text-muted-foreground flex w-full items-center justify-between border shadow-md backdrop-blur-lg transition-all hover:shadow-lg dark:bg-[oklch(0.12_0.025_241_/_0.55)] dark:hover:bg-[oklch(0.14_0.030_241_/_0.65)] ${
              size === 'sm'
                ? 'bg-background/60 hover:bg-background/75 h-10 rounded-lg px-3 py-2 pr-12 pl-10 text-sm'
                : 'bg-background/77 hover:bg-background/85 h-14 rounded-xl px-4 py-3 pr-14 pl-12 text-base'
            } ${className}`}
          >
            <span className="text-foreground/40 dark:text-muted-foreground/50 w-full truncate text-left">
              {placeholder || t('searchPlaceholderLong')}
            </span>
          </div>
          <kbd
            className={`bg-primary/20 text-primary border-primary/20 pointer-events-none absolute top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border font-mono font-medium shadow-sm md:flex ${
              size === 'sm' ? 'right-2 h-6 px-1.5 text-[11px]' : 'right-3 h-8 gap-1 px-2.5 text-sm'
            }`}
          >
            {isMac ? (
              <>
                <span
                  className={
                    size === 'sm' ? 'translate-y-[1px] text-sm' : 'translate-y-[1px] text-xl'
                  }
                >
                  ⌘
                </span>
                <span>K</span>
              </>
            ) : (
              <>Ctrl K</>
            )}
          </kbd>
        </div>
      )}

      {trigger === 'hero' && (
        <Button
          variant="outline"
          size="lg"
          className="gap-2"
          onClick={() => {
            handleOpenChange(true);
            trackSearchOpened(searchOpenSource || 'hero');
          }}
        >
          <Search className="h-4 w-4" />
          {label || t('search')}
        </Button>
      )}

      {/* Search Dialog */}
      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        shouldFilter={false}
        showCloseButton={false}
      >
        <CommandInput
          placeholder={isMobile ? t('searchPlaceholderShort') : t('searchPlaceholderLong')}
          value={query}
          onValueChange={setQuery}
          hint={
            <kbd className="bg-primary/15 text-primary border-primary/20 hidden shrink-0 items-center gap-0.5 rounded border px-1.5 py-1 font-mono text-xs shadow-sm md:flex">
              {isMac ? (
                <>
                  <span className="translate-y-px text-sm">⌘</span>
                  <span>K</span>
                </>
              ) : (
                <>Ctrl K</>
              )}
            </kbd>
          }
        />
        <CommandList>
          {isPending && (
            <div className="max-h-[calc(100svh-14rem)] overflow-hidden p-1 sm:max-h-[420px]">
              {/* Fake section header */}
              <div className="px-3 pt-4 pb-1.5">
                <div className="h-2 w-16 animate-pulse rounded-full bg-white/[8%]" />
              </div>
              {Array.from({ length: 2 }).map((_, i) => (
                <SkeletonItem key={`a${i}`} width={['55%', '72%'][i]} />
              ))}
              {/* Fake section header */}
              <div className="px-3 pt-4 pb-1.5">
                <div className="h-2 w-24 animate-pulse rounded-full bg-white/[8%]" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonItem key={`b${i}`} width={['48%', '65%', '58%'][i]} />
              ))}
            </div>
          )}

          {!isPending &&
            debouncedQuery.length >= 3 &&
            (!results || results.results.length === 0) &&
            (!glossaryData || glossaryData.results.length === 0) && (
              <CommandEmpty>{t('noResults')}</CommandEmpty>
            )}

          {!isPending &&
            debouncedQuery.length >= 3 &&
            (!results || results.results.length === 0) &&
            glossaryData &&
            glossaryData.results.length > 0 && (
              <CommandGroup
                heading={tSearch('headings.glossary', { count: glossaryData.results.length })}
              >
                {glossaryData.results.map((item) => {
                  const glossarySegments: Record<string, string> = {
                    en: 'glossary',
                    de: 'glossar',
                    fr: 'glossaire',
                    it: 'glossario',
                    nl: 'woordenlijst',
                    es: 'glosario',
                  };
                  const seg = glossarySegments[locale] ?? 'glossary';
                  return (
                    <CommandItem
                      key={item.id}
                      value={`${item.name} glossary`}
                      onSelect={() => {
                        handleOpenChange(false);
                        trackSearchResultClicked({
                          resultType: 'glossary',
                          term_id: item.id,
                          hasQuery: query.trim().length > 0,
                          queryLength: query.trim().length,
                        });
                        router.push(`/${seg}/${item.slug}` as '/parks/europe');
                      }}
                      className="flex cursor-pointer items-center gap-4"
                    >
                      <div className="bg-foreground/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                        <BookOpen className="text-foreground/65 h-5 w-5" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="truncate text-[15px] leading-none font-semibold">
                          {item.name}
                        </span>
                        <span className="text-foreground/45 truncate text-xs">
                          {item.shortDefinition}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

          {!isPending && results && results.results.length > 0 && (
            <>
              {/* Build all category groups (including glossary), sort by best match score */}
              {(() => {
                const groups: { key: string; score: number; node: ReactNode }[] = [];

                const mainTypes = results.results.some((r) => r.type === 'location')
                  ? (['location', 'park', 'attraction', 'show', 'restaurant'] as const)
                  : (['park', 'attraction', 'show', 'restaurant', 'location'] as const);

                const itemsByType = Object.groupBy(results.results, (r) => r.type);

                mainTypes.forEach((type) => {
                  const items = itemsByType[type];
                  if (!items || items.length === 0) return;
                  const scoredSortedItems = sortResultsByMatch(items);
                  const bestScore = scoredSortedItems.length > 0 ? scoredSortedItems[0].score : 0;
                  groups.push({
                    key: type,
                    score: bestScore,
                    node: (
                      <CommandGroup
                        key={type}
                        heading={tSearch(`headings.${type}`, { count: items.length })}
                      >
                        {scoredSortedItems
                          .slice(0, 5)
                          .map(({ item }, index) => renderResultItem(item, index))}
                      </CommandGroup>
                    ),
                  });
                });

                if (glossaryData && glossaryData.results.length > 0) {
                  const glossarySegments: Record<string, string> = {
                    en: 'glossary',
                    de: 'glossar',
                    fr: 'glossaire',
                    it: 'glossario',
                    nl: 'woordenlijst',
                    es: 'glosario',
                  };
                  const seg = glossarySegments[locale] ?? 'glossary';
                  // Glossary results found by API (which searches English names + aliases)
                  // should rank higher than substring matches in other categories
                  const glossaryBestScore = 40;
                  groups.push({
                    key: 'glossary',
                    score: glossaryBestScore,
                    node: (
                      <CommandGroup
                        key="glossary"
                        heading={tSearch('headings.glossary', {
                          count: glossaryData.results.length,
                        })}
                      >
                        {glossaryData.results.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={`${item.name} glossary`}
                            onSelect={() => {
                              handleOpenChange(false);
                              trackSearchResultClicked({
                                resultType: 'glossary',
                                term_id: item.id,
                                hasQuery: query.trim().length > 0,
                                queryLength: query.trim().length,
                              });
                              router.push(`/${seg}/${item.slug}` as '/parks/europe');
                            }}
                            className="flex cursor-pointer items-center gap-4"
                          >
                            <div className="bg-foreground/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                              <BookOpen className="text-foreground/65 h-5 w-5" />
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                              <span className="truncate text-[15px] leading-none font-semibold">
                                {item.name}
                              </span>
                              <span className="text-foreground/45 truncate text-xs">
                                {item.shortDefinition}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ),
                  });
                }

                // Sort all groups: exact matches (score=100) first, then by descending score
                groups.sort((a, b) => b.score - a.score);

                return groups.map((g) => g.node);
              })()}

              {/* Link to full search page */}
              <div className="border-border/30 border-t p-3">
                <Button
                  variant="ghost"
                  className="hover:bg-foreground/10 w-full justify-center text-sm"
                  onClick={() => {
                    handleOpenChange(false);
                    trackSearchViewAll();
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                  }}
                >
                  {tSearch('viewAllResults', { query })}
                </Button>
              </div>
            </>
          )}

          {!isPending && query.length < 3 && (
            <>
              {nearbyItems.length > 0 ? (
                <CommandGroup heading={nearbyHeading}>
                  {nearbyItems.map((item, index) => renderResultItem(item, index))}
                </CommandGroup>
              ) : (
                <div className="text-muted-foreground py-10 text-center text-sm">
                  {tSearch('typeToSearch')}
                </div>
              )}
            </>
          )}
        </CommandList>

        {/* Keyboard shortcuts footer – hidden on mobile */}
        <div className="border-primary/10 bg-primary/10 text-foreground/50 dark:text-muted-foreground/60 hidden items-center gap-4 border-t px-5 py-3 text-xs sm:flex">
          <span className="flex items-center gap-1.5">
            <kbd className="bg-primary/20 text-primary flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-[11px] shadow-sm">
              ↑↓
            </kbd>
            {tSearch('keyboard.navigate')}
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="bg-primary/20 text-primary flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-[11px] shadow-sm">
              ↵
            </kbd>
            {tSearch('keyboard.select')}
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <kbd className="bg-primary/20 text-primary flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-[11px] shadow-sm">
              Esc
            </kbd>
            {tSearch('keyboard.close')}
          </span>
        </div>
      </CommandDialog>
    </>
  );
}
