import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Don't cache this API route

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '500';

  // Validate parameters
  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing required parameters: lat, lng' }, { status: 400 });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const radiusNum = parseInt(radius);

  if (
    isNaN(latitude) ||
    isNaN(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json({ error: 'Invalid latitude or longitude' }, { status: 400 });
  }

  if (isNaN(radiusNum) || radiusNum < 0 || radiusNum > 10000) {
    return NextResponse.json(
      { error: 'Invalid radius (must be between 0 and 10000 meters)' },
      { status: 400 }
    );
  }

  try {
    // Call backend API server-side (no CORS issues)
    const apiUrl = new URL('https://api.park.fan/v1/discovery/nearby');
    apiUrl.searchParams.set('lat', lat);
    apiUrl.searchParams.set('lng', lng);
    apiUrl.searchParams.set('radius', radius);

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Don't cache location-based data
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Nearby Proxy] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch nearby parks' }, { status: 500 });
  }
}
