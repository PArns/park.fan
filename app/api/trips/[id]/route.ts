import { NextRequest, NextResponse } from 'next/server';
import { getServerApiHeaders } from '@/lib/api/client';
import { getForwardedForHeaders } from '@/lib/utils/request-ip';

/**
 * Reading and replacing one stored plan.
 *
 * The id is the credential, so this route checks nothing about who is asking —
 * there is nothing to check against. What it does check is that the id LOOKS
 * like one: 16 base64url characters, which is what the API issues. A path
 * segment that is not that shape cannot be a trip, and refusing it here keeps
 * a scanner's `../` and its SQL out of an upstream request entirely.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan';

/** What `TripsService.newId` produces: 12 random bytes as base64url. */
const TRIP_ID = /^[A-Za-z0-9_-]{16}$/;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!TRIP_ID.test(id)) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  try {
    const response = await fetch(`${API_BASE}/v1/trips/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getForwardedForHeaders(request),
        ...getServerApiHeaders(),
      },
      cache: 'no-store',
    });
    const text = await response.text();
    return new NextResponse(text || null, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Trip service unreachable' }, { status: 502 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!TRIP_ID.test(id)) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_BASE}/v1/trips/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getForwardedForHeaders(request),
        ...getServerApiHeaders(),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const text = await response.text();
    return new NextResponse(text || null, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Trip service unreachable' }, { status: 502 });
  }
}
