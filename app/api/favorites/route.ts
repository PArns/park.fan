import { NextRequest, NextResponse } from 'next/server';
import { enrichParksWithImages, enrichAttractionsWithImages } from '@/lib/utils/park-assets';
import { getForwardedForHeaders } from '@/lib/utils/request-ip';

/** Response depends on cookies and optionally IP; must not be cached. */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parkIds = searchParams.get('parkIds');
  const attractionIds = searchParams.get('attractionIds');
  const showIds = searchParams.get('showIds');
  const restaurantIds = searchParams.get('restaurantIds');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  try {
    // Build API URL
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan';
    const apiUrl = new URL(`${apiBase}/v1/favorites`);

    // Add query parameters if provided
    if (parkIds) {
      apiUrl.searchParams.set('parkIds', parkIds);
    }
    if (attractionIds) {
      apiUrl.searchParams.set('attractionIds', attractionIds);
    }
    if (showIds) {
      apiUrl.searchParams.set('showIds', showIds);
    }
    if (restaurantIds) {
      apiUrl.searchParams.set('restaurantIds', restaurantIds);
    }
    if (lat) {
      apiUrl.searchParams.set('lat', lat);
    }
    if (lng) {
      apiUrl.searchParams.set('lng', lng);
    }

    const favoritesCookie = request.cookies.get('favorites');
    const forwardedHeaders = getForwardedForHeaders(request);

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Content-Type': 'application/json',
        ...(favoritesCookie ? { Cookie: `${favoritesCookie.name}=${favoritesCookie.value}` } : {}),
        ...forwardedHeaders,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.parks && Array.isArray(data.parks)) {
      data.parks = enrichParksWithImages(data.parks);
    }

    if (data.attractions && Array.isArray(data.attractions)) {
      data.attractions = enrichAttractionsWithImages(data.attractions);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Favorites Proxy] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}
