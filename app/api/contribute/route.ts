import 'server-only';
import { randomUUID } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyTurnstile } from '@/lib/contribute/turnstile';
import { putImage } from '@/lib/contribute/storage';
import { recordSubmission } from '@/lib/contribute/submissions';
import {
  contributionMetaSchema,
  type StoredImageRecord,
  type SubmissionRecord,
} from '@/lib/contribute/types';
import { MAX_FILE_SIZE, MAX_FILES, isAcceptedMimeType } from '@/lib/contribute/config';
import { getForwardedForHeaders } from '@/lib/utils/request-ip';

// Uploads are user-specific writes; never cache or statically optimize this route.
export const dynamic = 'force-dynamic';
// Buffering files needs the Node.js runtime (not Edge).
export const runtime = 'nodejs';

/**
 * POST /api/contribute — accept a set of user photos assigned to a park/attraction.
 *
 * Flow: verify Turnstile (bot protection) → validate the assignment metadata (zod)
 * → validate each file (type + size + count) → store the bytes (storage adapter)
 * → append a `pending` record to the moderation queue.
 *
 * Prototype note: files are sent as multipart through this route. That's the
 * simplest end-to-end flow for local dev, but Vercel caps request bodies at
 * ~4.5 MB — for production high-res uploads switch to direct-to-storage uploads
 * (see lib/contribute/storage.ts). The validation + queue logic here stays the same.
 */
export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'invalid-form' }, { status: 400 });
  }

  // 1) Bot protection — verify the Turnstile token before doing any real work.
  const token = String(form.get('turnstileToken') ?? '');
  const clientIp = getForwardedForHeaders(request)['X-Forwarded-For'];
  const turnstile = await verifyTurnstile(token, clientIp);
  if (!turnstile.success) {
    return NextResponse.json(
      { error: 'turnstile-failed', reason: turnstile.reason },
      { status: 403 }
    );
  }

  // 2) Validate the assignment + consent metadata.
  let meta;
  try {
    meta = contributionMetaSchema.parse(JSON.parse(String(form.get('meta') ?? '{}')));
  } catch {
    return NextResponse.json({ error: 'invalid-meta' }, { status: 422 });
  }

  // 3) Collect and validate files.
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: 'no-files' }, { status: 422 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: 'too-many-files', max: MAX_FILES }, { status: 422 });
  }
  for (const file of files) {
    if (!isAcceptedMimeType(file.type)) {
      return NextResponse.json({ error: 'bad-type', name: file.name }, { status: 415 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'too-large', name: file.name, max: MAX_FILE_SIZE },
        { status: 413 }
      );
    }
  }

  // 4) Store each image via the configured driver.
  const submissionId = randomUUID();
  const images: StoredImageRecord[] = [];
  try {
    for (const file of files) {
      const data = Buffer.from(await file.arrayBuffer());
      images.push(
        await putImage({
          submissionId,
          originalName: file.name,
          contentType: file.type,
          data,
        })
      );
    }
  } catch (err) {
    console.error('[contribute] storage failed:', err);
    return NextResponse.json({ error: 'storage-failed' }, { status: 500 });
  }

  // 5) Append to the moderation queue as `pending`.
  const record: SubmissionRecord = {
    id: submissionId,
    createdAt: new Date().toISOString(),
    status: 'pending',
    entity: meta.entity,
    caption: meta.caption,
    credit: meta.credit,
    images,
    ip: clientIp,
    userAgent: request.headers.get('user-agent') ?? undefined,
  };
  try {
    await recordSubmission(record);
  } catch (err) {
    console.error('[contribute] failed to record submission:', err);
    return NextResponse.json({ error: 'record-failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: submissionId, count: images.length });
}
