'use client';

import dynamic from 'next/dynamic';

/**
 * The countdown, code-split from a client module: `FlipClock` pulls in framer-motion, and Next does
 * not split a Client Component that a Server Component imports dynamically. Called from here, the
 * chunk loads only when a countdown renders.
 */
export const FlipClockLazy = dynamic(() =>
  import('@/components/ui/flip-clock').then((m) => m.FlipClock)
);
