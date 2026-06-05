import { NextRequest, NextResponse } from 'next/server';
import { getIntegratedCalendar } from '@/lib/api/integrated-calendar';
import { getParkByGeoPath } from '@/lib/api/parks';
import { getParkWeatherNowcastFresh } from '@/lib/api/weather-nowcast';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const { path } = resolvedParams;

  // Handle park data: [continent, country, city, park] (4 segments)
  // e.g., ['europe', 'germany', 'rust', 'europa-park']
  if (path && path.length === 4) {
    const [continent, country, city, park] = path;

    try {
      const parkData = await getParkByGeoPath(continent, country, city, park);

      // No caching - we want fresh live data
      return NextResponse.json(parkData, {
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    } catch (error) {
      console.error('[Park API] Error:', error);

      if (error instanceof Error && error.message.includes('404')) {
        return NextResponse.json({ error: 'Park not found' }, { status: 404 });
      }

      return NextResponse.json({ error: 'Failed to fetch park data' }, { status: 500 });
    }
  }

  // Handle calendar data: [continent, country, city, park, 'calendar'] (5 segments)
  // e.g., ['europe', 'germany', 'bruehl', 'phantasialand', 'calendar']
  if (path && path.length === 5 && path[4] === 'calendar') {
    const [continent, country, city, park] = path;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Validate required parameters
    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required query parameters: from, to' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected: YYYY-MM-DD' },
        { status: 400 }
      );
    }

    try {
      const data = await getIntegratedCalendar(continent, country, city, park, {
        from,
        to,
        includeHourly: 'none', // No hourly data needed for calendar view
      });

      // Return with caching headers
      // Cache for 5 minutes (300 seconds) - calendar data changes frequently
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    } catch (error) {
      console.error('[Calendar API] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 });
    }
  }

  // Handle weather nowcast: [continent, country, city, park, 'weather', 'nowcast'] (6 segments)
  if (path && path.length === 6 && path[4] === 'weather' && path[5] === 'nowcast') {
    const [continent, country, city, park] = path;

    try {
      // Fresh fetch: this is the live poll path, so we don't compound our own caches on top
      // of the upstream CDN (that froze the banner / hid the update countdown). A small shared
      // CDN window keeps repeated polls off the backend without re-introducing stale data.
      const data = await getParkWeatherNowcastFresh(continent, country, city, park);

      if (!data) {
        return NextResponse.json({ error: 'Nowcast not available' }, { status: 404 });
      }

      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    } catch (error) {
      console.error('[Nowcast API] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch nowcast data' }, { status: 500 });
    }
  }

  // Invalid path format
  return NextResponse.json(
    {
      error:
        'Invalid path format. Expected: /api/parks/{continent}/{country}/{city}/{park}, /calendar, or /weather/nowcast',
    },
    { status: 400 }
  );
}

// No caching - we want fresh data on every request
