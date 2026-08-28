'use client';

import { useMenuReveal } from '@/lib/hooks/use-menu-reveal';

/**
 * The full-bleed glass band the header's menus open into.
 *
 * Extracted from `NavMenu` because it is no longer only a nav trigger's panel: the favorites
 * menu hangs off the actions cluster on the far right and opens the same band. Two copies of
 * the surface would be two chances for the ring, the blur or the container padding to drift, and
 * the whole point of the band is that a visitor cannot tell which trigger opened it.
 *
 * Positioned against the HEADER rather than against its trigger — which is why the triggers carry
 * no `relative`. A box centred on the trigger had to be sized by hand per panel and still ran off
 * the left edge (a 700 px panel under an entry 276 px from the edge starts at −36 px); spanning
 * the header there is nothing left to collide with, and the content inside lines up with the
 * page's own container. It is also what lets the favorites trigger, which sits ~40 px from the
 * right edge, open a band that starts at the left one.
 *
 * It sits flush against the bar, no gap: the diagonal from the trigger into the panel has nothing
 * to fall through, and the band reads as the bar having grown rather than as a card hovering
 * under it. Square corners for the same reason.
 *
 * Flat, not opaque. The band is one glass surface with the bar above it — the same `bg/80` +
 * `backdrop-blur` the header already runs, plus the ring `components/ui/popover.tsx` carries,
 * because a white panel on a white page is otherwise separated from it by a hairline and nothing
 * else. "Flat" here rules out the pointer-depth tilt and the layered glass cards the pages use,
 * not the blur: what a visitor sees through it is the photo the menu is covering, which is the
 * point of opening it over the page instead of replacing it. The cost is bounded — this repaints
 * only while a panel is open, and `backdrop-filter` stays off the transition list for the same
 * reason it is off the header's.
 *
 * The material itself is `.pk-menu-glass` in `app/globals.css`, not a stack of Tailwind classes,
 * and the comment there is worth reading: the blur used to do nothing at all, because `<header>`
 * carried its own `backdrop-filter` and therefore made itself a backdrop root for this band. The
 * bar's material is a sibling layer now, so the header is not a filter ancestor of anything.
 */
export function MenuBand({
  id,
  open,
  children,
}: {
  id: string;
  open: boolean;
  children: React.ReactNode;
}) {
  // Motion for the band's contents. The glass surface below is never a target — see the hook.
  const contentRef = useMenuReveal(open);

  return (
    <div
      id={id}
      // A stable hook for the checks in scripts/: the surface class has already been
      // `bg-popover` and then `bg-popover/95`, and a test that keys on styling silently stops
      // testing anything the next time the design moves.
      data-nav-panel=""
      className={`absolute inset-x-0 top-full z-50 ${open ? '' : 'hidden'}`}
    >
      <div className="pk-menu-glass text-popover-foreground border-border/60 w-full border-b shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
        {/* `overflow-hidden` is load-bearing: the rows inside carry `-mx-2` so their hover
            highlight reaches into the column gaps, and at exactly 1024 px — where the container
            is as wide as the viewport — the last column's 8 px of bleed gave the document a
            horizontal scrollbar. Nothing should be able to leave a full-bleed band anyway. */}
        <div ref={contentRef} className="container mx-auto overflow-hidden px-4 py-5 md:px-0">
          {children}
        </div>
      </div>
    </div>
  );
}
