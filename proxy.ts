import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  // next-intl detects the locale from the Accept-Language header and redirects
  // unprefixed paths accordingly (e.g. `/` → `/de` vs `/en`). The Location of
  // those redirects therefore varies by Accept-Language, so we must advertise
  // that to shared/CDN caches — otherwise one visitor's locale redirect could
  // be cached and served to everyone. Only tag redirects: the locale-prefixed
  // pages themselves are keyed by URL path and must stay fully cacheable.
  if (response.headers.has('location')) {
    response.headers.set('Vary', 'Accept-Language');
    return response;
  }

  // next-intl writes NEXT_LOCALE on a document response whenever the resolved locale differs
  // from the one Accept-Language would pick — on a six-language site that is most of the
  // international traffic, and it arrives on the very pages that are otherwise byte-identical
  // for everyone. A `Set-Cookie` takes a response out of every shared cache in front of the
  // origin, Cloudflare included, so those pages could never be served from a PoP near the
  // visitor; measured Aug 2026, every HTML response came back `cf-cache-status: DYNAMIC` while
  // assets and images were HIT.
  //
  // Dropping it here costs nothing that was worth keeping: the cookie is only read again to
  // resolve the unprefixed `/`, nothing in this codebase reads it, and an explicit language
  // switch still persists it from the client (`rememberLocale`). A visitor who never picked a
  // language now gets `/` resolved from Accept-Language — the same header the cookie was
  // derived from. Redirects keep theirs (returned above): they vary by Accept-Language and are
  // not cacheable anyway.
  //
  // Deleting the whole header is safe because next-intl's cookie is the only one this response
  // can carry — the middleware runs before the route, so nothing a page or route handler sets
  // is in here yet.
  response.headers.delete('set-cookie');

  return response;
}

export const config = {
  // Match all paths except:
  // - API routes (/api/...)
  // - Static files (/_next/static/..., /images/..., etc.)
  // - Favicon and other root files
  // Note: This must be a static array - Next.js config cannot use dynamic values
  // We use the pattern from config but expanded manually for now as Next.js config needs static strings
  // or simple template literals.
  matcher: ['/', '/(de|en|nl|fr|es|it)/:path*', '/((?!api|admin|dev|_next|_vercel|.*\\..*).*)'],
};
