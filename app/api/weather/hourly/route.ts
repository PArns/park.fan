import { NextRequest, NextResponse } from 'next/server';
import type { WeatherHourlyPoint, WeatherHourlyToday } from '@/lib/api/types';
import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';

/** On failures: a response without its own Cache-Control takes the shared window next.config.ts
 * gives this path. */
const NO_STORE = { 'Cache-Control': 'no-store, must-revalidate' };

/**
 * Today's hour-by-hour forecast for a park location, proxied from Open-Meteo because the backend
 * has only daily weather and a short nowcast. The proxy keeps visitor addresses first-party and
 * lets the caches collapse a park's visitors onto one upstream call.
 *
 * Query: `lat`, `lon` (rounded to two decimals for cache hits), `tz`, and the optional `date`, the
 * park-local day, which pins the upstream request so a stale serve never returns yesterday's hours.
 */

interface OpenMeteoHourlyResponse {
  timezone: string;
  hourly: {
    time: string[];
    temperature_2m: (number | null)[];
    precipitation: (number | null)[];
    precipitation_probability: (number | null)[];
    weather_code: (number | null)[];
    is_day: (number | null)[];
  };
}

const TZ_PATTERN = /^[A-Za-z0-9_+\-/]{1,64}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get('lat');
  const lonParam = searchParams.get('lon');
  const lat = latParam ? Number(latParam) : NaN;
  const lon = lonParam ? Number(lonParam) : NaN;
  const tz = searchParams.get('tz') ?? 'UTC';

  if (
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    !Number.isFinite(lon) ||
    lon < -180 ||
    lon > 180
  ) {
    return NextResponse.json({ error: 'Invalid lat/lon' }, { status: 400 });
  }
  if (!TZ_PATTERN.test(tz)) {
    return NextResponse.json({ error: 'Invalid tz' }, { status: 400 });
  }
  const date = searchParams.get('date');
  if (date !== null && !DATE_PATTERN.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  // Explicit day when the client sent one (date-stable cache keys, see above);
  // `forecast_days=1` as back-compat fallback for requests without it.
  const dayWindow = date ? `&start_date=${date}&end_date=${date}` : `&forecast_days=1`;

  const upstream =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}` +
    `&hourly=temperature_2m,precipitation,precipitation_probability,weather_code,is_day` +
    `${dayWindow}&timezone=${encodeURIComponent(tz)}`;

  try {
    // Open-Meteo refreshes its models roughly hourly; 15 min keeps the curve
    // fresh enough while one cached response serves every visitor of the park.
    const res = await fetch(upstream, { next: { revalidate: 900 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Upstream weather request failed' },
        { status: 502, headers: NO_STORE }
      );
    }

    const data = (await res.json()) as OpenMeteoHourlyResponse;
    const h = data.hourly;
    if (!h?.time?.length) {
      return NextResponse.json({ error: 'No hourly data' }, { status: 502, headers: NO_STORE });
    }

    const points: WeatherHourlyPoint[] = h.time.map((time, i) => ({
      time,
      temperatureC: h.temperature_2m?.[i] ?? null,
      precipitationMm: h.precipitation?.[i] ?? null,
      precipitationProbability: h.precipitation_probability?.[i] ?? null,
      weatherCode: h.weather_code?.[i] ?? null,
      isDay: (h.is_day?.[i] ?? 1) === 1,
    }));

    const body: WeatherHourlyToday = { timezone: data.timezone, points };

    return NextResponse.json(body, {
      headers: cdnCacheHeaders('public, s-maxage=900, stale-while-revalidate=900'),
    });
  } catch (error) {
    console.error('[Weather Hourly API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hourly weather' },
      { status: 500, headers: NO_STORE }
    );
  }
}
