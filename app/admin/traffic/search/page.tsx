import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingState } from '../../_ui/primitives';
import { SearchView } from '../_components/search-view';

export const metadata: Metadata = {
  title: 'Suche — park.fan',
  robots: { index: false, follow: false },
};

/**
 * The admin's search dashboard: which search field is used, from which page and on which device.
 * The view reads the window and language from the address, under a `Suspense` boundary.
 */
export default function SearchTrafficPage() {
  return (
    <Suspense fallback={<LoadingState label="Lade Suche…" />}>
      <SearchView />
    </Suspense>
  );
}
