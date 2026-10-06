import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { parkCalendarRedirect } from './lib/parks/calendar-redirects';
import { newsRedirect } from './lib/blog/news-redirects-rule';
import { unprefixedPathRedirect } from './lib/i18n/unprefixed-redirect';

const handleI18nRouting = createMiddleware(routing);

/** Next's request proxy: locale routing plus the redirects that must not render a page first. */
export default function proxy(request: NextRequest) {
  // A park calendar month outside the window the route serves. Thrown from the page, the 308
  // would carry the not-found document as its body. See
  // docs/rules/a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md.
  // A middleware `Location` must be absolute (a bare path throws `ERR_INVALID_URL`, a 500); Next
  // makes it relative again on the wire.
  const calendarTarget = parkCalendarRedirect(request.nextUrl.pathname);
  if (calendarTarget) {
    return NextResponse.redirect(new URL(calendarTarget, request.url), 308);
  }

  // Old `/blog/` news URLs to `/news/`, for the same reason as the calendar above.
  const newsTarget = newsRedirect(request.nextUrl.pathname);
  if (newsTarget) {
    return NextResponse.redirect(new URL(newsTarget, request.url), 308);
  }

  // A path without a locale prefix whose target does not depend on the visitor (a localized
  // segment names its locale, or there is no `Accept-Language` to negotiate) gets a cacheable 308
  // instead of next-intl's 307, with a calendar or news target resolved in the same hop.
  const prefixed = unprefixedPathRedirect(
    request.nextUrl.pathname,
    request.headers.has('accept-language')
  );
  if (prefixed) {
    const onward = parkCalendarRedirect(prefixed) ?? newsRedirect(prefixed);
    const target = new URL(onward ?? `${prefixed}${request.nextUrl.search}`, request.url);
    const redirect = NextResponse.redirect(target, 308);
    redirect.headers.set('Vary', 'Accept-Language');
    return redirect;
  }

  const response = handleI18nRouting(request);

  // next-intl's redirect of an unprefixed path depends on Accept-Language, so a shared cache must
  // not serve one visitor's redirect to everyone. Only redirects vary: the prefixed pages stay
  // cacheable by path.
  if (response.headers.has('location')) {
    response.headers.set('Vary', 'Accept-Language');
    return response;
  }

  // next-intl's NEXT_LOCALE cookie would take every page out of the shared caches in front of
  // the origin (a `Set-Cookie` response is never cached). Nothing reads it except the unprefixed
  // `/`, and an explicit language switch still sets it from the client (`rememberLocale`).
  // Deleting the whole header is safe: the proxy runs before the route, so it is the only cookie.
  response.headers.delete('set-cookie');

  return response;
}

export const config = {
  // Every path except API, admin, dev, Next's own and files with an extension. Next reads this
  // statically, so the locale list is written out instead of taken from i18n/config.
  matcher: ['/', '/(de|en|nl|fr|es|it)/:path*', '/((?!api|admin|dev|_next|_vercel|.*\\..*).*)'],
};
