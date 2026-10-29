import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingState } from '../../_ui/primitives';
import { PathsView } from '../_components/paths-view';

export const metadata: Metadata = {
  title: 'Wege — park.fan',
  robots: { index: false, follow: false },
};

/**
 * The admin's dashboard of the ways through the site: how far down park pages are read, which
 * links are followed from which block, the header's menus and the FAQ. The view reads the window
 * and language from the address, under a `Suspense` boundary.
 */
export default function PathsTrafficPage() {
  return (
    <Suspense fallback={<LoadingState label="Lade Wege…" />}>
      <PathsView />
    </Suspense>
  );
}
