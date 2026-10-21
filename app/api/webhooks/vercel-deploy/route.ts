import { SITE_URL } from '@/i18n/config';

/**
 * Marks park.fan's Cloudflare cache stale after a production deploy, so the deploy shows after one
 * request per PoP instead of after the edge window (a day for blog, glossary and the guide hubs).
 * Invalidate, not purge: every entry stays and is served once more while Cloudflare revalidates
 * it, and an unchanged file comes back as a 304.
 *
 * Called by a Vercel webhook on `deployment.promoted`, which fires once park.fan points at the new
 * deployment. Setup: docs/architecture/caching-strategy.md#a-deploy-invalidates-cloudflare
 */
export async function POST(request: Request) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zone) {
    return Response.json(
      { error: 'CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID is not configured' },
      { status: 503 }
    );
  }

  // `deployment.created` and the rest arrive before park.fan serves the new build.
  const event = (await request.json().catch(() => null)) as { type?: string } | null;
  if (event?.type !== 'deployment.promoted') return Response.json({ ignored: event?.type ?? null });

  // The host, not the whole zone: api.park.fan sits in the same zone, and its cache is the backend's.
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zone}/invalidate_cache`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ hosts: [new URL(SITE_URL).host] }),
    }
  );
  // A non-2xx makes Vercel deliver the event again, with backoff, for up to a day.
  return Response.json(await response.json().catch(() => null), {
    status: response.ok ? 200 : 502,
  });
}
