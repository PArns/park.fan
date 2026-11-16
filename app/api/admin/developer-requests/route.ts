import 'server-only';
import { NextResponse } from 'next/server';
import { denyUnlessAdmin } from '@/lib/admin/session';
import { listKeyRequests } from '@/lib/developers/key-request-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/developer-requests: every key request from the developer portal, newest first.
 * Owner only, like the keys themselves: a request holds an applicant's name and email, and
 * answering it is a licensing decision.
 */
export async function GET(request: Request) {
  const unauthorized = await denyUnlessAdmin(request, 'owner');
  if (unauthorized) return unauthorized;

  try {
    return NextResponse.json({ items: await listKeyRequests() });
  } catch (err) {
    console.error('[admin/developer-requests] list failed:', err);
    return NextResponse.json({ error: 'list-failed' }, { status: 500 });
  }
}
