import 'server-only';
import { NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import { denyUnlessAdmin } from '@/lib/admin/session';
import { readImageLocal } from '@/lib/contribute/storage';
import { resolveDriver } from '@/lib/contribute/driver';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EXT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  heic: 'image/heic',
  heif: 'image/heif',
};

/**
 * GET /api/admin/contributions/file?key=contributions/<id>/<file>
 *
 * Streams a contribution image to the admin moderation UI. This is the ONLY way the
 * bytes are exposed: the Blob store is private, so we fetch the blob server-side with
 * `get(..., { access: 'private' })` and stream it back behind the admin session.
 * The local driver reads from `.uploads/` instead.
 *
 * An `<img>` tag cannot set an Authorization header, which used to mean the
 * credential had to travel in the query string — and therefore into the
 * browser's history, the referrer of anything the page linked to, and this
 * app's own access log. The httpOnly session cookie removes that problem
 * rather than working around it: the browser attaches it to the image request
 * by itself, and nothing readable ends up in the URL.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  // The same guard as the routes that list these submissions, and for the same
  // reason: `resolveAdminIdentity` answers "this token is a session", which is
  // one question short of "this account may look at this". It skipped the role
  // floor and the must-change-password refusal that every sibling applies.
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;

  const key = url.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'missing-key' }, { status: 400 });

  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  const fallbackType = EXT_TYPES[ext] ?? 'application/octet-stream';

  // When ?download=1, force a download with the original filename instead of
  // rendering inline — so moderators can save the full-res original.
  const download = url.searchParams.get('download') === '1';
  const downloadName = url.searchParams.get('name') ?? key.split('/').pop() ?? 'photo';

  const extraHeaders: Record<string, string> = { 'Cache-Control': 'private, no-store' };
  if (download) extraHeaders['Content-Disposition'] = contentDisposition(downloadName);

  if (resolveDriver() === 'vercel-blob') {
    try {
      const result = await get(key, { access: 'private' });
      if (!result || !result.stream) {
        return NextResponse.json({ error: 'not-found' }, { status: 404 });
      }
      return new NextResponse(result.stream, {
        headers: { 'Content-Type': result.blob.contentType ?? fallbackType, ...extraHeaders },
      });
    } catch (err) {
      console.error('[admin/contributions/file] blob get failed:', err);
      return NextResponse.json({ error: 'not-found' }, { status: 404 });
    }
  }

  const data = await readImageLocal(key);
  if (!data) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  return new NextResponse(new Uint8Array(data), {
    headers: { 'Content-Type': fallbackType, ...extraHeaders },
  });
}

/** Build a safe `Content-Disposition: attachment` header (ASCII fallback + UTF-8). */
function contentDisposition(name: string): string {
  const clean = name.replace(/[\r\n"]/g, '').slice(0, 120) || 'photo';
  const ascii = clean.replace(/[^\x20-\x7E]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(clean)}`;
}
