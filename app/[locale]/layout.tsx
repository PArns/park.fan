import type { Metadata } from 'next';
import { Suspense } from 'react';
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
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { PlannerLauncher } from '@/components/planner/planner-launcher';
import { hasPublishedPosts } from '@/lib/blog/listing';
import { getGeoMenu } from '@/lib/navigation/geo-menu';
import { getBlogMenu } from '@/lib/navigation/blog-menu';
import { getFeaturedParksMenu } from '@/lib/navigation/featured-parks-menu';
import { LanguageBanner } from '@/components/layout/language-banner';
import Script from 'next/script';
import { WebVitalsReporter } from '@/components/analytics/web-vitals-reporter';
import { ScrollToTop } from '@/components/common/scroll-to-top';
import { CardPointerFx } from '@/components/parks/card-pointer-fx';
import { WebMcpTools } from '@/components/agents/webmcp-tools';
import { NavigationProgress } from '@/components/layout/navigation-progress';
import {
  OrganizationStructuredData,
  SiteNavigationStructuredData,
  WebSiteStructuredData,
} from '@/components/seo/structured-data';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { translateContinent } from '@/lib/i18n/helpers';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;

  // Validate locale for metadata generation (security/correctness)
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
    // No `icons` here on purpose — see the note in app/layout.tsx. A route that declares one
    // REPLACES the inherited object rather than merging into it, and this one used to declare
    // `icon: '/favicon.ico'`, which is what suppressed the SVG favicon site-wide.
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

  // Validate locale
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Only what the CHROME reads — header, footer, search, language banner. Everything handed to
  // the provider is serialized into every page's RSC payload, so a route's own namespaces are
  // added further down the tree by `<RouteMessages>`, which merges them on the client (see
  // i18n/client-messages.ts). Shipping the union here instead costs ~38 KB of JSON on routes
  // that render none of it.
  const messages = pickMessages(await getMessages(), LAYOUT_MESSAGE_NAMESPACES);
  // Blog surfaces show only in locales that actually list posts (German-first
  // rollout: /de/blog can be live while other locales stay blog-free).
  const showBlog = hasPublishedPosts(locale as Locale);
  // The header's two menus. Both are structure rather than state: the geo spine is a cached
  // discovery read (no per-page hop to api.park.fan) and the blog side is the generated
  // manifest, read synchronously. Fetched here because `Header` is a Client Component.
  const geoMenu = await getGeoMenu();
  const blogMenu = showBlog ? getBlogMenu(locale as Locale) : undefined;
  const featuredParks = getFeaturedParksMenu(locale);
  // The same entries the bar renders, in the same order, plus the continent hubs the parks menu
  // opens onto. Kept to ten: this is a hint about the primary navigation, and the country links
  // are already in the rendered <nav>.
  const tNav = await getTranslations({ locale, namespace: 'navigation' });
  const tGeo = await getTranslations({ locale, namespace: 'geo' });
  const navigationItems = [
    { name: tNav('explore'), path: '/parks' },
    ...(showBlog ? [{ name: tNav('blog'), path: '/blog' }] : []),
    { name: tNav('bestTime'), path: `/${BEST_TIME_SEGMENTS[locale as Locale]}` },
    { name: tNav('glossary'), path: `/${GLOSSARY_SEGMENTS[locale as Locale]}` },
    { name: tNav('howto'), path: `/${HOWTO_SEGMENTS[locale as Locale]}` },
    ...geoMenu.map((continent) => ({
      name: translateContinent(tGeo, continent.slug, locale, continent.name),
      path: `/parks/${continent.slug}`,
    })),
  ];
  const tSeo = await getTranslations({ locale, namespace: 'seo.global' });

  // NOTE: the temperature-unit cookie is intentionally NOT read here. Reading
  // cookies() in the root layout would opt every route into dynamic rendering.
  // The unit only matters for weather/calendar on park detail pages, so the
  // cookie is read in the park-scoped layout instead — keeping the homepage and
  // all geo pages statically prerenderable (ISR). The global provider below
  // resolves the unit client-side for any other page.

  // Umami is the only third-party origin the browser talks to (analytics script + beacons,
  // loaded afterInteractive). A dns-prefetch warms the DNS lookup without a full preconnect that
  // would compete with critical same-origin assets (HTML/CSS/fonts/JS/images are all same-origin).
  let umamiOrigin: string | null = null;
  try {
    if (process.env.NEXT_PUBLIC_UMAMI_URL) {
      umamiOrigin = new URL(process.env.NEXT_PUBLIC_UMAMI_URL).origin;
    }
  } catch {
    umamiOrigin = null;
  }

  // Render html/body here to have access to locale for lang attribute
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans antialiased`} suppressHydrationWarning>
        {umamiOrigin && <link rel="dns-prefetch" href={umamiOrigin} />}
        {/* Set the temperature unit on <html> before paint so weather/calendar values
            (server-rendered in both units, toggled by CSS) show the visitor's unit with
            no flash — and the pages stay statically cacheable. Reads the temp_unit cookie,
            else derives from the browser locale's region (mirrors detectDefaultUnit). */}
        {/* Deliberately a RAW <script>, not `next/script`.
            React 19 logs "Encountered a script tag while rendering React component" for
            this in development, because a script in the tree does not execute on a CLIENT
            render. That warning does not apply here: this layout is server-rendered, the
            browser executes the tag while parsing, and on a soft navigation there is
            nothing to re-run — the attribute is already set.
            `next/script` with `strategy="beforeInteractive"` was tried and reverted. It
            does not emit an executable tag at all; it emits
            `(self.__next_s=self.__next_s||[]).push([0,{children:"…"}])`, deferring the
            code to whenever Next's runtime drains that queue. For a script whose entire
            job is to run BEFORE first paint, that reintroduces the °C→°F flash this
            exists to prevent. Verified against the rendered HTML on 2026-07-28. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var m=document.cookie.match(/(?:^|; )temp_unit=([CF])/);var u=m&&m[1];if(!u){var r;try{r=new Intl.Locale(navigator.language).region}catch(e){r=(navigator.language||'').split('-')[1]}u=['US','MM','LR','BS','KY','PW'].indexOf((r||'').toUpperCase())>-1?'F':'C'}document.documentElement.setAttribute('data-temp-unit',u)}catch(e){document.documentElement.setAttribute('data-temp-unit','C')}})();",
          }}
        />
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && process.env.NEXT_PUBLIC_UMAMI_URL && (
          /* `data-exclude-hash` is what keeps the visit count honest. Umami's tracker patches
             `history.pushState` AND `history.replaceState` and sends a pageview whenever the
             resulting URL differs from the last one — the hash included. Three places here write
             a hash without navigating (`use-tab-hash-routing`, `park-calendar-grid`'s month
             stepper, the `#calendar` FAQ link), so every tab switch and every month click was
             billed as another pageview and inflated Views against Visitors.

             `data-domains` gates the tracker on `window.location.hostname`, so a host missing
             from this list is invisible in the stats — www included, not just the apex.

             `data-do-not-track` is a deliberate choice, not a requirement: Umami is cookieless and
             anonymous, the privacy policy relies on Art. 6(1)(f) rather than consent, and it never
             promises to honour DNT. Keeping it means DNT visitors send nothing at all — no
             pageview, no session — so the visitor count reads structurally low (typically 3–8 %).
             See docs/development/analytics.md. */
          <Script
            src={process.env.NEXT_PUBLIC_UMAMI_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            data-domains="park.fan,www.park.fan"
            data-do-not-track="true"
            data-exclude-hash="true"
            strategy="afterInteractive"
          />
        )}
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
        {/* park.fan is a dark site: dark for everyone by default, on every device, and light
            only for visitors who ask for it. `enableSystem` is off on purpose — following the OS
            would make the site dark for some people and light for others by accident, which is
            the opposite of having a default. See ThemeToggle for how browsers still holding the
            retired `system` value are moved over. */}
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
                <WebVitalsReporter />
                {/* Offers this tab's search and live park data to a browser-side agent
                    (WebMCP). Registers nothing where the API does not exist, which is nearly
                    everywhere, and is mounted here rather than in the root layout so /admin —
                    which has its own — never carries it. */}
                <WebMcpTools locale={locale} />
                <LanguageBanner currentLocale={locale as Locale} />
              </Suspense>
              {/* `min-h-dvh`, not `min-h-screen`: `100vh` is the LARGE viewport, the height with
                  the URL bar retracted, so every short page (`/contribute/thanks`, a thin glossary
                  term, a 404) was 80–115 px taller than what a phone actually shows — it scrolled
                  for no content and made the browser chrome jitter on the way. The unit is already
                  in the house: app/[locale]/page.tsx uses `lg:min-h-dvh`. */}
              {/* The open planner's width, so the page beside it reflows rather
                  than being covered. `--planner-inset` is set on the document
                  element by `PlannerLauncher` and is `0px` until then, which is
                  what the server renders and what a visitor who never opens the
                  panel keeps — so this costs nothing and cannot mismatch on
                  hydration. Above `sm` only: below it the panel is a modal
                  bottom sheet, and a right inset there would leave a stripe of
                  page beside nothing.

                  The DURATION is a property too, because the panel edge is
                  draggable: 300 ms is right for an open or a close and wrong
                  under a pointer, where the page would lag a third of a second
                  behind the edge somebody is holding. The tab sets it to 0 for
                  the length of a drag. */}
              <div className="flex min-h-dvh flex-col transition-[padding] [transition-duration:var(--planner-inset-ms,300ms)] ease-in-out sm:pr-[var(--planner-inset,0px)]">
                {/* Reserves the bar's exact height (h-12 + the 1 px border the header itself draws)
                    so the first paint does not move when the client Header streams in. Both
                    numbers live in components/layout/header.tsx — change them together. */}
                <Suspense fallback={<div className="h-12" />}>
                  <Header
                    showBlog={showBlog}
                    geoMenu={geoMenu}
                    blogMenu={blogMenu}
                    featuredParks={featuredParks}
                  />
                </Suspense>
                <main className="flex-1">{children}</main>
                {/* Footer renders next-intl links (dynamic under Cache Components) — stream it
                    as a below-the-fold dynamic hole so pages keep a static, cacheable shell. */}
                <Suspense fallback={null}>
                  <Footer locale={locale} showBlog={showBlog} />
                </Suspense>
              </div>
              {/* Fixed, so it is outside the flow and reserves nothing — and it
                  renders nothing at all until the visitor has planned something,
                  which on the server is always. */}
              <PlannerLauncher />
            </NextIntlClientProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
