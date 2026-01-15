import { NextResponse } from 'next/server';
import { search } from '@/lib/api/search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 3) {
    return NextResponse.json({ results: [], counts: {}, query: '' });
  }

  try {
    const data = await search(query);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', results: [], counts: {}, query },
      { status: 500 }
    );
  }
}
