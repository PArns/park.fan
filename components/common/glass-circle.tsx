import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * The row the card corner's circles sit in, right-aligned by its caller. Below `sm` the gap is
 * 6 px, which {@link GLASS_CIRCLE_HIT_AREA}'s width is measured against; from `sm` up there are no
 * touch targets to keep apart.
 */
export const GLASS_CIRCLE_ROW = 'flex items-center gap-1.5 sm:gap-2';

/**
 * The phone hit area of a control filling a {@link GlassCircle} in a {@link GLASS_CIRCLE_ROW}:
 * 44 px tall and 40 px wide, the circle plus the row's gap, so neighbouring targets meet edge to
 * edge. A 44 px square would overlap its neighbour by 4 px, and the overlap goes to the later one.
 */
export const GLASS_CIRCLE_HIT_AREA =
  'max-sm:after:absolute max-sm:after:top-1/2 max-sm:after:left-1/2 max-sm:after:h-11 max-sm:after:w-10 max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2 max-sm:after:content-[""]';

/**
 * The 34 px frosted disc the card corner controls sit on (`FavoriteStar`, `RideAlertBell`). A
 * control that can render nothing draws its own disc, or a `null` would leave an empty circle.
 * `className` is for placement only; size, colour, border and shadow stay here.
 */
export function GlassCircle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('h-[34px] w-[34px] rounded-full', className)}
      style={{
        background: 'var(--pk-fav-bg)',
        border: '1px solid var(--pk-fav-border)',
        boxShadow: 'var(--pk-fav-shadow)',
      }}
    >
      {children}
    </div>
  );
}
