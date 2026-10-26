import { SITE_URL } from '@/i18n/config';
import { vercelSignatureValid } from '@/lib/security/vercel-webhook';

/**
 * Purges park.fan's Cloudflare cache after a production deploy, so the next request shows the
 * deploy instead of waiting out the edge window (a day for the homepage, blog, news, glossary and
 * the guide hubs). Purge, not invalidate: an invalidated entry is served once more per PoP while
 * Cloudflare revalidates it, and for a news post that is the reader who came for it.
 *
 * Called by a Vercel webhook on `deployment.promoted`, which fires once park.fan points at the new
 * deployment. Setup: docs/architecture/caching-strategy.md#a-deploy-purges-cloudflare
 */
export async function POST(request: Request) {
  const secret = process.env.VERCEL_DEPLOY_WEBHOOK_SECRET;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  if (!secret || !token || !zone) {
    return Response.json(
      {
        error:
          'VERCEL_DEPLOY_WEBHOOK_SECRET, CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID is not configured',
      },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  if (!vercelSignatureValid(rawBody, request.headers.get('x-vercel-signature'), secret)) {
    return Response.json({ error: 'Invalid signature' }, { status: 403 });
  }

  let event: { type?: string; payload?: { deployment?: { id?: string } } } | null;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  // `deployment.created` and the rest arrive before park.fan serves the new build.
  if (event?.type !== 'deployment.promoted') return Response.json({ ignored: event?.type ?? null });
  // The delivery must name the deployment answering it. That keeps out other projects in the
  // webhook's scope, and a captured delivery replays only until the next deploy.
  if (event.payload?.deployment?.id !== process.env.VERCEL_DEPLOYMENT_ID) {
    return Response.json({ ignored: 'not the live deployment' });
  }

  try {
    // The host, not the whole zone: api.park.fan sits in the same zone, and its cache is the backend's.
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ hosts: [new URL(SITE_URL).host] }),
      signal: AbortSignal.timeout(10_000),
    });
    // A non-2xx makes Vercel deliver the event again, with backoff, for up to a day.
    return Response.json(await response.json().catch(() => null), {
      status: response.ok ? 200 : 502,
    });
  } catch {
    return Response.json({ error: 'Cloudflare unreachable' }, { status: 502 });
  }
}
