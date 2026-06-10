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
  }

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
  matcher: [
    '/',
    '/(de|en|nl|fr|es|it)/:path*',
    '/((?!api|admin|dev|_next|_vercel|.*\\..*).*)',
  ],
};
