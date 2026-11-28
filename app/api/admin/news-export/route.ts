import 'server-only';
import { NextResponse } from 'next/server';

import { NO_STORE } from '@/lib/api/cdn-cache-headers';
import { buildNewsExportReport } from '@/lib/admin/news-export-report';
import { denyUnlessAdmin } from '@/lib/admin/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/news-export: the app's news and guides export on media.park.fan against this
 * deployment's posts, for „Export für die App“ on `/admin/system`. The API's MCP tools read the
 * same report from `/api/news-export/status`.
 */
export async function GET(request: Request) {
  const denied = await denyUnlessAdmin(request, 'viewer');
  if (denied) return denied;
  return NextResponse.json(await buildNewsExportReport(), { headers: NO_STORE });
}
