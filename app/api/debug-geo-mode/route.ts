import { NextRequest, NextResponse } from 'next/server';
import { decryptOverrides } from 'flags';
import type { DebugGeoMode } from '@/flags';

const FLAG_KEY = 'debug-geo-mode';
const VALID_MODES: DebugGeoMode[] = ['real', 'near', 'in'];

/**
 * GET /api/debug-geo-mode
 * Reads the debug-geo-mode flag from the vercel-flag-overrides cookie (set by Flags Explorer).
 * Called by the client so that flag overrides take effect even when the server render didn't receive the cookie.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.FLAGS_SECRET;
  if (!secret) {
    return NextResponse.json({ mode: 'real' as DebugGeoMode });
  }

  const cookie = request.cookies.get('vercel-flag-overrides')?.value;
  if (!cookie) {
    return NextResponse.json({ mode: 'real' as DebugGeoMode });
  }

  try {
    const overrides = await decryptOverrides(cookie, secret);
    const raw = overrides?.[FLAG_KEY];
    const mode =
      typeof raw === 'string' && VALID_MODES.includes(raw as DebugGeoMode)
        ? (raw as DebugGeoMode)
        : ('real' as DebugGeoMode);
    return NextResponse.json({ mode });
  } catch {
    return NextResponse.json({ mode: 'real' as DebugGeoMode });
  }
}
