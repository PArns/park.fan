import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all paths except:
  // - API routes (/api/...)
  // - Static files (/_next/static/..., /images/..., etc.)
  // - Favicon and other root files
  // Note: This must be a static array - Next.js config cannot use dynamic values
  matcher: ['/', '/(de|en|nl|fr|es)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
