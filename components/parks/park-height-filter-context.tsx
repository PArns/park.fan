'use client';

import { createContext, useContext } from 'react';

/**
 * The park page's rider-height filter, for a control that is not in the filter panel.
 *
 * The state is `useAttractionFilter`'s, owned by `TabsWithHash`; this hands the same value and the
 * same setter to the second slider in the „Mit Kindern“ block under the ride list
 * (`ParkKidsHeightFilter`), so both sliders are one filter and the list, the panel's chip and the
 * phone's „Filter“ button all follow whichever of them moved. `null` where the park publishes no
 * minimum height at all, which is also what a consumer outside the park page reads.
 */
export interface ParkHeightFilter {
  /** Every height the slider may be set to, ascending — see `riderHeightStops`. */
  stops: number[];
  /** The chosen height in cm, `null` while the filter is off. The slider's own, urgent value. */
  value: number | null;
  onChange: (cm: number | null) => void;
  /** Attractions this height may ride / attractions the park has — the panel's readout. */
  rideableCount: number;
  totalCount: number;
  /** Switches to the ride list's tab and scrolls its filter panel into view. */
  showList: () => void;
}

export const ParkHeightFilterContext = createContext<ParkHeightFilter | null>(null);

export function useParkHeightFilter(): ParkHeightFilter | null {
  return useContext(ParkHeightFilterContext);
}
