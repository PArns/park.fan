import 'server-only';
import { sessionProxyRoute } from '@/lib/admin/session-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** A visitor account's proxy to `/v1/account` and below; see `proxySessionRequest`. */
const route = sessionProxyRoute('account');
export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const PUT = route.PUT;
export const DELETE = route.DELETE;
