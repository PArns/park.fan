import { SITE_URL } from '@/i18n/config';
import { deployPurgeBodies } from '@/lib/cloudflare/deploy-purge';
import { vercelSignatureValid } from '@/lib/security/vercel-webhook';

/**
 * Purges park.fan's Cloudflare cache after a production deploy, so the next request shows the
 * deploy instead of waiting out the edge window (a day for the homepage, blog, news, glossary and
 * the guide hubs). Pages, relays and machine files go; OG cards, photos and `/_next/` stay, since
 * their URLs move with their content (`lib/cloudflare/deploy-purge.ts`). Purge, not invalidate: an invalidated entry is served once more per PoP while
 * Cloudflare revalidates it, and for a news post that is the reader who came for it.
 *
 * Called by a Vercel webhook on `deployment.promoted`, which fires once park.fan points at the new
 * deployment. Setup: docs/architecture/cdn-caching.md#a-deploy-purges-cloudflare
 */
export async function POST(request: Request) {
  const secret = process.env.VERCEL_DEPLOY_WEBHOOK_SECRET;
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const zone = process.env.CLOUDFLARE_ZONE_ID?.trim();
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
  const deploymentId = event.payload?.deployment?.id;
  if (deploymentId !== process.env.VERCEL_DEPLOYMENT_ID) {
    return Response.json({ ignored: 'not the live deployment' });
  }

  // The host, not the whole zone: api.park.fan sits in the same zone, and its cache is the backend's.
  const host = new URL(SITE_URL).host;
  const bodies = deployPurgeBodies(host);
  try {
    for (const body of bodies) {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10_000),
        }
      );
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        // Cloudflare answers a wrong zone ID and an invalid token alike with 401 "Authentication
        // error", so the log names what was sent: the zone, and of the token only its prefix and
        // length.
        console.error(
          `Cloudflare purge_cache ${response.status}: zone ${zone}, token ${token.slice(0, 5)}… (${token.length} chars)`,
          JSON.stringify(result?.errors ?? result)
        );
        // A non-2xx makes Vercel deliver the event again, with backoff, for up to a day. Every call
        // is repeated then, which is harmless: a purge of an empty cache purges nothing.
        return Response.json(result, { status: 502 });
      }
    }
    // So the runtime logs show that a promote purged, not only that a purge failed.
    console.info(
      `Cloudflare purge_cache ok: host ${host}, ${bodies.length} calls, deployment ${deploymentId}`
    );
    return Response.json({ purged: bodies.length });
  } catch (error) {
    console.error('Cloudflare purge_cache unreachable', error);
    return Response.json({ error: 'Cloudflare unreachable' }, { status: 502 });
  }
}
