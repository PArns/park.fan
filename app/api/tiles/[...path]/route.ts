import { NextRequest, NextResponse } from 'next/server';
import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';

/**
 * Proxies CARTO basemap raster tiles through our own `/api/*` origin so
 * Cloudflare's existing cache rule ("use cache-control header if present")
 * holds them at the edge, instead of every visitor's browser hitting CARTO
 * (or, before that, OpenStreetMap's own tile server) directly. See
 * docs/rules/map-tiles-are-carto-not-osms-own-tile-server.md.
 *
 * `CARTO_MAP_KEY` is server-only on purpose: proxied, the browser never sees it.
 *
 * Repeated in next.config.ts's `/api/tiles/:path*` rule with the same value —
 * that rule OVERRIDES a route handler's Cache-Control on Vercel/production is
 * the one exception; `next dev` resolves it the other way. Keep both in step,
 * same as every other cacheable /api route in that file.
 */

const ALLOWED_STYLES = new Set(['rastertiles/voyager', 'dark_all']);
const MAX_ZOOM = 23;

const TILE_CACHE = 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000';

interface Tile {
  style: string;
  z: string;
  x: string;
  y: string;
}

/** Validates every segment against a closed set / digit pattern before it reaches the upstream URL. */
function parseTilePath(path: string[]): Tile | null {
  if (path.length < 4) return null;
  const [z, x, yFile] = path.slice(-3);
  const style = path.slice(0, -3).join('/');
  if (!ALLOWED_STYLES.has(style)) return null;
  if (!/^\d{1,2}$/.test(z) || Number(z) > MAX_ZOOM) return null;
  if (!/^\d{1,10}$/.test(x)) return null;
  const yMatch = /^(\d{1,10})\.png$/.exec(yFile);
  if (!yMatch) return null;
  return { style, z, x, y: yMatch[1] };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const tile = parseTilePath((await params).path);
  if (!tile) {
    return NextResponse.json({ error: 'Invalid tile path' }, { status: 400 });
  }

  const key = process.env.CARTO_MAP_KEY;
  const upstreamUrl = `https://basemaps.cartocdn.com/${tile.style}/${tile.z}/${tile.x}/${tile.y}.png${key ? `?key=${key}` : ''}`;

  try {
    const upstream = await fetch(upstreamUrl);

    if (!upstream.ok || !upstream.body) {
      // CARTO's own answer for this tile (e.g. out of range at this zoom) — not
      // cached here, so it isn't pinned as a permanent fact about a coordinate
      // a future style update might fill in.
      return new NextResponse(null, { status: upstream.status });
    }

    return new NextResponse(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'image/png',
        ...cdnCacheHeaders(TILE_CACHE),
      },
    });
  } catch (error) {
    console.error('[Tiles API] Error:', error);
    return new NextResponse(null, { status: 502 });
  }
}
