import { api } from './client';
import type { TermAttraction } from './types';

/**
 * The glossary → rides direction of the ride/glossary link, so a term page can list the rides
 * that feature it (the ride page gets its terms embedded in the attraction response).
 *
 * Cached for a week because this fetch sets the ISR clock of every prerendered glossary term page
 * (Next takes the shortest `revalidate` in a route), and the curated seed rarely changes. The
 * `attractions` tag, which the backend pushes on every curated write, makes a real edit land at
 * once. See docs/rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md.
 */
const REVALIDATE = 604800; // 7d

interface TermAttractionsResponse {
  termId: string;
  total: number;
  data: TermAttraction[];
}

/**
 * Rides whose track figures, ride type or manufacturer match `termId`. An empty list rather than a
 * throw, so a glossary page still renders when the API is down.
 */
export async function getAttractionsForTerm(
  termId: string,
  /**
   * `park` is the API's alphabetical default; `popularity` ranks by typical peak wait (P90), so a
   * long list leads with the rides people recognise.
   */
  sort: 'park' | 'popularity' = 'park'
): Promise<TermAttraction[]> {
  try {
    const res = await api.get<TermAttractionsResponse>(
      `/v1/glossary/terms/${encodeURIComponent(termId)}/attractions`,
      {
        params: { sort },
        next: { revalidate: REVALIDATE, tags: ['glossary-rides', 'attractions'] },
      }
    );
    return res?.data ?? [];
  } catch {
    return [];
  }
}

/** Term id → number of curated rides, for deciding which terms get a badge on the overview. */
export async function getRideCountsByTerm(): Promise<Record<string, number>> {
  try {
    return (
      (await api.get<Record<string, number>>('/v1/glossary/terms/counts', {
        next: { revalidate: REVALIDATE, tags: ['glossary-rides', 'attractions'] },
      })) ?? {}
    );
  } catch {
    return {};
  }
}
