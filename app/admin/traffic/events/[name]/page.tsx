'use client';

import { Suspense, use } from 'react';
import { LoadingState } from '../../../_ui/primitives';
import { EventDetailView } from '../../_components/event-detail-view';

/**
 * One event of the counter. The name is a route segment, so the page is a link that can be shared;
 * the window and language are in the query, which the view reads under its `Suspense`.
 */
export default function EventDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  return (
    <Suspense fallback={<LoadingState label="Lade Ereignis…" />}>
      <EventDetailView name={decodeURIComponent(name)} />
    </Suspense>
  );
}
