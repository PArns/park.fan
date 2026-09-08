import { NextRequest, NextResponse } from 'next/server';
import { getServerApiHeaders } from '@/lib/api/client';
import { getForwardedForHeaders } from '@/lib/utils/request-ip';

/**
 * A browser's wait-time alerts. Thin on purpose, same reasoning as
 * `app/api/push/subscriptions/route.ts`: the API owns every rule — that the
 * subscription exists, that the attraction exists and can be alerted on,
 * that the threshold is in range. Duplicating any of it here would put the
 * same check in two repositories.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan';

export async function GET(request: NextRequest) {
  const endpoint = request.nextUrl.searchParams.get('endpoint');
  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${API_BASE}/v1/push/ride-alerts?endpoint=${encodeURIComponent(endpoint)}`,
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
    const response = await fetch(`${API_BASE}/v1/push/ride-alerts`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getForwardedForHeaders(request),
        ...getServerApiHeaders(),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    // 204 (delete) carries no body — calling `.json()` on one throws.
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
