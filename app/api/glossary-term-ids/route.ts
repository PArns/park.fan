import { getGlossaryTerms } from '@/lib/glossary/translations';
import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';

/**
 * The canonical list of glossary term ids, which this app owns and the API only stores; the API
 * diffs it against the ids in `attraction_ride_profiles`. A single path segment on purpose:
 * `/api/glossary/term-ids` would match `app/[locale]/glossary/[term]` with `locale = "api"`. The
 * ids come from `getGlossaryTerms`, so only ids that resolve to a page are listed.
 */
export const revalidate = 3600;

export async function GET() {
  const terms = await getGlossaryTerms('en');
  const ids = terms.map((t) => t.id).sort();

  return Response.json(
    { count: ids.length, ids },
    {
      headers: cdnCacheHeaders('public, s-maxage=3600, stale-while-revalidate=86400'),
    }
  );
}
