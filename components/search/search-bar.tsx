'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackSearchOpened } from '@/lib/analytics/umami';

// The palette itself (cmdk + live result/glossary/nearby queries + ~600 lines of result rendering)
// is the heavy part. Code-split it so it stays OUT of every page's initial bundle — only this
// trigger ships up front; the dialog loads on first open. ssr:false: it's interaction-only, never
// needed in the server HTML.
const SearchDialog = dynamic(() => import('@/components/search/search-dialog'), { ssr: false });

interface SearchCommandProps {
  trigger?: 'button' | 'input' | 'hero';
  label?: string;
  placeholder?: ReactNode;
  isGlobal?: boolean;
  autoFocusOnType?: boolean;
  size?: 'sm' | 'lg'; // sm for header, lg for jumbotron
  /** Source label for the search_opened event when this trigger opens the dialog. */
  searchOpenSource?: 'header' | 'hero';
  /**
   * Pre-mount the (closed) lazy dialog during idle on touch devices so the FIRST tap opens an
   * already-mounted palette. Without it, the first tap has to fetch the dialog chunk and mount it
   * before Radix can focus the input — that async gap lands the focus() outside the user-gesture
   * window mobile browsers (iOS Safari especially) require to raise the on-screen keyboard, so the
   * keyboard stays down on the first tap. Opt-in (hero) to keep cmdk off the idle path elsewhere.
   */
  prewarm?: boolean;
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
  prewarm = false,
  className,
}: SearchCommandProps) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  // Once opened, keep the (lazy) dialog mounted so Radix animates the close and reopen is instant.
  const [hasOpened, setHasOpened] = useState(false);
  // Query lives here (not in the lazy dialog) so opening can seed it (autoFocusOnType's first
  // keystroke) and closing can clear it — no prop→state sync needed inside the dialog.
  const [query, setQuery] = useState('');
  const [isMac, setIsMac] = useState(true); // default Mac for SSR (only affects the ⌘K hint)

  const openSearch = (source: 'header' | 'hero' | 'keyboard', seed = '') => {
    setQuery(seed);
    setHasOpened(true);
    setOpen(true);
    trackSearchOpened(source);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery(''); // reset the query when the palette closes
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- post-mount platform check for the ⌘/Ctrl hint; kept in an effect to avoid an SSR/hydration mismatch
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
  }, []);

  // Cmd+K / Ctrl+K toggles the palette (global only).
  useEffect(() => {
    if (!isGlobal) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) handleOpenChange(false);
        else openSearch('keyboard');
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isGlobal, open]);

  // Auto-focus on type: a single character anywhere opens the palette seeded with that key.
  useEffect(() => {
    if (!autoFocusOnType) return;
    const onKey = (e: KeyboardEvent) => {
      if (open) return;
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length === 1) openSearch('keyboard', e.key);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [autoFocusOnType, open]);

  // Pre-mount the (closed) lazy dialog during idle so the first tap opens an already-mounted
  // palette instead of one that still has to fetch its chunk + mount before it can focus. That
  // async gap is what keeps the on-screen keyboard down on the first tap on mobile (see the
  // `prewarm` prop docs). Gated to coarse-pointer (touch) devices — desktop focus() works
  // regardless of the lazy mount, so there's no reason to pull cmdk onto the idle path there.
  // Scheduled after load + idle so it never competes with LCP/hydration; the dialog stays
  // closed (open=false) so no portal content renders and no visible change occurs.
  useEffect(() => {
    if (!prewarm || hasOpened) return;
    if (!window.matchMedia?.('(pointer: coarse)').matches) return;

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const premount = () => {
      const ric = window.requestIdleCallback;
      if (ric) {
        idleId = ric(() => setHasOpened(true), { timeout: 2000 });
      } else {
        // Safari has no requestIdleCallback — fall back to a short timeout.
        timeoutId = setTimeout(() => setHasOpened(true), 200);
      }
    };

    if (document.readyState === 'complete') {
      premount();
    } else {
      window.addEventListener('load', premount, { once: true });
    }

    return () => {
      window.removeEventListener('load', premount);
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [prewarm, hasOpened]);

  return (
    <>
      {/* Trigger — the only part in the initial bundle; opening lazy-loads <SearchDialog>. */}
      {trigger === 'button' && (
        <Button
          variant="outline"
          className="relative h-10 w-10 p-0 md:h-9 md:w-64 md:justify-start md:px-3 md:py-2"
          onClick={() => openSearch(searchOpenSource)}
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
          onClick={() => openSearch(searchOpenSource)}
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
          onClick={() => openSearch(searchOpenSource || 'hero')}
        >
          <Search className="h-4 w-4" />
          {label || t('search')}
        </Button>
      )}

      {/* Lazy palette: mounts on first open, then stays mounted (Radix animates open/close). */}
      {hasOpened && (
        <SearchDialog
          open={open}
          onOpenChange={handleOpenChange}
          query={query}
          onQueryChange={setQuery}
        />
      )}
    </>
  );
}
