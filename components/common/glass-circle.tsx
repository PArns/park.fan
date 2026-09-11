import type { ReactNode } from 'react';

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
 * It is NOT yet every disc on the site: `park-card.tsx` hard-codes a
 * byte-identical copy, because there the disc is also the positioned element
 * (`absolute top-3 right-3 z-[4]`) and this component takes no `className`.
 * So a change here does not reach park cards, which sit in the same grids —
 * closing that gap is PAR-130.
 */
export function GlassCircle({ children }: { children: ReactNode }) {
  return (
    <div
      className="h-[34px] w-[34px] rounded-full"
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
