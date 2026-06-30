import 'server-only';
import { NextResponse } from 'next/server';
import { requireAdminPass } from '@/lib/admin/verify-pass';
import { purgeOrphanImages } from '@/lib/contribute/submissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * DELETE /api/admin/contributions/orphans — remove image blobs that have no
 * matching metadata record (left over from uploads that failed before finalize).
 */
export async function DELETE(request: Request) {
  const unauthorized = await requireAdminPass(request);
  if (unauthorized) return unauthorized;
  try {
    const removed = await purgeOrphanImages();
    return NextResponse.json({ ok: true, removed });
  } catch (err) {
    console.error('[admin/contributions/orphans] purge failed:', err);
    return NextResponse.json({ error: 'purge-failed' }, { status: 500 });
  }
}
