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
    const fields = 'id,name,country,hierarchicalUrl';
    const resp = await fetch(
      `${API_BASE_URL}/parks?search=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`,
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
    console.error('Error searching parks:', err);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
