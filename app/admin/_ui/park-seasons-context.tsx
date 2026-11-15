'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { parkDayOf } from '@/lib/utils/park-day';
import { adminKeys, useAdminQuery } from '../_lib/api';
import { bindableSeasons, seasonListPath } from '../_lib/seasons';
import type { ParkSeason } from '../_lib/types';

const ParkSeasonsContext = createContext<readonly ParkSeason[]>([]);

/**
 * The running and coming seasons of the park a curated form belongs to, for a field that is
 * edited per season (the performance schedules). The query is the one `SeasonBindings` reads, by
 * the same key, so the ride page asks the API once.
 */
export function ParkSeasonsProvider({
  parkId,
  children,
}: {
  /** None for a ride the API names no park for: then the form offers no season. */
  parkId: string | undefined;
  children: ReactNode;
}) {
  const [today] = useState(() => parkDayOf(Date.now(), undefined));
  const path = parkId
    ? seasonListPath({ year: null, kind: null, status: null, region: null, parkId, current: false })
    : null;
  const seasons = useAdminQuery<{ seasons: ParkSeason[]; total: number }>(
    adminKeys.seasons({ path }),
    path
  );
  return (
    <ParkSeasonsContext value={bindableSeasons(seasons.data?.seasons ?? [], today)}>
      {children}
    </ParkSeasonsContext>
  );
}

/** The seasons {@link ParkSeasonsProvider} loaded, or none outside one (a park's own form). */
export function useParkSeasons(): readonly ParkSeason[] {
  return useContext(ParkSeasonsContext);
}
