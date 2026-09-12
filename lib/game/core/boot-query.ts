/**
 * The URL query `/game` understands. Every key is optional; the harness relies on all of them.
 *
 *   ?showcase=<module>   stage one module's showcase scene instead of a park
 *   ?seed=<n|text>       world seed (default 1)
 *   ?quality=low|medium|high|ultra
 *   ?tod=<HH:MM|minutes> park time of day at boot
 *   ?cam=<preset>        camera preset name (overview, entrance, coaster, pool, night, close)
 *   ?park=demo|empty     which world factory (default demo)
 *   ?speed=0|1|2|3|5     initial speed (default 1; the harness uses 0 for stable screenshots)
 *   ?weather=clear|cloudy|overcast|rain|storm
 *   ?harness=1           expose metrics on window.__parkfan_game and disable the intro
 *   ?engine=webgl2       skip the WebGPU probe (headless Chromium logs a warning for it)
 */

import { seedFromString } from './rng';
import type { QualityPreset, Speed, WeatherKind } from './types';

export interface BootQuery {
  showcase: string | null;
  seed: number;
  quality: QualityPreset | null;
  minute: number | null;
  camera: string | null;
  park: 'demo' | 'empty' | 'sandbox';
  speed: Speed;
  weather: WeatherKind | null;
  harness: boolean;
  engine: 'webgpu' | 'webgl2' | null;
  raw: URLSearchParams;
}

const PRESETS: QualityPreset[] = ['low', 'medium', 'high', 'ultra'];
const WEATHER: WeatherKind[] = ['clear', 'cloudy', 'overcast', 'rain', 'storm'];

export function parseBootQuery(search: string): BootQuery {
  const q = new URLSearchParams(search);
  const quality = q.get('quality');
  const speedRaw = Number(q.get('speed') ?? '1');
  const speed = ([0, 1, 2, 3, 5, 100] as Speed[]).includes(speedRaw as Speed)
    ? (speedRaw as Speed)
    : 1;
  const park = q.get('park');
  const weather = q.get('weather');
  return {
    showcase: q.get('showcase'),
    seed: seedFromString(q.get('seed') ?? '1'),
    quality:
      quality && PRESETS.includes(quality as QualityPreset) ? (quality as QualityPreset) : null,
    minute: parseTimeOfDay(q.get('tod')),
    camera: q.get('cam'),
    park: park === 'empty' || park === 'sandbox' ? park : 'demo',
    speed,
    weather: weather && WEATHER.includes(weather as WeatherKind) ? (weather as WeatherKind) : null,
    harness: q.get('harness') === '1',
    engine:
      q.get('engine') === 'webgl2' ? 'webgl2' : q.get('engine') === 'webgpu' ? 'webgpu' : null,
    raw: q,
  };
}

export function parseTimeOfDay(text: string | null): number | null {
  if (!text) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (m) return (Number(m[1]) % 24) * 60 + (Number(m[2]) % 60);
  const n = Number(text);
  return Number.isFinite(n) ? ((n % 1440) + 1440) % 1440 : null;
}
