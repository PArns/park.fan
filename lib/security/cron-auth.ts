import { timingSafeEqual } from 'node:crypto';

/**
 * `null` when the request carries `Bearer <process.env[envName]>`, the response to return
 * otherwise. An unset secret disables the route with a 503 rather than accepting
 * `Bearer undefined`, which anybody can send. The comparison takes the same time however much of
 * the secret a guess gets right.
 */
export function bearerUnauthorized(request: Request, envName: string): Response | null {
  const secret = process.env[envName];
  if (!secret) {
    return Response.json({ error: `Disabled (${envName} is not configured)` }, { status: 503 });
  }
  const sent = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (sent.length !== expected.length || !timingSafeEqual(sent, expected)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/** The gate every `/api/cron/*` route opens with; see {@link bearerUnauthorized}. */
export function cronUnauthorized(request: Request): Response | null {
  return bearerUnauthorized(request, 'CRON_SECRET');
}
