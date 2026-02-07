import { NextRequest, NextResponse } from 'next/server';
import { getParkBackgroundImage, getAttractionBackgroundImage } from '@/lib/utils/park-assets';
import { getForwardedForHeaders } from '@/lib/utils/request-ip';

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
    const apiUrl = new URL('https://api.park.fan/v1/favorites');

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

    const cookieHeader = request.headers.get('cookie');
    const forwardedHeaders = getForwardedForHeaders(request);

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
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

    // Enrich parks with background images (like nearby route)
    if (data.parks && Array.isArray(data.parks)) {
      data.parks = data.parks.map((park: { slug: string }) => ({
        ...park,
        backgroundImage: getParkBackgroundImage(park.slug),
      }));
    }

    // Enrich attractions with background images (fallback to park background if no attraction image)
    if (data.attractions && Array.isArray(data.attractions)) {
      data.attractions = data.attractions.map(
        (attraction: { slug: string; park?: { slug: string } }) => {
          const attractionImage = attraction.park?.slug
            ? getAttractionBackgroundImage(attraction.park.slug, attraction.slug)
            : null;
          // Fallback to park background if no attraction image
          const parkImage = attraction.park?.slug
            ? getParkBackgroundImage(attraction.park.slug)
            : null;
          return {
            ...attraction,
            backgroundImage: attractionImage || parkImage,
          };
        }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Favorites Proxy] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}
