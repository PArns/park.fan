/**
 * The environment on the sim side: it owns the weather, and it is the only writer of
 * `world.modules.environment`.
 *
 * `SimRuntime.environment()` calls this handle's `current()` for every module that asks what the
 * weather is, several times per tick, so the state is cached per park minute rather than rebuilt
 * per call. The main thread cannot read the slot (the world it holds is a boot-time clone), so a
 * transition is announced as `env:weather`, which `FORWARDED_PREFIXES` in `core/sim-runtime.ts`
 * relays across the worker boundary.
 */

import { computeEnvironment } from '../core/sun';
import type { Command, EnvironmentState, SimContext, SimHandle, WeatherKind } from '../core/types';
import { cloudFor, freshSlot, isSnowing, stepWeather, type WeatherSlot } from './weather-model';

export interface EnvironmentSimApi {
  current(): EnvironmentState;
  weather(): WeatherKind;
  /** 0..1, how hard it is doing it. Not part of `EnvironmentState`. */
  intensity(): number;
  windMs(): number;
  snowing(): boolean;
}

export interface WeatherChangedEvent {
  weather: WeatherKind;
  cloud: number;
  wetness: number;
  intensity: number;
  windMs: number;
  temperatureC: number;
  snowing: boolean;
}

export function createEnvironmentSim(ctx: SimContext): SimHandle {
  let slot = readSlot();
  let cache: EnvironmentState | null = null;
  let cacheKey = -1;
  let announced = '';

  function readSlot(): WeatherSlot {
    const stored = ctx.world.modules.environment as Partial<WeatherSlot> | undefined;
    const next = freshSlot(stored?.kind ?? 'clear');
    if (stored) {
      if (typeof stored.minutesLeft === 'number') next.minutesLeft = stored.minutesLeft;
      if (typeof stored.intensity === 'number') next.intensity = stored.intensity;
      if (typeof stored.windMs === 'number') next.windMs = stored.windMs;
      if (typeof stored.temperatureC === 'number') next.temperatureC = stored.temperatureC;
      if (typeof stored.wetness === 'number') next.wetness = stored.wetness;
      if (stored.forced) next.forced = true;
      // A save resumes the chain where it stopped; without this a reload rerolls the week.
      if (Array.isArray(stored.rng) && stored.rng.length === 4) {
        ctx.rng.restore(stored.rng as [number, number, number, number]);
      }
    }
    ctx.world.modules.environment = next;
    return next;
  }

  function state(): EnvironmentState {
    const key = Math.floor(ctx.world.clock.minute * 4) + ctx.world.clock.day * 5760;
    if (cache && cacheKey === key) return cache;
    cacheKey = key;
    cache = computeEnvironment({
      minute: ctx.world.clock.minute,
      day: ctx.world.clock.day,
      weather: slot.kind,
      cloud: cloudFor(slot.kind, slot.intensity),
      wetness: slot.wetness,
      temperatureC: slot.temperatureC,
    });
    return cache;
  }

  function announce(): void {
    const payload: WeatherChangedEvent = {
      weather: slot.kind,
      cloud: cloudFor(slot.kind, slot.intensity),
      wetness: slot.wetness,
      intensity: slot.intensity,
      windMs: slot.windMs,
      temperatureC: slot.temperatureC,
      snowing: isSnowing(slot),
    };
    // Only the shape a renderer reacts to, not every 0.001 of drying: this crosses a postMessage.
    const signature = `${payload.weather}|${payload.snowing}|${Math.round(payload.cloud * 40)}|${Math.round(payload.wetness * 40)}|${Math.round(payload.temperatureC)}`;
    if (signature === announced) return;
    announced = signature;
    ctx.events.emit('env:weather', payload);
  }

  const api: EnvironmentSimApi = {
    current: state,
    weather: () => slot.kind,
    intensity: () => slot.intensity,
    windMs: () => slot.windMs,
    snowing: () => isSnowing(slot),
  };

  announce();

  return {
    api,
    tick(dtMinutes: number) {
      stepWeather(slot, dtMinutes, ctx.world.clock.day, ctx.world.clock.minute, ctx.rng);
      cache = null;
      announce();
    },
    command(cmd: Command) {
      if (cmd.type !== 'environment:weather') return false;
      const payload = cmd.payload as { weather: WeatherKind | null };
      if (payload.weather === null) {
        // Release the pin and let the chain roll again at the next spell boundary.
        slot.forced = false;
      } else {
        slot.kind = payload.weather;
        slot.forced = true;
        slot.intensity =
          payload.weather === 'clear' ? 0 : payload.weather === 'storm' ? 0.85 : 0.55;
        slot.minutesLeft = 240;
      }
      cache = null;
      announce();
      return true;
    },
    rebuild() {
      slot = readSlot();
      cache = null;
      announced = '';
      announce();
    },
    serialize() {
      slot.rng = ctx.rng.state();
      return slot;
    },
  };
}
