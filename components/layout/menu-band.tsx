'use client';

import { useEffect } from 'react';
import {
  columnReachesEdgeTab,
  registerEdgeMenuBand,
} from '@/lib/hooks/use-menu-band-over-edge-tab';
import { useMenuReveal } from '@/lib/hooks/use-menu-reveal';

/**
 * The full-bleed glass band the header's menus open into, one surface whichever trigger opened it.
 * Positioned against the header rather than the trigger, so no panel runs off an edge and the
 * favorites trigger on the right can open a band that starts at the left. Flush against the bar,
 * square corners, so it reads as the bar having grown. Glass, not opaque: the blur shows the page
 * the menu covers. The material is `.pk-menu-glass` in `app/globals.css`; the header carries no
 * `backdrop-filter` of its own, or it would be a backdrop root for this band.
 */
export function MenuBand({
  id,
  open,
  onClick,
  children,
}: {
  id: string;
  open: boolean;
  /** `useMenuTrigger().closeOnSamePageClick`: a link to the page already showing closes it. */
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  children: React.ReactNode;
}) {
  // Motion for the band's contents. The glass surface below is never a target — see the hook.
  const contentRef = useMenuReveal(open);
  // The planner's edge tab steps aside while this band's column runs under it (see the store). One
  // layout read per opening, after the band is no longer `hidden`.
  useEffect(() => {
    const column = contentRef.current;
    if (!open || !column || !columnReachesEdgeTab(column)) return;
    return registerEdgeMenuBand();
  }, [open, contentRef]);

  return (
    <div
      id={id}
      // A stable hook for the checks in scripts/, which must not key on the surface's styling.
      data-nav-panel=""
      onClick={onClick}
      className={`absolute inset-x-0 top-full z-50 ${open ? '' : 'hidden'}`}
    >
      {/* `whitespace-normal` resets the nav row's `whitespace-nowrap`, which inherits: a panel is a
          page, and the favorites empty state's sentences would run out of the band on one line.
          `shadow-lg`, not `shadow-2xl`: only the lower edge of a full-bleed band is ever seen, and
          a big shadow reads as a tinted strip; some shadow stays because the hairlines vanish over
          a busy photo. */}
      <div className="pk-menu-glass text-popover-foreground border-border/60 w-full border-b whitespace-normal shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        {/* The content column is the bar's column: the same container-query tiers and `px-4` floor
            as the header's row, so a panel entry lines up with the nav entry that opened it.
            `overflow-hidden` because the rows' `-mx-2` hover bleed would otherwise give the
            document a horizontal scrollbar at 1024 px. */}
        <div
          ref={contentRef}
          className="mx-auto w-full overflow-hidden px-4 py-5 @min-[768px]:max-w-[768px] @min-[1024px]:max-w-[1024px] @min-[1280px]:max-w-[1280px] @min-[1536px]:max-w-[1536px]"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
