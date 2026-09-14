/**
 * Environment module: sun, procedural sky, IBL, weather, seasons, fog, shadows, exposure.
 *
 * Import-safe on the worker — the sim half is a plain function over pure files, and every line
 * that touches Babylon sits behind a dynamic import.
 */

import type { GameModule } from '../core/types';
import { createEnvironmentSim } from './sim';

export const environmentModule: GameModule = {
  id: 'environment',
  deps: ['core'],
  sim: createEnvironmentSim,
  main: async (ctx) => (await import('./main')).createEnvironmentMain(ctx),
  showcase: async (ctx) => (await import('./showcase')).stageEnvironmentShowcase(ctx),
};

export type { EnvironmentSimApi, WeatherChangedEvent } from './sim';
export type { EnvironmentMainApi } from './main';
export type { WeatherSlot } from './weather-model';
export { WEATHER_KINDS, cloudFor, isSnowing, SNOW_TEMPERATURE_C } from './weather-model';
export { seasonFoliageTint, turbidityFor } from './sky-model';
