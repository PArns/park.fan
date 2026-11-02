'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/common/glass-card';
import {
  HERO_SKELETON_ROW_CLASS,
  SearchSkeletonList,
} from '@/components/search/search-skeleton-list';
import { HeroBrowseHeaderSkeleton } from '@/components/search/hero-browse-header';
import {
  HERO_SEARCH_FIELD_HEIGHT_CLASS,
  HERO_SEARCH_HINT_CLASS,
  HERO_SEARCH_INPUT_ROW_CLASS,
  HERO_SEARCH_ICON_CLASS,
  HERO_SEARCH_INPUT_CLASS,
  HERO_SEARCH_LIST_BOX_CLASS,
} from '@/components/search/hero-search-classes';

/**
 * How many rows the field's list holds at rest, from `md` up; a phone's field opens the palette and
 * holds none. With none the field stands alone until it is used.
 */
export interface HeroSearchRest {
  desktopRows: number;
  /** The flow's reservation under the field, as a class: a custom property per surface. */
  spacerClass: string;
}

type HeroSearchFrameProps = Omit<React.ComponentProps<typeof GlassCard>, 'children'> & {
  /** The list under the field; none where the field has no list (a phone's field). */
  children?: React.ReactNode;
  /** `false` off the hero, where the frame takes `tile` glass (see `HeroInlineSearchPanel`). */
  onHero?: boolean;
  /** `shell`, `pending` or `settled`, read by `pnpm check:hero-search-rest`. */
  state: 'shell' | 'pending' | 'settled';
};

/**
 * The glass of the hero search: one border, one radius and one blur for the field and the list
 * attached under it, so the two read as one object. It floats from the field's top edge (`-top-px`
 * puts its top border on the field's edge) and grows downward over the page; the field is drawn
 * over its first 48 px (56 from `md`). `group/hero-search` on a shared parent lights the border while the field
 * has focus.
 */
export function HeroSearchFrame({
  onHero = true,
  state,
  className,
  children,
  ...rest
}: HeroSearchFrameProps) {
  return (
    <GlassCard
      variant={onHero ? 'heavy' : 'tile'}
      // The marker `pnpm check:hero-search-rest` measures — see that script for what drifts.
      data-hero-search-card=""
      data-state={state}
      className={cn(
        'border-primary/20 group-focus-within/hero-search:border-primary/50 absolute inset-x-0 -top-px z-40 overflow-hidden rounded-xl p-0 shadow-2xl transition-[border-color]',
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
  rest: HeroSearchRest;
  onHero?: boolean;
  /**
   * Fires on focus and on every keystroke — the cue to pull in the real search panel — and on
   * mount, where text or focus came in before hydration, when no React handler was there yet.
   */
  onActivate: (typed: string, focused: boolean) => void;
}

/**
 * The resting list as a skeleton, in exactly the box the real one will occupy from `md` up (a
 * phone's field holds no list). Its parts are the ones the real list renders while it waits, so
 * mounting it changes nothing on screen. Nothing at all for a field without rows at rest.
 */
function HeroSearchRestingSkeleton({ rest }: { rest: HeroSearchRest }) {
  const tSearch = useTranslations('search');
  if (rest.desktopRows === 0) return null;

  return (
    <div className={cn(HERO_SEARCH_LIST_BOX_CLASS, 'max-md:hidden')}>
      <HeroBrowseHeaderSkeleton />
      <SearchSkeletonList
        rows={rest.desktopRows}
        headingClassName={null}
        rowClassName={HERO_SKELETON_ROW_CLASS}
      />
      <div className={HERO_SEARCH_HINT_CLASS}>{tSearch('heroHint')}</div>
    </div>
  );
}

/**
 * The hero search field before the search chunk exists: a real input, so focus and keystrokes are
 * captured and handed to the panel, with the text already typed, the instant it mounts. Below `md`
 * it hands over to the palette trigger, which takes the same box.
 */
export function HeroSearchShell({
  placeholder,
  label,
  rest,
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
          // The phone's trigger it hands over to truncates its placeholder; so does this.
          className={cn(HERO_SEARCH_INPUT_CLASS, 'text-ellipsis')}
        />
      </div>
      <div aria-hidden="true" className={rest.spacerClass} />
      <HeroSearchFrame aria-hidden="true" onHero={onHero} state="shell">
        <HeroSearchRestingSkeleton rest={rest} />
      </HeroSearchFrame>
    </div>
  );
}
