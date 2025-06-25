import { NextResponse } from 'next/server';
import { API_BASE_URL, API_HEADERS } from '@/lib/config';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('search') ?? '';
  const limit = searchParams.get('limit') ?? '5';

  if (!query) {
    return NextResponse.json({ data: [] });
  }

  try {
    const resp = await fetch(
      `${API_BASE_URL}/rides?search=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: API_HEADERS,
      }
    );

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error searching rides:', err);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
