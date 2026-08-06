'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { trackSearchViewAll } from '@/lib/analytics/umami';
import { useSearchResults } from '@/lib/hooks/use-search-results';
import { useSearchNavigation } from '@/lib/hooks/use-search-navigation';
import { SkeletonItem, GlossaryResultItem } from '@/components/search/search-result-items';
import { SearchResultGroups } from '@/components/search/search-result-groups';
import { SearchBrowseGroup } from '@/components/search/search-browse-group';

interface SearchDialogProps {
  /** Controlled open state — owned by the lightweight <SearchCommand> trigger. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Controlled query — also owned by the trigger (seeded on open, cleared on close). */
  query: string;
  onQueryChange: (query: string) => void;
}

/**
 * The heavy search palette: cmdk + live result/glossary/nearby queries + result rendering. Code-
 * split out of the always-rendered <SearchCommand> trigger (see search-bar.tsx) so cmdk and this
 * tree stay OUT of every page's initial bundle — it only loads on first open. Data fetching +
 * match scoring live in `useSearchResults`; the result rows live in search-result-items.tsx.
 */
export default function SearchDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
}: SearchDialogProps) {
  const t = useTranslations('common');
  const tSearch = useTranslations('search');
  const router = useRouter();

  // Three live queries (search / glossary / browse) + debounce + match scoring.
  const { debouncedQuery, results, loading, glossaryData, browse, sortResultsByMatch } =
    useSearchResults(query);

  // Open state lives in the lightweight <SearchCommand> trigger; closing just notifies it
  // (the query reset is handled by the open/close effect above).
  const handleOpenChange = (newOpen: boolean) => onOpenChange(newOpen);

  // Shared analytics + routing for picking a result (same behavior as the hero's inline list).
  const { handleSelect, handleGlossarySelect } = useSearchNavigation(query.trim().length, () =>
    handleOpenChange(false)
  );

  const [isMobile, setIsMobile] = useState(false);
  const [isMac, setIsMac] = useState(true); // Default to Mac for SSR

  useEffect(() => {
    // matchMedia change events fire only when the breakpoint is actually
    // crossed — unlike a window resize listener, which ran a layout read
    // (innerWidth) on every resize frame just to recompute the same boolean.
    const mq = window.matchMedia('(max-width: 639px)');
    const updateMobile = () => setIsMobile(mq.matches);

    const checkPlatform = () => {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
    };

    updateMobile();
    checkPlatform();
    mq.addEventListener('change', updateMobile);
    return () => mq.removeEventListener('change', updateMobile);
  }, []);

  // Show skeleton as soon as user types ≥3 chars (covers debounce window + fetch)
  const isPending = loading || (query.trim().length >= 3 && debouncedQuery.trim().length < 3);

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      shouldFilter={false}
      showCloseButton={false}
    >
      <CommandInput
        placeholder={isMobile ? t('searchPlaceholderShort') : t('searchPlaceholderLong')}
        value={query}
        onValueChange={onQueryChange}
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
          <div className="max-h-[calc(100svh-6rem)] overflow-hidden p-1 sm:max-h-[420px]">
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
              {glossaryData.results.map((item) => (
                <GlossaryResultItem key={item.id} item={item} onSelect={handleGlossarySelect} />
              ))}
            </CommandGroup>
          )}

        {!isPending && results && results.results.length > 0 && (
          <>
            <SearchResultGroups
              results={results}
              glossaryData={glossaryData}
              sortResultsByMatch={sortResultsByMatch}
              onSelect={handleSelect}
              onGlossarySelect={handleGlossarySelect}
            />

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

        {!isPending &&
          query.length < 3 &&
          (browse.items.length > 0 ? (
            <SearchBrowseGroup browse={browse} onSelect={handleSelect} />
          ) : (
            <div className="text-muted-foreground py-10 text-center text-sm">
              {tSearch('typeToSearch')}
            </div>
          ))}
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
  );
}
