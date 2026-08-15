import { getGlossaryTerms } from '@/lib/glossary/translations';

/**
 * The canonical list of glossary term ids.
 *
 * This app owns the ids; the API only stores them (curated ride profiles keep
 * track figures, ride types and builders as term ids). The API used to mirror
 * the list into a checked-in allowlist and fail CI on an unknown id, but that
 * file went away with its ride-profile seed — so nothing validated the ids any
 * more, and a term renamed here silently shortened every ride layout that
 * referenced it.
 *
 * Publishing the list closes that gap without coupling the two repositories:
 * the API fetches this and diffs it against the ids actually stored in
 * `attraction_ride_profiles`.
 *
 * The ids come from `getGlossaryTerms`, NOT straight from `data.ts`, and the
 * difference matters: a term with no translation for a locale is dropped when
 * the term list is built, so it would not render even though `data.ts` lists
 * it. This endpoint therefore answers "which ids actually resolve to a page",
 * which is the question the API needs answered.
 */
export const revalidate = 3600;

export async function GET() {
  const terms = await getGlossaryTerms('en');
  const ids = terms.map((t) => t.id).sort();

  return Response.json(
    { count: ids.length, ids },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
