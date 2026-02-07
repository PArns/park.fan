import { NextRequest, NextResponse } from 'next/server';
import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { getForwardedForHeaders, isLocalOrUnusableIp } from '@/lib/utils/request-ip';

/** Default radius in meters (backend default: 1000). */
const DEFAULT_RADIUS = 1000;
/** Max radius in meters. */
const MAX_RADIUS = 50000;
/** Max limit for nearby_parks (backend default when omitted: 6). */
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') ?? String(DEFAULT_RADIUS);
  const limit = searchParams.get('limit');
  const ipDebug = searchParams.get('ip'); // Debug: force GeoIP for this IP

  const hasCoords = lat != null && lat !== '' && lng != null && lng !== '';

  if (hasCoords) {
    const latitude = parseFloat(lat!);
    const longitude = parseFloat(lng!);
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
  }

  const radiusNum = parseInt(radius, 10);
  if (isNaN(radiusNum) || radiusNum < 0 || radiusNum > MAX_RADIUS) {
    return NextResponse.json(
      { error: `Invalid radius (must be between 0 and ${MAX_RADIUS} meters)` },
      { status: 400 }
    );
  }

  if (limit != null && limit !== '') {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > MAX_LIMIT) {
      return NextResponse.json(
        { error: `Invalid limit (must be between 1 and ${MAX_LIMIT})` },
        { status: 400 }
      );
    }
  }

  try {
    const apiUrl = new URL('https://api.park.fan/v1/discovery/nearby');
    if (hasCoords) {
      apiUrl.searchParams.set('lat', lat!);
      apiUrl.searchParams.set('lng', lng!);
    }
    apiUrl.searchParams.set('radius', String(radiusNum));
    if (limit != null && limit !== '') apiUrl.searchParams.set('limit', limit);
    if (ipDebug != null && ipDebug !== '') apiUrl.searchParams.set('ip', ipDebug);

    // Frontend always calls this route (/api/nearby), never api.park.fan directly → we are the proxy.
    const forwardedHeaders = getForwardedForHeaders(request);
    const clientIp = forwardedHeaders['X-Forwarded-For'] ?? '';

    const useIpFallback = !hasCoords && !(ipDebug != null && ipDebug !== '');
    if (useIpFallback && isLocalOrUnusableIp(clientIp)) {
      return NextResponse.json(
        {
          error:
            'Location required. Provide lat and lng, or ensure your request is forwarded with a public client IP (X-Forwarded-For).',
        },
        { status: 400 }
      );
    }

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Content-Type': 'application/json',
        ...forwardedHeaders,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message =
        typeof body?.message === 'string' ? body.message : (body?.error ?? response.statusText);
      return NextResponse.json(
        { error: message || `API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.type === 'nearby_parks' && data.data?.parks) {
      data.data.parks = data.data.parks.map((park: { slug: string }) => ({
        ...park,
        backgroundImage: getParkBackgroundImage(park.slug),
      }));
    } else if (data.type === 'in_park' && data.data?.park) {
      data.data.park = {
        ...data.data.park,
        backgroundImage: getParkBackgroundImage(data.data.park.slug),
      };
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Nearby Proxy] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch nearby parks' }, { status: 500 });
  }
}
