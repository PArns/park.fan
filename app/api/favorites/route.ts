import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import { favoritesForCards } from '@/lib/api/favorites';
import { getCardImageMap } from '@/lib/utils/park-assets';
import { getForwardedForHeaders } from '@/lib/utils/request-ip';

// The answer depends on cookies and optionally the IP, so it is never cached. With
// NEXT_PUBLIC_API_DIRECT on, the browser asks the API itself (`getFavorites`).

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parkIds = searchParams.get('parkIds');
  const attractionIds = searchParams.get('attractionIds');
  const showIds = searchParams.get('showIds');
  const restaurantIds = searchParams.get('restaurantIds');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  try {
    const apiUrl = new URL(`${getApiBaseUrl()}/v1/favorites`);

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
        ...getServerApiHeaders(),
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    return NextResponse.json(favoritesForCards(getCardImageMap(), await response.json()));
  } catch (error) {
    console.error('[Favorites Proxy] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}
