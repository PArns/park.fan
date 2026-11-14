import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingState } from '../../_ui/primitives';
import { TripPlannerView } from '../_components/trip-planner-view';

export const metadata: Metadata = {
  title: 'Reiseplaner — park.fan',
  robots: { index: false, follow: false },
};

/**
 * The admin's dashboard of the multi-day trip planner and the region hubs. The view reads the
 * window and language from the address, under a `Suspense` boundary.
 */
export default function TripPlannerTrafficPage() {
  return (
    <Suspense fallback={<LoadingState label="Lade Reiseplaner…" />}>
      <TripPlannerView />
    </Suspense>
  );
}
