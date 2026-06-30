import 'server-only';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyTicket } from '@/lib/contribute/ticket';
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/contribute/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/contribute/upload — authorizes a single direct-to-Blob upload.
 *
 * The browser's `upload()` (from @vercel/blob/client) calls this to get a one-time
 * client token. We authorize based on the signed ticket carried in `clientPayload`
 * (issued by /api/contribute/start after Turnstile) — NOT another Turnstile solve —
 * and we pin every file under the ticket's `contributions/<sid>/` folder so a client
 * can't write elsewhere. Recording metadata happens later in /api/contribute/finalize.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const ticket = await verifyTicket(clientPayload);
        if (!ticket) throw new Error('invalid-or-expired-ticket');
        if (!pathname.startsWith(`contributions/${ticket.sid}/`)) {
          throw new Error('pathname-outside-submission');
        }
        return {
          allowedContentTypes: [...ACCEPTED_MIME_TYPES],
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: true,
          tokenPayload: clientPayload,
        };
      },
      // Per-file completion callback. We intentionally record the whole set in
      // /finalize instead (this callback also can't reach localhost in dev).
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'upload-auth-failed' },
      { status: 400 }
    );
  }
}
