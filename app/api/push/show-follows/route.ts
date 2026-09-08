import { NextRequest, NextResponse } from 'next/server';
import { getServerApiHeaders } from '@/lib/api/client';
import { getForwardedForHeaders } from '@/lib/utils/request-ip';

/**
 * A browser's followed shows. Same thin-relay shape as
 * `app/api/push/ride-alerts/route.ts` — see there for why.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan';

export async function GET(request: NextRequest) {
  const endpoint = request.nextUrl.searchParams.get('endpoint');
  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${API_BASE}/v1/push/show-follows?endpoint=${encodeURIComponent(endpoint)}`,
      {
        headers: { ...getForwardedForHeaders(request), ...getServerApiHeaders() },
        cache: 'no-store',
      }
    );
    const text = await response.text();
    return new NextResponse(text || null, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Push service unreachable' }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  return relay(request, 'POST');
}

export async function DELETE(request: NextRequest) {
  return relay(request, 'DELETE');
}

async function relay(request: NextRequest, method: 'POST' | 'DELETE') {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_BASE}/v1/push/show-follows`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getForwardedForHeaders(request),
        ...getServerApiHeaders(),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    const text = await response.text();
    return new NextResponse(text || null, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Push service unreachable' }, { status: 502 });
  }
}
