import type { Locale } from '@/i18n/config';

/**
 * next-intl's locale cookie, written by this app itself, so byte-identical to next-intl's default
 * (`{name: 'NEXT_LOCALE', sameSite: 'lax'}`, no `Max-Age`, a session cookie).
 */
const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * Remembers an explicit language choice for the unprefixed `/` entry point. `proxy.ts` drops
 * next-intl's own cookie so pages stay cacheable, and only `/` reads it, so only an active pick is
 * persisted. Needed for hard navigation only: next-intl's client navigation syncs the cookie
 * itself.
 */
export function rememberLocale(locale: Locale): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; SameSite=lax`;
}
