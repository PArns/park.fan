import { NextResponse } from 'next/server';
import type { SearchResult } from '@/lib/api/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 3) {
    return NextResponse.json({ results: [], counts: {}, query: '' });
  }

  try {
    const response = await fetch(`https://api.park.fan/v1/search?q=${encodeURIComponent(query)}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = (await response.json()) as SearchResult;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', results: [], counts: {}, query },
      { status: 500 }
    );
  }
}
