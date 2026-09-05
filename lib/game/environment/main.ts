/**
 * The environment on the main thread: it answers "what is the environment at this minute" for the
 * whole game, and it draws everything that answer implies.
 *
 * `core/host.ts` calls this handle's `current(minute, day)` on every clock step and feeds the
 * result to `RenderContext.applyEnvironment` before handing it back through `onEnvironment`. So
 * this module is both the source of the numbers and the thing that reacts to them, and the sun a
 * player sees in the sky cannot disagree with the sun that casts their shadow — they are the same
 * two lines of maths.
 *
 * The weather itself lives in the worker (`sim.ts`). The world object on this side is a boot-time
 * clone, so it is read once for the initial state and never again; transitions arrive as the
 * `env:weather` event core forwards.
 */

import type { Scene } from '@babylonjs/core/scene';
import { computeEnvironment, sunAngles } from '../core/sun';
import type {
  EnvironmentState,
  MainContext,
  MainHandle,
  Season,
  Vec3,
  WeatherKind,
} from '../core/types';
import { createSkyDome, type SkyDomeHandle } from './sky-dome';
import { createIbl } from './ibl';
import { createLighting } from './lighting';
import { createPrecipitation } from './precipitation';
import { createSurfaces } from './surfaces';
import { makeSkyState, sampleSky, seasonFoliageTint, type SkyState } from './sky-model';
import { cloudFor, isSnowing, type WeatherSlot } from './weather-model';
import type { WeatherChangedEvent } from './sim';

const SYNODIC_DAYS = 29.53059;

export interface EnvironmentMainApi {
  /** The environment of a park minute. Core calls this; other modules may too. */
  current(minute: number, day: number): EnvironmentState;
  /** Linear RGB the sky shows along a unit world direction, right now. */
  skyAt(direction: Vec3): Vec3;
  /** 0..1 surface wetness, the same number the wet-surface pass is applying. */
  wetness(): number;
  /** Multiply into a foliage albedo for the current season. */
  seasonTint(): Vec3;
  /** The IBL cube, for a module that wants its own reflection probe fallback. */
  environmentTexture(): unknown;
  /** Put a mesh in the sun's cascaded shadow map. */
  addShadowCaster(mesh: unknown, includeDescendants?: boolean): void;
  removeShadowCaster(mesh: unknown): void;
  /** Keep a material out of the wetness and season passes. */
  excludeMaterial(material: unknown): void;
  /** Pin the weather, or pass null to hand it back to the chain. */
  setWeather(weather: WeatherKind | null): void;
}

interface WeatherView {
  weather: WeatherKind;
  cloud: number;
  wetness: number;
  intensity: number;
  windMs: number;
  temperatureC: number;
  snowing: boolean;
}

export function createEnvironmentMain(ctx: MainContext): MainHandle {
  const scene = ctx.scene as Scene;

  const view = initialView(ctx);
  let env: EnvironmentState = computeEnvironment({
    minute: ctx.world.clock.minute,
    day: ctx.world.clock.day,
    weather: view.weather,
    cloud: view.cloud,
    wetness: view.wetness,
    temperatureC: view.temperatureC,
  });
  let sky: SkyState = skyFor(env);

  const dome: SkyDomeHandle = createSkyDome(scene, ctx.quality, ctx.rng.fork('sky'));
  const ibl = createIbl(scene, ctx.quality);
  const lighting = createLighting(scene, ctx.quality);
  const precipitation = createPrecipitation(scene, ctx.quality);
  const surfaces = createSurfaces(scene);

  scene.environmentTexture = ibl.texture;
  scene.environmentIntensity = 1;

  let iblKey = '';
  let moonDay = -1;

  function skyFor(state: EnvironmentState): SkyState {
    const moon = moonFor(state.minute, state.day);
    return makeSkyState({
      sun: [-state.sunDirection[0], -state.sunDirection[1], -state.sunDirection[2]],
      moon: moon.direction,
      night: state.night,
      cloud: state.cloud,
      weather: state.weather,
      moonPhase: moon.illuminated,
    });
  }

  /** Coarser than the dome's: the cube costs ~1.6 ms and 1.4° of sun is invisible in an ambient. */
  function iblKeyFor(state: SkyState): string {
    return [
      Math.round(state.sun[0] * 41),
      Math.round(state.sun[1] * 41),
      Math.round(state.sun[2] * 41),
      Math.round(state.cloud * 20),
      Math.round(state.night * 25),
    ].join(',');
  }

  function applyAll(next: EnvironmentState, force: boolean): void {
    env = next;
    sky = skyFor(next);
    dome.setState(sky, force);

    const key = iblKeyFor(sky);
    if (force || key !== iblKey) {
      iblKey = key;
      ibl.update(sky, next.sunColor, next.sunIntensity);
    }
    lighting.apply(next, sky, ibl.meanLuminance(), force);
    surfaces.apply(next.wetness, next.season, force);
    precipitation.set(
      view.weather === 'rain' || view.weather === 'storm' ? (view.snowing ? 'snow' : 'rain') : null,
      view.intensity || (view.weather === 'storm' ? 0.85 : 0.5),
      view.windMs
    );

    const moon = moonFor(next.minute, next.day);
    if (next.day !== moonDay) {
      moonDay = next.day;
      dome.setMoonPhase(next.day, moon.illuminated, moon.waxing);
    }
  }

  // The world the main thread holds is a clone; the worker owns the chain and reports it.
  const offWeather = ctx.events.on('env:weather', (payload: unknown) => {
    const p = payload as WeatherChangedEvent;
    if (!p || typeof p.weather !== 'string') return;
    view.weather = p.weather;
    view.cloud = p.cloud;
    view.wetness = p.wetness;
    view.intensity = p.intensity;
    view.windMs = p.windMs;
    view.temperatureC = p.temperatureC;
    view.snowing = p.snowing;
    applyAll(current(env.minute, env.day), false);
  });

  function current(minute: number, day: number): EnvironmentState {
    return computeEnvironment({
      minute,
      day,
      weather: view.weather,
      cloud: view.cloud,
      wetness: view.wetness,
      temperatureC: view.temperatureC,
    });
  }

  applyAll(env, true);

  const api: EnvironmentMainApi = {
    current,
    skyAt(direction) {
      // Builds a row cache per call; fine for the handful of callers a frame this has.
      const out: Vec3 = [0, 0, 0];
      sampleSky(sky, direction, out);
      return out;
    },
    wetness: () => env.wetness,
    seasonTint: () => seasonFoliageTint(env.season),
    environmentTexture: () => ibl.texture,
    addShadowCaster: (mesh, includeDescendants = true) =>
      lighting.addShadowCaster(mesh, includeDescendants),
    removeShadowCaster: (mesh) => lighting.removeShadowCaster(mesh),
    excludeMaterial: (material) => surfaces.exclude(material),
    setWeather: (weather) => {
      ctx.dispatch('environment:weather', { weather });
      if (weather) {
        view.weather = weather;
        view.cloud = cloudFor(weather, weather === 'storm' ? 0.85 : 0.55);
        applyAll(current(env.minute, env.day), false);
      }
    },
  };

  return {
    api,
    onEnvironment(next) {
      applyAll(next, false);
    },
    onRender(dt) {
      const camera = scene.activeCamera;
      dome.render(dt, camera, sky);
      lighting.render(dt, sky);
      precipitation.follow(camera);
    },
    dispose() {
      offWeather();
      surfaces.restore();
      if (scene.environmentTexture === ibl.texture) scene.environmentTexture = null;
      precipitation.dispose();
      lighting.dispose();
      ibl.dispose();
      dome.dispose();
    },
  };
}

function initialView(ctx: MainContext): WeatherView {
  const slot = ctx.world.modules.environment as Partial<WeatherSlot> | undefined;
  const weather: WeatherKind = slot?.kind ?? 'clear';
  const intensity =
    typeof slot?.intensity === 'number' ? slot.intensity : weather === 'clear' ? 0 : 0.55;
  const full: WeatherSlot = {
    kind: weather,
    minutesLeft: 60,
    intensity,
    windMs: typeof slot?.windMs === 'number' ? slot.windMs : 3,
    temperatureC: typeof slot?.temperatureC === 'number' ? slot.temperatureC : 15,
    wetness: typeof slot?.wetness === 'number' ? slot.wetness : weather === 'rain' ? 0.7 : 0,
  };
  return {
    weather,
    cloud: cloudFor(weather, intensity),
    wetness: full.wetness,
    intensity,
    windMs: full.windMs,
    temperatureC: full.temperatureC,
    snowing: isSnowing(full),
  };
}

interface MoonView {
  direction: Vec3;
  illuminated: number;
  waxing: boolean;
}

/**
 * Where the moon is and how much of it is lit.
 *
 * The moon lags the sun by one synodic month spread over a day, so a new moon rides with the sun
 * and a full moon rises as it sets — which is the only part of lunar motion a player can check
 * against the sky they know. Running it through the same `sunAngles` as the sun keeps the two on
 * one celestial sphere instead of two.
 */
function moonFor(minute: number, day: number): MoonView {
  const age = (((day - 1) % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
  const lagMinutes = (age / SYNODIC_DAYS) * 1440;
  const { elevation, azimuth } = sunAngles(minute - lagMinutes, day);
  const cosEl = Math.cos(elevation);
  const phaseAngle = (age / SYNODIC_DAYS) * Math.PI * 2;
  return {
    direction: [Math.sin(azimuth) * cosEl, Math.sin(elevation), -Math.cos(azimuth) * cosEl],
    illuminated: (1 - Math.cos(phaseAngle)) / 2,
    waxing: age < SYNODIC_DAYS / 2,
  };
}

/** Re-exported so other modules can name the type without importing `sky-model` themselves. */
export type { Season };
