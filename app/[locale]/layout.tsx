import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { generateAlternateLanguages, locales, localeToOpenGraphLocale } from '@/i18n/config';
import { Providers } from '@/lib/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { LanguageBanner } from '@/components/layout/language-banner';
import Script from 'next/script';
import { AnalyticsIdentify } from '@/components/common/analytics-identify';
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
      template: '%s',
      default: t('title'),
    },
    description: t('description'),
    keywords: t('keywords'),
    icons: {
      icon: '/favicon.ico',
      apple: '/logo.png',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}`),
        'x-default': 'https://park.fan/en',
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

  // Render html/body here to have access to locale for lang attribute
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && process.env.NEXT_PUBLIC_UMAMI_URL && (
          <Script
            src={process.env.NEXT_PUBLIC_UMAMI_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            data-domains="park.fan"
            data-do-not-track="true"
            strategy="afterInteractive"
          />
        )}
        <OrganizationStructuredData description={tSeo('description')} />
        <WebSiteStructuredData locale={locale} description={tSeo('description')} />
        <Providers>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <AnalyticsIdentify locale={locale} />
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
