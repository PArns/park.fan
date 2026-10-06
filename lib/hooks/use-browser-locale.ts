'use client';

import { useSyncExternalStore } from 'react';
import { locales, type Locale } from '@/i18n/config';

function firstSiteLocale(languages: readonly string[]): Locale | null {
  for (const raw of languages) {
    const base = raw.toLowerCase().split('-')[0];
    if ((locales as readonly string[]).includes(base)) return base as Locale;
  }
  return null;
}

const subscribeToNothing = () => () => {};
const fromLanguageList = () =>
  firstSiteLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
const fromFirstLanguage = () => firstSiteLocale([navigator.language]);
const noLocale = () => null;

/**
 * The site locale the visitor's browser asks for: null on the server, while hydrating, and when
 * none of its languages is one of ours. `firstChoiceOnly` reads only `navigator.language` instead
 * of the whole preference list.
 */
export function useBrowserLocale({ firstChoiceOnly = false } = {}): Locale | null {
  return useSyncExternalStore(
    subscribeToNothing,
    firstChoiceOnly ? fromFirstLanguage : fromLanguageList,
    noLocale
  );
}
