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
import { Providers } from '@/lib/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { hasPublishedPosts } from '@/lib/blog';
import { LanguageBanner } from '@/components/layout/language-banner';
import Script from 'next/script';
import { AnalyticsIdentify } from '@/components/common/analytics-identify';
import { UserbackFeedback } from '@/components/common/userback-feedback';
import { WebVitalsReporter } from '@/components/analytics/web-vitals-reporter';
import { ScrollToTop } from '@/components/common/scroll-to-top';
import { NavigationProgress } from '@/components/layout/navigation-progress';
import {
  OrganizationStructuredData,
  WebSiteStructuredData,
} from '@/components/seo/structured-data';
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
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
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
          url: `${siteUrl}/api/og/${locale}/og.png`,
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
      images: [`${siteUrl}/api/og/${locale}/og.png`],
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

  // Get messages for the current locale
  const messages = await getMessages();
  // Blog surfaces show only in locales that actually list posts (German-first
  // rollout: /de/blog can be live while other locales stay blog-free).
  const showBlog = hasPublishedPosts(locale as Locale);
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
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var m=document.cookie.match(/(?:^|; )temp_unit=([CF])/);var u=m&&m[1];if(!u){var r;try{r=new Intl.Locale(navigator.language).region}catch(e){r=(navigator.language||'').split('-')[1]}u=['US','MM','LR','BS','KY','PW'].indexOf((r||'').toUpperCase())>-1?'F':'C'}document.documentElement.setAttribute('data-temp-unit',u)}catch(e){document.documentElement.setAttribute('data-temp-unit','C')}})();",
          }}
        />
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && process.env.NEXT_PUBLIC_UMAMI_URL && (
          <Script
            src={process.env.NEXT_PUBLIC_UMAMI_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            data-domains="park.fan"
            data-do-not-track="true"
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
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
                <AnalyticsIdentify locale={locale} />
                <UserbackFeedback locale={locale} />
                <WebVitalsReporter />
                <LanguageBanner currentLocale={locale as Locale} />
              </Suspense>
              <div className="flex min-h-screen flex-col">
                <Suspense fallback={<div className="h-14" />}>
                  <Header showBlog={showBlog} />
                </Suspense>
                <main className="flex-1">{children}</main>
                {/* Footer renders next-intl links (dynamic under Cache Components) — stream it
                    as a below-the-fold dynamic hole so pages keep a static, cacheable shell. */}
                <Suspense fallback={null}>
                  <Footer locale={locale} showBlog={showBlog} />
                </Suspense>
              </div>
            </NextIntlClientProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
