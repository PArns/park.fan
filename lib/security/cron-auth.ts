import { NextResponse } from 'next/server';

/**
 * The gate every `/api/cron/*` route opens with: `null` when the request carries the cron
 * secret, the response to return otherwise.
 *
 * The routes each compared `authorization` against `` `Bearer ${process.env.CRON_SECRET}` ``,
 * and with the variable unset — a preview, a misconfigured environment — that string is
 * `Bearer undefined`, which anybody can send. `prewarm` is a five-minute fan-out against the
 * backend and `indexnow`/`websub` ping third parties, so an unset secret now disables them, the
 * way `/api/revalidate` already treats its own.
 */
export function cronUnauthorized(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'Cron is disabled (CRON_SECRET is not configured)' },
      { status: 503 }
    );
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
