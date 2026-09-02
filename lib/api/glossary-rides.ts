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
 * a week rather than polled.
 *
 * A week, and the second tag is what makes that safe. This fetch sets the ISR clock for all
 * 1,644 prerendered glossary term pages (274 terms x 6 locales), because Next takes the SHORTEST
 * revalidate of any fetch in a route and nothing else on that page reaches the network. At a day
 * those 1,644 pages re-rendered every morning to produce the same bytes, which was the single
 * largest source of ISR writes on the site — 55 % of all daily regenerations.
 *
 * `glossary-rides` is a tag no backend service has ever pushed, so on its own it would have meant
 * a curated edit sitting invisible for a week. `attractions` IS pushed, by
 * `admin-curation.service.ts` on every curated write and by the merge/retirement services, and a
 * ride profile changing is exactly an attraction write. So the seed still lands the moment
 * somebody edits it; the week only governs the case where nothing changed.
 */
const REVALIDATE = 604800; // 7d — curated seed; real edits arrive via the `attractions` tag

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
export async function getAttractionsForTerm(
  termId: string,
  /**
   * `park` is the API's default (alphabetical). `popularity` ranks by typical
   * peak wait — the P90 over 548 days — so a term with 151 rides can lead with
   * the ones people recognise instead of opening on "Adventureland Resort".
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

/**
 * Term id → number of curated rides, for the whole set. Used to decide which
 * glossary terms are worth badging on the overview.
 */
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
