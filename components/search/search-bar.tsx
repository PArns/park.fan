'use client';

import { useState, useEffect, useEffectEvent, useRef } from 'react';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  HERO_SEARCH_FIELD_ROW_CLASS,
  HERO_SEARCH_ICON_CLASS,
  HERO_SEARCH_INPUT_CLASS,
} from '@/components/search/hero-search-classes';
import { nothingFocused } from '@/lib/utils/page-focus';
import { useIsApplePlatform } from '@/lib/hooks/use-mounted';
import { useSearchSession } from '@/lib/hooks/use-search-session';
import type { SearchSurface } from '@/lib/analytics/site-analytics';
import type { SearchSession } from '@/lib/analytics/search-session';
import { cn } from '@/lib/utils';

// The palette itself (cmdk + live result/glossary/nearby queries + ~600 lines of result rendering)
// is the heavy part. Code-split it so it stays OUT of every page's initial bundle — only this
// trigger ships up front; the dialog loads on first open. ssr:false: it's interaction-only, never
// needed in the server HTML.
const SearchDialog = dynamic(() => import('@/components/search/search-dialog'), { ssr: false });

interface SearchCommandProps {
  /**
   * `button` and `input` are the header's; `hero` is the hero field on a phone, drawn without
   * glass of its own because it sits on the frame it shares with its list; `field` is a field in a
   * page's own content, as tall as the button scale's `lg` and its phone tier.
   */
  trigger?: 'button' | 'input' | 'hero' | 'field';
  placeholder?: ReactNode;
  /** The accessible name of the `hero` trigger, whose placeholder is a list of examples. */
  label?: string;
  isGlobal?: boolean;
  autoFocusOnType?: boolean;
  /** The `button` trigger's size: `sm` is the header bar's icon, `lg` the wide button. */
  size?: 'sm' | 'lg';
  /**
   * The surface this trigger opens the palette as, which every search event of that opening
   * carries. ⌘K is always `keyboard`.
   */
  searchOpenSource?: SearchSurface;
  /**
   * Pre-mount the (closed) lazy dialog during idle on touch devices so the FIRST tap opens an
   * already-mounted palette. Without it, the first tap has to fetch the dialog chunk and mount it
   * before Radix can focus the input — that async gap lands the focus() outside the user-gesture
   * window mobile browsers (iOS Safari especially) require to raise the on-screen keyboard, so the
   * keyboard stays down on the first tap. Opt-in (hero) to keep cmdk off the idle path elsewhere.
   * `near` waits until the trigger is about a screen away, for a field far down a page that most
   * readers never reach.
   */
  prewarm?: boolean | 'near';
  /**
   * The session to count in, where the trigger shares its surface with other parts (the hero's
   * phone list); without it the trigger keeps one of its own.
   */
  session?: SearchSession;
  /**
   * Opens the palette on mount, seeded with this text: what the hero's shell held when the phone
   * trigger took its place (`HeroSearchShell`).
   */
  openOnMount?: string;
  /** Called once `openOnMount` has opened the palette, so the text is not handed over twice. */
  onOpenedOnMount?: () => void;
  className?: string;
}

/**
 * Trigger for the site search palette, as a button, an input or the hero field. Loads the dialog on
 * first open; with `isGlobal`, Cmd/Ctrl+K toggles it.
 */
export function SearchCommand({
  trigger = 'button',
  placeholder,
  label,
  isGlobal = false,
  autoFocusOnType = false,
  size = 'lg',
  searchOpenSource = 'header',
  prewarm = false,
  session: sharedSession,
  openOnMount,
  onOpenedOnMount,
  className,
}: SearchCommandProps) {
  const t = useTranslations('common');
  const openedOnMount = openOnMount !== undefined;
  const [open, setOpen] = useState(openedOnMount);
  // Once opened, keep the (lazy) dialog mounted so Radix animates the close and reopen is instant.
  const [hasOpened, setHasOpened] = useState(openedOnMount);
  // Query lives here (not in the lazy dialog) so opening can seed it (autoFocusOnType's first
  // keystroke) and closing can clear it — no prop→state sync needed inside the dialog.
  const [query, setQuery] = useState(openOnMount ?? '');
  const isMac = useIsApplePlatform();
  const fieldRef = useRef<HTMLButtonElement>(null);
  const ownSession = useSearchSession(searchOpenSource);
  const session = sharedSession ?? ownSession;

  const openSearch = (surface: SearchSurface, seed = '') => {
    setQuery(seed);
    setHasOpened(true);
    setOpen(true);
    session.open(surface);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery(''); // reset the query when the palette closes
      session.close();
    }
  };

  // A palette open from its mount (`openOnMount`) is an opening like a tap's.
  const onMountOpened = useEffectEvent(() => {
    if (!openedOnMount) return;
    session.open(searchOpenSource);
    onOpenedOnMount?.();
  });
  useEffect(() => onMountOpened(), []);

  // Cmd+K / Ctrl+K toggles the palette (global only).
  const onShortcut = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (open) handleOpenChange(false);
      else openSearch('keyboard');
    }
  });
  useEffect(() => {
    if (!isGlobal) return;
    const down = (e: KeyboardEvent) => onShortcut(e);
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isGlobal]);

  // Auto-focus on type: a single character anywhere opens the palette seeded with that key —
  // with the hero search's guard (`hero-inline-search-panel.tsx`): only when nothing is focused,
  // and never for Space, which scrolls the page and activates a focused control. It is this
  // trigger's shortcut, so it opens as this trigger's surface, not as ⌘K.
  const onTypeAnywhere = useEffectEvent((e: KeyboardEvent) => {
    if (open) return;
    if (!nothingFocused(document.activeElement)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key.length !== 1 || e.key === ' ') return;
    openSearch(searchOpenSource, e.key);
  });
  useEffect(() => {
    if (!autoFocusOnType) return;
    const onKey = (e: KeyboardEvent) => onTypeAnywhere(e);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [autoFocusOnType]);

  // Pre-mount the closed dialog during idle on touch devices (see `prewarm`), after load so it
  // never competes with LCP. Desktop focus() works regardless, so cmdk stays off the idle path
  // there.
  useEffect(() => {
    if (!prewarm || hasOpened) return;
    if (!window.matchMedia?.('(pointer: coarse)').matches) return;

    if (prewarm === 'near') {
      const field = fieldRef.current;
      if (!field) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          observer.disconnect();
          setHasOpened(true);
        },
        { rootMargin: '100% 0px' }
      );
      observer.observe(field);
      return () => observer.disconnect();
    }

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
          /* `sm` is the header bar's icon, where the field does not fit: below a 360 px bar and
             between 1024 and 1279, where the nav row takes the width. No taller than the burger;
             `max-sm:h-9 max-sm:w-9` cancels the button scale's 44 px phone tier, see
             docs/rules/the-header-is-48-px.md. `lg` keeps the wide trigger. */
          className={`relative p-0 ${
            size === 'sm'
              ? 'h-9 w-9 max-sm:h-9 max-sm:w-9'
              : 'h-10 w-10 md:h-9 md:w-64 md:justify-start md:px-3 md:py-2'
          }`}
          onClick={() => openSearch(searchOpenSource)}
          aria-label={t('search')}
        >
          <Search className={`h-4 w-4 ${size === 'sm' ? '' : 'md:mr-2'}`} />
          <span className={size === 'sm' ? 'hidden' : 'hidden md:inline-flex'}>
            {placeholder || t('searchPlaceholderShort')}
          </span>
          {/* Only on the wide trigger — there is no room for a shortcut hint in a 36 px square,
              and centred rather than `top-2` because that trigger now comes in two heights. */}
          {size !== 'sm' && (
            <kbd className="bg-primary/40 text-primary border-primary/40 pointer-events-none absolute top-1/2 right-2 hidden h-5 -translate-y-1/2 items-center gap-1 rounded border px-1.5 font-mono text-xs font-medium opacity-100 shadow-sm select-none md:flex">
              {isMac ? <span className="text-xs">⌘</span> : 'Ctrl'}K
            </kbd>
          )}
        </Button>
      )}

      {trigger === 'input' && (
        // A button, so a keyboard and a screen reader reach it too; it looks like the text box it
        // opens, and the header shows it on a phone as well as on a wide bar.
        <button
          type="button"
          aria-haspopup="dialog"
          className="group focus-visible:ring-ring/50 relative block w-full cursor-pointer rounded-lg text-left outline-none focus-visible:ring-[3px]"
          onClick={() => openSearch(searchOpenSource)}
        >
          <Search className="text-muted-foreground group-hover:text-primary absolute top-1/2 left-2.5 z-10 h-4 w-4 -translate-y-1/2 transition-colors" />
          <span
            className={`border-primary/20 hover:border-primary/40 text-muted-foreground bg-background/60 hover:bg-background/75 flex h-8 w-full items-center justify-between rounded-lg border py-1 pr-3 pl-8 text-sm shadow-md backdrop-blur-lg transition-all hover:shadow-lg md:pr-11 md:pl-9 dark:bg-[oklch(0.12_0.025_241_/_0.55)] dark:hover:bg-[oklch(0.14_0.030_241_/_0.65)] ${className}`}
          >
            <span className="text-foreground/40 dark:text-muted-foreground/50 w-full truncate text-left">
              {placeholder || t('searchPlaceholderLong')}
            </span>
          </span>
          <kbd className="bg-primary/20 text-primary border-primary/20 pointer-events-none absolute top-1/2 right-1.5 hidden h-5 -translate-y-1/2 items-center gap-0.5 rounded border px-1.5 font-mono text-[11px] font-medium shadow-sm md:flex">
            {isMac ? (
              <>
                <span className="translate-y-[1px] text-sm">⌘</span>
                <span>K</span>
              </>
            ) : (
              <>Ctrl K</>
            )}
          </kbd>
        </button>
      )}

      {trigger === 'hero' && (
        // A button, so the field a phone taps is reachable and named for a keyboard and a screen
        // reader too; it looks like the text box it opens.
        <button
          type="button"
          aria-label={label}
          aria-haspopup="dialog"
          onClick={() => openSearch(searchOpenSource)}
          className={cn(
            HERO_SEARCH_FIELD_ROW_CLASS,
            'block w-full text-left outline-none focus-visible:ring-2'
          )}
        >
          <Search className={HERO_SEARCH_ICON_CLASS} />
          <span
            className={cn(
              HERO_SEARCH_INPUT_CLASS,
              'text-foreground/40 dark:text-muted-foreground/50 flex items-center truncate'
            )}
          >
            <span className="truncate">{placeholder || t('searchPlaceholderLong')}</span>
          </span>
        </button>
      )}

      {trigger === 'field' && (
        // A button that looks like the text box it opens, like the hero's on a phone: the palette
        // brings its own field, so this one never takes a keystroke.
        <button
          ref={fieldRef}
          type="button"
          aria-haspopup="dialog"
          onClick={() => openSearch(searchOpenSource)}
          className={cn(
            'group border-input bg-card/60 hover:border-primary/40 hover:bg-card focus-visible:border-ring focus-visible:ring-ring/50 relative flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl border px-4 text-left shadow-xs transition-colors outline-none focus-visible:ring-[3px] max-sm:h-11',
            className
          )}
        >
          <Search
            className="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0 transition-colors"
            aria-hidden="true"
          />
          <span className="text-muted-foreground min-w-0 flex-1 truncate text-base md:text-sm">
            {placeholder || t('searchPlaceholderLong')}
          </span>
          <kbd className="bg-primary/20 text-primary border-primary/20 pointer-events-none hidden h-5 shrink-0 items-center gap-0.5 rounded border px-1.5 font-mono text-[11px] font-medium shadow-sm md:flex">
            {isMac ? '⌘' : 'Ctrl'} K
          </kbd>
        </button>
      )}

      {/* Lazy palette: mounts on first open, then stays mounted (Radix animates open/close). */}
      {hasOpened && (
        <SearchDialog
          open={open}
          onOpenChange={handleOpenChange}
          query={query}
          onQueryChange={setQuery}
          session={session}
        />
      )}
    </>
  );
}
