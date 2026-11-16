import 'server-only';
import { sessionProxyRoute } from '@/lib/admin/session-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The developer dashboard's proxy to `/v1/developer/*`; see `proxySessionRequest`. */
const route = sessionProxyRoute('developer');
export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const PUT = route.PUT;
export const DELETE = route.DELETE;
