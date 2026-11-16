import 'server-only';
import { sessionProxyRoute } from '@/lib/admin/session-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The admin UI's proxy to `/v1/admin/*`; see `proxySessionRequest`. */
const route = sessionProxyRoute('admin');
export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const PUT = route.PUT;
export const DELETE = route.DELETE;
