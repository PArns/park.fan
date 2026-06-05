import { NextRequest, NextResponse } from 'next/server';
import { getPopularParks } from '@/lib/api/parks';

export async function GET(request: NextRequest) {
  const limitParam = new URL(request.url).searchParams.get('limit');
  const parsed = limitParam ? Number.parseInt(limitParam, 10) : 20;
  const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 20;

  try {
    const data = await getPopularParks(limit);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  } catch (error) {
    console.error('[Popular Parks API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch popular parks' }, { status: 500 });
  }
}
