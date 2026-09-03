import { NextRequest, NextResponse } from 'next/server';
import { getServerApiHeaders } from '@/lib/api/client';
import { getForwardedForHeaders } from '@/lib/utils/request-ip';

/**
 * Storing a plan.
 *
 * `getForwardedForHeaders` is load-bearing rather than tidy. The API rate-limits
 * trip writes per address, and without the visitor's own address every write
 * from this site keys on ONE Vercel function's IP — one bucket for the whole
 * world, which is either no limit at all or a limit that locks everybody out
 * together the first time a script finds the endpoint.
 *
 * No `revalidate`, no CDN header: a trip is one visitor's and a shared edge copy
 * would hand the next reader somebody else's plan.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_BASE}/v1/trips`, {
      method: 'POST',
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
