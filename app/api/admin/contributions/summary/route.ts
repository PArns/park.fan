import 'server-only';
import { NextResponse } from 'next/server';
import { denyUnlessAdmin } from '@/lib/admin/session';
import { summarizeSubmissions } from '@/lib/contribute/submissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/contributions/summary: the pending submissions, newest first, for the shell's
 * "new photos came in" notice. Lighter than the moderation list, which also lists every image blob;
 * "seen" lives in the reader's browser.
 */
export async function GET(request: Request) {
  const unauthorized = await denyUnlessAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    return NextResponse.json(await summarizeSubmissions(), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (err) {
    console.error('[admin/contributions/summary] failed:', err);
    return NextResponse.json({ error: 'summary-failed' }, { status: 500 });
  }
}
