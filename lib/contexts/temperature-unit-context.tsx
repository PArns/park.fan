'use client';

import { getCookie, setCookie } from 'cookies-next';
import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { detectDefaultUnit, type TemperatureUnit } from '@/lib/utils/temperature';

const COOKIE_NAME = 'temp_unit';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

/** What the server renders, and therefore what hydration has to see. */
const SERVER_UNIT: TemperatureUnit = 'C';

interface TemperatureUnitContextValue {
  unit: TemperatureUnit;
  setUnit: (unit: TemperatureUnit) => void;
}

const TemperatureUnitContext = createContext<TemperatureUnitContextValue | null>(null);

interface TemperatureUnitProviderProps {
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// The unit as an external store.
//
// It has to be one. The value is read from the DOM (the pre-paint attribute) and
// the cookie, i.e. from outside React, and every consumer has to see `C` for the
// whole hydration pass because that is what the server put in the HTML. An effect
// cannot promise that: effects fire per committed boundary, so the provider's ran
// while a weather widget further down was still waiting to hydrate, and that
// widget was then hydrated against `F` over server markup that said `C` — React
// logged the subtree and patched nothing. `useSyncExternalStore` is the one hook
// that takes a separate server snapshot, so hydration is `C` by construction and
// the real unit arrives in the re-render right after it.
// ---------------------------------------------------------------------------

let current: TemperatureUnit | null = null;
const listeners = new Set<() => void>();

/** The pre-paint attribute first — it already resolved cookie and locale. */
function readUnit(): TemperatureUnit {
  const attr = document.documentElement.getAttribute('data-temp-unit');
  if (attr === 'C' || attr === 'F') return attr;
  const fromCookie = getCookie(COOKIE_NAME);
  return fromCookie === 'C' || fromCookie === 'F' ? fromCookie : detectDefaultUnit();
}

/** Cached: `getSnapshot` is called on every render and must not keep re-deriving. */
function getSnapshot(): TemperatureUnit {
  current ??= readUnit();
  return current;
}

function getServerSnapshot(): TemperatureUnit {
  return SERVER_UNIT;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function writeUnit(next: TemperatureUnit): void {
  current = next;
  // Drives the CSS display toggle for every server-rendered dual-unit value.
  document.documentElement.setAttribute('data-temp-unit', next);
  setCookie(COOKIE_NAME, next, { maxAge: COOKIE_MAX_AGE, sameSite: 'lax', path: '/' });
  for (const listener of listeners) listener();
}

/**
 * Centralized temperature-unit preference (°C / °F).
 *
 * Display is driven by CSS: weather/calendar values are server-rendered in BOTH
 * units (see components/common/unit-display) and an inline script in the root
 * layout sets `html[data-temp-unit]` before paint — so there is no flash and the
 * pages stay statically cacheable. This context backs the few CLIENT consumers
 * that still need the unit imperatively (the °C/°F toggle's `aria-pressed`, and
 * the nowcast banner's wind value inside a translated sentence).
 */
export function TemperatureUnitProvider({ children }: TemperatureUnitProviderProps) {
  const unit = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo(() => ({ unit, setUnit: writeUnit }), [unit]);

  return (
    <TemperatureUnitContext.Provider value={value}>{children}</TemperatureUnitContext.Provider>
  );
}

export function useTemperatureUnit(): TemperatureUnitContextValue {
  const ctx = useContext(TemperatureUnitContext);
  if (!ctx) {
    // Pre-provider fallback for components rendered outside the tree (rare; mostly tests).
    return { unit: SERVER_UNIT, setUnit: () => undefined };
  }
  return ctx;
}
