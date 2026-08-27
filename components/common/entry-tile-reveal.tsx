'use client';

import { useTileReveal } from '@/lib/hooks/use-tile-reveal';

/**
 * Client shell around a SERVER-rendered tile row, so the row can settle in on mount without
 * becoming a Client Component itself.
 *
 * The ride page's chapter row is a Server Component on purpose — its labels are chapter headings
 * the page already renders, so it costs no client bundle and no routed message namespace. Motion
 * needs an effect and a ref, which is all this holds: the tiles arrive as `children`, already
 * rendered on the server, and stay in the served HTML exactly as before.
 *
 * It renders `display: contents`, so it adds no box of its own — the grid on the `<nav>` inside
 * keeps working as if this wrapper were not there. `querySelectorAll` on an element with
 * `display: contents` still walks its subtree, which is all `useTileReveal` needs it for.
 */
export function EntryTileReveal({ children }: { children: React.ReactNode }) {
  const rowRef = useTileReveal<HTMLDivElement>();
  return (
    <div ref={rowRef} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}
