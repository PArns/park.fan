import { NextResponse } from 'next/server';
import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';

/**
 * Whether push works and the key to subscribe with, asked before the browser offers the control,
 * so a deploy without a VAPID keypair shows no switch that does nothing. `no-store`, or a cached
 * `available: false` would hide the control after push is switched on.
 */
export async function GET() {
  try {
    const response = await fetch(`${getApiBaseUrl()}/v1/push`, {
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
