import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminPass } from '@/lib/admin/verify-pass';
import { deleteSubmission, updateSubmission } from '@/lib/contribute/submissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const patchSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  caption: z.string().max(500).optional(),
  credit: z.string().max(120).optional(),
});

/** PATCH — moderate a submission: change status and/or edit caption/credit. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminPass(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  let patch;
  try {
    patch = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid-body' }, { status: 422 });
  }

  try {
    const updated = await updateSubmission(id, patch);
    if (!updated) return NextResponse.json({ error: 'not-found' }, { status: 404 });
    return NextResponse.json({ ok: true, submission: updated });
  } catch (err) {
    console.error('[admin/contributions] update failed:', err);
    return NextResponse.json({ error: 'update-failed' }, { status: 500 });
  }
}

/** DELETE — remove a submission and its stored photos. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminPass(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const removed = await deleteSubmission(id);
    if (!removed) return NextResponse.json({ error: 'not-found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/contributions] delete failed:', err);
    return NextResponse.json({ error: 'delete-failed' }, { status: 500 });
  }
}
