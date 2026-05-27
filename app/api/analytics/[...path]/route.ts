import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.park.fan';

// Read-only passthrough for the public /v1/analytics/* endpoints.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const incoming = new URL(request.url);
  const apiUrl = new URL(`${API_BASE}/v1/analytics/${path.join('/')}`);
  incoming.searchParams.forEach((value, key) => apiUrl.searchParams.set(key, value));

  try {
    const response = await fetch(apiUrl.toString(), { cache: 'no-store' });
    const data = await response.json();
    return NextResponse.json(data, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  } catch (error) {
    console.error('[Analytics proxy] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 502 });
  }
}
