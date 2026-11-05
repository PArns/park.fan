'use client';

import { useSyncExternalStore } from 'react';
import { parkySwitch } from './easter-eggs';
import { lookSwitch, NO_LOOK, seasonOn, type ParkyLook, type ParkyWeather } from './parky-look';

let parkWeather: ParkyWeather | null = null;
let preview: ParkyLook | null = null;
let current: ParkyLook | null = null;
const listeners = new Set<() => void>();

function changed() {
  current = null;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// shortcut: the season is read once per change of look, so a tab left open over midnight keeps
// yesterday's until the next one; a reload or the weather arriving puts it right.
function snapshot(): ParkyLook {
  if (!current) {
    const asked = lookSwitch(parkySwitch());
    current = preview ?? {
      season: asked.season ?? seasonOn(new Date()),
      weather: asked.weather ?? parkWeather,
    };
  }
  return current;
}

const serverSnapshot = () => NO_LOOK;

/** The park's weather look while a park page shows it (`useParkyWeather`), `null` elsewhere. */
export function setParkyWeather(weather: ParkyWeather | null): void {
  if (weather === parkWeather) return;
  parkWeather = weather;
  changed();
}

/** A look picked on Parky's page, in place of the date's and the park's; `null` lets them back. */
export function previewParkyLook(look: ParkyLook | null): void {
  preview = look;
  changed();
}

/**
 * What every Parky on the page wears: the season from the browser's calendar and the park's
 * weather on a park page, or what `?parky=` or the preview on Parky's page asks for. Nothing on
 * the server, so the first paint matches the prerendered page.
 */
export function useParkyLook(): ParkyLook {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
