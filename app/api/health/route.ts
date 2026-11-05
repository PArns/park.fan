import { NextResponse } from 'next/server';
import { api } from '@/lib/api/client';
import { NO_STORE } from '@/lib/api/cdn-cache-headers';

/**
 * Whether api.park.fan can serve pages again, for the maintenance page's recovery poll: `ready`
 * also checks Postgres and Redis, which a deploy restarts after the API itself. Nothing on the way
 * is cached (neither the Data Cache nor a CDN), so a copy from before the outage can never report
 * the API as back.
 */
export async function GET() {
  try {
    await api.get('/v1/health/ready', { cache: 'no-store', signal: AbortSignal.timeout(3_000) });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers: NO_STORE });
  }
}
