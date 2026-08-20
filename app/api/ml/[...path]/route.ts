import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getServerApiHeaders } from '@/lib/api/client';
import { readSessionToken } from '@/lib/admin/session';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.park.fan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The ML dashboard's read passthrough — for the admin, and nobody else.
 *
 * It was a plain catch-all that joined the segments into a URL and forwarded
 * them with `getServerApiHeaders()`, which is the same shape that turned
 * `/api/admin/[...path]` into an anonymous proxy to the whole API: a
 * percent-encoded separator survives Next's route matching and only becomes
 * one inside `new URL()`, and the headers include this deployment's
 * `x-auth-key`, which the API treats as a rate-limit bypass.
 *
 * Two locks rather than a character filter, because unlike the admin proxy
 * this one serves a closed set of four paths and has exactly one caller
 * (`app/admin/ml/page.tsx`, through `useAdminFetch`, which is a same-origin
 * fetch and therefore already sends the session cookie):
 *
 *  - a session is required, so it is not an anonymous relay,
 *  - and the upstream path comes from this list, not from the request, so
 *    there is nothing to smuggle through it.
 */
const ML_PATHS = new Set([
  'dashboard',
  'monitoring/alerts',
  'monitoring/anomalies/stats',
  'monitoring/tft/performers',
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  const token = await readSessionToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requested = path.join('/');
  if (!ML_PATHS.has(requested)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  // The matched constant, never the caller's segments.
  const upstream = [...ML_PATHS].find((candidate) => candidate === requested)!;

  const incoming = new URL(request.url);
  const apiUrl = new URL(`${API_BASE}/v1/ml/${upstream}`);
  incoming.searchParams.forEach((value, key) => apiUrl.searchParams.set(key, value));

  try {
    const response = await fetch(apiUrl.toString(), {
      cache: 'no-store',
      headers: getServerApiHeaders(),
    });
    const data = await response.json();
    return NextResponse.json(data, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  } catch (error) {
    console.error('[ML proxy] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch ML data' }, { status: 502 });
  }
}
