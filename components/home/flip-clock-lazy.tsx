'use client';

import dynamic from 'next/dynamic';

/**
 * The countdown, code-split from a client module. A Client Component that a Server Component
 * imports statically ships in the route's JavaScript whether it renders or not, and the countdown
 * renders only while an announcement with `countdownTo` is running. Called from here, its chunk
 * loads only then.
 */
export const FlipClockLazy = dynamic(() =>
  import('@/components/ui/flip-clock').then((m) => m.FlipClock)
);
