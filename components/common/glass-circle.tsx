import type { ReactNode } from 'react';

/**
 * The 34px frosted disc a card's corner controls sit on — `FavoriteStar` on
 * every card, `RideAlertBell` on an attraction card.
 *
 * It lives here rather than in `attraction-card.tsx` because a control that
 * can decide not to render has to draw this itself: wrapped at the call site,
 * a `null` from the control leaves the disc behind as an empty circle, which
 * is exactly what the bell did for every ride whose queue is too short to set
 * an alert on. `components/common/` and not `components/parks/` so the push
 * bell can reach it without a client component importing card chrome.
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
