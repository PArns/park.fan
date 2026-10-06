'use client';

import { createContext, useContext } from 'react';

/**
 * The park page's rider-height filter, for a control outside the filter panel. The state is
 * `useAttractionFilter`'s, owned by `TabsWithHash`; this hands the same value and setter to the
 * second slider in the „Mit Kindern“ block (`ParkKidsHeightFilter`), so both sliders are one
 * filter. `null` where the park publishes no minimum height.
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

/** Carries the shared rider-height filter from `TabsWithHash` to controls outside the panel. */
export const ParkHeightFilterContext = createContext<ParkHeightFilter | null>(null);

/**
 * Reads the park page's shared rider-height filter. `null` outside the park page and on a park that
 * publishes no minimum heights.
 */
export function useParkHeightFilter(): ParkHeightFilter | null {
  return useContext(ParkHeightFilterContext);
}
