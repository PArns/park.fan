/**
 * Game UI strings. EN and DE are complete; NL/FR/ES/IT fall back to EN (DECISIONS.md #7).
 * The locale is resolved once in `app/game/layout.tsx` and handed down as a prop — no provider,
 * no context, because the HUD is one client tree and the strings are a flat map.
 */

import { en, type GameStringKey } from './en';
import { de } from './de';

export type GameLocale = 'en' | 'de' | 'nl' | 'fr' | 'es' | 'it';
export const GAME_LOCALES: GameLocale[] = ['en', 'de', 'nl', 'fr', 'es', 'it'];

const tables: Partial<Record<GameLocale, Record<GameStringKey, string>>> = { en, de };

export function resolveGameLocale(candidate: string | null | undefined): GameLocale {
  const c = (candidate ?? '').slice(0, 2).toLowerCase();
  return (GAME_LOCALES as string[]).includes(c) ? (c as GameLocale) : 'en';
}

export type Translate = (key: GameStringKey, vars?: Record<string, string | number>) => string;

export function createTranslator(locale: GameLocale): Translate {
  const table = tables[locale] ?? en;
  return (key, vars) => {
    let s: string = table[key] ?? en[key] ?? key;
    if (vars) for (const k in vars) s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
    return s;
  };
}

export type { GameStringKey };
