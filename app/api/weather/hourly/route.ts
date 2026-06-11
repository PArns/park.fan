import { NextRequest, NextResponse } from 'next/server';
import type { WeatherHourlyPoint, WeatherHourlyToday } from '@/lib/api/types';

/**
 * Today's hour-by-hour forecast for a park location, proxied from Open-Meteo.
 *
 * The park.fan backend only exposes daily weather plus a ~6 h nowcast (no hourly
 * temperatures), so the detailed day view fetches Open-Meteo — the backend's own
 * upstream source, already attributed in the weather card — directly. Proxying it
 * through this route keeps the request first-party (no visitor IPs to a third
 * party) and lets the Next data cache + CDN collapse all visitors of a park onto
 * one upstream call per cache window.
 *
 * Query params: lat, lon (coordinates), tz (IANA timezone for local hour labels).
 * Coordinates are rounded to 2 decimals (~1 km) — plenty for weather, and it
 * canonicalizes the upstream URL for better cache hits.
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

  const upstream =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}` +
    `&hourly=temperature_2m,precipitation,precipitation_probability,weather_code,is_day` +
    `&forecast_days=1&timezone=${encodeURIComponent(tz)}`;

  try {
    // Open-Meteo refreshes its models roughly hourly; 15 min keeps the curve
    // fresh enough while one cached response serves every visitor of the park.
    const res = await fetch(upstream, { next: { revalidate: 900 } });

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream weather request failed' }, { status: 502 });
    }

    const data = (await res.json()) as OpenMeteoHourlyResponse;
    const h = data.hourly;
    if (!h?.time?.length) {
      return NextResponse.json({ error: 'No hourly data' }, { status: 502 });
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
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=900',
      },
    });
  } catch (error) {
    console.error('[Weather Hourly API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch hourly weather' }, { status: 500 });
  }
}
