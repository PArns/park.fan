import 'server-only';
import { NextResponse } from 'next/server';
import { getGlossaryTerms } from '@/lib/glossary/translations';
import { requireAdmin } from '@/lib/admin/session';

export const runtime = 'nodejs';

/**
 * The glossary as the ride-profile editor's grouped picker needs it: names to pick from, where
 * `/api/glossary-term-ids` has bare ids and `/api/glossary-search` only matches. Behind the admin
 * session because it is an editor's tool, which also keeps it out of the public cache.
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
