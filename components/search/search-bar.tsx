'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, TreePalm, Cog, Utensils, Music, MapPin, Clock, Loader2 } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { stripNewPrefix } from '@/lib/utils';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import type { SearchResult, SearchResultItem } from '@/lib/api/types';
import {
  trackSearchOpened,
  trackSearchResultClicked,
  trackSearchViewAll,
  trackSearchNoResults,
} from '@/lib/analytics/umami';

const typeIcons = {
  park: TreePalm,
  attraction: Cog,
  show: Music,
  restaurant: Utensils,
  location: MapPin,
};

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

      // Track no results
      if (data.results.length === 0) {
        trackSearchNoResults({ query: debouncedQuery, queryLength: debouncedQuery.length });
      }

      return data;
    },
    enabled: debouncedQuery.length >= 3,
    staleTime: 60_000, // 1 min cache
    gcTime: 5 * 60_000, // 5 min garbage collection
    retry: 1,
  });

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
  const renderResultItem = (result: SearchResultItem, position?: number) => {
    const Icon = typeIcons[result.type];

    return (
      <CommandItem
        key={result.id}
        value={`${stripNewPrefix(result.name)} ${result.type}`}
        onSelect={() => handleSelect(result, position)}
        className="flex items-start gap-3 py-4 md:py-3"
      >
        <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
          <Icon className="text-primary h-4 w-4" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="font-medium">{stripNewPrefix(result.name)}</span>
            {result.status && (
              <Badge
                className={`border-0 text-xs font-medium ${
                  result.status === 'OPERATING'
                    ? 'bg-status-operating text-white'
                    : 'bg-status-closed text-white'
                }`}
              >
                {result.status === 'OPERATING' ? t('open') : t('closed')}
              </Badge>
            )}
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
            {/* Type Badge */}
            <Badge variant="secondary" className="text-xs">
              {tSearch(`types.${result.type}`)}
            </Badge>

            {/* Location */}
            {(result.city || result.country) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {[
                  result.city,
                  result.country
                    ? tGeo(`countries.${result.country.toLowerCase().replace(/\s+/g, '-')}`)
                    : null,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            )}

            {/* Parent Park for attractions */}
            {result.parentPark && (
              <span className="truncate">
                {tSearch('at', { park: stripNewPrefix(result.parentPark.name) })}
              </span>
            )}

            {/* Wait Time */}
            {result.type === 'attraction' &&
              result.waitTime !== undefined &&
              result.waitTime !== null && (
                <span className="text-foreground flex items-center gap-1 font-medium">
                  <Clock className="h-3 w-3" />
                  {result.waitTime} min
                </span>
              )}

            {/* Crowd Level */}
            {result.type === 'park' && result.load && result.status !== 'CLOSED' && (
              <CrowdLevelBadge level={result.load} className="text-xs" />
            )}
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
      setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    };

    checkMobile();
    checkPlatform();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          <kbd className="bg-muted pointer-events-none absolute top-2 right-2 hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-xs font-medium opacity-100 select-none md:flex">
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
          <Search
            className={`text-muted-foreground group-hover:text-primary absolute top-1/2 z-10 -translate-y-1/2 transition-colors ${
              size === 'sm' ? 'left-3 h-4 w-4' : 'left-4 h-5 w-5'
            }`}
          />
          <div
            className={`border-input bg-background/60 hover:bg-background/80 hover:border-primary/50 text-muted-foreground flex w-full items-center justify-between border shadow-sm backdrop-blur-md transition-all hover:shadow-md ${
              size === 'sm'
                ? 'h-10 rounded-lg px-3 py-2 pr-12 pl-10 text-sm'
                : 'h-14 rounded-xl px-4 py-3 pr-14 pl-12 text-base'
            } ${className}`}
          >
            <span className="w-full truncate text-left">
              {placeholder || t('searchPlaceholderLong')}
            </span>
          </div>
          <kbd
            className={`bg-muted text-muted-foreground pointer-events-none absolute top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border font-mono font-medium md:flex ${
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
      <CommandDialog open={open} onOpenChange={handleOpenChange} shouldFilter={false}>
        <CommandInput
          placeholder={isMobile ? 'Parks, Attraktionen...' : t('searchPlaceholderLong')}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          )}

          {!loading && query.length >= 3 && (!results || results.results.length === 0) && (
            <CommandEmpty>{t('noResults')}</CommandEmpty>
          )}

          {!loading && results && results.results.length > 0 && (
            <>
              {/* Group by type */}
              {(['park', 'attraction', 'show', 'restaurant', 'location'] as const).map((type) => {
                const items = results.results.filter((r) => r.type === type);
                if (items.length === 0) return null;

                return (
                  <CommandGroup
                    key={type}
                    heading={tSearch(`headings.${type}`, { count: items.length })}
                  >
                    {items.slice(0, 5).map((item, index) => renderResultItem(item, index))}
                  </CommandGroup>
                );
              })}

              {/* Link to full search page */}
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-center text-sm"
                  onClick={() => {
                    handleOpenChange(false);
                    trackSearchViewAll(); // Track viewing all results
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                  }}
                >
                  {tSearch('viewAllResults', { query })}
                </Button>
              </div>
            </>
          )}

          {!loading && query.length < 3 && (
            <div className="text-muted-foreground py-6 text-center text-sm">
              {tSearch('typeToSearch')}
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
