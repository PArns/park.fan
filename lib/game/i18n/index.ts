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

/**
 * `{var, plural, one {# Einheit} other {# Einheiten}}` — the ICU plural form, and only that form.
 *
 * The table shipped as flat `{var}` substitution and produced **"Limonade hat 1 Einheiten
 * nachgefüllt."** beside "Eisdiele hat 7 Einheiten nachgefüllt." The site next door has next-intl
 * and real ICU (`docs/i18n/pluralization.md`); this table has neither, and the open issue recorded
 * the fix as "not cheap" on the grounds that "every count in the HUD has the same bug waiting".
 *
 * Counted before writing anything: of **290 keys, two interpolate a number** — `{units}` here and
 * `{day}` in `hud.day`, which is a label ("Tag 3") and wants no plural at all. So the capability is
 * one function and the backlog it unblocks is one string, which is why this is a parser for the
 * plural argument and not a dependency.
 *
 * `Intl.PluralRules` picks the category, so French gets its `one` for zero and the five other
 * locales get the `one`/`other` split they need without a table of rules here. Arms may also be
 * exact (`=0 {nichts}`), which ICU allows and German log lines want more often than a category.
 * `#` is the number. An arm body may not contain braces: that keeps this a regex rather than a
 * parser, and a message that needs nesting is a message that belongs in a component.
 */
const PLURAL_ARG = /\{(\w+),\s*plural,\s*((?:\s*(?:=\d+|\w+)\s*\{[^{}]*\})+)\s*\}/g;
const PLURAL_ARM = /(=\d+|\w+)\s*\{([^{}]*)\}/g;

function applyPlurals(
  message: string,
  vars: Record<string, string | number>,
  locale: GameLocale
): string {
  return message.replace(PLURAL_ARG, (whole, name: string, arms: string) => {
    const raw = vars[name];
    const n = typeof raw === 'number' ? raw : Number(raw);
    // A plural argument with nothing to count is left exactly as written rather than guessed at:
    // an untouched `{units, plural, …}` on screen says "this call site forgot a variable", which a
    // silently chosen `other` arm would not.
    if (!Number.isFinite(n)) return whole;
    const chosen = new Map<string, string>();
    for (const [, key, body] of arms.matchAll(PLURAL_ARM)) chosen.set(key, body);
    const exact = chosen.get(`=${n}`);
    const category = new Intl.PluralRules(locale).select(n);
    const body = exact ?? chosen.get(category) ?? chosen.get('other');
    return (body ?? whole).replace(/#/g, String(n));
  });
}

export function createTranslator(locale: GameLocale): Translate {
  const table = tables[locale] ?? en;
  /**
   * The plural rules follow the TABLE, not the reader's locale, and the difference is visible.
   *
   * NL/FR/ES/IT ship no table and fall back to English (DECISIONS.md #7). French counts zero as
   * `one`, so asking `Intl.PluralRules('fr')` which arm of an ENGLISH sentence to use returned
   * "Limonade took 0 unit of stock." — French grammar applied to English words. The arms belong to
   * whichever language wrote them.
   */
  const pluralLocale: GameLocale = tables[locale] ? locale : 'en';
  return (key, vars) => {
    let s: string = table[key] ?? en[key] ?? key;
    if (vars) {
      // Plurals first: an arm body carries `#` and plain text, never another `{var}`, so the simple
      // substitution below cannot reach into an arm that was not chosen.
      s = applyPlurals(s, vars, pluralLocale);
      for (const k in vars) s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
    }
    return s;
  };
}

export type { GameStringKey };
