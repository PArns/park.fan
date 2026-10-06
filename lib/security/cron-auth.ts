import { NextResponse } from 'next/server';

/**
 * The gate every `/api/cron/*` route opens with: `null` when the request carries the cron
 * secret, the response to return otherwise. An unset `CRON_SECRET` disables cron with a 503
 * rather than accepting `Bearer undefined`, which anybody can send.
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
