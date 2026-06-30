import 'server-only';
import { randomUUID } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyTurnstile } from '@/lib/contribute/turnstile';
import { signTicket } from '@/lib/contribute/ticket';
import { contributionMetaSchema } from '@/lib/contribute/types';
import { MAX_FILES } from '@/lib/contribute/config';
import { getForwardedForHeaders } from '@/lib/utils/request-ip';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/contribute/start — begin a contribution.
 *
 * Verifies the Turnstile challenge ONCE (server-side), validates the assignment +
 * consent, then mints a short-lived signed ticket. The browser presents that ticket
 * when proxying each photo through /api/contribute/file and when finalizing — so
 * Turnstile isn't re-solved per file and the assignment can't be tampered with.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid-form' }, { status: 400 });
  }

  const { turnstileToken, ...rest } = (body ?? {}) as Record<string, unknown>;

  // 1) Bot protection.
  const clientIp = getForwardedForHeaders(request)['X-Forwarded-For'];
  const turnstile = await verifyTurnstile(String(turnstileToken ?? ''), clientIp);
  if (!turnstile.success) {
    return NextResponse.json(
      { error: 'turnstile-failed', reason: turnstile.reason },
      { status: 403 }
    );
  }

  // 2) Validate assignment + consent.
  const parsed = contributionMetaSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid-meta' }, { status: 422 });
  }
  const { entity, caption, credit } = parsed.data;

  // 3) Mint the ticket.
  const sid = randomUUID();
  const ticket = await signTicket({ sid, entity, caption, credit, maxFiles: MAX_FILES });

  return NextResponse.json({ ok: true, sid, ticket, maxFiles: MAX_FILES });
}
