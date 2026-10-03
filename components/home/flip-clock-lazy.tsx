'use client';

import dynamic from 'next/dynamic';

/**
 * The countdown, code-split from a CLIENT module. `FlipClock` pulls in framer-motion (140 KB raw,
 * 40 KB brotli). `AnnounceSection` used to call `next/dynamic` itself, but it is a Server
 * Component, and there Next does not split: "When a Server Component dynamically imports a Client
 * Component, automatic code splitting is currently not supported" (next/dist/docs, lazy-loading).
 * So framer-motion shipped with every homepage view, including the months with no countdown on
 * screen (measured 2026-10-03). Called from here, the chunk loads only when a countdown renders.
 */
export const FlipClockLazy = dynamic(() =>
  import('@/components/ui/flip-clock').then((m) => m.FlipClock)
);
