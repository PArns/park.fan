import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingState } from '../../_ui/primitives';
import { LiveView } from './_components/live-view';

export const metadata: Metadata = {
  title: 'Live — park.fan',
  robots: { index: false, follow: false },
};

/**
 * The admin's live view of the site's own counter. The view reads the language from the address,
 * which needs a `Suspense` boundary above it.
 */
export default function LiveTrafficPage() {
  return (
    <Suspense fallback={<LoadingState label="Lade Live-Zahlen…" />}>
      <LiveView />
    </Suspense>
  );
}
