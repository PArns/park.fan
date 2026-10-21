import { SITE_URL } from '@/i18n/config';
import { vercelSignatureValid } from '@/lib/security/vercel-webhook';

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

  // `deployment.created` and the rest arrive before park.fan serves the new build.
  let type: string | undefined;
  try {
    type = (JSON.parse(rawBody) as { type?: string } | null)?.type;
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (type !== 'deployment.promoted') return Response.json({ ignored: type ?? null });

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
