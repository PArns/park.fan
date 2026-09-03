import { NextResponse } from 'next/server';
import { getServerApiHeaders } from '@/lib/api/client';

/**
 * Whether push works, and the key to subscribe with.
 *
 * Asked BEFORE the browser offers the control. A switch that turns on and does
 * nothing is the worst state this feature has, and an unconfigured deploy — no
 * VAPID keypair on the API — is exactly that unless somebody asks first.
 *
 * `no-store`: the answer changes when a deploy's environment changes, and a CDN
 * copy of `available: false` would keep the control hidden for a cache window
 * after push was switched on.
 */
export async function GET() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan';

  try {
    const response = await fetch(`${apiBase}/v1/push`, {
      headers: { 'Content-Type': 'application/json', ...getServerApiHeaders() },
      cache: 'no-store',
    });
    if (!response.ok) {
      // A deploy whose API does not know this route yet is not an error worth
      // showing anybody: it means push is unavailable, which is the answer.
      return NextResponse.json(
        { available: false, topics: [] },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }
    return NextResponse.json(await response.json(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { available: false, topics: [] },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
