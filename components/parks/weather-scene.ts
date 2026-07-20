/**
 * weather-scene.ts
 * ----------------
 * Maps Open-Meteo WMO weather codes onto a small set of renderable
 * scenes used by <WeatherBackground />. Kept separate from
 * `lib/utils/weather-utils.ts` (which maps WMO codes to icons / labels)
 * because the animated background needs a coarser grouping.
 *
 * Reference: https://open-meteo.com/en/docs
 */

/** High-level scene that determines which animated background is shown. */
export type WeatherScene =
  'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'thunderstorm';

/** Particle system to run on the canvas, or `null` for no precipitation. */
export type Precipitation = 'rain' | 'snow' | null;

export interface SceneDescriptor {
  scene: WeatherScene;
  /** Relative intensity (0..1). Scales particle count and fall speed. */
  intensity: number;
  precipitation: Precipitation;
}

/**
 * Resolves a raw Open-Meteo `weather_code` into a SceneDescriptor.
 * Unknown / unmapped codes fall back to an overcast scene.
 */
export function weatherCodeToScene(code: number): SceneDescriptor {
  // 0, 1 - Clear sky / mainly clear
  if (code === 0 || code === 1) {
    return { scene: 'clear', intensity: 0, precipitation: null };
  }

  // 2 - Partly cloudy
  if (code === 2) {
    return { scene: 'partly-cloudy', intensity: 0, precipitation: null };
  }

  // 3 - Overcast
  if (code === 3) {
    return { scene: 'cloudy', intensity: 0, precipitation: null };
  }

  // 45, 48 - Fog and depositing rime fog
  if (code === 45 || code === 48) {
    return { scene: 'fog', intensity: 0.6, precipitation: null };
  }

  // 51-57 - Drizzle and freezing drizzle, rendered as light rain
  if (code >= 51 && code <= 57) {
    return { scene: 'rain', intensity: 0.35, precipitation: 'rain' };
  }

  // 61-67 - Rain and freezing rain, 80-82 - rain showers
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    const isHeavy = code === 65 || code === 82;
    return { scene: 'rain', intensity: isHeavy ? 1 : 0.7, precipitation: 'rain' };
  }

  // 71-77 - Snowfall and snow grains, 85-86 - snow showers
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    const isHeavy = code === 75 || code === 86;
    return { scene: 'snow', intensity: isHeavy ? 1 : 0.65, precipitation: 'snow' };
  }

  // 95, 96, 99 - Thunderstorm, with or without hail
  if (code >= 95) {
    return { scene: 'thunderstorm', intensity: 1, precipitation: 'rain' };
  }

  return { scene: 'cloudy', intensity: 0, precipitation: null };
}
