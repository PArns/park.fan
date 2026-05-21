'use client';

import { getCookie, setCookie } from 'cookies-next';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { detectDefaultUnit, type TemperatureUnit } from '@/lib/utils/temperature';

const COOKIE_NAME = 'temp_unit';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

interface TemperatureUnitContextValue {
  unit: TemperatureUnit;
  setUnit: (unit: TemperatureUnit) => void;
}

const TemperatureUnitContext = createContext<TemperatureUnitContextValue | null>(null);

interface TemperatureUnitProviderProps {
  children: ReactNode;
  /** Server-resolved initial unit from the cookie, to avoid an SSR/hydration flash. */
  initialUnit?: TemperatureUnit;
}

/**
 * Centralized temperature-unit preference (°C / °F).
 *
 * - Server reads the cookie via next/headers and passes `initialUnit` to
 *   prevent a hydration flash for users who have a saved preference.
 * - When no cookie is present, falls back to browser-locale detection on
 *   mount (en-US / my / lr / etc → Fahrenheit, everyone else → Celsius).
 * - Any change is immediately persisted to the cookie (1-year max-age).
 */
export function TemperatureUnitProvider({ children, initialUnit }: TemperatureUnitProviderProps) {
  const [unit, setUnitState] = useState<TemperatureUnit>(initialUnit ?? 'C');

  // If the server didn't see a cookie, derive the preference once on mount
  // from either the client-readable cookie or the browser locale. This needs
  // an effect because document/navigator only exist after hydration.
  useEffect(() => {
    if (initialUnit) return;
    const fromCookie = getCookie(COOKIE_NAME);
    const next: TemperatureUnit =
      fromCookie === 'C' || fromCookie === 'F' ? fromCookie : detectDefaultUnit();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing React state with persisted/browser preference is the explicit purpose of this effect
    setUnitState((prev) => (prev === next ? prev : next));
  }, [initialUnit]);

  const setUnit = useCallback((next: TemperatureUnit) => {
    setUnitState(next);
    setCookie(COOKIE_NAME, next, { maxAge: COOKIE_MAX_AGE, sameSite: 'lax', path: '/' });
  }, []);

  return (
    <TemperatureUnitContext.Provider value={{ unit, setUnit }}>
      {children}
    </TemperatureUnitContext.Provider>
  );
}

export function useTemperatureUnit(): TemperatureUnitContextValue {
  const ctx = useContext(TemperatureUnitContext);
  if (!ctx) {
    // Pre-provider fallback for components rendered outside the tree (rare; mostly tests).
    return { unit: 'C', setUnit: () => undefined };
  }
  return ctx;
}
