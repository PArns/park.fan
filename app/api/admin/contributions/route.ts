import 'server-only';
import { NextResponse } from 'next/server';
import { requireAdminPass } from '@/lib/admin/verify-pass';
import { listSubmissions } from '@/lib/contribute/submissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/admin/contributions — moderation queue, newest first. Admin-only. */
export async function GET(request: Request) {
  const unauthorized = await requireAdminPass(request);
  if (unauthorized) return unauthorized;

  try {
    const submissions = await listSubmissions();
    const counts = submissions.reduce<Record<string, number>>((acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    }, {});
    return NextResponse.json({ submissions, counts, total: submissions.length });
  } catch (err) {
    console.error('[admin/contributions] list failed:', err);
    return NextResponse.json({ error: 'list-failed' }, { status: 500 });
  }
}
