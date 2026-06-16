/**
 * Dev-only location presets for the nearby / in-park simulation.
 *
 * Lets you preview the in-park homepage UI (headliner list, live wait times, seasonal handling)
 * without physically standing in a park. Instead of fabricating data, the simulation overrides the
 * request coordinates with a known park, so the real backend returns a genuine `in_park` response —
 * including the real `isHeadliner` / `isSeasonal` / `isCurrentlyInSeason` flags. Phantasialand, for
 * example, reliably reports headliners.
 *
 * The caller (`/api/nearby`) gates this behind `NODE_ENV !== 'production'`; the `sim` param is
 * ignored entirely in production.
 *
 * Usage: open the homepage with one of
 *   - `?sim=in_park`            → default park (Phantasialand)
 *   - `?sim=<presetName>`       → e.g. `?sim=efteling`, `?sim=europapark`
 *   - `?sim=<lat>,<lng>`        → arbitrary coordinates
 */

export interface SimLocation {
  latitude: number;
  longitude: number;
}

/**
 * Whether the `sim` param may be honored. Enabled on local dev and Vercel **preview** deployments,
 * disabled only on the real production deployment.
 *
 * On Vercel, `NODE_ENV` is `'production'` even for preview builds, so checking `NODE_ENV` alone
 * would (wrongly) disable simulation on previews. Vercel distinguishes the environments via
 * `VERCEL_ENV` (`'production' | 'preview' | 'development'`), so we key off that when present and
 * fall back to `NODE_ENV` for non-Vercel/local runs.
 */
export function isSimulationEnabled(): boolean {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV !== 'production';
  return process.env.NODE_ENV !== 'production';
}

/**
 * Coordinates that sit inside the park (not just nearby) so the backend classifies the request as
 * `in_park` and returns the rides/headliners list. Keys are normalized (no spaces/dashes).
 */
const SIM_PRESETS: Record<string, SimLocation> = {
  phantasialand: { latitude: 50.7991, longitude: 6.8782 },
  efteling: { latitude: 51.6498, longitude: 5.0489 },
  europapark: { latitude: 48.2682, longitude: 7.7216 },
  disneylandparis: { latitude: 48.8722, longitude: 2.7758 },
};

/** Park used for the generic `in_park` / `in` aliases — known to return headliners. */
const DEFAULT_PRESET = 'phantasialand';

/**
 * Resolve a `sim` query value to coordinates, or `null` when it doesn't match anything.
 * Accepts `in_park`/`in`/`1`/`true` (default park), a named preset, or a raw `lat,lng` pair.
 */
export function resolveSimLocation(raw: string | null | undefined): SimLocation | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (!value) return null;

  if (value === 'in_park' || value === 'in' || value === '1' || value === 'true') {
    return SIM_PRESETS[DEFAULT_PRESET];
  }

  const preset = SIM_PRESETS[value.replace(/[\s_-]/g, '')];
  if (preset) return preset;

  const match = value.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
  if (match) {
    const latitude = parseFloat(match[1]);
    const longitude = parseFloat(match[2]);
    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      return { latitude, longitude };
    }
  }

  return null;
}
