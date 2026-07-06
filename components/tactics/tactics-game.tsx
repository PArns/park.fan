'use client';

/**
 * Public entry for Queue Tactics. Code-splits the heavy three.js scene
 * behind a `ssr:false` dynamic import (same pattern as the glossary coaster
 * player) so three.js never lands in SSR or the initial bundle.
 */

import nextDynamic from 'next/dynamic';

const Game = nextDynamic(() => import('./tactics-game-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh w-full items-center justify-center bg-[#101b33] text-sm text-white/60">
      Loading Queue Tactics…
    </div>
  ),
});

export function TacticsGame() {
  return <Game />;
}
