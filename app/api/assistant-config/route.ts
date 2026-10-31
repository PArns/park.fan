import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';
import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';
import { ASSISTANT_OFF, type AssistantConfig } from '@/lib/assistant/config';

/**
 * Whether Parky is on and for what share of visitors, as set in the admin. Relayed rather than
 * called from the browser because the answer is cached: Cloudflare keeps one copy whatever the
 * `Origin`, so a direct cross-origin read could get a copy without CORS headers
 * (api.park.fan docs/deployment/cors.md). A minute at the edge, so a switch in the admin is live
 * within one.
 */

export const dynamic = 'force-dynamic';

/** The config, or "off" when the API cannot be asked: a widget that cannot answer stays hidden. */
export async function GET() {
  const config = await apiFetch<AssistantConfig>('/v1/assistant/config', {
    cache: 'no-store',
  }).catch(() => ASSISTANT_OFF);
  return NextResponse.json(
    { enabled: config.enabled === true, rolloutPercent: Number(config.rolloutPercent) || 0 },
    { headers: cdnCacheHeaders('public, max-age=60, s-maxage=60, stale-while-revalidate=300') }
  );
}
