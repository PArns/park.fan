import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import { denyUnlessAdmin } from '@/lib/admin/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The ML dashboard's read passthrough, for the admin only, because `getServerApiHeaders()` carries
 * the `x-auth-key` the API reads as a rate-limit bypass. Two locks: a session validated with the
 * backend (`denyUnlessAdmin`), not a cookie merely present, and an upstream path taken from this
 * list, never from the request.
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

  const denied = await denyUnlessAdmin(request, 'viewer');
  if (denied) return denied;

  const requested = path.join('/');
  if (!ML_PATHS.has(requested)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  // The matched constant, never the caller's segments.
  const upstream = [...ML_PATHS].find((candidate) => candidate === requested)!;

  const incoming = new URL(request.url);
  const apiUrl = new URL(`${getApiBaseUrl()}/v1/ml/${upstream}`);
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
