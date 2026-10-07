import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * The row the card corner's circles sit in, right-aligned by its caller. Below `sm` the gap is
 * 3 px, which {@link GLASS_CIRCLE_HIT_AREA}'s width is measured against; from `sm` up there are no
 * touch targets to keep apart.
 */
export const GLASS_CIRCLE_ROW = 'flex items-center gap-[3px] sm:gap-2';

/**
 * The phone hit area of a control filling a {@link GlassCircle} in a {@link GLASS_CIRCLE_ROW}:
 * 40 px tall and 33 px wide, the 30 px circle plus the row's gap, so neighbouring targets meet edge
 * to edge, where an overlap would go to the later one. Under the 44 px floor on purpose, see
 * docs/design/design-system.md#the-target-grows-the-box-does-not.
 */
export const GLASS_CIRCLE_HIT_AREA =
  'max-sm:after:absolute max-sm:after:top-1/2 max-sm:after:left-1/2 max-sm:after:h-10 max-sm:after:w-[33px] max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2 max-sm:after:content-[""]';

/**
 * The frosted disc the card corner controls sit on (`FavoriteStar`, `RideAlertBell`): 34 px, and
 * 30 px with a 14 px icon below `sm`. A control that can render nothing draws its own disc, or a
 * `null` would leave an empty circle. `className` is for placement only; size, colour, border and
 * shadow stay here.
 */
export function GlassCircle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('size-[30px] rounded-full sm:size-[34px] max-sm:[&_svg]:size-3.5', className)}
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
