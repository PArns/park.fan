'use client';

import { readCookie, writeCookie } from '@/lib/utils/browser-cookie';
import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { detectDefaultUnit, type TemperatureUnit } from '@/lib/utils/temperature';

const COOKIE_NAME = 'temp_unit';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

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

// The unit is an external store: it is read from the DOM attribute and the cookie, and every
// consumer must see `C` for the whole hydration pass because that is what the server rendered. An
// effect fires per committed boundary, so a widget hydrating later would see `F` over `C` markup;
// `useSyncExternalStore` takes a separate server snapshot. See
// docs/rules/a-client-only-preference-may-not-decide-server-rendered-markup.md.

let current: TemperatureUnit | null = null;
const listeners = new Set<() => void>();

/** The pre-paint attribute first — it already resolved cookie and locale. */
function readUnit(): TemperatureUnit {
  const attr = document.documentElement.getAttribute('data-temp-unit');
  if (attr === 'C' || attr === 'F') return attr;
  const fromCookie = readCookie(COOKIE_NAME);
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
  writeCookie(COOKIE_NAME, next, { maxAge: COOKIE_MAX_AGE, sameSite: 'lax', path: '/' });
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

/**
 * Returns the visitor's temperature unit (°C or °F) and its setter; outside the provider it answers
 * °C and a no-op setter.
 */
export function useTemperatureUnit(): TemperatureUnitContextValue {
  const ctx = useContext(TemperatureUnitContext);
  if (!ctx) {
    // Pre-provider fallback for components rendered outside the tree (rare; mostly tests).
    return { unit: SERVER_UNIT, setUnit: () => undefined };
  }
  return ctx;
}
