/**
 * A small solar model, the fallback environment when the `environment` module is absent or
 * failed, and the base the module builds on. Pure maths; runs on every thread.
 *
 * Latitude 50° N (Rhineland — the park is European), day of year from `day` starting at
 * 1 April so a new park opens in spring. Sun colour follows a blackbody ramp 6500 K → 2600 K by
 * elevation; intensity uses a simple air-mass attenuation.
 */

import type { EnvironmentState, Season, Vec3, WeatherKind } from './types';

const LATITUDE = (50.0 * Math.PI) / 180;
const DAY_OF_YEAR_OFFSET = 91; // 1 April

export function seasonForDay(day: number): Season {
  const doy = ((day + DAY_OF_YEAR_OFFSET - 1) % 365) + 1;
  if (doy < 80 || doy >= 355) return 'winter';
  if (doy < 172) return 'spring';
  if (doy < 266) return 'summer';
  return 'autumn';
}

/** Sun elevation and azimuth (radians) for park-local minute and day. */
export function sunAngles(minute: number, day: number): { elevation: number; azimuth: number } {
  const doy = ((day + DAY_OF_YEAR_OFFSET - 1) % 365) + 1;
  const declination = ((-23.44 * Math.PI) / 180) * Math.cos(((2 * Math.PI) / 365) * (doy + 10));
  const hourAngle = ((minute / 60 - 12) * 15 * Math.PI) / 180;
  const sinEl =
    Math.sin(LATITUDE) * Math.sin(declination) +
    Math.cos(LATITUDE) * Math.cos(declination) * Math.cos(hourAngle);
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinEl)));
  const cosAz =
    (Math.sin(declination) - Math.sin(elevation) * Math.sin(LATITUDE)) /
    (Math.cos(elevation) * Math.cos(LATITUDE) || 1e-6);
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (hourAngle > 0) azimuth = 2 * Math.PI - azimuth;
  return { elevation, azimuth };
}

/** Approximate blackbody colour (linear RGB 0..1) for a temperature in kelvin. */
export function blackbody(kelvin: number): Vec3 {
  const t = kelvin / 100;
  let r: number;
  let g: number;
  let b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const clamp = (v: number) => Math.max(0, Math.min(255, v)) / 255;
  const srgb: Vec3 = [clamp(r), clamp(g), clamp(b)];
  return srgb.map((c) => Math.pow(c, 2.2)) as Vec3;
}

export interface EnvironmentInputs {
  minute: number;
  day: number;
  weather?: WeatherKind;
  cloud?: number;
  wetness?: number;
  temperatureC?: number;
  /** 0..1, how hard the weather is doing whatever it does. */
  intensity?: number;
  /** Metres per second. */
  windMs?: number;
}

export function computeEnvironment(input: EnvironmentInputs): EnvironmentState {
  const { minute, day } = input;
  const weather = input.weather ?? 'clear';
  const cloud = input.cloud ?? defaultCloud(weather);
  const { elevation, azimuth } = sunAngles(minute, day);
  // Direction FROM the sun towards the world: at elevation e and azimuth a (0 = north, clockwise),
  // the sun sits at (sin a cos e, sin e, -cos a cos e) in a right-handed +Y-up frame where -Z is north.
  const toSun: Vec3 = [
    Math.sin(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    -Math.cos(azimuth) * Math.cos(elevation),
  ];
  const sunDirection: Vec3 = [-toSun[0], -toSun[1], -toSun[2]];
  const el01 = Math.max(0, Math.sin(elevation));
  const kelvin = 2600 + (6500 - 2600) * Math.pow(el01, 0.45);
  const sunColor = blackbody(kelvin);
  const airMass =
    el01 > 0.01 ? 1 / (el01 + 0.15 * Math.pow(93.885 - (elevation * 180) / Math.PI, -1.253)) : 40;
  const attenuation = Math.exp(-0.12 * Math.min(airMass, 40));
  const twilight = smoothstep(-0.12, 0.02, Math.sin(elevation));
  const sunIntensity = 3.2 * attenuation * twilight * (1 - 0.85 * cloud);
  const night = 1 - smoothstep(-0.2, 0.08, Math.sin(elevation));
  const skyDay: Vec3 = [0.42, 0.62, 0.95];
  const skyDusk: Vec3 = [0.75, 0.42, 0.32];
  const skyNight: Vec3 = [0.03, 0.045, 0.09];
  const duskMix = 1 - smoothstep(0.05, 0.35, Math.sin(elevation));
  const skyTw = mix(skyDay, skyDusk, duskMix);
  const skyColor = mix(skyTw, skyNight, night).map(
    (c, i) => c * (1 - 0.5 * cloud) + cloud * 0.5 * [0.55, 0.58, 0.62][i]
  ) as Vec3;
  const ambientIntensity = 0.12 + 0.55 * (1 - night) * (1 - 0.3 * cloud);
  const season = seasonForDay(day);
  const baseTemp = { spring: 14, summer: 24, autumn: 12, winter: 3 }[season];
  const diurnal = -4 * Math.cos(((minute / 60 - 15) / 24) * 2 * Math.PI);
  const temperatureC = input.temperatureC ?? Math.round((baseTemp + diurnal - 3 * cloud) * 10) / 10;
  return {
    minute,
    day,
    season,
    weather,
    wetness: input.wetness ?? (weather === 'rain' ? 0.8 : weather === 'storm' ? 1 : 0),
    cloud,
    temperatureC,
    sunDirection,
    sunElevation: elevation,
    sunColor,
    sunIntensity,
    skyColor,
    ambientIntensity,
    night,
    intensity: input.intensity ?? defaultIntensity(weather),
    windMs: input.windMs ?? defaultWind(weather),
    /**
     * Snow is rain below about 1.5 °C.
     *
     * Not a sixth `WeatherKind`, on the environment module's own argument: the difference is a
     * temperature, and it behaves the same way for a guest either way — the decision to go home is
     * about getting wet, not about the crystal. Storm counts as rain because a storm that dropped
     * nothing would be a light show.
     */
    precipitation:
      weather === 'rain' || weather === 'storm' ? (temperatureC <= 1.5 ? 'snow' : 'rain') : 'none',
  };
}

/** A default for a caller that has no weather chain of its own — the fallback `environment()`. */
function defaultIntensity(weather: WeatherKind): number {
  switch (weather) {
    case 'storm':
      return 0.9;
    case 'rain':
      return 0.5;
    case 'overcast':
      return 0.3;
    case 'cloudy':
      return 0.15;
    default:
      return 0;
  }
}

function defaultWind(weather: WeatherKind): number {
  switch (weather) {
    case 'storm':
      return 16;
    case 'rain':
      return 6;
    case 'overcast':
      return 4;
    case 'cloudy':
      return 3;
    default:
      return 2;
  }
}

function defaultCloud(weather: WeatherKind): number {
  switch (weather) {
    case 'clear':
      return 0.08;
    case 'cloudy':
      return 0.4;
    case 'overcast':
      return 0.85;
    case 'rain':
      return 0.9;
    case 'storm':
      return 1;
  }
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function mix(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
