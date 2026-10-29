import type { Metadata } from 'next';
import { Suspense, type CSSProperties } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import {
  generateAlternateLanguages,
  locales,
  localeToOpenGraphLocale,
  SITE_URL,
} from '@/i18n/config';
import { pickMessages } from '@/i18n/client-messages';
import { LAYOUT_MESSAGE_NAMESPACES } from '@/i18n/route-namespaces.generated';
import { Providers } from '@/lib/providers';
import { DIRECT_API_ORIGIN } from '@/lib/api/client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { PlannerLauncher } from '@/components/planner/planner-launcher';
import { hasPublishedPosts } from '@/lib/blog/listing';
import { getGeoMenu } from '@/lib/navigation/geo-menu';
import { getBlogMenu } from '@/lib/navigation/blog-menu';
import { getNewsMenu } from '@/lib/navigation/news-menu';
import { getMoreMenu } from '@/lib/navigation/more-menu';
import { getFeaturedParksMenu } from '@/lib/navigation/featured-parks-menu';
import { LanguageBanner } from '@/components/layout/language-banner';
import { SitePageviewBeacon } from '@/components/analytics/site-pageview-beacon';
import { MarkupEventTracker } from '@/components/analytics/markup-event-tracker';
import { ScrollLockGutter } from '@/components/layout/scroll-lock-gutter';
import { ScrollToTop } from '@/components/common/scroll-to-top';
import { CardPointerFx } from '@/components/parks/card-pointer-fx';
import { PushTimezoneSync } from '@/components/push/push-timezone-sync';
import { SearchConsoleGate } from '@/components/admin/search-console-gate';
import { WebMcpTools } from '@/components/agents/webmcp-tools';
import { NavigationProgress } from '@/components/layout/navigation-progress';
import { NewPostsWatcher } from '@/components/blog/new-posts-watcher';
import {
  OrganizationStructuredData,
  SiteNavigationStructuredData,
  WebSiteStructuredData,
} from '@/components/seo/structured-data';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import { translateContinent } from '@/lib/i18n/helpers';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

// The two inherited values an open Radix popup writes onto <body>: `pointer-events: none` from its
// dismissable layer and `--removed-body-scroll-bar-size` from react-remove-scroll-bar. Declared on
// the page wrapper, the change stops there instead of restyling the whole page on open and on
// close. Inline, because the same declarations in app/globals.css did not stop the custom
// property; see docs/rules/a-popup-changes-nothing-the-page-inherits.md.
const PAGE_ROOT_STYLE = {
  pointerEvents: 'auto',
  '--removed-body-scroll-bar-size': '0px',
} as CSSProperties;

/** The skip link's target. Not `main` or `content`: a blog chapter's slug could be either. */
const MAIN_CONTENT_ID = 'main-content';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    return {
      title: 'park.fan',
    };
  }

  const t = await getTranslations({ locale, namespace: 'seo.global' });
  const siteUrl = SITE_URL;

  return {
    title: {
      template: '%s',
      default: t('title'),
    },
    description: t('description'),
    keywords: t('keywords'),
    // No `icons` here: a segment that declares them replaces the inherited object. See the note
    // in app/layout.tsx.
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}`),
        'x-default': `${SITE_URL}/en`,
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'park.fan',
      url: `${siteUrl}/${locale}`,
      locale: localeToOpenGraphLocale[locale as Locale] || 'en_US',
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      title: t('title'),
      description: t('description'),
      images: [
        {
          url: getOgImageUrl([locale]),
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [getOgImageUrl([locale])],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Only what the chrome reads: everything handed to the provider is serialized into every
  // page's RSC payload, so a route's own namespaces come further down from `<RouteMessages>`.
  // See docs/rules/translations-are-routed-not-bundled.md.
  const messages = pickMessages(await getMessages(), LAYOUT_MESSAGE_NAMESPACES);
  // Blog surfaces show only in locales that list posts.
  const showBlog = hasPublishedPosts(locale as Locale);
  // The header's two menus. Both are structure rather than state: the geo spine is a cached
  // discovery read (no per-page hop to api.park.fan) and the blog side is the generated
  // manifest, read synchronously. Fetched here because `Header` is a Client Component.
  const geoMenu = await getGeoMenu();
  const blogMenu = showBlog ? getBlogMenu(locale as Locale) : undefined;
  // News is its own bar entry beside the blog's, from the same manifest. No items → no entry.
  const newsMenu = showBlog ? getNewsMenu(locale as Locale) : undefined;
  const hasNews = (newsMenu?.items.length ?? 0) > 0;
  const featuredParks = getFeaturedParksMenu(locale);
  // The "more" menu: the dictionary's categories, the chapters of the guide and of the best-time
  // hub, and a photo for each. No I/O either — terms, chapters and the media catalog are modules
  // in this repo; the await is only `getTranslations` reaching for the category labels.
  const moreMenu = await getMoreMenu(locale as Locale);
  // The targets of the main navigation, in this list's own order, plus the continent hubs the
  // parks menu opens onto. Kept to twelve at most: this is a hint about the primary navigation,
  // and the country links are already in the rendered <nav>.
  const tNav = await getTranslations({ locale, namespace: 'navigation' });
  const tGeo = await getTranslations({ locale, namespace: 'geo' });
  const navigationItems = [
    { name: tNav('explore'), path: '/parks' },
    ...(showBlog ? [{ name: tNav('blog'), path: '/blog' }] : []),
    ...(hasNews && newsMenu ? [{ name: newsMenu.label, path: newsMenu.path }] : []),
    { name: tNav('bestTime'), path: `/${BEST_TIME_SEGMENTS[locale as Locale]}` },
    { name: tNav('glossary'), path: `/${GLOSSARY_SEGMENTS[locale as Locale]}` },
    { name: tNav('howto'), path: `/${HOWTO_SEGMENTS[locale as Locale]}` },
    { name: tNav('planner'), path: `/${PLANNER_SEGMENTS[locale as Locale]}` },
    ...geoMenu.map((continent) => ({
      name: translateContinent(tGeo, continent.slug, locale, continent.name),
      path: `/parks/${continent.slug}`,
    })),
  ];
  const tSeo = await getTranslations({ locale, namespace: 'seo.global' });

  // The temperature-unit cookie is not read on the server: cookies() here would make every route
  // dynamic. The markup carries both units and the inline script below picks one before paint.

  // With NEXT_PUBLIC_API_DIRECT the API is the only other origin the browser talks to, after load.
  // A dns-prefetch warms the DNS lookup without a full preconnect that would compete with critical
  // same-origin assets (HTML/CSS/fonts/JS/images are all same-origin).

  // Render html/body here to have access to locale for lang attribute
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans antialiased`} suppressHydrationWarning>
        {DIRECT_API_ORIGIN && <link rel="dns-prefetch" href={DIRECT_API_ORIGIN} />}
        {/* Sets the temperature unit on <html> before paint, from the temp_unit cookie or the
            browser locale's region (mirrors detectDefaultUnit), so values rendered in both units
            show the visitor's with no flash. A raw <script>, not `next/script`: its
            `beforeInteractive` queues the code for Next's runtime, which brings the flash back.
            React 19's dev warning about a script tag does not apply: the browser runs it while
            parsing, and a soft navigation has nothing to re-run. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var m=document.cookie.match(/(?:^|; )temp_unit=([CF])/);var u=m&&m[1];if(!u){var r;try{r=new Intl.Locale(navigator.language).region}catch(e){r=(navigator.language||'').split('-')[1]}u=['US','MM','LR','BS','KY','PW'].indexOf((r||'').toUpperCase())>-1?'F':'C'}document.documentElement.setAttribute('data-temp-unit',u)}catch(e){document.documentElement.setAttribute('data-temp-unit','C')}})();",
          }}
        />
        {/* Marks <html> before paint when the favorites cookie holds at least one id (an array
            opening on a quote, `[` `"` URI-encoded), so the homepage can drop its empty favorites
            band on a phone with no shift. `saveFavoritesToCookies` keeps it current. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "/(?:^|; )favorites=[^;]*%5B%22/.test(document.cookie)&&document.documentElement.setAttribute('data-has-favorites','')",
          }}
        />
        <OrganizationStructuredData
          description={tSeo('description')}
          image={getOgImageUrl([locale])}
        />
        <WebSiteStructuredData
          locale={locale}
          description={tSeo('description')}
          image={getOgImageUrl([locale])}
        />
        <SiteNavigationStructuredData locale={locale} items={navigationItems} />
        {/* Dark for everyone by default, light only for visitors who ask for it; `enableSystem`
            is off so the OS does not decide. See ThemeToggle for browsers still holding the
            retired `system` value. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers>
            <NextIntlClientProvider messages={messages} locale={locale}>
              {/* Layout client components read request data (usePathname) / run live queries,
                  which are dynamic under Cache Components — stream them as Suspense holes so the
                  page shell stays statically prerenderable. */}
              <Suspense fallback={null}>
                <NavigationProgress />
                <ScrollToTop />
                {/* Pointer depth on every card, on every page — one delegated listener, and it
                    costs nothing on pages that have no cards. */}
                <CardPointerFx />
                {/* Our own statistic: a view per path, and what marked markup reports (a link
                    leaving the site, a link inside a marked block, an FAQ answer opened). See
                    docs/development/analytics.md. */}
                <SitePageviewBeacon />
                <MarkupEventTracker />
                {/* The scrollbar gutter while a popup locks the page, without a `:has()` rule. */}
                <ScrollLockGutter />
                {/* Keeps the stored push zone pointed at where the phone is, so an alert's
                    quiet window follows a traveller. Does nothing on a browser with none armed. */}
                <PushTimezoneSync />
                {/* Offers this tab's search and live park data to a browser-side agent
                    (WebMCP). Registers nothing where the API does not exist, which is nearly
                    everywhere, and is mounted here rather than in the root layout so /admin —
                    which has its own — never carries it. */}
                <WebMcpTools locale={locale} />
                {/* Google's figures for the page on screen, for a browser signed in to the admin;
                    for everyone else a cookie check and nothing more. */}
                <SearchConsoleGate />
                <LanguageBanner currentLocale={locale as Locale} />
                {/* "New on the blog since your last visit". Renders nothing on a first visit
                    and nothing until the page is idle; the posts and the toast's strings are
                    fetched then, once per session, so no page carries them in its payload. */}
                <NewPostsWatcher enabled={showBlog} />
              </Suspense>
              {/* `min-h-dvh`, not `min-h-screen`: `100vh` is the large viewport, so a short page
                  would scroll on a phone with nothing to scroll to. */}
              {/* The open planner's width, so the page beside it reflows rather than being
                  covered. `--planner-inset` is `0px` until `PlannerLauncher` sets it, so the
                  server render cannot mismatch. The duration is a variable too: the tab sets it
                  to 0 while the panel edge is dragged, so the page does not lag the pointer. */}
              {/* `@container/page`: the page's own width, which the planner narrows while `sm:`,
                  `lg:` and `xl:` keep reading the window. A route opts in with
                  `@min-[1280px]/page:` instead of `xl:`. Named, because an unnamed container
                  query answers to the nearest container, such as `@container/card-header` inside
                  a card. `container-type: inline-size` applies no layout containment, so `fixed`
                  descendants, stacking and the menu band's backdrop blur are unaffected. */}
              {/* `planner-wide:`, not `sm:`: the inset is the other half of where the panel
                  sits, so it asks the panel's own question (on a landscape phone the panel is a
                  bottom sheet). `app/globals.css` keeps the pair. */}
              <div
                className="planner-wide:pr-[var(--planner-inset,0px)] @container/page flex min-h-dvh flex-col transition-[padding] [transition-duration:var(--planner-inset-ms,300ms)] ease-in-out"
                style={PAGE_ROOT_STYLE}
              >
                <a
                  href={`#${MAIN_CONTENT_ID}`}
                  className="bg-background text-foreground focus-visible:ring-ring sr-only rounded-md px-4 py-2 text-sm font-medium shadow-lg focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-[100] focus-visible:ring-2 focus-visible:outline-none"
                >
                  {tNav('skipToContent')}
                </a>
                {/* Header and footer sit outside any `<Suspense>`: the project runs no PPR, so a
                    boundary here deferred nothing and only moved both after `</main>`, into a
                    `<div hidden>` that a crawler without JavaScript reads as hidden. See
                    docs/rules/the-chrome-is-in-the-first-html-in-reading-order.md. */}
                <Header
                  showBlog={showBlog}
                  geoMenu={geoMenu}
                  blogMenu={blogMenu}
                  newsMenu={newsMenu}
                  featuredParks={featuredParks}
                  moreMenu={moreMenu}
                />
                <main id={MAIN_CONTENT_ID} className="flex-1">
                  {children}
                </main>
                <Footer
                  locale={locale}
                  showBlog={showBlog}
                  newsLabel={hasNews ? newsMenu?.label : undefined}
                />
              </div>
              {/* `fixed`, so it reserves nothing. The tab is drawn on every page; the panel and
                  its `planner` namespace wait until somebody opens it. It reads `localStorage`
                  through `useSyncExternalStore`, whose server snapshot is empty, so the first HTML
                  is the same for every visitor and this layout stays cacheable. */}
              <PlannerLauncher />
            </NextIntlClientProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
