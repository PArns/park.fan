'use client';

import { useEffect, useRef, useState } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/common/glass-card';
import { trackHeroSearchClicked } from '@/lib/analytics/umami';
import { useSearchResults } from '@/lib/hooks/use-search-results';
import { useSearchNavigation } from '@/lib/hooks/use-search-navigation';
import { SearchResultsPanel } from '@/components/search/search-results-panel';
import { HERO_SEARCH_INPUT_CLASS } from '@/components/search/hero-search-field';

interface HeroInlineSearchPanelProps {
  placeholder: string;
  /** Accessible name — the placeholder is a list of example parks, not a description. */
  label: string;
  /** Text already typed into the static shell before this chunk finished loading. */
  initialQuery?: string;
  /** Focus the input on mount — set when the visitor's own interaction pulled this chunk in. */
  autoFocus?: boolean;
  /** Called once the mount-focus has been dealt with, taken or declined. */
  onFocusHandled?: () => void;
}

/**
 * Desktop-only in-place hero search: the input stays in the hero and the results FLOAT below it
 * — an absolutely positioned dropdown that expands downward over the page. Nothing in the hero
 * moves when the list opens, grows or shrinks, which is what an in-flow list could not offer:
 * the hero is vertically centred, so every change in result count shifted the headline.
 *
 * The dropdown is open while the field has focus and shows the nearby/popular browse list
 * before the first keystroke — the same list the palette shows on mobile, from the same hook.
 */
export default function HeroInlineSearchPanel({
  placeholder,
  label,
  initialQuery = '',
  autoFocus = false,
  onFocusHandled,
}: HeroInlineSearchPanelProps) {
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(autoFocus);
  const inputRef = useRef<HTMLInputElement>(null);
  const trackedFocus = useRef(false);

  const search = useSearchResults(query);
  const { handleSelect, handleGlossarySelect } = useSearchNavigation(query.trim().length, () =>
    setOpen(false)
  );

  // Hand-off from the static shell: the visitor clicked or typed before this chunk arrived, so
  // take over the focus and put the caret after what they already typed.
  //
  // Only if they are still there, though. Loading this chunk takes real time on a slow
  // connection, and by now they may have scrolled past the hero or opened the header palette —
  // stealing focus then would yank the page back up or out of an open dialog. `preventScroll`
  // covers the rest: a focus() that scrolls is the same jump by another route.
  useEffect(() => {
    if (!autoFocus) return;
    onFocusHandled?.();
    const input = inputRef.current;
    if (!input) return;
    const active = document.activeElement;
    if (active && active !== document.body && active !== input) return;
    input.focus({ preventScroll: true });
    input.setSelectionRange(input.value.length, input.value.length);
  }, [autoFocus, onFocusHandled]);

  // Type-anywhere: a printable key outside an input focuses the hero search seeded with it
  // (same behavior the palette trigger had via autoFocusOnType).
  //
  // Space is excluded on purpose. It is a printable character, so a naive length-1 test catches
  // it — and then Space no longer scrolls the page and no longer activates a focused button,
  // for every visitor, whether or not they ever use the search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (
        active?.isContentEditable ||
        (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1 || e.key === ' ') return;
      e.preventDefault();
      setQuery((prev) => prev + e.key);
      inputRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <CommandPrimitive
      shouldFilter={false}
      className="[&_[cmdk-group-heading]]:text-muted-foreground/60 relative w-full bg-transparent [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-3.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group]]:px-1.5 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          if (query) {
            setQuery('');
          } else {
            setOpen(false);
            inputRef.current?.blur();
          }
        }
      }}
    >
      {/* Input — same look as the static shell it replaces */}
      <div className="relative w-full">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 z-10 h-5 w-5 -translate-y-1/2" />
        <CommandPrimitive.Input
          ref={inputRef}
          value={query}
          onValueChange={setQuery}
          placeholder={placeholder}
          aria-label={label}
          onFocus={() => {
            setOpen(true);
            if (!trackedFocus.current) {
              trackedFocus.current = true;
              trackHeroSearchClicked();
            }
          }}
          onBlur={() => setOpen(false)}
          className={cn(HERO_SEARCH_INPUT_CLASS, 'focus:border-primary/50 focus:shadow-lg')}
        />
      </div>

      {/* Floating dropdown. The `onMouseDown` preventDefault keeps focus in the input, so
          clicking a result cannot blur-close the list out from under the click. */}
      {open && (
        <div onMouseDown={(e) => e.preventDefault()} className="absolute inset-x-0 top-full z-40">
          {/* Real glass, not a near-opaque sheet: what it lands on is the hero photo, the
              scrim and the panel plate — all smooth, all beautiful under blur. The nearby
              pills would have ruined that (their text ghosts through the blur), so the panel
              fades them out while the field has focus instead of the dropdown going opaque. */}
          <GlassCard
            variant="heavy"
            className="border-border/60 mt-3 overflow-hidden p-0 shadow-2xl"
          >
            <SearchResultsPanel
              query={query}
              search={search}
              onSelect={handleSelect}
              onGlossarySelect={handleGlossarySelect}
            />
          </GlassCard>
        </div>
      )}
    </CommandPrimitive>
  );
}
