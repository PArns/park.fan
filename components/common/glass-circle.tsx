import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * The 34px frosted disc the attraction card's two corner controls sit on —
 * `FavoriteStar` and `RideAlertBell`.
 *
 * It lives here rather than in `attraction-card.tsx` because a control that
 * can decide not to render has to draw this itself: wrapped at the call site,
 * a `null` from the control leaves the disc behind as an empty circle, which
 * is exactly what the bell did for every ride whose queue is too short to set
 * an alert on. `components/common/` and not `components/parks/` so the push
 * bell can reach it without a client component importing card chrome.
 *
 * It is every such disc on the site: `park-card.tsx` renders it too, and passes
 * its positioning (`absolute top-3 right-3 z-[4]`) through `className`, because
 * there the disc is itself the positioned element. `className` is for placement
 * only; size, colour, border and shadow stay here (PAR-130).
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
