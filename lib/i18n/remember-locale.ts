import type { Locale } from '@/i18n/config';

/**
 * Name and attributes next-intl uses for its locale cookie, mirrored here because we write it
 * ourselves now. Kept byte-identical to `receiveRoutingConfig`'s default
 * (`{name: 'NEXT_LOCALE', sameSite: 'lax'}`, no `Max-Age` → a session cookie) so switching a
 * language behaves exactly as it did while the middleware was writing it.
 */
const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * Remember an EXPLICIT language choice for the unprefixed `/` entry point.
 *
 * next-intl used to write this cookie from the middleware on every document response whose
 * resolved locale differed from what `Accept-Language` would have picked — which on this site is
 * most international traffic. A `Set-Cookie` makes a response uncacheable for every shared cache
 * in front of the origin, Cloudflare included, so no park page could ever be served from a
 * European PoP; see `proxy.ts` for where that header is now dropped.
 *
 * The cookie is only ever read again to resolve `/` (next-intl's own detection — nothing in this
 * codebase reads it), so the only case worth persisting is someone actively picking a language.
 * That happens here and in the language banner. Everyone else falls back to `Accept-Language`,
 * which is what the cookie would have been set from in the first place.
 *
 * Only needed for the hard-navigation path: next-intl's client navigation (`router.replace(…,
 * {locale})`) syncs the cookie itself.
 */
export function rememberLocale(locale: Locale): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; SameSite=lax`;
}
