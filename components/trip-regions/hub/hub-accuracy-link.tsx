'use client';

import type { ReactNode } from 'react';
import { FaqLink } from '@/components/faq/faq-link';
import { trackTripEvent } from '@/lib/trip-regions/plan-analytics';
import { TRIP_ACCURACY_ID } from '@/lib/trip-regions/paths';

/** The accuracy line's link to its question in chapter 04, counted as `trip_accuracy_opened`. */
export function HubAccuracyLink({ region, children }: { region: string; children: ReactNode }) {
  return (
    <FaqLink
      id={TRIP_ACCURACY_ID}
      className="text-primary-ink underline underline-offset-4"
      onOpen={() => trackTripEvent(region, 'trip_accuracy_opened', { surface: 'hub' })}
    >
      {children}
    </FaqLink>
  );
}
