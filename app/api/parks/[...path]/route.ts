import { NextRequest, NextResponse } from 'next/server';
import { getIntegratedCalendar } from '@/lib/api/integrated-calendar';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const { path } = resolvedParams;

  // Expected path format: [continent, country, city, park, 'calendar']
  // e.g., ['europe', 'germany', 'bruehl', 'phantasialand', 'calendar']
  if (!path || path.length !== 5 || path[4] !== 'calendar') {
    return NextResponse.json(
      {
        error:
          'Invalid path format. Expected: /api/parks/{continent}/{country}/{city}/{park}/calendar',
      },
      { status: 400 }
    );
  }

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
