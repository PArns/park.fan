import { NextResponse } from 'next/server';

import { NO_STORE } from '@/lib/api/cdn-cache-headers';
import { startNewsExport } from '@/lib/admin/news-export-run';
import { bearerUnauthorized } from '@/lib/security/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/news-export/run: starts the export workflow for the API's MCP tools, as „Export neu
 * starten“ does in the admin, with the same answers: `{ started: true, workflowUrl }`, or
 * `{ started: false, reason }` with 503 (no GitHub token here) or 502 (GitHub refused).
 *
 *   curl -X POST https://park.fan/api/news-export/run -H "Authorization: Bearer $REVALIDATE_SECRET"
 *
 * Gated like `/api/revalidate`: 503 until REVALIDATE_SECRET is configured, 401 for any other
 * bearer.
 */
export async function POST(request: Request) {
  const denied = bearerUnauthorized(request, 'REVALIDATE_SECRET');
  if (denied) return denied;
  const { status, answer } = await startNewsExport();
  return NextResponse.json(answer, { status, headers: NO_STORE });
}
