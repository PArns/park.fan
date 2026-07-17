'use client';

import { getCookie, setCookie } from 'cookies-next';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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
}

/**
 * Centralized temperature-unit preference (°C / °F).
 *
 * Display is driven by CSS: weather/calendar values are server-rendered in BOTH
 * units (see components/common/unit-display) and an inline script in the root
 * layout sets `html[data-temp-unit]` before paint — so there is no flash and the
 * pages stay statically cacheable. This context backs the few CLIENT consumers
 * that still need the unit imperatively (the toggle's pressed state, and the
 * nowcast banner's wind value inside a translated sentence).
 *
 * - On mount it syncs from the pre-paint `data-temp-unit` attribute (falling back
 *   to the cookie / browser-locale detection).
 * - `setUnit` updates React state, the `<html>` attribute (so the CSS toggle and
 *   every server-rendered dual-unit value flip instantly), and the 1-year cookie.
 */
export function TemperatureUnitProvider({ children }: TemperatureUnitProviderProps) {
  const [unit, setUnitState] = useState<TemperatureUnit>('C');

  useEffect(() => {
    const attr = document.documentElement.getAttribute('data-temp-unit');
    let next: TemperatureUnit;
    if (attr === 'C' || attr === 'F') {
      next = attr;
    } else {
      const fromCookie = getCookie(COOKIE_NAME);
      next = fromCookie === 'C' || fromCookie === 'F' ? fromCookie : detectDefaultUnit();
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing React state with the pre-paint attribute/cookie is the explicit purpose of this effect
    setUnitState((prev) => (prev === next ? prev : next));
  }, []);

  const setUnit = useCallback((next: TemperatureUnit) => {
    setUnitState(next);
    // Drives the CSS display toggle for every server-rendered dual-unit value.
    document.documentElement.setAttribute('data-temp-unit', next);
    setCookie(COOKIE_NAME, next, { maxAge: COOKIE_MAX_AGE, sameSite: 'lax', path: '/' });
  }, []);

  const value = useMemo(() => ({ unit, setUnit }), [unit, setUnit]);

  return (
    <TemperatureUnitContext.Provider value={value}>{children}</TemperatureUnitContext.Provider>
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
