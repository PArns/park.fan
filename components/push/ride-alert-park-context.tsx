'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ParkAttraction, ParkStatus } from '@/lib/api/types';
import { stripNewPrefix } from '@/lib/utils';
import {
  getAttractionDisplayStatus,
  getLiveAttractionStatus,
  getStandbyWait,
} from '@/lib/utils/park-utils';
import type { RideAlertDialogAttraction } from './ride-alert-dialog';

/**
 * Every ride of one park as `RideAlertDialog` lists it. Shared by the central entry point
 * (`ParkTodayPanel`) and the provider below, so the dialog shows the same list whichever of the
 * two opened it.
 */
export function rideAlertAttractionsFor(park: {
  attractions?: ParkAttraction[] | null;
  status?: ParkStatus;
}): RideAlertDialogAttraction[] {
  return (park.attractions ?? []).map((a) => {
    return {
      id: a.id,
      name: stripNewPrefix(a.name),
      slug: a.slug,
      currentWaitTime:
        getAttractionDisplayStatus(a, park.status) === 'OPERATING' ? getStandbyWait(a) : null,
      // The card's own reading of the status, so a ride the card shows as stopped is offered its
      // reopening here as well.
      status: getLiveAttractionStatus(a, park.status),
      // Attached by the live poll's route (`enrichAttractionsWithImages`), not
      // declared on `ParkAttraction` — read the way `AttractionCard` reads them.
      // Until the first poll lands the picker shows its placeholder instead.
      backgroundImage:
        'backgroundImage' in a && typeof a.backgroundImage === 'string' ? a.backgroundImage : null,
      backgroundPosition:
        'backgroundPosition' in a && typeof a.backgroundPosition === 'string'
          ? a.backgroundPosition
          : undefined,
    };
  });
}

const RideAlertParkContext = createContext<readonly RideAlertDialogAttraction[] | null>(null);
/** Outside a park page nothing says the park is unreadable, and the API refuses it if it is. */
const RideAlertReopenContext = createContext(true);

/**
 * Hands the park's ride list to every `RideAlertBell` below it, so a bell opens the full dialog
 * with its siblings in the picker. A context and not a card prop: the park page memoizes each
 * `AttractionCard` (`LandSection`), and a list prop that changes with every live poll would
 * re-render all of them. Here only the bells read it.
 */
export function RideAlertParkProvider({
  park,
  reopenAvailable,
  children,
}: {
  park: { attractions?: ParkAttraction[] | null; status?: ParkStatus };
  /**
   * `hasReadableWaitTimes` of the server-rendered park. Not of the polled one: the flag is
   * day-stable and rides on the server render, and an absent field reads as readable.
   */
  reopenAvailable: boolean;
  children: ReactNode;
}) {
  const attractions = useMemo(
    () => rideAlertAttractionsFor(park),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [park.attractions, park.status]
  );
  return (
    <RideAlertParkContext.Provider value={attractions}>
      <RideAlertReopenContext.Provider value={reopenAvailable}>
        {children}
      </RideAlertReopenContext.Provider>
    </RideAlertParkContext.Provider>
  );
}

/** The park's rides, or `null` outside a park page (favorites, homepage, blog). */
export function useRideAlertParkAttractions(): readonly RideAlertDialogAttraction[] | null {
  return useContext(RideAlertParkContext);
}

/** Whether the park's wait times can be read, so a ride's reopening can be told about. */
export function useRideAlertReopenAvailable(): boolean {
  return useContext(RideAlertReopenContext);
}
