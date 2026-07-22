import { api } from './client';
import type { CrowdLevel } from './types';

/** One weekday (key 0–6, Sun–Sat) or month (key 1–12) bucket of the global aggregate. */
export interface BestTimeBucket {
  key: number;
  /** 1.0 = the all-park average; < 1 quieter than usual, > 1 busier. The ranking signal. */
  relativeIndex: number;
  /** Crowd level derived from `relativeIndex` (relative, not an absolute baseline). */
  crowdLevel: CrowdLevel;
  /** Sample-weighted global avg P50 wait (min) — context only, mixes park sizes. */
  avgWaitP50: number;
  sampleDays: number;
  parkCount: number;
}

export interface GlobalBestTimes {
  byDayOfWeek: BestTimeBucket[];
  byMonth: BestTimeBucket[];
  meta: {
    windowMonths: number;
    dataFrom: string;
    dataTo: string;
    parkCount: number;
    totalSampleDays: number;
    displayable: boolean;
    generatedAt: string;
    schemaVersion: number;
  };
}

/**
 * Global "best time to visit" aggregate — relative busyness across all parks by
 * weekday and by month. The backend serves this from a 24h Redis cache; we
 * revalidate the Data Cache daily and tag it `best-times-global` so a future
 * backend webhook can bust it on recompute.
 */
export function getGlobalBestTimes(): Promise<GlobalBestTimes> {
  return api.get<GlobalBestTimes>('/v1/analytics/best-times', {
    next: { revalidate: 86400, tags: ['best-times-global'] },
  });
}
