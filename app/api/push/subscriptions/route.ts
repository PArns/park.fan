import { NextRequest, NextResponse } from 'next/server';
import { getServerApiHeaders } from '@/lib/api/client';
import { getForwardedForHeaders } from '@/lib/utils/request-ip';

/**
 * Subscribing and unsubscribing a browser.
 *
 * A thin relay, and thin on purpose: the API owns every rule here — that the
 * trip exists, that the topic is known, that the endpoint is https. Duplicating
 * any of them would put the same check in two repositories, and the copy that
 * drifts is the one nothing tests.
 *
 * The status is passed through rather than flattened. 503 (this deploy cannot
 * send), 404 (no such trip) and 400 (malformed) mean different things to the
 * control that called this, and collapsing them into "failed" is how a visitor
 * ends up retrying something that will never work.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan';

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
    const response = await fetch(`${API_BASE}/v1/push/subscriptions`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getForwardedForHeaders(request),
        ...getServerApiHeaders(),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    // 204 carries no body, and calling `.json()` on one throws — the same trap
    // `app/api/admin/[...path]` documents for a logout and a delete.
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
