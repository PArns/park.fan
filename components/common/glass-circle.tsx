import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

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
