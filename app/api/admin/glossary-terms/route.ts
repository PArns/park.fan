import 'server-only';
import { NextResponse } from 'next/server';
import { getGlossaryTerms } from '@/lib/glossary/translations';
import { requireAdmin } from '@/lib/admin/session';

export const runtime = 'nodejs';

/**
 * The glossary, as the ride-profile editor needs it.
 *
 * `/api/glossary-term-ids` publishes the bare ids for the API's nightly audit,
 * and bare ids are exactly what an editor must not be asked to type: a ride
 * profile is a list of `zero-g-roll`, `top-hat`, `lsm-launch` in ride order,
 * and picking those from a list of names is the difference between curation
 * and transcription. `/api/glossary-search` would do the lookup but only
 * answers from three characters and only returns matches, so it cannot fill a
 * grouped picker.
 *
 * Behind the admin session because it is an editor's tool, not because the
 * glossary is a secret — it is a public site — and because that keeps the
 * route out of the public cache, where a 400-entry list would sit for an hour
 * for nobody's benefit.
 */
export async function GET(request: Request) {
  const { response } = await requireAdmin(request, 'viewer');
  if (response) return response;

  const terms = await getGlossaryTerms('de');

  return NextResponse.json(
    {
      terms: terms.map((term) => ({
        id: term.id,
        name: term.name,
        category: term.category,
      })),
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
