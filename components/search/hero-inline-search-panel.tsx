'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { CommandEmpty, CommandGroup, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { stripNewPrefix, cn } from '@/lib/utils';
import { trackHeroSearchClicked, trackSearchViewAll } from '@/lib/analytics/umami';
import { useSearchResults } from '@/lib/hooks/use-search-results';
import { useSearchNavigation } from '@/lib/hooks/use-search-navigation';
import { useHeroBrowseParks } from '@/lib/hooks/use-hero-browse-parks';
import {
  SkeletonItem,
  SearchResultRow,
  GlossaryResultItem,
} from '@/components/search/search-result-items';
import { SearchResultGroups } from '@/components/search/search-result-groups';
import { HERO_SEARCH_INPUT_CLASS } from '@/components/search/hero-inline-search';

/**
 * Desktop-only in-place hero search: the input stays in the hero and the result list lives
 * directly beneath it — results update in place instead of opening the palette popup.
 *
 * Empty state: the nearby-parks feed (photo, city, live open counts, Ø wait) so the list is
 * useful before the first keystroke. From 3 typed characters the same three live queries as
 * the palette take over (`useSearchResults`), rendered through the shared row/group
 * components so both surfaces stay identical.
 */
export default function HeroInlineSearchPanel({ placeholder }: { placeholder: string }) {
  const tSearch = useTranslations('search');
  const t = useTranslations('common');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const trackedFocus = useRef(false);

  const { debouncedQuery, results, loading, glossaryData, sortResultsByMatch } =
    useSearchResults(query);
  // Pre-query list: nearby parks, or popular parks when there is no nearby result at all.
  const browse = useHeroBrowseParks();

  const { handleSelect, handleGlossarySelect } = useSearchNavigation(query.trim().length);

  // Type-anywhere: a printable key outside an input focuses the hero search seeded with it
  // (same behavior the palette trigger had via autoFocusOnType).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;
      e.preventDefault();
      setQuery((prev) => prev + e.key);
      inputRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const browseHeading = browse.inPark
    ? tSearch('headings.inPark', { park: stripNewPrefix(browse.items[0]?.name ?? '') })
    : browse.isFallback
      ? tSearch('headings.popular')
      : tSearch('headings.nearby');

  // Show skeleton as soon as user types ≥3 chars (covers debounce window + fetch)
  const isPending = loading || (query.trim().length >= 3 && debouncedQuery.trim().length < 3);
  const hasResults = !isPending && debouncedQuery.length >= 3 && results;
  /** Nothing typed and no browse list yet — the panel has nothing to list. */
  const isEmptyBrowse = !isPending && query.length < 3 && browse.items.length === 0;

  return (
    <CommandPrimitive
      shouldFilter={false}
      className="[&_[cmdk-group-heading]]:text-muted-foreground/60 w-full bg-transparent [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-3.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group]]:px-1.5 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setQuery('');
          inputRef.current?.blur();
        }
      }}
    >
      {/* Input — same look as the mobile trigger/shell */}
      <div className="relative w-full">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 z-10 h-5 w-5 -translate-y-1/2" />
        <CommandPrimitive.Input
          ref={inputRef}
          value={query}
          onValueChange={setQuery}
          placeholder={placeholder}
          onFocus={() => {
            if (!trackedFocus.current) {
              trackedFocus.current = true;
              trackHeroSearchClicked();
            }
          }}
          className={cn(HERO_SEARCH_INPUT_CLASS, 'focus:border-primary/50 focus:shadow-lg')}
        />
      </div>

      {/* In-place result card. With neither a query nor a nearby feed there is nothing to
          list, so the card collapses to its hint line instead of a tall empty box. */}
      <div className="border-border/60 bg-background/85 mt-3 overflow-hidden rounded-xl border shadow-xl backdrop-blur-xl">
        {/* Fixed height once the panel has anything to list: a short result set must not
            shrink the box, or the vertically centred hero would jump on every keystroke. */}
        <CommandList
          className={cn(
            'scroll-py-1 overflow-x-hidden overflow-y-auto overscroll-y-contain',
            isEmptyBrowse ? 'max-h-0' : 'h-60'
          )}
        >
          {isPending && (
            <div className="p-1">
              <div className="px-3 pt-3.5 pb-1">
                <div className="bg-foreground/10 h-2 w-16 animate-pulse rounded-full" />
              </div>
              {['55%', '72%', '48%', '65%'].map((width, i) => (
                <SkeletonItem key={i} width={width} />
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
                {glossaryData.results.map((item) => (
                  <GlossaryResultItem key={item.id} item={item} onSelect={handleGlossarySelect} />
                ))}
              </CommandGroup>
            )}

          {hasResults && results.results.length > 0 && (
            <SearchResultGroups
              results={results}
              glossaryData={glossaryData}
              sortResultsByMatch={sortResultsByMatch}
              onSelect={handleSelect}
              onGlossarySelect={handleGlossarySelect}
            />
          )}

          {!isPending && query.length < 3 && browse.items.length > 0 && (
            <CommandGroup heading={browseHeading}>
              {browse.items.map((item, index) => (
                <SearchResultRow
                  key={item.id}
                  result={item}
                  position={index}
                  onSelect={handleSelect}
                />
              ))}
            </CommandGroup>
          )}
        </CommandList>

        {/* Footer: hint while browsing, "all results" once a query ran */}
        {hasResults && results.results.length > 0 ? (
          <div className="border-border/40 border-t p-2">
            <Button
              variant="ghost"
              className="hover:bg-foreground/10 w-full justify-center text-sm"
              onClick={() => {
                trackSearchViewAll();
                router.push(`/search?q=${encodeURIComponent(query)}`);
              }}
            >
              {tSearch('viewAllResults', { query })}
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              'bg-muted/30 text-muted-foreground px-4 py-2.5 text-xs',
              !isEmptyBrowse && 'border-border/40 border-t'
            )}
          >
            {tSearch('heroHint')}
          </div>
        )}
      </div>
    </CommandPrimitive>
  );
}
