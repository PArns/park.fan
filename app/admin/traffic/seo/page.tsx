import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingState } from '../../_ui/primitives';
import { SeoView } from '../_components/seo-view';

export const metadata: Metadata = {
  title: 'SEO — park.fan',
  robots: { index: false, follow: false },
};

/**
 * What search engines and AI assistants send: the pages visits begin on, the ones gaining and
 * losing, the addresses that 404 and the parks and rides no search visit reached.
 */
export default function SeoPage() {
  return (
    <Suspense fallback={<LoadingState label="Lade SEO…" />}>
      <SeoView />
    </Suspense>
  );
}
