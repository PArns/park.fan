import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingState } from '../../_ui/primitives';
import { PlannerView } from '../_components/planner-view';

export const metadata: Metadata = {
  title: 'Tagesplaner — park.fan',
  robots: { index: false, follow: false },
};

/**
 * The admin's planner dashboard: how the trip planner is opened, how far it leads and what goes
 * into the plans. The view reads the window and language from the address, under a `Suspense`
 * boundary.
 */
export default function PlannerTrafficPage() {
  return (
    <Suspense fallback={<LoadingState label="Lade Tagesplaner…" />}>
      <PlannerView />
    </Suspense>
  );
}
