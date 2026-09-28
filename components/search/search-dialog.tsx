'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { CommandDialog, CommandInput } from '@/components/ui/command';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useSearchResults } from '@/lib/hooks/use-search-results';
import { useSearchNavigation } from '@/lib/hooks/use-search-navigation';
import { SearchResultsPanel } from '@/components/search/search-results-panel';

interface SearchDialogProps {
  /** Controlled open state — owned by the lightweight <SearchCommand> trigger. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Controlled query — also owned by the trigger (seeded on open, cleared on close). */
  query: string;
  onQueryChange: (query: string) => void;
}

const subscribeNever = () => () => {};
const isApplePlatform = () => /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);
/** The ⌘ hint is the default, so the server and hydration passes agree. */
const assumeApple = () => true;

/**
 * The heavy search palette: cmdk + live result/glossary/nearby queries + result rendering. Code-
 * split out of the always-rendered <SearchCommand> trigger (see search-bar.tsx) so cmdk and this
 * tree stay OUT of every page's initial bundle — it only loads on first open. Data fetching +
 * match scoring live in `useSearchResults`; the list body is `SearchResultsPanel`, the same one
 * the hero's in-place search renders.
 */
export default function SearchDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
}: SearchDialogProps) {
  const t = useTranslations('common');
  const tSearch = useTranslations('search');

  // Three live queries (search / glossary / browse) + debounce + match scoring.
  const search = useSearchResults(query);

  // Shared analytics + routing for picking a result (same behavior as the hero's inline list).
  // Closing just notifies the trigger, which owns the open state and clears the query.
  const { handleSelect, handleGlossarySelect } = useSearchNavigation(query.trim().length, () =>
    onOpenChange(false)
  );

  const isMobile = useMediaQuery('(max-width: 639px)');
  const isMac = useSyncExternalStore(subscribeNever, isApplePlatform, assumeApple);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
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
      <SearchResultsPanel
        query={query}
        search={search}
        onSelect={handleSelect}
        onGlossarySelect={handleGlossarySelect}
        onNavigate={() => onOpenChange(false)}
        restingFooter={null}
        emptyBrowse={
          <div className="text-muted-foreground py-10 text-center text-sm">
            {tSearch('typeToSearch')}
          </div>
        }
      />

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
