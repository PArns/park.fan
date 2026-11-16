import 'server-only';
import type { NextRequest } from 'next/server';
import { proxySessionRequest } from '@/lib/admin/session-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The developer dashboard's proxy to `/v1/developer/*`; see `proxySessionRequest`. */
type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: Context) {
  return proxySessionRequest(request, (await params).path, 'developer');
}

export async function POST(request: NextRequest, { params }: Context) {
  return proxySessionRequest(request, (await params).path, 'developer');
}

export async function PATCH(request: NextRequest, { params }: Context) {
  return proxySessionRequest(request, (await params).path, 'developer');
}

export async function PUT(request: NextRequest, { params }: Context) {
  return proxySessionRequest(request, (await params).path, 'developer');
}

export async function DELETE(request: NextRequest, { params }: Context) {
  return proxySessionRequest(request, (await params).path, 'developer');
}
