import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { routing, type Locale } from '@/i18n/routing';
import { generateAlternateLanguages, locales, localeToOpenGraphLocale } from '@/i18n/config';
import { Providers } from '@/lib/providers';
import { debugGeoModeFlag } from '@/flags';
import { VercelToolbar } from '@vercel/toolbar/next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { LanguageBanner } from '@/components/layout/language-banner';
import {
  OrganizationStructuredData,
  WebSiteStructuredData,
} from '@/components/seo/structured-data';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/** Force dynamic so Vercel Toolbar flag overrides (cookie) are read on every request. */
export const dynamic = 'force-dynamic';

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
  const siteUrl = 'https://park.fan';

  return {
    title: {
      template: `%s | ${t('title')}`,
      default: t('title'),
    },
    description: t('description'),
    keywords: t('keywords'),
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}`),
        'x-default': '/en',
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
  const tSeo = await getTranslations({ locale, namespace: 'seo.global' });
  const debugGeoMode = await debugGeoModeFlag();

  // Render html/body here to have access to locale for lang attribute
  return (
    <html lang={locale} suppressHydrationWarning>
      {/* Umami Analytics - Privacy-friendly, cookie-free tracking */}
      {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && process.env.NEXT_PUBLIC_UMAMI_URL && (
        <Script
          defer
          src={process.env.NEXT_PUBLIC_UMAMI_URL}
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          data-domains="park.fan"
          data-do-not-track="true"
        />
      )}
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <OrganizationStructuredData description={tSeo('description')} />
        <WebSiteStructuredData locale={locale} description={tSeo('description')} />
        {process.env.NODE_ENV === 'development' &&
          (process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_VERCEL_TOOLBAR === 'true') && (
            <VercelToolbar />
          )}
        <Providers initialDebugGeoMode={debugGeoMode}>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <LanguageBanner currentLocale={locale as Locale} />
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer locale={locale} />
            </div>
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
