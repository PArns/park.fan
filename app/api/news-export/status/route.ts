import { NextResponse } from 'next/server';

import { NO_STORE } from '@/lib/api/cdn-cache-headers';
import { buildNewsExportReport } from '@/lib/admin/news-export-report';
import { bearerUnauthorized } from '@/lib/security/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/news-export/status: the report `/api/admin/news-export` answers the admin
 * (`NewsExportReport`), for the API's MCP tools, which hold no admin session.
 *
 *   curl https://park.fan/api/news-export/status -H "Authorization: Bearer $REVALIDATE_SECRET"
 *
 * The API already sends this secret to `/api/revalidate`, so it opens this route the same way: 503
 * until REVALIDATE_SECRET is configured, 401 for any other bearer.
 */
export async function GET(request: Request) {
  const denied = bearerUnauthorized(request, 'REVALIDATE_SECRET');
  if (denied) return denied;
  return NextResponse.json(await buildNewsExportReport(), { headers: NO_STORE });
}
