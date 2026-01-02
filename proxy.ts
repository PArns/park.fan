import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is a legacy route (missing locale) and not an internal/api path
  // We assume that valid locales are 'de' and 'en'.
  // If the path starts with /parks or other main routes but NOT /de or /en, it's legacy.
  const isLegacyRoute =
    !pathname.startsWith('/de') &&
    !pathname.startsWith('/en') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.includes('.') &&
    pathname !== '/';

  if (isLegacyRoute) {
    // Redirect to default locale (en) with 301
    request.nextUrl.pathname = `/en${pathname}`;
    return NextResponse.redirect(request.nextUrl, 301);
  }

  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except for:
  // - API routes (/api/...)
  // - Static files (/_next/static/..., /images/..., etc.)
  // - Favicon and other root files
  matcher: ['/', '/(de|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
