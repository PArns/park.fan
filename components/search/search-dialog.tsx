'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { CommandDialog, CommandInput } from '@/components/ui/command';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useSearchResults } from '@/lib/hooks/use-search-results';
import { useSearchNavigation } from '@/lib/hooks/use-search-navigation';
import { SearchResultsPanel } from '@/components/search/search-results-panel';
import { AnimatedHeight } from '@/components/common/animated-height';

interface SearchDialogProps {
  /** Controlled open state — owned by the lightweight <SearchCommand> trigger. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Controlled query — also owned by the trigger (seeded on open, cleared on close). */
  query: string;
  onQueryChange: (query: string) => void;
}

/**
 * The list takes the room the viewport has, up to 48rem: from its anchor at 12svh down, less the
 * field, the tab row, the "all results" button and the key legend (12.5rem together) and a margin
 * below. On a phone the dialog sits at the top and there is no legend.
 */
const LIST_HEIGHT_CLASS = 'max-h-[calc(100svh-12rem)] sm:max-h-[min(48rem,calc(84svh-12.5rem))]';

const subscribeNever = () => () => {};
const isApplePlatform = () => /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);
/** The ⌘ hint is the default, so the server and hydration passes agree. */
const assumeApple = () => true;

/**
 * The heavy search palette: cmdk + live result/glossary/nearby queries, guides and news + result
 * rendering. Code-split out of the always-rendered <SearchCommand> trigger (see search-bar.tsx) so
 * cmdk and this tree stay OUT of every page's initial bundle — it only loads on first open. Data
 * fetching + match scoring live in `useSearchResults`; the list body is `SearchResultsPanel`, the
 * same one the hero's in-place search renders.
 */
export default function SearchDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
}: SearchDialogProps) {
  const t = useTranslations('common');
  const tSearch = useTranslations('search');

  // Three live queries (search / glossary / browse), the post search, debounce + match scoring.
  const search = useSearchResults(query);

  // Shared analytics + routing for picking a result (same behavior as the hero's inline list).
  // Closing just notifies the trigger, which owns the open state and clears the query.
  const { handleSelect, handleGlossarySelect, handlePostSelect } = useSearchNavigation(
    query.trim().length,
    () => onOpenChange(false)
  );

  const isMobile = useMediaQuery('(max-width: 639px)');
  const isMac = useSyncExternalStore(subscribeNever, isApplePlatform, assumeApple);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      shouldFilter={false}
      showCloseButton={false}
      // Anchored at the top rather than centred, so a tab switch or a longer result list moves
      // only the lower edge.
      className="sm:top-[12svh] sm:translate-y-0"
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
      <AnimatedHeight>
        <SearchResultsPanel
          query={query}
          search={search}
          onSelect={handleSelect}
          onGlossarySelect={handleGlossarySelect}
          onPostSelect={handlePostSelect}
          onNavigate={() => onOpenChange(false)}
          listClassName={LIST_HEIGHT_CLASS}
          restingFooter={null}
          emptyBrowse={
            <div className="text-muted-foreground py-10 text-center text-sm">
              {tSearch('typeToSearch')}
            </div>
          }
        />
      </AnimatedHeight>

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
