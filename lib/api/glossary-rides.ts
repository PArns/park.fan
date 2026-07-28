import { api } from './client';
import type { TermAttraction } from './types';

/**
 * The glossary → rides direction of the ride/glossary link.
 *
 * The ride page gets its terms embedded in the attraction response; this is the
 * other way round, so a glossary term page can list the rides that feature it.
 *
 * The data behind this is hand-curated seed that only changes when someone
 * edits the seed file in the API repo and re-runs the job — so it is cached for
 * a day rather than polled.
 */
const REVALIDATE = 86400; // 1d — curated seed, changes on a human's schedule

interface TermAttractionsResponse {
  termId: string;
  total: number;
  data: TermAttraction[];
}

/**
 * Rides whose track figures, ride type or manufacturer match `termId`.
 * Returns an empty list rather than throwing — a glossary page must still
 * render if the API is down or the term has no curated rides yet.
 */
export async function getAttractionsForTerm(termId: string): Promise<TermAttraction[]> {
  try {
    const res = await api.get<TermAttractionsResponse>(
      `/glossary/terms/${encodeURIComponent(termId)}/attractions`,
      { next: { revalidate: REVALIDATE, tags: ['glossary-rides'] } }
    );
    return res?.data ?? [];
  } catch {
    return [];
  }
}

/**
 * Term id → number of curated rides, for the whole set. Used to decide which
 * glossary terms are worth badging on the overview.
 */
export async function getRideCountsByTerm(): Promise<Record<string, number>> {
  try {
    return (
      (await api.get<Record<string, number>>('/glossary/terms/counts', {
        next: { revalidate: REVALIDATE, tags: ['glossary-rides'] },
      })) ?? {}
    );
  } catch {
    return {};
  }
}
