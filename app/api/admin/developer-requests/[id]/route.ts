import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/session';
import { decideKeyRequest, deleteKeyRequest } from '@/lib/developers/key-request-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** The id is a path segment of a stored document, so only a UUID may reach the store. */
const idSchema = z.uuid();

const decisionSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('approved'),
    keyId: z.uuid(),
    keyPrefix: z.string().max(20).optional(),
  }),
  z.object({ status: z.literal('rejected'), reason: z.string().trim().max(1000).optional() }),
  // Back into the queue, for a decision taken by mistake.
  z.object({ status: z.literal('pending') }),
]);

/** PATCH: approve a request with the key issued for it, turn it down, or reopen it. Owner only. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request, 'owner');
  if (guard.response) return guard.response;

  const id = idSchema.safeParse((await params).id);
  if (!id.success) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  const body = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'invalid-body' }, { status: 422 });

  const at = new Date().toISOString();
  const by = guard.identity.displayName;
  const decision =
    body.data.status === 'approved'
      ? { at, by, keyId: body.data.keyId, keyPrefix: body.data.keyPrefix }
      : body.data.status === 'rejected'
        ? { at, by, ...(body.data.reason && { reason: body.data.reason }) }
        : undefined;

  try {
    const updated = await decideKeyRequest(id.data, body.data.status, decision);
    if (!updated) return NextResponse.json({ error: 'not-found' }, { status: 404 });
    return NextResponse.json({ ok: true, item: updated });
  } catch (err) {
    console.error('[admin/developer-requests] update failed:', err);
    return NextResponse.json({ error: 'update-failed' }, { status: 500 });
  }
}

/** DELETE: remove a request and the personal data in it for good. Owner only. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request, 'owner');
  if (guard.response) return guard.response;

  const id = idSchema.safeParse((await params).id);
  if (!id.success) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  try {
    const removed = await deleteKeyRequest(id.data);
    if (!removed) return NextResponse.json({ error: 'not-found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/developer-requests] delete failed:', err);
    return NextResponse.json({ error: 'delete-failed' }, { status: 500 });
  }
}
