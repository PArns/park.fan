import { isValidLocale } from '@/i18n/config';

/** The visitor account's page, under the locale; members only. Not linked from the site yet. */
export const ACCOUNT_PATH = '/account';

/** The sign-in for visitor accounts, under the locale. Not linked from the site yet. */
export const LOGIN_PATH = '/login';

/**
 * Where to go after signing in: the `next` a members-only page sent, when it is a path on this
 * site, else the account. A full URL, a protocol-relative `//host` or a backslash is refused, so
 * the sign-in cannot be used to send somebody elsewhere. A leading locale is dropped.
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) {
    return ACCOUNT_PATH;
  }
  // The router adds the locale itself; a path that already names one would get it twice.
  const [, first, ...rest] = raw.split('/');
  return isValidLocale(first) ? `/${rest.join('/')}` : raw;
}

/** The sign-in with the page to come back to. */
export function loginPathFor(next: string): string {
  return `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;
}
