import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthHeaders } from '@/lib/api/client';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.park.fan';

const ALLOWED_PARAMS = new Set([
  'page',
  'limit',
  'sort',
  'continent',
  'country',
  'city',
  'continentSlug',
  'countrySlug',
  'citySlug',
]);

// Paginated park list for the admin parks table (proxy to /v1/parks).
export async function GET(request: NextRequest) {
  const incoming = new URL(request.url);
  const apiUrl = new URL(`${API_BASE}/v1/parks`);
  incoming.searchParams.forEach((value, key) => {
    if (ALLOWED_PARAMS.has(key)) apiUrl.searchParams.set(key, value);
  });

  try {
    const response = await fetch(apiUrl.toString(), {
      cache: 'no-store',
      headers: getServerAuthHeaders(),
    });
    const data = await response.json();
    return NextResponse.json(data, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  } catch (error) {
    console.error('[Parks list proxy] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch parks' }, { status: 502 });
  }
}
