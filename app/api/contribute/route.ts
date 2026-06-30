import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyTicket } from '@/lib/contribute/ticket';
import { putImageLocal } from '@/lib/contribute/storage';
import { recordSubmission } from '@/lib/contribute/submissions';
import { MAX_FILE_SIZE, isAcceptedMimeType } from '@/lib/contribute/config';
import type { StoredImageRecord, SubmissionRecord } from '@/lib/contribute/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/contribute — SERVER-UPLOAD FALLBACK (offline dev only, no Blob token).
 *
 * Files are streamed through this route to the local filesystem. Vercel caps
 * request bodies at ~4.5 MB, so production uses the direct-to-Blob client upload
 * instead (start → upload → finalize). Trust comes from the signed ticket issued by
 * /api/contribute/start (Turnstile already verified there).
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

  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: 'no-files' }, { status: 422 });
  if (files.length > ticket.maxFiles) {
    return NextResponse.json({ error: 'too-many-files', max: ticket.maxFiles }, { status: 422 });
  }
  for (const file of files) {
    if (!isAcceptedMimeType(file.type)) {
      return NextResponse.json({ error: 'bad-type', name: file.name }, { status: 415 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'too-large', name: file.name }, { status: 413 });
    }
  }

  const images: StoredImageRecord[] = [];
  try {
    for (const file of files) {
      images.push(
        await putImageLocal({
          submissionId: ticket.sid,
          originalName: file.name,
          contentType: file.type,
          data: Buffer.from(await file.arrayBuffer()),
        })
      );
    }
  } catch (err) {
    console.error('[contribute] local storage failed:', err);
    return NextResponse.json({ error: 'storage-failed' }, { status: 500 });
  }

  const record: SubmissionRecord = {
    id: ticket.sid,
    createdAt: new Date().toISOString(),
    status: 'pending',
    entity: ticket.entity,
    caption: ticket.caption,
    credit: ticket.credit,
    images,
    userAgent: request.headers.get('user-agent') ?? undefined,
  };
  try {
    await recordSubmission(record);
  } catch (err) {
    console.error('[contribute] failed to record submission:', err);
    return NextResponse.json({ error: 'record-failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: record.id, count: images.length });
}
