'use client';

import { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/common/glass-card';
import {
  HERO_SEARCH_FIELD_HEIGHT_CLASS,
  HERO_SEARCH_INPUT_ROW_CLASS,
  HERO_SEARCH_ICON_CLASS,
  HERO_SEARCH_INPUT_CLASS,
  HERO_SEARCH_INPUT_KEY_ROOM_CLASS,
  HERO_SEARCH_KEY_CLASS,
} from '@/components/search/hero-search-classes';
import { SearchShortcutKey } from '@/components/search/search-shortcut-key';
import { SEARCH_SHORTCUT_TARGET_ATTR } from '@/lib/utils/page-focus';

type HeroSearchFrameProps = Omit<React.ComponentProps<typeof GlassCard>, 'children'> & {
  /** The list under the field, once the field has focus. */
  children?: React.ReactNode;
  /** `false` off the hero, where the frame takes `tile` glass (see `HeroInlineSearchPanel`). */
  onHero?: boolean;
};

/**
 * The glass of the hero search: one border, one radius and one blur for the field and the list
 * that opens under it, so the two read as one object. It floats from the field's top edge
 * (`-top-px` puts its top border on the field's edge) and grows downward over the page; the field
 * is drawn over its first 48 px (56 from `md`). `group/hero-search` on a shared parent lights the
 * border while the field has focus.
 */
export function HeroSearchFrame({
  onHero = true,
  className,
  children,
  ...rest
}: HeroSearchFrameProps) {
  return (
    <GlassCard
      variant={onHero ? 'heavy' : 'tile'}
      className={cn(
        // The brand colour as its border, and a soft ring of it that firms up while the field
        // has focus: on the photo the field must read as the hero's one control.
        'border-primary/70 ring-primary/15 group-focus-within/hero-search:border-primary group-focus-within/hero-search:ring-primary/30 absolute inset-x-0 -top-px z-40 overflow-hidden rounded-xl p-0 shadow-2xl ring-4 transition-[border-color,box-shadow]',
        className
      )}
      {...rest}
    >
      <div aria-hidden="true" className={HERO_SEARCH_FIELD_HEIGHT_CLASS} />
      {children}
    </GlassCard>
  );
}

interface HeroSearchShellProps {
  placeholder: string;
  /** What the field is FOR, for screen readers — the placeholder is a list of examples. */
  label: string;
  onHero?: boolean;
  /**
   * Fires on focus and on every keystroke — the cue to pull in the real search panel — and on
   * mount, where text or focus came in before hydration, when no React handler was there yet.
   */
  onActivate: (typed: string, focused: boolean) => void;
}

/**
 * The hero search field before the search chunk exists: a real input, so focus and keystrokes are
 * captured and handed to the panel, with the text already typed, the instant it mounts. Below `md`
 * it hands over to the palette trigger, which takes the same box.
 */
export function HeroSearchShell({
  placeholder,
  label,
  onHero = true,
  onActivate,
}: HeroSearchShellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const focused = document.activeElement === input;
    if (focused || input.value) onActivate(input.value, focused);
  }, [onActivate]);

  return (
    <div className="group/hero-search relative w-full">
      <div className={HERO_SEARCH_INPUT_ROW_CLASS}>
        <Search className={HERO_SEARCH_ICON_CLASS} />
        <input
          type="text"
          inputMode="search"
          placeholder={placeholder}
          aria-label={label}
          ref={inputRef}
          onFocus={(e) => onActivate(e.currentTarget.value, true)}
          onInput={(e) => onActivate(e.currentTarget.value, true)}
          {...(onHero ? { [SEARCH_SHORTCUT_TARGET_ATTR]: '', 'aria-keyshortcuts': '/' } : {})}
          // The phone's trigger it hands over to truncates its placeholder; so does this.
          className={cn(
            HERO_SEARCH_INPUT_CLASS,
            'text-ellipsis',
            onHero && HERO_SEARCH_INPUT_KEY_ROOM_CLASS
          )}
        />
        {onHero && <SearchShortcutKey className={HERO_SEARCH_KEY_CLASS} />}
      </div>
      <HeroSearchFrame aria-hidden="true" onHero={onHero} />
    </div>
  );
}
