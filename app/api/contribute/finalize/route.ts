import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyTicket } from '@/lib/contribute/ticket';
import { recordSubmission } from '@/lib/contribute/submissions';
import { isAcceptedMimeType } from '@/lib/contribute/config';
import {
  uploadedBlobSchema,
  type StoredImageRecord,
  type SubmissionRecord,
} from '@/lib/contribute/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const finalizeSchema = z.object({
  ticket: z.string().min(1),
  blobs: z.array(uploadedBlobSchema).min(1),
});

/**
 * POST /api/contribute/finalize — records the moderation-queue entry AFTER the
 * browser has uploaded every photo directly to Blob.
 *
 * Trust comes from the signed ticket (assignment + file budget), not the request
 * body: we re-derive entity/caption/credit from the ticket and accept a blob only
 * if it lives under this submission's folder and has an allowed content type.
 */
export async function POST(request: NextRequest) {
  let parsed;
  try {
    parsed = finalizeSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid-form' }, { status: 400 });
  }

  const ticket = await verifyTicket(parsed.ticket);
  if (!ticket) return NextResponse.json({ error: 'invalid-or-expired-ticket' }, { status: 403 });

  if (parsed.blobs.length > ticket.maxFiles) {
    return NextResponse.json({ error: 'too-many-files', max: ticket.maxFiles }, { status: 422 });
  }

  const prefix = `contributions/${ticket.sid}/`;
  const images: StoredImageRecord[] = [];
  for (const b of parsed.blobs) {
    if (!b.pathname.startsWith(prefix)) {
      return NextResponse.json({ error: 'pathname-outside-submission' }, { status: 422 });
    }
    if (!isAcceptedMimeType(b.contentType)) {
      return NextResponse.json({ error: 'bad-type', name: b.originalName }, { status: 415 });
    }
    images.push({
      key: b.pathname,
      url: b.url,
      originalName: b.originalName,
      contentType: b.contentType,
      size: b.size,
    });
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
    console.error('[contribute] finalize failed to record:', err);
    return NextResponse.json({ error: 'record-failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: record.id, count: images.length });
}
