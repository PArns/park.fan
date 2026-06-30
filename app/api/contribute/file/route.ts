import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyTicket } from '@/lib/contribute/ticket';
import { putImage } from '@/lib/contribute/storage';
import { MAX_FILE_SIZE, isAcceptedMimeType } from '@/lib/contribute/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/contribute/file — proxy ONE photo to the (private) Blob store.
 *
 * The browser sends one file per request (multipart) so each request stays under
 * Vercel's ~4.5 MB serverless body limit; the server `put()`s it with the
 * server-only Blob token. Authorized by the signed ticket from /api/contribute/start
 * (Turnstile already verified there) — the store's write token is never exposed and
 * nothing is pushed to Blob from outside our server.
 */
export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'invalid-form' }, { status: 400 });
  }

  const ticket = await verifyTicket(String(form.get('ticket') ?? ''));
  if (!ticket) return NextResponse.json({ error: 'invalid-or-expired-ticket' }, { status: 403 });

  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'no-file' }, { status: 422 });
  if (!isAcceptedMimeType(file.type)) {
    return NextResponse.json({ error: 'bad-type', name: file.name }, { status: 415 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'too-large', name: file.name }, { status: 413 });
  }

  try {
    const stored = await putImage({
      submissionId: ticket.sid,
      originalName: file.name,
      contentType: file.type,
      data: Buffer.from(await file.arrayBuffer()),
    });
    return NextResponse.json({
      ok: true,
      blob: {
        url: stored.url,
        pathname: stored.key,
        originalName: stored.originalName,
        contentType: stored.contentType,
        size: stored.size,
      },
    });
  } catch (err) {
    console.error('[contribute] file upload failed:', err);
    return NextResponse.json(
      { error: 'storage-failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
