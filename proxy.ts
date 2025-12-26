import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export const proxy = createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - API routes (/api/...)
  // - Static files (/_next/static/..., /images/..., etc.)
  // - Favicon and other root files
  matcher: ['/', '/(de|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
