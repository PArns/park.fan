'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
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
import type { SearchResult, SearchResultItem } from '@/lib/api/types';

const typeIcons = {
  park: TreePalm,
  attraction: Cog,
  show: Music,
  restaurant: Utensils,
};

interface SearchCommandProps {
  trigger?: 'button' | 'input' | 'hero';
  label?: string;
  placeholder?: string;
  isGlobal?: boolean;
  autoFocusOnType?: boolean;
}

export function SearchCommand({
  trigger = 'button',
  label,
  placeholder,
  isGlobal = false,
  autoFocusOnType = false,
}: SearchCommandProps) {
  const t = useTranslations('common');
  const tSearch = useTranslations('search');
  const tGeo = useTranslations('geo');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Keyboard shortcut to open search (Cmd+K / Ctrl+K)
  useEffect(() => {
    if (!isGlobal) return;

    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isGlobal]);

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
        setOpen(true);
        setQuery((prev) => (open ? prev : e.key));
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [autoFocusOnType, open]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      // Use local API route to avoid CORS
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = (await response.json()) as SearchResult;
        setResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Handle selecting a result
  const handleSelect = (result: SearchResultItem) => {
    setOpen(false);
    setQuery('');

    if (result.url) {
      // Strip /v1 prefix but keep /parks structure for future content (news, blog)
      // Also remove the /attractions/ segment that comes after park URLs
      const cleanUrl = result.url
        .replace(/^\/v1\/parks\//, '/parks/')
        .replace(/^\/v1\/attractions\//, '/parks/')
        .replace(/^\/v1\/shows\//, '/parks/')
        .replace(/^\/v1\/restaurants\//, '/parks/')
        .replace(/\/attractions\//, '/'); // Remove /attractions/ segment
      router.push(cleanUrl as '/parks/europe');
    } else if (result.type === 'park' && result.continent && result.country) {
      // Build URL from available data
      const citySlug = result.city?.toLowerCase().replace(/\s+/g, '-') || 'unknown';
      router.push(
        `/parks/${result.continent.toLowerCase()}/${result.country.toLowerCase()}/${citySlug}/${result.slug}` as '/parks/europe/germany/rust/europa-park'
      );
    }
  };

  // Render a search result item
  const renderResultItem = (result: SearchResultItem) => {
    const Icon = typeIcons[result.type];

    return (
      <CommandItem
        key={result.id}
        value={`${result.name} ${result.type}`}
        onSelect={() => handleSelect(result)}
        className="flex items-start gap-3 py-3"
      >
        <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
          <Icon className="text-primary h-4 w-4" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="font-medium">{result.name}</span>
            {result.status && (
              <Badge
                variant="outline"
                className={`text-xs ${result.status === 'OPERATING'
                    ? 'border-green-600 text-green-600'
                    : 'border-red-500 text-red-500'
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
              <span className="truncate">{tSearch('at', { park: result.parentPark.name })}</span>
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
              <Badge
                className={`text-xs ${result.load === 'very_low' || result.load === 'low'
                    ? 'bg-crowd-low'
                    : result.load === 'moderate'
                      ? 'bg-crowd-moderate'
                      : 'bg-crowd-high'
                  } text-white`}
              >
                {t(`crowd.${result.load}`)}
              </Badge>
            )}
          </div>
        </div>
      </CommandItem>
    );
  };

  return (
    <>
      {/* Trigger */}
      {trigger === 'button' && (
        <Button
          variant="outline"
          className="relative h-10 w-10 p-0 md:h-9 md:w-64 md:justify-start md:px-3 md:py-2"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline-flex">
            {placeholder || t('searchPlaceholderShort')}
          </span>
          <kbd className="bg-muted pointer-events-none absolute top-2 right-2 hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-xs font-medium opacity-100 select-none md:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      )}

      {trigger === 'input' && (
        <div className="group relative w-full cursor-pointer" onClick={() => setOpen(true)}>
          <Search className="text-muted-foreground group-hover:text-primary absolute top-1/2 left-4 z-10 h-5 w-5 -translate-y-1/2 transition-colors" />
          <div className="border-input bg-background/60 hover:bg-background/80 hover:border-primary/50 text-muted-foreground flex h-14 w-full items-center justify-between rounded-xl border px-4 py-3 pr-14 pl-12 text-base shadow-sm backdrop-blur-md transition-all hover:shadow-md">
            {placeholder || t('searchPlaceholderLong')}
          </div>
          <kbd className="bg-muted/80 text-muted-foreground pointer-events-none absolute top-1/2 right-3 flex h-7 -translate-y-1/2 items-center gap-1 rounded border px-2 font-mono text-xs font-medium">
            <span>⌘</span>K
          </kbd>
        </div>
      )}

      {trigger === 'hero' && (
        <Button variant="outline" size="lg" className="gap-2" onClick={() => setOpen(true)}>
          <Search className="h-4 w-4" />
          {label || t('search')}
        </Button>
      )}

      {/* Search Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={t('searchPlaceholderLong')}
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
              {(['park', 'attraction', 'show', 'restaurant'] as const).map((type) => {
                const items = results.results.filter((r) => r.type === type);
                if (items.length === 0) return null;

                return (
                  <CommandGroup
                    key={type}
                    heading={tSearch(`headings.${type}`, { count: items.length })}
                  >
                    {items.slice(0, 5).map(renderResultItem)}
                  </CommandGroup>
                );
              })}

              {/* Link to full search page */}
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-center text-sm"
                  onClick={() => {
                    setOpen(false);
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
