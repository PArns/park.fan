import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthHeaders } from '@/lib/api/client';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.park.fan';

// Read-only passthrough for the public /v1/ml/* stats endpoints, so the
// client-side admin dashboard can fetch them without cross-origin requests.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const incoming = new URL(request.url);
  const apiUrl = new URL(`${API_BASE}/v1/ml/${path.join('/')}`);
  incoming.searchParams.forEach((value, key) => apiUrl.searchParams.set(key, value));

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
    console.error('[ML proxy] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch ML data' }, { status: 502 });
  }
}
