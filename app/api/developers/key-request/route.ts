import 'server-only';
import { randomUUID } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyTurnstile } from '@/lib/security/turnstile';
import { TURNSTILE_ACTIONS } from '@/lib/security/turnstile-actions';
import { getForwardedForHeaders } from '@/lib/utils/request-ip';
import { NO_STORE } from '@/lib/api/cdn-cache-headers';
import { keyRequestInputSchema, type KeyRequestRecord } from '@/lib/developers/key-request';
import { recordKeyRequest } from '@/lib/developers/key-request-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** A request body larger than this is not a filled-in form. */
const MAX_BODY_BYTES = 16 * 1024;

/**
 * POST /api/developers/key-request: stores a key request from the developer portal for the owner
 * to review on `/admin/api-keys`. Turnstile first, so a script never reaches the store; then the
 * shared schema. Every answer is `no-store`: an error is the applicant's, not the next one's.
 */
export async function POST(request: NextRequest) {
  const fail = (error: string, status: number, extra?: Record<string, unknown>) =>
    NextResponse.json({ error, ...extra }, { status, headers: NO_STORE });

  const text = await request.text().catch(() => '');
  if (!text || text.length > MAX_BODY_BYTES) return fail('invalid-form', 400);

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return fail('invalid-form', 400);
  }

  const { turnstileToken, ...fields } = body;
  const turnstile = await verifyTurnstile(String(turnstileToken ?? ''), {
    expectedAction: TURNSTILE_ACTIONS.developerKeyRequest,
    remoteIp: getForwardedForHeaders(request)['X-Forwarded-For'],
  });
  if (!turnstile.success) return fail('turnstile-failed', 403, { reason: turnstile.reason });

  const parsed = keyRequestInputSchema.safeParse(fields);
  if (!parsed.success) {
    return fail('invalid-form', 422, {
      fields: [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? '')))],
    });
  }

  const record: KeyRequestRecord = {
    ...parsed.data,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    userAgent: request.headers.get('user-agent')?.slice(0, 300) ?? undefined,
  };

  try {
    const stored = await recordKeyRequest(record);
    if (!stored.ok) return fail(stored.reason, stored.reason === 'already-pending' ? 409 : 503);
  } catch (err) {
    console.error('[developers/key-request] store failed:', err);
    return fail('store-failed', 500);
  }

  return NextResponse.json({ ok: true, id: record.id }, { status: 201, headers: NO_STORE });
}
