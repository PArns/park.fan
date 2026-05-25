import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.park.fan';

async function proxyRequest(request: NextRequest, path: string[]) {
  const incomingUrl = new URL(request.url);
  const apiUrl = new URL(`${API_BASE}/v1/admin/${path.join('/')}`);

  // Forward all query params (including ?pass=)
  incomingUrl.searchParams.forEach((value, key) => {
    apiUrl.searchParams.set(key, value);
  });

  const response = await fetch(apiUrl.toString(), {
    method: request.method,
    headers: { 'Content-Type': 'application/json' },
    body: request.method !== 'GET' ? await request.text() : undefined,
    cache: 'no-store',
  });

  const data = await response.json();
  return NextResponse.json(data, {
    status: response.status,
    headers: { 'Cache-Control': 'no-store, must-revalidate' },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}
