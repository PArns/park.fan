import 'server-only';
import { NextResponse } from 'next/server';
import { isValidAdminPass } from '@/lib/admin/verify-pass';
import { readImageLocal } from '@/lib/contribute/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/contributions/file?key=contributions/<id>/<file>&pass=<admin-pass>
 *
 * Serves a locally-stored contribution image for the admin preview. Only relevant
 * to the local storage driver (offline dev); with Vercel Blob the records already
 * carry public image URLs and this route isn't used. The pass may come via the
 * `x-admin-pass` header or a `pass` query param (an <img> tag can't set headers).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const pass = request.headers.get('x-admin-pass') ?? url.searchParams.get('pass');
  if (!(await isValidAdminPass(pass))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = url.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'missing-key' }, { status: 400 });

  const data = await readImageLocal(key);
  if (!data) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  return new NextResponse(new Uint8Array(data), {
    headers: { 'Content-Type': 'application/octet-stream', 'Cache-Control': 'private, no-store' },
  });
}
