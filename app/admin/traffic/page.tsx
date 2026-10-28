import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingState } from '../_ui/primitives';
import { TrafficView } from './_components/traffic-view';

export const metadata: Metadata = {
  title: 'Traffic — park.fan',
  robots: { index: false, follow: false },
};

/**
 * The admin's traffic overview. The view reads the window and language from the address, which
 * needs a `Suspense` boundary above it.
 */
export default function TrafficPage() {
  return (
    <Suspense fallback={<LoadingState label="Lade Traffic…" />}>
      <TrafficView />
    </Suspense>
  );
}
