'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/common/glass-card';
import { trackHeroSearchClicked } from '@/lib/analytics/umami';
import { useSearchResults } from '@/lib/hooks/use-search-results';
import { useSearchNavigation } from '@/lib/hooks/use-search-navigation';
import { SearchResultsPanel } from '@/components/search/search-results-panel';
import { HERO_SEARCH_INPUT_CLASS } from '@/components/search/hero-search-field';
import { HERO_SKELETON_ROW_CLASS } from '@/components/search/search-skeleton-list';

/**
 * How many parks the resting dropdown lists. The hero reserves the height of exactly this many
 * rows (`--hero-search-rest-h`), so the two must be changed together.
 */
const HERO_BROWSE_LIMIT = 3;

/** The card's own `mt-3` — part of the box the spacer has to reserve. */
const DROPDOWN_TOP_GAP_PX = 12;
/** Space kept between the dropdown's lower edge and the bottom of the viewport. */
const DROPDOWN_GAP_PX = 28;
/** Never squeeze it below this, even on a short viewport — it scrolls instead. */
const DROPDOWN_MIN_PX = 200;

interface HeroInlineSearchPanelProps {
  placeholder: string;
  /** Accessible name — the placeholder is a list of example parks, not a description. */
  label: string;
  /** Text already typed into the static shell before this chunk finished loading. */
  initialQuery?: string;
  /** Focus the input on mount — set when the visitor's own interaction pulled this chunk in. */
  autoFocus?: boolean;
  /** Called once the mount-focus has been dealt with, taken or declined. */
  onFocusHandled?: () => void; /**
   * `false` when the field does not sit on the hero photo.
   *
   * The dropdown is real glass at 62 % on purpose: in the hero it lands on the
   * photo, the scrim and the plate, all smooth and all beautiful under blur. On
   * a flat page it lands on whatever text happens to be under it, and that text
   * reads straight through — in the homepage's step card the card's own hint
   * ghosted up through the result rows. Off the hero it takes `tile` instead:
   * more fill AND more blur, so it is still glass.
   */
  onHero?: boolean;
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
  onHero = true,
}: HeroInlineSearchPanelProps) {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  /** Measured height of the RESTING card — what the spacer below reserves. */
  const [restHeight, setRestHeight] = useState<number | null>(null);
  /**
   * Focused: the list grows from the three resting rows to everything the browse hook has.
   * At rest three rows are an answer at a glance; once the visitor is actually in the field,
   * showing more of what is nearby beats making them type.
   */
  const [expanded, setExpanded] = useState(false);
  /** The card's height just before a row count change — the tween's starting point. */
  const heightBeforeChange = useRef<number | null>(null);
  /** True while GSAP is tweening the card's height. See the ResizeObserver below. */
  const tweening = useRef(false);
  const trackedFocus = useRef(false);

  const search = useSearchResults(query);
  const { handleSelect, handleGlossarySelect } = useSearchNavigation(query.trim().length);

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

  // Animate the row-count change. The card is absolutely positioned and its content swaps in
  // one render, so there is nothing for CSS to interpolate — capture the height before React
  // commits, then tween from it to the new natural height. GSAP handles `height: auto` for the
  // target, which a CSS transition cannot.
  useLayoutEffect(() => {
    const card = cardRef.current;
    const from = heightBeforeChange.current;
    heightBeforeChange.current = null;
    if (!card || from == null || from === card.offsetHeight) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    import('gsap')
      .then(({ gsap }) => {
        if (cancelled || !cardRef.current) return;
        ctx = gsap.context(() => {
          tweening.current = true;
          gsap.from(cardRef.current, {
            height: from,
            duration: 0.34,
            ease: 'power2.out',
            clearProps: 'height',
            onComplete: () => {
              tweening.current = false;
            },
          });
        }, cardRef);
      })
      .catch(() => {
        // Without the tween the list simply snaps to its new size, which is what it did before.
      });

    return () => {
      cancelled = true;
      tweening.current = false;
      ctx?.revert();
    };
  }, [expanded]);

  // Reserve exactly the resting card's height in the flow, measured rather than assumed.
  //
  // It was a hardcoded constant that happened to match one locale's three rows. Any content
  // that changes the card's height — a longer park name wrapping, a different language's
  // heading, four rows instead of three — moved the card without moving the pills, so the gap
  // between them drifted or closed entirely.
  //
  // Only measured while at REST, and only once the list it is measuring is the REAL one. Once a
  // query grows the list the card is meant to expand over the pills, so the last resting height
  // is what stays reserved; and a height taken off the pending skeleton would be reserved for as
  // long as the browse lookup takes and then corrected, which is a second move of the pills for
  // something the CSS variable already estimates.
  const atRest = query.trim().length < 3 && !expanded && !search.browse.isPending;
  useEffect(() => {
    const card = cardRef.current;
    if (!card || !atRest) return;
    // Never while GSAP is mid-tween. The tween writes an inline height frame by frame, and the
    // observer fired on every one of them — so the spacer, and the pills sitting on it, animated
    // along with the card and lurched the moment the field lost focus.
    const measure = () => {
      if (tweening.current) return;
      setRestHeight(card.getBoundingClientRect().height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    return () => observer.disconnect();
  }, [atRest]);

  // Cap the dropdown at whatever room is left below the field, so a long result list ends at
  // the bottom of the screen and scrolls inside itself instead of running off the page. The
  // field's viewport position only moves on scroll and resize, so those are the only triggers;
  // the value is written straight onto the node as a custom property, which keeps a scroll
  // listener from re-rendering the whole result tree.
  useEffect(() => {
    const update = () => {
      const input = inputRef.current;
      const dropdown = dropdownRef.current;
      if (!input || !dropdown) return;
      const room = window.innerHeight - input.getBoundingClientRect().bottom - DROPDOWN_GAP_PX;
      dropdown.style.setProperty('--hero-search-max-h', `${Math.max(DROPDOWN_MIN_PX, room)}px`);
    };
    update();

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Type-anywhere: a printable key outside an input focuses the hero search seeded with it
  // (same behavior the palette trigger had via autoFocusOnType).
  //
  // Space is excluded on purpose. It is a printable character, so a naive length-1 test catches
  // it — and then Space no longer scrolls the page and no longer activates a focused button,
  // for every visitor, whether or not they ever use the search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Only when nothing is focused. Anything else — a link, a button, a menu — is a control
      // the visitor deliberately moved to, and letters there mean first-letter navigation to a
      // screen reader, not "start searching". Hijacking those was an unrequested focus change
      // for people who may never touch this field.
      const active = document.activeElement;
      if (active && active !== document.body && active !== document.documentElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Space stays with the page: it scrolls, and it activates a focused control.
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
        // Escape steps back one level and KEEPS focus on the field: a query is cleared first,
        // and only an already-empty field collapses to the three resting rows. There is no
        // closed state to fall back to — blurring to <body> dropped a keyboard user out of the
        // hero with nothing announced and no defined place to tab on from.
        if (e.key !== 'Escape') return;
        if (query) {
          setQuery('');
        } else if (expanded) {
          heightBeforeChange.current = cardRef.current?.offsetHeight ?? null;
          setExpanded(false);
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
            heightBeforeChange.current = cardRef.current?.offsetHeight ?? null;
            setExpanded(true);
            if (!trackedFocus.current) {
              trackedFocus.current = true;
              trackHeroSearchClicked();
            }
          }}
          onBlur={() => {
            heightBeforeChange.current = cardRef.current?.offsetHeight ?? null;
            setExpanded(false);
          }}
          className={cn(HERO_SEARCH_INPUT_CLASS, 'focus:border-primary/50 focus:shadow-lg')}
        />
      </div>

      {/* Reserves the RESTING height of the dropdown in the hero's flow, so the nearby pills
          sit below the open list instead of underneath it. Only the resting height — once a
          query grows the list past three rows it grows over the pills rather than pushing
          them, which is the whole reason the dropdown floats.

          The CSS variable is only the pre-measurement estimate (it matches the shell's skeleton
          card, which is what paints before this chunk exists); from mount on, the real card's
          measured height takes over. */}
      <div
        aria-hidden="true"
        className="h-[var(--hero-search-rest-h)]"
        style={restHeight != null ? { height: restHeight + DROPDOWN_TOP_GAP_PX } : undefined}
      />

      {/* The dropdown itself: always open (the hero's default state is an open list of the
          nearest parks), floating over the page. `onMouseDown` preventDefault keeps focus in
          the input so clicking a result cannot blur the field out from under the click. */}
      <div
        ref={dropdownRef}
        onMouseDown={(e) => e.preventDefault()}
        className="absolute inset-x-0 top-14 z-40"
      >
        {/* Real glass, not a near-opaque sheet: what it lands on is the hero photo, the scrim
            and the panel plate — all smooth, all beautiful under blur. The nearby pills would
            have ruined that (their text ghosts through the blur), so the panel fades them out
            while the field has focus instead of the dropdown going opaque. */}
        <GlassCard
          ref={cardRef}
          // `tile` is the same glass one grade more solid — 75 % fill and
          // `backdrop-blur-2xl` instead of `xl` — and it exists for exactly this
          // case: a panel that has to stay readable over whatever happens to be
          // under it. The stronger blur is what does the work; at 2xl the card's
          // own prose under the dropdown stops being letters. Going opaque
          // instead would fix the ghosting by deleting the glass, which is not
          // the same fix.
          variant={onHero ? 'heavy' : 'tile'}
          // Same marker the shell's skeleton carries, so `pnpm check:hero-search-rest` measures
          // the two against each other.
          data-hero-search-card=""
          className="border-border/60 mt-3 flex max-h-[var(--hero-search-max-h,32rem)] flex-col overflow-hidden p-0 shadow-2xl"
        >
          <SearchResultsPanel
            query={query}
            search={search}
            onSelect={handleSelect}
            onGlossarySelect={handleGlossarySelect}
            browseLimit={expanded ? undefined : HERO_BROWSE_LIMIT}
            listClassName="min-h-0 flex-1"
            skeletonRowClassName={HERO_SKELETON_ROW_CLASS}
          />
        </GlassCard>
      </div>
    </CommandPrimitive>
  );
}
