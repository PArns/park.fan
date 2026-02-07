/**
 * Debug geolocation presets (used with Vercel Toolbar Flags Explorer).
 * Mode is set via the "debug-geo-mode" flag in the toolbar; when "near" or "in",
 * the app uses these coordinates instead of browser/IP geolocation.
 */

export type DebugGeoMode = 'real' | 'near' | 'in';

/** Phantasialand, Brühl – center of park (for "in" mode). */
const PHANTASIALAND_CENTER = { lat: 50.7989, lng: 6.8791 };

/** ~2 km north of Phantasialand – should trigger nearby_parks, not in_park. */
const PHANTASIALAND_NEAR = { lat: 50.817, lng: 6.879 };

export const DEBUG_GEO_PRESETS: Record<
  Exclude<DebugGeoMode, 'real'>,
  { lat: number; lng: number }
> = {
  in: PHANTASIALAND_CENTER,
  near: PHANTASIALAND_NEAR,
};

export function getDebugPositionForMode(mode: DebugGeoMode): { lat: number; lng: number } | null {
  if (mode === 'real') return null;
  return DEBUG_GEO_PRESETS[mode] ?? null;
}
